import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import { useUser } from './UserContext'
import type { UnifiedStorageData } from '../hooks/useUnifiedStorage'

const defaultUnifiedData: UnifiedStorageData = {
  generations: [],
  conversations: [],
  favoriteGenerations: [],
  favoriteModels: [],
  modelTemplates: [],
  themeOptions: null,
  chatTextSize: 'md',
}

interface UnifiedStorageContextValue {
  data: UnifiedStorageData
  setData: (data: UnifiedStorageData) => void
  syncStatus: 'syncing' | 'synced' | 'error'
}

const UnifiedStorageContext = createContext<UnifiedStorageContextValue | undefined>(undefined)

/**
 * Single source of truth for unified storage
 * Calls useStorage('user-data') once at app level, all components read from here
 * Prevents mass of redundant cloud fetches on page load
 */
export function UnifiedStorageProvider({ children }: { children: ReactNode }) {
  const { useStorage, user } = useUser()
  const [cloudData, setCloudData, syncStatus] = useStorage<UnifiedStorageData>('user-data', defaultUnifiedData)

  // Force re-render when user changes to load new user's data
  return (
    <UnifiedStorageContext.Provider
      key={user?.userId ?? 'anonymous'}
      value={{ data: cloudData, setData: setCloudData, syncStatus: syncStatus as 'syncing' | 'synced' | 'error' }}
    >
      {children}
    </UnifiedStorageContext.Provider>
  )
}

export function useUnifiedStorageContext() {
  const context = useContext(UnifiedStorageContext)
  if (context === undefined) {
    throw new Error('useUnifiedStorageContext must be used within a UnifiedStorageProvider')
  }
  return context
}
