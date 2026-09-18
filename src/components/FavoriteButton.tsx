import { useState } from 'react'
import { useTheme } from '../theme/ThemeContext'

interface FavoriteButtonProps {
  isFavorite: boolean
  onToggle: () => void
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Favorite button that toggles on click
 * Click event is stopped from propagating to parent elements
 */
export function FavoriteButton({ isFavorite, onToggle, size = 'md' }: FavoriteButtonProps) {
  const { theme } = useTheme()
  const [isPressed, setIsPressed] = useState(false)

  // Size configurations
  const sizeConfig = {
    sm: { icon: '16px', padding: theme.spacing.xs },
    md: { icon: '20px', padding: theme.spacing.sm },
    lg: { icon: '24px', padding: theme.spacing.md },
  }

  const config = sizeConfig[size]

  // Handle click and stop propagation
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent parent click handler
    e.preventDefault()
    onToggle()
  }

  // Handle mouse down for visual feedback
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsPressed(true)
  }

  // Handle mouse up
  const handleMouseUp = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsPressed(false)
  }

  // Star icon (filled when favorited, outline when not)
  const starIcon = isFavorite ? '★' : '☆'

  return (
    <button
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => setIsPressed(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: config.padding,
        fontSize: config.icon,
        color: isFavorite ? theme.colors.primary : theme.colors.textSecondary,
        backgroundColor: isPressed ? theme.colors.surfaceHover : 'transparent',
        border: 'none',
        borderRadius: theme.borderRadius.full,
        cursor: 'pointer',
        transition: `all ${theme.transitions.fast}`,
        transform: isPressed ? 'scale(0.9)' : 'scale(1)',
        opacity: isPressed ? 0.7 : 1,
        flexShrink: 0,
        WebkitTapHighlightColor: 'transparent', // Remove tap highlight on mobile
      }}
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      type="button"
    >
      {starIcon}
    </button>
  )
}
