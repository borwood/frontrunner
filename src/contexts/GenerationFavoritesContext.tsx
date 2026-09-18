import { createContext, useContext, useCallback } from 'react'
import type { ReactNode } from 'react'
import { useUnifiedStorage } from '../hooks/useUnifiedStorage'

interface GenerationFavoritesContextType {
  favoriteGenerations: string[]
  isFavorite: (generationId: string) => boolean
  toggleFavorite: (generationId: string) => void
  addFavorite: (generationId: string) => void
  removeFavorite: (generationId: string) => void
}

const GenerationFavoritesContext = createContext<GenerationFavoritesContextType | undefined>(undefined)

export function GenerationFavoritesProvider({ children }: { children: ReactNode }) {
  const [favoriteGenerations, setFavoriteGenerations] = useUnifiedStorage('favoriteGenerations', [])

  const isFavorite = useCallback(
    (generationId: string): boolean => {
      return favoriteGenerations.includes(generationId)
    },
    [favoriteGenerations]
  )

  const toggleFavorite = useCallback(
    (generationId: string) => {
      setFavoriteGenerations((prev) => {
        return prev.includes(generationId) ? prev.filter((id) => id !== generationId) : [...prev, generationId]
      })
    },
    [setFavoriteGenerations]
  )

  const addFavorite = useCallback(
    (generationId: string) => {
      setFavoriteGenerations((prev) => {
        if (prev.includes(generationId)) return prev
        return [...prev, generationId]
      })
    },
    [setFavoriteGenerations]
  )

  const removeFavorite = useCallback(
    (generationId: string) => {
      setFavoriteGenerations((prev) => prev.filter((id) => id !== generationId))
    },
    [setFavoriteGenerations]
  )

  return (
    <GenerationFavoritesContext.Provider
      value={{
        favoriteGenerations,
        isFavorite,
        toggleFavorite,
        addFavorite,
        removeFavorite,
      }}
    >
      {children}
    </GenerationFavoritesContext.Provider>
  )
}

export function useGenerationFavorites() {
  const context = useContext(GenerationFavoritesContext)
  if (context === undefined) {
    throw new Error('useGenerationFavorites must be used within a GenerationFavoritesProvider')
  }
  return context
}
