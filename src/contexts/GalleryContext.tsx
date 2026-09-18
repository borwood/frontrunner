import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

type OutputType = 'image' | 'video' | 'text'

interface GalleryContextType {
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedTypes: Set<OutputType>
  setSelectedTypes: (types: Set<OutputType>) => void
  toggleType: (type: OutputType) => void
}

const GalleryContext = createContext<GalleryContextType | undefined>(undefined)

export function GalleryProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<Set<OutputType>>(
    new Set(['image', 'video', 'text'])
  )

  const toggleType = (type: OutputType) => {
    setSelectedTypes((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(type)) {
        newSet.delete(type)
      } else {
        newSet.add(type)
      }
      return newSet
    })
  }

  return (
    <GalleryContext.Provider
      value={{
        searchQuery,
        setSearchQuery,
        selectedTypes,
        setSelectedTypes,
        toggleType,
      }}
    >
      {children}
    </GalleryContext.Provider>
  )
}

export function useGalleryContext() {
  const context = useContext(GalleryContext)
  if (context === undefined) {
    throw new Error('useGalleryContext must be used within a GalleryProvider')
  }
  return context
}
