import { useRef, useState, useEffect } from 'react'
import type { CSSProperties } from 'react'
import { useTheme } from '../theme/ThemeContext'
import type { ModelConfig } from '../types/models'
import { ModelIcon } from './ModelIcon'

interface ModelCarouselProps {
  models: ModelConfig[]
  size?: 'sm' | 'md' | 'lg'
  itemsPerView?: number // Number of items visible at once (auto-calculated on mobile)
}

/**
 * Swipeable carousel for model icons
 * Touch-optimized with smooth scrolling
 */
export function ModelCarousel({ models, size = 'md' }: ModelCarouselProps) {
  const { theme } = useTheme()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(false)

  // Check scroll position to show/hide arrows
  const updateArrows = () => {
    if (!scrollContainerRef.current) return

    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
    setShowLeftArrow(scrollLeft > 0)
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1)
  }

  useEffect(() => {
    updateArrows()
    window.addEventListener('resize', updateArrows)
    return () => window.removeEventListener('resize', updateArrows)
  }, [models])

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return

    const scrollAmount = scrollContainerRef.current.clientWidth * 0.8
    const newScrollLeft =
      direction === 'left'
        ? scrollContainerRef.current.scrollLeft - scrollAmount
        : scrollContainerRef.current.scrollLeft + scrollAmount

    scrollContainerRef.current.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth',
    })
  }

  const containerStyle: CSSProperties = {
    position: 'relative',
    width: '100%',
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    border: `1px solid ${theme.colors.border}`,
    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
  }

  const scrollContainerStyle: CSSProperties = {
    display: 'flex',
    gap: theme.spacing.lg,
    overflowX: 'auto',
    overflowY: 'hidden',
    scrollSnapType: 'x mandatory',
    WebkitOverflowScrolling: 'touch',
    scrollBehavior: 'smooth',
    padding: `${theme.spacing.md} 0`,
    // Hide scrollbar
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
  }

  const itemStyle: CSSProperties = {
    scrollSnapAlign: 'start',
    flexShrink: 0,
  }

  const arrowButtonStyle = (direction: 'left' | 'right'): CSSProperties => ({
    position: 'absolute',
    top: '50%',
    [direction]: theme.spacing.sm,
    transform: 'translateY(-50%)',
    width: '32px',
    height: '32px',
    borderRadius: theme.borderRadius.full,
    background: theme.colors.surface,
    border: `1px solid ${theme.colors.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: theme.zIndex.dropdown,
    boxShadow: theme.shadows.md,
    transition: theme.transitions.fast,
    color: theme.colors.text,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
  })

  const arrowHoverStyle: CSSProperties = {
    background: theme.colors.surfaceHover,
    boxShadow: theme.shadows.lg,
  }

  if (models.length === 0) {
    return (
      <div
        style={{
          padding: theme.spacing.lg,
          textAlign: 'center',
          color: theme.colors.textSecondary,
          fontSize: theme.typography.sizes.sm,
        }}
      >
        No models available
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      {/* Left arrow */}
      {showLeftArrow && (
        <button
          style={arrowButtonStyle('left')}
          onClick={() => scroll('left')}
          onMouseEnter={(e) => Object.assign(e.currentTarget.style, arrowHoverStyle)}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = theme.colors.surface
            e.currentTarget.style.boxShadow = theme.shadows.md
          }}
          aria-label="Scroll left"
        >
          ‹
        </button>
      )}

      {/* Scrollable container */}
      <div
        ref={scrollContainerRef}
        style={scrollContainerStyle}
        onScroll={updateArrows}
        className="hide-scrollbar"
      >
        {models.map((model) => (
          <div key={model.id} style={itemStyle}>
            <ModelIcon model={model} size={size} />
          </div>
        ))}
      </div>

      {/* Right arrow */}
      {showRightArrow && (
        <button
          style={arrowButtonStyle('right')}
          onClick={() => scroll('right')}
          onMouseEnter={(e) => Object.assign(e.currentTarget.style, arrowHoverStyle)}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = theme.colors.surface
            e.currentTarget.style.boxShadow = theme.shadows.md
          }}
          aria-label="Scroll right"
        >
          ›
        </button>
      )}

      {/* CSS to hide scrollbar */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}
