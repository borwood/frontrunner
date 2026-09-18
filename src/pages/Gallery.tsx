import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useDrag } from '@use-gesture/react'
import { useTheme } from '../theme/ThemeContext'
import { useUnifiedStorage } from '../hooks/useUnifiedStorage'
import { GenerationModal } from '../components/GenerationModal'
import { SearchInput } from '../components/SearchInput'
import { useGalleryContext } from '../contexts/GalleryContext'
import { MobileGrid, DesktopMasonryGrid } from '../components/grids'
import type { Generation } from '../types/models'

type OutputType = 'image' | 'video' | 'text'

export function Gallery() {
  const { theme } = useTheme()
  const [generations] = useUnifiedStorage('generations', [], { skipLocalStorage: true })
  const [selectedGeneration, setSelectedGeneration] = useState<Generation | null>(null)
  const { searchQuery, setSearchQuery, selectedTypes, toggleType } = useGalleryContext()
  const [columnCount, setColumnCount] = useState(3)

  // Memoize the click handler to prevent unnecessary re-renders
  const handleGenerationClick = useCallback((generation: Generation) => {
    setSelectedGeneration(generation)
  }, [])

  // Calculate responsive column count based on window width
  useEffect(() => {
    const calculateColumns = () => {
      const width = window.innerWidth
      if (width >= 1600) {
        setColumnCount(5)
      } else if (width >= 1200) {
        setColumnCount(4)
      } else if (width >= 900) {
        setColumnCount(3)
      } else {
        setColumnCount(2)
      }
    }

    calculateColumns()
    window.addEventListener('resize', calculateColumns)
    return () => window.removeEventListener('resize', calculateColumns)
  }, [])

  // Mobile inline tray state
  const [trayHeight, setTrayHeight] = useState(0)
  const [trayOverstretch, setTrayOverstretch] = useState(0) // Extra padding when pulling down on open tray
  const [trayIsAnimating, setTrayIsAnimating] = useState(false)
  const [isUserTouching, setIsUserTouching] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const initialScrollTop = useRef(0) // Track scroll position when gesture starts

  const TRAY_RESTING_HEIGHT = 200
  const TRAY_THRESHOLD = 100
  const MAX_OVERSTRETCH = 100

  // Gesture handler for handle bar only - simpler logic
  const bind = useDrag(
    ({ first, last, movement: [, my], velocity: [, vy], memo = trayHeight, active, event, tap }) => {
      // Prevent pull-to-refresh on mobile browsers
      event?.preventDefault()

      // Track if user is actively touching
      setIsUserTouching(active)

      const mainElement = document.querySelector('main')
      if (!mainElement) return memo

      // On first touch
      if (first) {
        // Save the initial scroll position when we start dragging
        initialScrollTop.current = mainElement.scrollTop
        // Lock the main scroll container to prevent page scrolling while dragging handle
        mainElement.style.overflowY = 'hidden'
        mainElement.scrollTop = initialScrollTop.current
        return trayHeight
      }

      // On release
      if (last) {
        // Handle tap/click - toggle open/closed
        if (tap) {
          const finalHeight = trayHeight === 0 ? TRAY_RESTING_HEIGHT : 0
          setTrayIsAnimating(true)
          setTrayHeight(finalHeight)
          setTrayOverstretch(0)

          // Re-enable scrolling immediately
          setTimeout(() => {
            const main = document.querySelector('main')
            if (main) {
              main.style.overflowY = 'auto'
            }
            setTrayIsAnimating(false)
          }, 0)

          return finalHeight
        }

        // Handle drag - determine if we should close or keep open
        const projectedHeight = memo + (vy * 50)
        const finalHeight = projectedHeight > TRAY_THRESHOLD ? TRAY_RESTING_HEIGHT : 0

        // Calculate how much the tray is changing in height
        const trayHeightDelta = finalHeight - trayHeight

        setTrayIsAnimating(true)
        setTrayHeight(finalHeight)
        setTrayOverstretch(0) // Snap overstretch back

        // Re-enable scrolling and compensate for tray height change
        setTimeout(() => {
          const main = document.querySelector('main')
          if (main) {
            // Restore scroll to initial position, adjusted for tray height change
            // When tray closes (negative delta), we add that delta to keep visual position stable
            main.scrollTop = Math.max(0, initialScrollTop.current + trayHeightDelta)
            main.style.overflowY = 'auto'
          }
          setTrayIsAnimating(false)
        }, 0) // Do this immediately, not after animation

        return finalHeight
      }

      // During drag - update tray height
      const resistance = 0.6
      let newHeight = trayHeight + my * resistance

      // If at resting height and pulling down (positive my), add overstretch
      if (newHeight >= TRAY_RESTING_HEIGHT && my > 0) {
        // Tray is at full height, apply overstretch with more resistance
        const overpull = my * 0.3 // More resistance for overstretch
        const newOverstretch = Math.max(0, Math.min(overpull, MAX_OVERSTRETCH))
        setTrayOverstretch(newOverstretch)
        setTrayHeight(TRAY_RESTING_HEIGHT)
        return TRAY_RESTING_HEIGHT
      } else {
        // Normal tray height adjustment
        setTrayOverstretch(0) // Clear overstretch when not at top
        newHeight = Math.max(0, Math.min(newHeight, TRAY_RESTING_HEIGHT))
        setTrayHeight(newHeight)
        return newHeight
      }
    },
    {
      from: () => [0, 0],
      filterTaps: true,
      pointer: { touch: true },
      threshold: 5,
      eventOptions: { passive: false },
    }
  )

  // Filter generations based on search query and output types
  const filteredGenerations = useMemo(() => {
    let filtered = generations

    // Filter by output type
    if (selectedTypes.size > 0) {
      filtered = filtered.filter((gen) => selectedTypes.has(gen.outputData.type as OutputType))
    }

    // Filter by search query (model name, prompt, or text output)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((gen) => {
        const modelMatch = gen.modelName.toLowerCase().includes(query)
        const promptMatch = gen.inputData.prompt?.toLowerCase().includes(query) ?? false

        // Also search within text outputs
        const textMatch = gen.outputData.type === 'text' &&
          typeof gen.outputData.content === 'string' &&
          gen.outputData.content.toLowerCase().includes(query)

        return modelMatch || promptMatch || textMatch
      })
    }

    return filtered
  }, [generations, searchQuery, selectedTypes])

  return (
    <>
      {/* Desktop Filter Pills and Results */}
      <div style={{ marginBottom: theme.spacing.xl, padding: theme.spacing.lg, maxWidth: '1100px', marginInline: 'auto' }} className="desktop-filters">
        {/* Output Type Filter Pills */}
        <div
          style={{
            display: 'flex',
            gap: theme.spacing.sm,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          {(['image', 'video', 'text'] as OutputType[]).map((type) => {
            const isSelected = selectedTypes.has(type)
            return (
              <button
                key={type}
                onClick={() => toggleType(type)}
                style={{
                  padding: `${theme.spacing.xs} ${theme.spacing.md}`,
                  fontSize: theme.typography.sizes.sm,
                  fontWeight: theme.typography.weights.medium,
                  color: isSelected ? theme.colors.textInverse : theme.colors.text,
                  background: isSelected
                    ? `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`
                    : theme.colors.surface,
                  border: `1px solid ${isSelected ? 'transparent' : theme.colors.border}`,
                  borderRadius: '100px',
                  cursor: 'pointer',
                  transition: `all ${theme.transitions.fast}`,
                  textTransform: 'capitalize',
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.xs,
                }}
              >
                <span>{type}</span>
                {isSelected && (
                  <span
                    style={{
                      fontSize: theme.typography.sizes.xs,
                      color: theme.colors.textInverse,
                      opacity: 0.8,
                      fontWeight: theme.typography.weights.bold,
                    }}
                  >
                    ×
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <p
          style={{
            fontSize: theme.typography.sizes.sm,
            color: theme.colors.textSecondary,
            marginTop: theme.spacing.sm,
            textAlign: 'center',
          }}
        >
          {filteredGenerations.length} of {generations.length} saved generation{generations.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* In-Flow Tray (Mobile Only) */}
      <div
        className="mobile-container in-flow-tray"
        style={{
          maxHeight: `${trayHeight}px`,
          overflow: 'hidden',
          backgroundColor: theme.colors.surface,
          borderBottom: trayHeight > 0 ? `1px solid ${theme.colors.border}` : 'none',
          transition: trayIsAnimating ? `max-height ${theme.transitions.normal}` : 'none',
          opacity: Math.min(trayHeight / TRAY_THRESHOLD, 1),
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end', // Align content to bottom
        }}
      >
        {/* Overstretch spacer - adds elastic padding at top when pulling down on open tray */}
        <div style={{
          height: `${trayOverstretch}px`,
          flexShrink: 0,
          transition: !isUserTouching ? 'height 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
          backgroundColor: theme.colors.surface,
          willChange: 'height',
        }} />

        <div style={{ padding: theme.spacing.md }}>
          {/* Search Bar */}
          <div style={{ marginBottom: theme.spacing.sm }}>
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by model or prompt..."
              style={{ borderRadius: '100px' }}
            />
          </div>

          {/* Filter Pills */}
          <div
            style={{
              display: 'flex',
              gap: theme.spacing.xs,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            {(['image', 'video', 'text'] as OutputType[]).map((type) => {
              const isSelected = selectedTypes.has(type)
              return (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  style={{
                    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                    fontSize: theme.typography.sizes.xs,
                    fontWeight: theme.typography.weights.medium,
                    color: isSelected ? theme.colors.textInverse : theme.colors.text,
                    background: isSelected
                      ? `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`
                      : theme.colors.background,
                    border: `1px solid ${isSelected ? 'transparent' : theme.colors.border}`,
                    borderRadius: '100px',
                    cursor: 'pointer',
                    transition: `all ${theme.transitions.fast}`,
                    textTransform: 'capitalize',
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.xs,
                  }}
                >
                  <span>{type}</span>
                  {isSelected && (
                    <span
                      style={{
                        fontSize: '10px',
                        color: theme.colors.textInverse,
                        opacity: 0.8,
                        fontWeight: theme.typography.weights.bold,
                      }}
                    >
                      ×
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Results count */}
          <p
            style={{
              fontSize: theme.typography.sizes.xs,
              color: theme.colors.textSecondary,
              textAlign: 'center',
              marginTop: theme.spacing.sm,
              marginBottom: 0,
            }}
          >
            {filteredGenerations.length} of {generations.length} saved generation{generations.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Mobile Gallery Container */}
      <div
        ref={containerRef}
        className="mobile-container"
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* Drawer Handle Bar - Always visible, draggable */}
        <div
          {...bind()}
          className="filter-bar"
          style={{
            width: '100%',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            backgroundColor: theme.colors.surface,
            borderBottom: `1px solid ${theme.colors.border}`,
            borderTop: `1px solid ${theme.colors.borderLight}`,
            boxShadow: 'inset 0 -1px 3px rgba(0, 0, 0, 0.05), inset 0 1px 2px rgba(255, 255, 255, 0.05)',
            transition: `all ${theme.transitions.fast}`,
            position: 'relative',
            flexShrink: 0,
            touchAction: 'none', // Prevent pull-to-refresh and other browser gestures
            WebkitUserSelect: 'none',
            userSelect: 'none',
          }}
        >
          {/* Drawer handle indicator */}
          <div
            style={{
              width: '40px',
              height: '4px',
              borderRadius: theme.borderRadius.full,
              background: `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`,
              opacity: 0.5,
            }}
          />
        </div>

        {/* Gallery Items Container */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minHeight: 0,
            overflowY: 'auto', // Always allow scrolling
            WebkitOverflowScrolling: 'touch', // Enable momentum scrolling on iOS
            overscrollBehavior: 'contain', // Prevent pull-to-refresh and improve scrolling
          }}
        >
        {filteredGenerations.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: theme.spacing.xxl,
            color: theme.colors.textSecondary,
          }}
        >
          <p style={{ fontSize: theme.typography.sizes.lg }}>
            {searchQuery.trim() ? 'No matching generations found.' : 'No generations yet. Start creating!'}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Grid (4 columns, square cards) */}
          <MobileGrid
            generations={filteredGenerations}
            onGenerationClick={handleGenerationClick}
            showFavorites={true}
          />
      </>
      )}
        </div>{/* End Gallery Items Container */}
      </div>{/* End Mobile Gallery Container */}

      {/* Desktop Gallery (outside mobile container) */}
      <div style={{ padding: theme.spacing.lg, maxWidth: '1100px', marginInline: 'auto' }} className="desktop-content">
        {filteredGenerations.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: theme.spacing.xxl,
              color: theme.colors.textSecondary,
            }}
          >
            <p style={{ fontSize: theme.typography.sizes.lg }}>
              {searchQuery.trim() ? 'No matching generations found.' : 'No generations yet. Start creating!'}
            </p>
          </div>
        ) : (
          <DesktopMasonryGrid
            generations={filteredGenerations}
            onGenerationClick={handleGenerationClick}
            columnCount={columnCount}
            showFavorites={true}
          />
        )}
      </div>

      {/* Modal */}
      {selectedGeneration && (
        <GenerationModal
          generation={selectedGeneration}
          onClose={() => setSelectedGeneration(null)}
        />
      )}

      {/* CSS for responsive layout */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-gallery {
            display: none !important;
          }
          .desktop-filters {
            display: none !important;
          }
          .desktop-content {
            display: none !important;
          }
        }
        @media (min-width: 769px) {
          .mobile-gallery {
            display: none !important;
          }
          .mobile-container {
            display: none !important;
          }
        }
      `}</style>
    </>
  )
}
