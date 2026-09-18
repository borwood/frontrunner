import { useCallback, useEffect, useState, useRef } from 'react'
import { useUser } from '../contexts/UserContext'
import { useUnifiedStorageContext } from '../contexts/UnifiedStorageContext'
import type { ThemeOptions } from '../theme/theme'

/**
 * Write queue to prevent race conditions when multiple components update different keys
 * in the unified storage object simultaneously
 */
let pendingWrites: Partial<UnifiedStorageData> = {}
let writeTimer: number | null = null
let currentCloudDataRef: UnifiedStorageData | null = null

function scheduleWrite(
  key: keyof UnifiedStorageData,
  value: any,
  setCloudData: (data: UnifiedStorageData) => void
) {
  // Accumulate writes
  pendingWrites[key] = value

  // Clear existing timer
  if (writeTimer) {
    clearTimeout(writeTimer)
  }

  // Batch writes with 50ms debounce
  writeTimer = setTimeout(() => {
    // Capture pending writes before clearing
    const writesToFlush = { ...pendingWrites }

    // Merge with latest cloud data ref (updated by useEffect below)
    const mergedData = {
      ...(currentCloudDataRef || {}),
      ...writesToFlush,
    }

    setCloudData(mergedData as UnifiedStorageData)

    pendingWrites = {}
    writeTimer = null
  }, 50)
}

/**
 * Update the current cloud data ref so scheduleWrite can access latest state
 */
export function updateCloudDataRef(data: UnifiedStorageData) {
  currentCloudDataRef = data
}

/**
 * Unified storage schema - all user data in one cloud key
 * This enables atomic operations (clear all at once, single cloud fetch, no race conditions)
 */
export interface UnifiedStorageData {
  generations: any[]
  conversations: any[]
  favoriteGenerations: string[]
  favoriteModels: string[]
  modelTemplates: any[]
  themeOptions: ThemeOptions | null
  chatTextSize: string
}

const defaultUnifiedData: UnifiedStorageData = {
  generations: [],
  conversations: [],
  favoriteGenerations: [],
  favoriteModels: [],
  modelTemplates: [],
  themeOptions: null,
  chatTextSize: 'md',
}

/**
 * Hook for accessing a nested key within unified storage
 *
 * Usage:
 *   const [generations, setGenerations] = useUnifiedStorage('generations', [])
 *   const [generations, setGenerations] = useUnifiedStorage('generations', [], { skipLocalStorage: true })
 *
 * Behind the scenes:
 * - Single cloud key: 'user-data' contains all nested data
 * - LocalStorage: still uses separate keys per field (backwards compat)
 * - Atomic operations: clearing all data is a single cloud write
 *
 * Options:
 * - skipLocalStorage: If true, only uses cloud storage (no localStorage caching)
 */
export function useUnifiedStorage<K extends keyof UnifiedStorageData>(
  key: K,
  defaultValue: UnifiedStorageData[K],
  options?: { skipLocalStorage?: boolean }
) {
  const skipLocalStorage = options?.skipLocalStorage ?? false
  const { user } = useUser()
  const { data: cloudData, setData: setCloudData, syncStatus } = useUnifiedStorageContext()

  // Keep the module-level ref in sync with latest cloudData
  useEffect(() => {
    updateCloudDataRef(cloudData)
  }, [cloudData])

  // Create STABLE user-specific localStorage key
  // Use useRef to lock in the userId on first render when user is available
  // This prevents race conditions where user identity flips to undefined mid-operation
  // Using userId instead of email because:
  // 1. userId is always present when user exists (more reliable)
  // 2. Email might be slow to load or missing in some auth flows
  // 3. userId is the canonical user identifier in subscribe.dev
  const stableUserIdRef = useRef<string | null>(null)

  // Track last write to prevent infinite sync loop
  const lastWriteTimestampRef = useRef<number>(0)

  // Cache local data to avoid re-reading on every render
  const localDataCacheRef = useRef<{ data: UnifiedStorageData[K]; timestamp: number } | null>(null)

  // Track if we've completed initial sync to avoid re-syncing on every render
  const hasSyncedRef = useRef(false)

  // Lock in userId when user is first available, never change it after
  if (user?.userId && !stableUserIdRef.current) {
    stableUserIdRef.current = user.userId

    // Reset sync flag for new user
    hasSyncedRef.current = false
  }

  const currentUserId = stableUserIdRef.current || 'anonymous'
  const localStorageKey = `${key}:${currentUserId}`

  // Initialize from localStorage FIRST (instant load)
  const getLocalData = useCallback((): { data: UnifiedStorageData[K]; timestamp: number } => {
    // Skip localStorage if flag is set
    if (skipLocalStorage) {
      const result = { data: defaultValue, timestamp: 0 }
      return result
    }

    // Return cached value if available
    if (localDataCacheRef.current) {
      return localDataCacheRef.current
    }

    try {
      const stored = localStorage.getItem(localStorageKey)

      if (stored) {
        const parsed = JSON.parse(stored)
        // Check if it's a timestamped envelope (must be object first)
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed !== null) {
          const hasData = 'data' in parsed
          const hasTimestamp = 'timestamp' in parsed

          if (hasData && hasTimestamp) {
            const result = { data: parsed.data as UnifiedStorageData[K], timestamp: parsed.timestamp }
            localDataCacheRef.current = result
            return result
          }
        }
        // Old format without timestamp - treat as very old
        console.warn('[useUnifiedStorage] localStorage has old format (no timestamp)')
        const result = { data: parsed as UnifiedStorageData[K], timestamp: 0 }
        localDataCacheRef.current = result
        return result
      }
    } catch (err) {
      console.error('[useUnifiedStorage] Error reading localStorage:', err)
    }
    const result = { data: defaultValue, timestamp: 0 }
    localDataCacheRef.current = result
    return result
  }, [localStorageKey, defaultValue, key, skipLocalStorage])

  const [data, setDataState] = useState<UnifiedStorageData[K]>(() => {
    const initial = getLocalData()

    return initial.data
  })

  // Sync with cloud when it loads
  useEffect(() => {
    // Skip cloud sync entirely for anonymous users (they can't have cloud data)
    if (!user) {

      return
    }

    // When skipLocalStorage is true, always sync from cloud (no caching)
    // When skipLocalStorage is false, only sync once to prevent re-syncing on every render
    if (!skipLocalStorage && hasSyncedRef.current) {
      return
    }

    if (syncStatus === 'synced' && cloudData) {
      if (!skipLocalStorage) {
        hasSyncedRef.current = true
      }
      // Extract this key's data from unified cloud storage
      let cloudValue = cloudData[key] as UnifiedStorageData[K]
      let cloudTimestamp = 0

      // Check if cloud data has timestamp metadata
      if (cloudValue && typeof cloudValue === 'object' && 'data' in cloudValue && 'timestamp' in cloudValue) {
        cloudTimestamp = (cloudValue as any).timestamp
        cloudValue = (cloudValue as any).data as UnifiedStorageData[K]
      }

      // If skipLocalStorage is true, always use cloud data directly (no localStorage caching)
      if (skipLocalStorage) {
        const hasCloudData = Array.isArray(cloudValue)
          ? cloudValue.length > 0
          : typeof cloudValue === 'object' && cloudValue !== null
          ? Object.keys(cloudValue).length > 0
          : cloudValue !== null && cloudValue !== undefined

        if (hasCloudData) {
          setDataState(cloudValue)
        }
        return
      }

      const { data: localData, timestamp: localTimestamp } = getLocalData()

      // Check if cloud has actual data for this key
      const hasCloudData = Array.isArray(cloudValue)
        ? cloudValue.length > 0
        : typeof cloudValue === 'object' && cloudValue !== null
        ? Object.keys(cloudValue).length > 0
        : cloudValue !== null && cloudValue !== undefined

      const hasLocalData = Array.isArray(localData)
        ? localData.length > 0
        : typeof localData === 'object' && localData !== null
        ? Object.keys(localData).length > 0
        : localData !== null && localData !== undefined && JSON.stringify(localData) !== JSON.stringify(defaultValue)

      // Sync cloud -> local if cloud is newer OR local is empty (first load)
      if (hasCloudData && (cloudTimestamp > localTimestamp || localTimestamp === 0) && JSON.stringify(cloudValue) !== JSON.stringify(localData)) {

        setDataState(cloudValue)
        try {
          localStorage.setItem(localStorageKey, JSON.stringify({ data: cloudValue, timestamp: cloudTimestamp }))
          // Update cache with synced data
          localDataCacheRef.current = { data: cloudValue, timestamp: cloudTimestamp }
        } catch (err) {
          console.error('[useUnifiedStorage] Error writing localStorage during sync:', err)
          // CRITICAL: Invalidate cache on sync write failure
          // This ensures we use cloud data instead of stale cache on next read
          localDataCacheRef.current = null
          console.warn('[useUnifiedStorage] Cache invalidated due to sync write failure for key:', key)
        }
      } else if (hasLocalData && localTimestamp > cloudTimestamp) {
        // Local is newer - sync local -> cloud
        // But prevent infinite loop: don't re-sync if we just wrote this timestamp
        if (localTimestamp !== lastWriteTimestampRef.current) {

          scheduleWrite(key, localData, setCloudData)
          lastWriteTimestampRef.current = localTimestamp
        }
      } else if (!hasCloudData && hasLocalData) {
        // Cloud is empty but local has data - sync local -> cloud

        scheduleWrite(key, localData, setCloudData)
      }
    }
  }, [cloudData, syncStatus, key, localStorageKey, getLocalData, setCloudData, defaultValue, user, skipLocalStorage])

  // Listen for custom storage events to sync across components in same window
  useEffect(() => {
    // Skip localStorage event listener if flag is set
    if (skipLocalStorage) {
      return
    }

    const handleStorageChange = (e: CustomEvent) => {
      if (e.detail.key === localStorageKey) {

        try {
          const stored = localStorage.getItem(localStorageKey)
          if (stored) {
            const parsed = JSON.parse(stored)
            // Check for timestamped envelope
            const updatedData = (parsed && typeof parsed === 'object' && 'data' in parsed && 'timestamp' in parsed)
              ? parsed.data
              : parsed
            setDataState(updatedData)
          }
        } catch (err) {
          console.error('[useUnifiedStorage] Error reloading from localStorage:', err)
        }
      }
    }

    window.addEventListener('localStorageChange' as any, handleStorageChange as any)
    return () => {
      window.removeEventListener('localStorageChange' as any, handleStorageChange as any)
    }
  }, [localStorageKey, key, skipLocalStorage])

  // Update function - saves to both local and cloud
  const setData = useCallback((newData: UnifiedStorageData[K] | ((prev: UnifiedStorageData[K]) => UnifiedStorageData[K])) => {
    setDataState((prev) => {
      const nextData = typeof newData === 'function' ? (newData as (prev: UnifiedStorageData[K]) => UnifiedStorageData[K])(prev) : newData
      const timestamp = Date.now()

      // Save to localStorage immediately with timestamp (unless skipLocalStorage is set)
      if (!skipLocalStorage) {
        try {
          localStorage.setItem(localStorageKey, JSON.stringify({ data: nextData, timestamp }))
          // Update cache with new data
          localDataCacheRef.current = { data: nextData, timestamp }

          // Dispatch custom event AFTER state update completes
          queueMicrotask(() => {
            window.dispatchEvent(new CustomEvent('localStorageChange', {
              detail: { key: localStorageKey, value: nextData }
            }))
          })
        } catch (err) {
          console.error('[useUnifiedStorage] Error writing localStorage:', err)
          // CRITICAL: Invalidate cache on write failure to prevent stale data
          // This forces next read to skip cache and use cloud data instead
          localDataCacheRef.current = null
          console.warn('[useUnifiedStorage] Cache invalidated due to localStorage write failure for key:', key)
        }
      } else {

      }

      // Save to cloud storage (background) - update just this key in unified storage
      // Use write queue to prevent race conditions when multiple keys update simultaneously
      // Wrap with timestamp metadata
      scheduleWrite(key, { data: nextData, timestamp }, setCloudData)

      return nextData
    })
  }, [localStorageKey, key, setCloudData, skipLocalStorage])

  return [data, setData, syncStatus] as const
}

/**
 * Hook for clearing ALL unified storage at once (atomic operation)
 * Use this for the dev tool "clear all storage" button
 */
export function useClearAllStorage() {
  const { user } = useUser()
  const { setData: setCloudData } = useUnifiedStorageContext()

  const clearAllStorage = useCallback(() => {

    // CRITICAL: Clear cloud context FIRST (synchronous state update)
    // This prevents race condition where sync effect sees empty localStorage
    // but still-populated cloud and syncs old data back
    setCloudData(defaultUnifiedData)

    // Force a small delay to let React flush state updates
    // This ensures sync effects see the cleared cloud state
    setTimeout(() => {
      // Then clear localStorage for all keys
      const userId = user?.userId || 'anonymous'
      const keys: Array<keyof UnifiedStorageData> = [
        'generations',
        'conversations',
        'favoriteGenerations',
        'favoriteModels',
        'modelTemplates',
        'themeOptions',
        'chatTextSize',
      ]

      keys.forEach(key => {
        const localKey = `${key}:${userId}`
        localStorage.removeItem(localKey)

      })
    }, 100)

    return true
  }, [user, setCloudData])

  return clearAllStorage
}
