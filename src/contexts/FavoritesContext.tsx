import { createContext, useContext, useCallback } from 'react'
import type { ReactNode } from 'react'
import { useUnifiedStorage } from '../hooks/useUnifiedStorage'

interface FavoritesContextType {
  favorites: string[]
  isFavorite: (modelId: string) => boolean
  toggleFavorite: (modelId: string) => void
  addFavorite: (modelId: string) => void
  removeFavorite: (modelId: string) => void
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

export function FavoritesProvider({ children }: { children: ReactNode }) {
  // Use unified storage for favorites (local + cloud sync, single atomic key)
  const [favorites, setFavorites] = useUnifiedStorage('favoriteModels', [])

  const isFavorite = useCallback(
    (modelId: string): boolean => {
      return favorites.includes(modelId)
    },
    [favorites]
  )

  const toggleFavorite = useCallback(
    (modelId: string) => {
      setFavorites((prev) => {
        return prev.includes(modelId) ? prev.filter((id) => id !== modelId) : [...prev, modelId]
      })
    },
    [setFavorites]
  )

  const addFavorite = useCallback(
    (modelId: string) => {
      setFavorites((prev) => {
        if (prev.includes(modelId)) return prev
        return [...prev, modelId]
      })
    },
    [setFavorites]
  )

  const removeFavorite = useCallback(
    (modelId: string) => {
      setFavorites((prev) => {
        return prev.filter((id) => id !== modelId)
      })
    },
    [setFavorites]
  )

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        isFavorite,
        toggleFavorite,
        addFavorite,
        removeFavorite,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider')
  }
  return context
}
