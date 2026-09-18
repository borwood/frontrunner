import { useState, useEffect, useCallback, useRef } from 'react'
import { useUser } from '../contexts/UserContext'

/**
 * Hybrid storage hook that combines local and cloud storage
 * - Saves to localStorage immediately (keyed by user email)
 * - Syncs to cloud storage in background
 * - Falls back to localStorage if cloud is slow/unavailable
 */
export function useHybridStorage<T>(key: string, defaultValue: T) {
  const { user, useStorage } = useUser()
  const [cloudData, setCloudData, syncStatus] = useStorage<T>(key, defaultValue)

  // Create user-specific localStorage key
  const localStorageKey = user?.email ? `${key}:${user.email}` : `${key}:anonymous`
  const previousKeyRef = useRef<string>(localStorageKey)

  // Ref for default value to avoid it being a dependency
  const defaultValueRef = useRef(defaultValue)

  // Initialize from localStorage first (instant)
  const getLocalData = useCallback((): T => {
    try {
      const stored = localStorage.getItem(localStorageKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Unwrap if it's an old envelope format from StorageManager
        if (parsed && typeof parsed === 'object' && 'data' in parsed && 'timestamp' in parsed && 'version' in parsed) {
          return parsed.data as T
        }
        return parsed as T
      }
    } catch (err) {
      console.error('[useHybridStorage] Error reading localStorage:', err)
    }
    return defaultValueRef.current
  }, [localStorageKey])

  const [data, setDataState] = useState<T>(getLocalData)

  // Re-initialize from localStorage ONLY when localStorageKey actually changes (not on every render)
  useEffect(() => {
    if (previousKeyRef.current !== localStorageKey) {

      previousKeyRef.current = localStorageKey
      const localData = getLocalData()
      setDataState(localData)
    }
  }, [localStorageKey, getLocalData])

  // Sync localStorage with cloud data when cloud loads
  useEffect(() => {
    if (syncStatus === 'synced' && cloudData) {
      // Unwrap cloud data if it's in old envelope format
      let unwrappedCloud: NonNullable<T> = cloudData
      if (cloudData && typeof cloudData === 'object' && 'data' in cloudData && 'timestamp' in cloudData && 'version' in cloudData) {
        unwrappedCloud = (cloudData as any).data as NonNullable<T>
      }

      // Cloud data is ready, check if it's newer/different
      const localData = getLocalData()

      // IMPORTANT: Only sync if cloud has ACTUAL data
      // Don't sync if cloud data is just the default value (empty array/object)
      // For primitives (string/number/boolean), always consider them as "has data" if not null/undefined
      const hasCloudData = Array.isArray(unwrappedCloud)
        ? unwrappedCloud.length > 0
        : typeof unwrappedCloud === 'object' && unwrappedCloud !== null
        ? Object.keys(unwrappedCloud).length > 0
        : true // Primitives always count as "has data"

      // Only sync cloud -> local if:
      // 1. Cloud has actual data (not just default empty value)
      // 2. Cloud data is different from local data
      if (hasCloudData && JSON.stringify(unwrappedCloud) !== JSON.stringify(localData)) {

        setDataState(unwrappedCloud)
        try {
          localStorage.setItem(localStorageKey, JSON.stringify(unwrappedCloud))
        } catch (err) {
          console.error('[useHybridStorage] Error writing localStorage:', err)
        }
      } else if (!hasCloudData && localData && JSON.stringify(localData) !== JSON.stringify(defaultValueRef.current)) {
        // Cloud is empty but local has data - sync local -> cloud instead!

        setCloudData(localData)
      }
    }
  }, [cloudData, syncStatus, localStorageKey, key, getLocalData, setCloudData])

  // Listen for custom storage events to sync across components in same window
  useEffect(() => {
    const handleStorageChange = (e: CustomEvent) => {

      if (e.detail.key === localStorageKey) {

        // Read directly from localStorage instead of calling getLocalData to avoid dependency
        try {
          const stored = localStorage.getItem(localStorageKey)
          if (stored) {
            const parsed = JSON.parse(stored)
            // Unwrap if it's an old envelope format
            const updatedData = (parsed && typeof parsed === 'object' && 'data' in parsed && 'timestamp' in parsed && 'version' in parsed)
              ? parsed.data
              : parsed
            setDataState(updatedData)
          }
        } catch (err) {
          console.error('[useHybridStorage] Error reloading from localStorage:', err)
        }
      }
    }

    // Listen for custom storage events (dispatched by setData below)
    window.addEventListener('localStorageChange' as any, handleStorageChange as any)

    return () => {

      window.removeEventListener('localStorageChange' as any, handleStorageChange as any)
    }
  }, [localStorageKey, key])

  // Update function - saves to both local and cloud
  const setData = useCallback((newData: T | ((prev: T) => T)) => {
    setDataState((prev) => {
      const nextData = typeof newData === 'function' ? (newData as (prev: T) => T)(prev) : newData

      // Save to localStorage immediately
      try {
        localStorage.setItem(localStorageKey, JSON.stringify(nextData))

        // Dispatch custom event AFTER state update completes
        queueMicrotask(() => {

          window.dispatchEvent(new CustomEvent('localStorageChange', {
            detail: { key: localStorageKey, value: nextData }
          }))
        })
      } catch (err) {
        console.error('[useHybridStorage] Error writing localStorage:', err)
      }

      // Save to cloud storage (background)
      setCloudData(nextData)

      return nextData
    })
  }, [localStorageKey, key, setCloudData])

  return [data, setData, syncStatus] as const
}
