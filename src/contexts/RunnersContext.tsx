import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import type { ModelCategory } from '../types/models'

type OrganizationMode = 'by-type' | 'by-company'

interface RunnersContextType {
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedCategories: Set<ModelCategory>
  setSelectedCategories: (categories: Set<ModelCategory>) => void
  toggleCategory: (category: ModelCategory) => void
  organizationMode: OrganizationMode
  setOrganizationMode: (mode: OrganizationMode) => void
}

const RunnersContext = createContext<RunnersContextType | undefined>(undefined)

export function RunnersProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<Set<ModelCategory>>(
    new Set(['text', 'image', 'video'])
  )
  const [organizationMode, setOrganizationMode] = useState<OrganizationMode>('by-type')

  const toggleCategory = (category: ModelCategory) => {
    setSelectedCategories((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(category)) {
        newSet.delete(category)
      } else {
        newSet.add(category)
      }
      return newSet
    })
  }

  return (
    <RunnersContext.Provider
      value={{
        searchQuery,
        setSearchQuery,
        selectedCategories,
        setSelectedCategories,
        toggleCategory,
        organizationMode,
        setOrganizationMode,
      }}
    >
      {children}
    </RunnersContext.Provider>
  )
}

export function useRunnersContext() {
  const context = useContext(RunnersContext)
  if (context === undefined) {
    throw new Error('useRunnersContext must be used within a RunnersProvider')
  }
  return context
}
