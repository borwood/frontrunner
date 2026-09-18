import { useMemo, useState } from 'react'
import { useTheme } from '../theme/ThemeContext'
import { useUser } from '../contexts/UserContext'
import { ModelListItem } from '../components/ModelListItem'
import { ModelIcon } from '../components/ModelIcon'
import { AnimatedToggle } from '../components/AnimatedToggle'
import { SearchInput } from '../components/SearchInput'
import { SignInPromptModal } from '../components/SignInPromptModal'
import { useRunnersContext } from '../contexts/RunnersContext'
import { useFavorites } from '../contexts/FavoritesContext'
import { MODELS, type ModelCategory, type ModelConfig } from '../types/models'

// Extract company from model ID (e.g., "openai/gpt-4o" -> "OpenAI")
function getCompanyFromId(id: string): string {
  const company = id.split('/')[0]
  return company
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Get all unique companies (excluding test models)
function getAllCompanies(): string[] {
  const companies = new Set(
    MODELS
      .filter((model) => !model.tags.includes('test'))
      .map((model) => getCompanyFromId(model.id))
  )
  return Array.from(companies).sort()
}

// Get all unique categories
function getAllCategories(): ModelCategory[] {
  return ['text', 'image', 'video']
}

export function Runners() {
  const { theme } = useTheme()
  const { signIn } = useUser()
  const { searchQuery, setSearchQuery, selectedCategories, setSelectedCategories, organizationMode, setOrganizationMode } = useRunnersContext()
  const { favorites } = useFavorites()
  const [showSignInPrompt, setShowSignInPrompt] = useState(false)

  const categories = getAllCategories()
  const companies = getAllCompanies()

  // Calculate total non-test models
  const totalNonTestModels = MODELS.filter(m => !m.tags.includes('test')).length


  // Determine current filter state for AnimatedFilter
  const currentFilter = selectedCategories.size === 3 ? 'all' : Array.from(selectedCategories)[0] as ModelCategory

  // Handle filter change from AnimatedFilter
  const handleFilterChange = (filter: 'all' | ModelCategory) => {
    if (filter === 'all') {
      setSelectedCategories(new Set(['text', 'image', 'video']))
    } else {
      setSelectedCategories(new Set([filter]))
    }
  }

  // Filter models based on search and selected categories, then sort favorites first
  const filteredModels = useMemo(() => {
    let filtered = MODELS

    // Exclude models with 'test' tag
    filtered = filtered.filter((model) => !model.tags.includes('test'))

    // Filter by selected categories
    if (selectedCategories.size > 0) {
      filtered = filtered.filter((model) => selectedCategories.has(model.category))
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((model) => {
        const nameMatch = model.name.toLowerCase().includes(query)
        const descriptionMatch = model.description.toLowerCase().includes(query)
        const categoryMatch = model.category.toLowerCase().includes(query)
        const companyMatch = getCompanyFromId(model.id).toLowerCase().includes(query)
        return nameMatch || descriptionMatch || categoryMatch || companyMatch
      })
    }

    // Sort favorites first
    filtered.sort((a, b) => {
      const aIsFavorite = favorites.includes(a.id)
      const bIsFavorite = favorites.includes(b.id)
      if (aIsFavorite && !bIsFavorite) return -1
      if (!aIsFavorite && bIsFavorite) return 1
      return 0
    })

    return filtered
  }, [searchQuery, selectedCategories, favorites])

  // Organize models by type/company based on mode
  const organizedModels = useMemo(() => {
    if (organizationMode === 'by-type') {
      // Group by category, then separate favorites and companies within each category
      return categories.map((category) => {
        const categoryModels = filteredModels.filter((model) => model.category === category)
        if (categoryModels.length === 0) return null

        // Split into favorites and non-favorites
        const favoriteModels = categoryModels.filter((model) => favorites.includes(model.id))
        const nonFavoriteModels = categoryModels.filter((model) => !favorites.includes(model.id))

        const subgroups: any[] = []

        // Add favorites subgroup if there are any
        if (favoriteModels.length > 0) {
          subgroups.push({
            company: 'Favorites',
            models: favoriteModels.sort((a, b) => a.name.localeCompare(b.name)),
            isFavorites: true,
          })
        }

        // Sub-group non-favorites by company
        const companiesInCategory = Array.from(new Set(nonFavoriteModels.map((model) => getCompanyFromId(model.id)))).sort()
        companiesInCategory.forEach((company) => {
          subgroups.push({
            company,
            models: nonFavoriteModels.filter((model) => getCompanyFromId(model.id) === company),
            isFavorites: false,
          })
        })

        return {
          category,
          subgroups,
          totalCount: categoryModels.length,
        }
      }).filter(Boolean)
    } else {
      // Group by company, then separate favorites and categories within each company
      return companies.map((company) => {
        const companyModels = filteredModels.filter((model) => getCompanyFromId(model.id) === company)
        if (companyModels.length === 0) return null

        // Split into favorites and non-favorites
        const favoriteModels = companyModels.filter((model) => favorites.includes(model.id))
        const nonFavoriteModels = companyModels.filter((model) => !favorites.includes(model.id))

        const subgroups: any[] = []

        // Add favorites subgroup if there are any
        if (favoriteModels.length > 0) {
          subgroups.push({
            category: 'Favorites',
            models: favoriteModels.sort((a, b) => a.name.localeCompare(b.name)),
            isFavorites: true,
          })
        }

        // Sub-group non-favorites by category
        const categoriesInCompany = Array.from(new Set(nonFavoriteModels.map((model) => model.category))).sort()
        categoriesInCompany.forEach((category) => {
          subgroups.push({
            category,
            models: nonFavoriteModels.filter((model) => model.category === category),
            isFavorites: false,
          })
        })

        return {
          company,
          subgroups,
          totalCount: companyModels.length,
        }
      }).filter(Boolean)
    }
  }, [filteredModels, organizationMode, categories, companies, favorites])

  // Distribute organized models into columns for desktop grid
  const gridColumns = useMemo(() => {
    const columnCount = organizedModels.length >= 3 ? 3 : organizedModels.length >= 2 ? 2 : 1
    const columns: any[][] = Array.from({ length: columnCount }, () => [])

    organizedModels.forEach((group, index) => {
      columns[index % columnCount].push(group)
    })

    return columns
  }, [organizedModels])

  return (
    <div className="runners-page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Mobile Search Bar (at top of page) */}
      <div className="mobile-search-container" style={{ padding: theme.spacing.md }}>
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search models..."
        />
      </div>

      {/* Filter and Organization Mode Toggle */}
      <div style={{ padding: theme.spacing.md, flexShrink: 0 }}>
        <div className="filters-container" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: theme.spacing.md,
        }}>
          {/* Organization Mode Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
            <span className="filter-label" style={{
              fontSize: theme.typography.sizes.sm,
              fontWeight: theme.typography.weights.medium,
              color: theme.colors.textSecondary,
              whiteSpace: 'nowrap',
            }}>
              Order by:
            </span>
            <div style={{ flex: 1 }}>
              <AnimatedToggle
                options={[
                  { value: 'by-type', label: 'Type' },
                  { value: 'by-company', label: 'Organization' },
                ]}
                selected={organizationMode}
                onChange={setOrganizationMode}
              />
            </div>
          </div>

          {/* Category Filter - Animated */}
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
            <span className="filter-label" style={{
              fontSize: theme.typography.sizes.sm,
              fontWeight: theme.typography.weights.medium,
              color: theme.colors.textSecondary,
              whiteSpace: 'nowrap',
            }}>
              Category:
            </span>
            <div style={{ flex: 1 }}>
              <AnimatedToggle
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'text', label: 'Text' },
                  { value: 'image', label: 'Image' },
                  { value: 'video', label: 'Video' },
                ]}
                selected={currentFilter}
                onChange={handleFilterChange}
              />
            </div>
          </div>
        </div>

        {/* Results count */}
        <p
          style={{
            fontSize: theme.typography.sizes.sm,
            color: theme.colors.textSecondary,
            marginTop: theme.spacing.sm,
            textAlign: 'center',
          }}
        >
          {filteredModels.length} of {totalNonTestModels} model{totalNonTestModels !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Model Listings */}
      <div className="runners-listings-container" style={{ flex: 1, minHeight: 0 }}>
        {filteredModels.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: theme.spacing.xxl,
              color: theme.colors.textSecondary,
            }}
          >
            <p style={{ fontSize: theme.typography.sizes.lg }}>
              {searchQuery.trim() ? 'No matching models found.' : 'No models available.'}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile: Linear layout */}
            <div className="runners-mobile-layout" style={{ padding: `0 ${theme.spacing.md} ${theme.spacing.xxl}` }}>
              {organizationMode === 'by-type' ? (
                organizedModels.map((group: any) => (
                  <section key={group.category} style={{ marginBottom: theme.spacing.xl }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: theme.spacing.md
                    }}>
                      <h2
                        style={{
                          fontSize: theme.typography.sizes.lg,
                          fontWeight: theme.typography.weights.semibold,
                          color: theme.colors.text,
                          textTransform: 'capitalize',
                          marginRight: theme.spacing.sm,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {group.category} ({group.totalCount})
                      </h2>
                      <div style={{
                        flex: 1,
                        height: '3px',
                        backgroundColor: theme.colors.border
                      }} />
                    </div>
                    {group.subgroups.map((subgroup: any) => (
                      <div key={subgroup.company} style={{ marginBottom: theme.spacing.lg }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          marginBottom: theme.spacing.sm,
                          paddingLeft: theme.spacing.sm,
                        }}>
                          <h3
                            style={{
                              fontSize: theme.typography.sizes.base,
                              fontWeight: theme.typography.weights.medium,
                              color: theme.colors.textSecondary,
                              marginRight: theme.spacing.sm,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {subgroup.company}
                          </h3>
                          <div style={{
                            flex: 1,
                            height: '1px',
                            backgroundColor: theme.colors.border
                          }} />
                        </div>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: theme.spacing.md,
                          }}
                        >
                          {subgroup.models.map((model: ModelConfig) => (
                            <ModelIcon
                              key={model.id}
                              model={model}
                              size="md"
                              onAuthRequired={() => setShowSignInPrompt(true)}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </section>
                ))
              ) : (
                organizedModels.map((group: any) => (
                  <section key={group.company} style={{ marginBottom: theme.spacing.xl }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: theme.spacing.md
                    }}>
                      <h2
                        style={{
                          fontSize: theme.typography.sizes.lg,
                          fontWeight: theme.typography.weights.semibold,
                          color: theme.colors.text,
                          marginRight: theme.spacing.sm,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {group.company} ({group.totalCount})
                      </h2>
                      <div style={{
                        flex: 1,
                        height: '3px',
                        backgroundColor: theme.colors.border
                      }} />
                    </div>
                    {group.subgroups.map((subgroup: any) => (
                      <div key={subgroup.category} style={{ marginBottom: theme.spacing.lg }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          marginBottom: theme.spacing.sm,
                          paddingLeft: theme.spacing.sm,
                        }}>
                          <h3
                            style={{
                              fontSize: theme.typography.sizes.base,
                              fontWeight: theme.typography.weights.medium,
                              color: theme.colors.textSecondary,
                              marginRight: theme.spacing.sm,
                              whiteSpace: 'nowrap',
                              textTransform: 'capitalize',
                            }}
                          >
                            {subgroup.category}
                          </h3>
                          <div style={{
                            flex: 1,
                            height: '1px',
                            backgroundColor: theme.colors.border
                          }} />
                        </div>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: theme.spacing.md,
                          }}
                        >
                          {subgroup.models.map((model: ModelConfig) => (
                            <ModelIcon
                              key={model.id}
                              model={model}
                              size="md"
                              onAuthRequired={() => setShowSignInPrompt(true)}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </section>
                ))
              )}
            </div>

            {/* Desktop: Grid with scrollable columns */}
            <div className="runners-desktop-grid">
              {gridColumns.map((column, colIndex) => (
                <div key={colIndex} className="runners-grid-column">
                  {column.map((group: any) => (
                    <section
                      key={organizationMode === 'by-type' ? group.category : group.company}
                      className="runners-grid-section"
                    >
                      <h2
                        style={{
                          fontSize: theme.typography.sizes.lg,
                          fontWeight: theme.typography.weights.semibold,
                          color: theme.colors.text,
                          marginBottom: theme.spacing.md,
                          textTransform: organizationMode === 'by-type' ? 'capitalize' : 'none',
                        }}
                      >
                        {organizationMode === 'by-type' ? group.category : group.company} ({group.totalCount})
                      </h2>
                      {group.subgroups.map((subgroup: any) => (
                        <div
                          key={organizationMode === 'by-type' ? subgroup.company : subgroup.category}
                          style={{ marginBottom: theme.spacing.lg }}
                        >
                          <h3
                            style={{
                              fontSize: theme.typography.sizes.base,
                              fontWeight: theme.typography.weights.medium,
                              color: theme.colors.textSecondary,
                              marginBottom: theme.spacing.sm,
                              paddingLeft: theme.spacing.sm,
                              textTransform: organizationMode === 'by-company' ? 'capitalize' : 'none',
                            }}
                          >
                            {organizationMode === 'by-type' ? subgroup.company : subgroup.category}
                          </h3>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
                            {subgroup.models.map((model: ModelConfig) => (
                              <ModelListItem
                                key={model.id}
                                model={model}
                                onAuthRequired={() => setShowSignInPrompt(true)}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </section>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Sign In Prompt Modal */}
      <SignInPromptModal
        isOpen={showSignInPrompt}
        onClose={() => setShowSignInPrompt(false)}
        onSignIn={() => {
          setShowSignInPrompt(false)
          signIn()
        }}
        message="You need to sign in to interact with models."
      />

      {/* CSS for responsive layout */}
      <style>{`
        /* Mobile: Show mobile layout only */
        .runners-mobile-layout {
          display: block;
        }

        .runners-desktop-grid {
          display: none;
        }

        .filter-label {
          display: none;
        }

        /* Desktop: Grid with scrollable columns */
        @media (min-width: 769px) {
          .mobile-search-container {
            display: none !important;
          }

          .runners-mobile-layout {
            display: none !important;
          }

          .filters-container {
            flex-direction: row !important;
            align-items: center;
            justify-content: center;
          }

          .filter-label {
            display: inline !important;
          }

          .filters-container > div {
            flex: 0 1 auto;
          }

          .filters-container > div:first-child {
            width: 400px;
          }

          .filters-container > div:last-child {
            width: 500px;
          }

          .runners-desktop-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: ${theme.spacing.md};
            height: 100%;
            padding: 0 ${theme.spacing.lg} ${theme.spacing.lg};
            overflow: hidden;
          }

          .runners-grid-column {
            overflow-y: auto;
            overflow-x: hidden;
            padding: ${theme.spacing.sm};
            background-color: ${theme.colors.surface};
            border: 1px solid ${theme.colors.border};
            border-radius: ${theme.borderRadius.lg};
            -webkit-overflow-scrolling: touch;
          }

          .runners-grid-section {
            background-color: ${theme.colors.background};
            border: 1px solid ${theme.colors.border};
            border-radius: ${theme.borderRadius.md};
            padding: ${theme.spacing.md};
            margin-bottom: ${theme.spacing.md};
          }

          .runners-grid-section:last-child {
            margin-bottom: 0;
          }
        }

        @media (min-width: 1400px) {
          .runners-desktop-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>
    </div>
  )
}
