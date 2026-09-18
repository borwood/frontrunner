import { useEffect, useRef } from 'react'
import { useUser } from '../contexts/UserContext'
import type { UnifiedStorageData } from './useUnifiedStorage'

/**
 * Migration hook to move from old multi-key storage to new unified storage
 *
 * OLD (multiple cloud keys):
 * - 'generations' → Generation[]
 * - 'conversations' → Conversation[]
 * - 'favorite-generations' → string[]
 * - 'favorite-models' → string[]
 * - 'model-templates' → Template[]
 * - 'theme-options' → ThemeOptions
 *
 * NEW (single cloud key):
 * - 'user-data' → { generations, conversations, favoriteGenerations, ... }
 *
 * This runs once per user session to migrate their data
 */
export function useStorageMigration() {
  const { useStorage } = useUser()
  const hasMigrated = useRef(false)

  // Old storage hooks
  const [oldGenerations] = useStorage('generations', [])
  const [oldConversations] = useStorage('conversations', [])
  const [oldFavoriteGenerations] = useStorage('favorite-generations', [])
  const [oldFavoriteModels] = useStorage('favorite-models', [])
  const [oldModelTemplates] = useStorage('model-templates', [])
  const [oldThemeOptions] = useStorage('theme-options', null)
  const [oldChatTextSize] = useStorage('chatTextSize', 'md')

  // New unified storage
  const [unifiedData, setUnifiedData, unifiedStatus] = useStorage<UnifiedStorageData>('user-data', {
    generations: [],
    conversations: [],
    favoriteGenerations: [],
    favoriteModels: [],
    modelTemplates: [],
    themeOptions: null,
    chatTextSize: 'md',
  })

  useEffect(() => {
    // Only migrate once per session and only when cloud is synced
    if (hasMigrated.current || unifiedStatus !== 'synced') {
      return
    }

    // Check if unified storage is empty (needs migration)
    // Only check the actual data arrays - ignore default values like chatTextSize/themeOptions
    const isUnifiedEmpty =
      unifiedData.generations.length === 0 &&
      unifiedData.conversations.length === 0 &&
      unifiedData.favoriteGenerations.length === 0 &&
      unifiedData.favoriteModels.length === 0 &&
      unifiedData.modelTemplates.length === 0

    // Check if old storage has any data (worth migrating)
    const hasOldData =
      (Array.isArray(oldGenerations) && oldGenerations.length > 0) ||
      (Array.isArray(oldConversations) && oldConversations.length > 0) ||
      (Array.isArray(oldFavoriteGenerations) && oldFavoriteGenerations.length > 0) ||
      (Array.isArray(oldFavoriteModels) && oldFavoriteModels.length > 0) ||
      (Array.isArray(oldModelTemplates) && oldModelTemplates.length > 0) ||
      oldThemeOptions !== null

    if (isUnifiedEmpty && hasOldData) {

      // Unwrap any envelope data from old StorageManager
      const unwrap = (data: any) => {
        if (data && typeof data === 'object' && 'data' in data && 'timestamp' in data && 'version' in data) {
          return data.data
        }
        return data
      }

      const migratedData: UnifiedStorageData = {
        generations: unwrap(oldGenerations) || [],
        conversations: unwrap(oldConversations) || [],
        favoriteGenerations: unwrap(oldFavoriteGenerations) || [],
        favoriteModels: unwrap(oldFavoriteModels) || [],
        modelTemplates: unwrap(oldModelTemplates) || [],
        themeOptions: unwrap(oldThemeOptions),
        chatTextSize: unwrap(oldChatTextSize) || 'md',
      }

      // Write to unified storage
      setUnifiedData(migratedData)
      hasMigrated.current = true

    } else if (!isUnifiedEmpty) {

      hasMigrated.current = true
    } else {

      hasMigrated.current = true
    }
  }, [
    unifiedStatus,
    unifiedData,
    oldGenerations,
    oldConversations,
    oldFavoriteGenerations,
    oldFavoriteModels,
    oldModelTemplates,
    oldThemeOptions,
    oldChatTextSize,
    setUnifiedData,
  ])

  return {
    migrationComplete: hasMigrated.current,
    migrationStatus: unifiedStatus,
  }
}
