import type { CSSProperties } from 'react'
import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../theme/ThemeContext'
import { useFavorites } from '../contexts/FavoritesContext'
import { useUser } from '../contexts/UserContext'
import type { ModelConfig } from '../types/models'

interface ModelIconProps {
  model: ModelConfig
  size?: 'sm' | 'md' | 'lg'
  onAuthRequired?: () => void
}

/**
 * iOS-style circular app icon for models
 * Displays model in a circular container with name underneath
 */
export function ModelIcon({ model, size = 'md', onAuthRequired }: ModelIconProps) {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const { favorites, toggleFavorite } = useFavorites()
  const { isSignedIn } = useUser()
  const isFavorite = favorites.includes(model.id)

  const [isPressed, setIsPressed] = useState(false)
  const [shouldFavorite, setShouldFavorite] = useState(false)
  const pressTimerRef = useRef<number | null>(null)
  const pressStartRef = useRef<{ x: number; y: number } | null>(null)

  const sizes = {
    sm: {
      icon: '48px',
      text: theme.typography.sizes.xs,
    },
    md: {
      icon: '64px',
      text: theme.typography.sizes.sm,
    },
    lg: {
      icon: '80px',
      text: theme.typography.sizes.base,
    },
  }

  const containerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: theme.spacing.sm,
    textDecoration: 'none',
    minWidth: sizes[size].icon,
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault() // Prevent default touch behaviors (context menu, image save)
    const touch = e.touches[0]
    pressStartRef.current = { x: touch.clientX, y: touch.clientY }
    setIsPressed(true)

    pressTimerRef.current = setTimeout(() => {
      setShouldFavorite(true)
    }, 500) // 500ms hold triggers favorite
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!pressStartRef.current) return

    const touch = e.touches[0]
    const deltaX = Math.abs(touch.clientX - pressStartRef.current.x)
    const deltaY = Math.abs(touch.clientY - pressStartRef.current.y)

    // Cancel if moved too far
    if (deltaX > 10 || deltaY > 10) {
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current)
        pressTimerRef.current = null
      }
      setIsPressed(false)
      setShouldFavorite(false)
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault()

    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current)
      pressTimerRef.current = null
    }

    if (shouldFavorite) {
      // Toggle favorite
      toggleFavorite(model.id)
    } else if (isPressed) {
      // Normal tap - check auth before navigate
      if (!isSignedIn) {
        onAuthRequired?.()
      } else {
        navigate(`/runners/${model.slug}`)
      }
    }

    setIsPressed(false)
    setShouldFavorite(false)
    pressStartRef.current = null
  }

  const iconContainerStyle: CSSProperties = {
    width: sizes[size].icon,
    height: sizes[size].icon,
    borderRadius: theme.borderRadius.full,
    background: `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: isPressed ? 'none' : theme.transitions.normal,
    boxShadow: theme.shadows.md,
    border: `2px solid ${theme.colors.border}`,
    overflow: 'hidden',
    padding: theme.spacing.sm,
    transform: isPressed ? 'scale(1.2)' : 'scale(1)',
    opacity: shouldFavorite ? 0.8 : 1,
  }

  const iconImageStyle: CSSProperties = {
    width: '70%',
    height: '70%',
    objectFit: 'contain',
    filter: 'brightness(0) invert(1)',
    pointerEvents: 'none', // Prevent image interaction
    userSelect: 'none', // Prevent text/image selection
  }

  const iconHoverStyle: CSSProperties = {
    transform: 'scale(1.05)',
    boxShadow: theme.shadows.lg,
  }

  const nameStyle: CSSProperties = {
    fontSize: sizes[size].text,
    fontWeight: isFavorite ? theme.typography.weights.semibold : theme.typography.weights.medium,
    color: isFavorite ? theme.colors.gradientStart : theme.colors.text,
    textAlign: 'center',
    width: '100%',
    lineHeight: '1.3',
    wordWrap: 'break-word',
    overflowWrap: 'break-word',
    hyphens: 'auto',
  }

  // Fallback to first letter if no icon
  const iconInitial = model.name.charAt(0).toUpperCase()

  return (
    <div style={{ ...containerStyle, position: 'relative' }}>
      {/* Bubble tooltip */}
      {shouldFavorite && (
        <div
          style={{
            position: 'absolute',
            top: '-45px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: theme.colors.surface,
            color: theme.colors.text,
            padding: `${theme.spacing.sm} ${theme.spacing.md}`,
            borderRadius: theme.borderRadius.md,
            fontSize: theme.typography.sizes.sm,
            fontWeight: theme.typography.weights.semibold,
            whiteSpace: 'nowrap',
            boxShadow: theme.shadows.lg,
            border: `1px solid ${theme.colors.border}`,
            zIndex: 1000,
          }}
        >
          {isFavorite ? 'Unfavorite?' : 'Favorite?'}
        </div>
      )}
      <div
        style={iconContainerStyle}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={(e) => {
          Object.assign(e.currentTarget.style, iconHoverStyle)
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = theme.shadows.md
        }}
        onClick={() => {
          // Desktop click - navigate normally
          if (!('ontouchstart' in window)) {
            navigate(`/runners/${model.slug}`)
          }
        }}
      >
        {model.icon ? (
          <img
            src={model.icon}
            alt={`${model.name} icon`}
            style={iconImageStyle}
          />
        ) : (
          <div style={{
            fontSize: theme.typography.sizes.xxl,
            color: theme.colors.textInverse,
            fontWeight: theme.typography.weights.bold,
          }}>
            {iconInitial}
          </div>
        )}
      </div>
      <span style={nameStyle}>{model.name}</span>
    </div>
  )
}
