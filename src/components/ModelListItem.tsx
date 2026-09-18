import { useNavigate } from 'react-router-dom'
import { useTheme } from '../theme/ThemeContext'
import { useFavorites } from '../contexts/FavoritesContext'
import { useChat } from '../contexts/ChatContext'
import { useUser } from '../contexts/UserContext'
import type { ModelConfig } from '../types/models'
import { useState } from 'react'

interface ModelListItemProps {
  model: ModelConfig
  onAuthRequired?: () => void
}

export function ModelListItem({ model, onAuthRequired }: ModelListItemProps) {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const { isFavorite: isFavoriteHook } = useFavorites()
  const { createConversation } = useChat()
  const { isSignedIn } = useUser()
  const [isHovered, setIsHovered] = useState(false)

  // Always use context to ensure reactivity
  const isFavorite = isFavoriteHook(model.id)
  const isTextModel = model.category === 'text'

  const handleStartChat = () => {
    if (!isSignedIn) {
      onAuthRequired?.()
      return
    }
    // Create a new conversation with this model
    createConversation(model.id, model.name)
    // Navigate to chat page
    navigate('/chat')
  }

  const handleRunModel = () => {
    if (!isSignedIn) {
      onAuthRequired?.()
      return
    }
    navigate(`/runners/${model.slug}`)
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.md,
        padding: `${theme.spacing.sm} ${theme.spacing.md}`,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        border: isFavorite
          ? `1px solid ${theme.colors.primary}80`
          : `1px solid ${theme.colors.border}`,
        cursor: 'pointer',
        transition: `all ${theme.transitions.normal}`,
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        setIsHovered(true)
        e.currentTarget.style.backgroundColor = theme.colors.surfaceHover
        e.currentTarget.style.borderColor = theme.colors.primary
      }}
      onMouseLeave={(e) => {
        setIsHovered(false)
        e.currentTarget.style.backgroundColor = theme.colors.surface
        e.currentTarget.style.borderColor = isFavorite ? `${theme.colors.primary}80` : theme.colors.border
      }}
    >
      {/* Favorite indicator (subtle glow for favorited items) */}
      {isFavorite && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(135deg, ${theme.colors.gradientStart}10, ${theme.colors.gradientEnd}10)`,
            borderRadius: theme.borderRadius.md,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Icon */}
      <div
        style={{
          flexShrink: 0,
          zIndex: 1,
          width: '40px',
          height: '40px',
          borderRadius: theme.borderRadius.full,
          background: `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: theme.spacing.xs,
        }}
      >
        {model.icon ? (
          <img
            src={model.icon}
            alt={`${model.name} icon`}
            style={{
              width: '70%',
              height: '70%',
              objectFit: 'contain',
              filter: 'brightness(0) invert(1)',
            }}
          />
        ) : (
          <div style={{
            fontSize: '24px',
            color: theme.colors.textInverse,
          }}>
            {model.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0, zIndex: 1 }}>
        <h3
          style={{
            fontSize: theme.typography.sizes.base,
            fontWeight: theme.typography.weights.semibold,
            color: theme.colors.text,
            margin: 0,
            marginBottom: '2px',
          }}
        >
          {model.name}
        </h3>

        {/* Description - shown on hover as tooltip on desktop */}
        {isHovered && (
          <div
            className="desktop-only-tooltip"
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 8px)',
              left: theme.spacing.md,
              right: theme.spacing.md,
              padding: theme.spacing.sm,
              backgroundColor: theme.colors.surface,
              border: `1px solid ${theme.colors.primary}`,
              borderRadius: theme.borderRadius.md,
              fontSize: theme.typography.sizes.sm,
              color: theme.colors.textSecondary,
              boxShadow: theme.shadows.lg,
              zIndex: 10,
              pointerEvents: 'none',
            }}
          >
            {model.description}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div
        style={{
          display: 'flex',
          gap: theme.spacing.xs,
          zIndex: 1,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {isTextModel ? (
          <>
            <button
              onClick={handleRunModel}
              style={{
                padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                fontSize: theme.typography.sizes.sm,
                fontWeight: theme.typography.weights.semibold,
                color: theme.colors.text,
                backgroundColor: 'transparent',
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.md,
                cursor: 'pointer',
                transition: `all ${theme.transitions.fast}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = theme.colors.primary
                e.currentTarget.style.color = theme.colors.primary
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = theme.colors.border
                e.currentTarget.style.color = theme.colors.text
              }}
            >
              Run
            </button>
            <button
              onClick={handleStartChat}
              style={{
                padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                fontSize: theme.typography.sizes.sm,
                fontWeight: theme.typography.weights.semibold,
                color: theme.colors.textInverse,
                background: `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`,
                border: 'none',
                borderRadius: theme.borderRadius.md,
                cursor: 'pointer',
                transition: `all ${theme.transitions.fast}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.9'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1'
              }}
            >
              Chat →
            </button>
          </>
        ) : (
          <button
            onClick={handleRunModel}
            style={{
              padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
              fontSize: theme.typography.sizes.sm,
              fontWeight: theme.typography.weights.semibold,
              color: theme.colors.textInverse,
              background: `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`,
              border: 'none',
              borderRadius: theme.borderRadius.md,
              cursor: 'pointer',
              transition: `all ${theme.transitions.fast}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1'
            }}
          >
            Run →
          </button>
        )}
      </div>

      {/* CSS for desktop-only tooltip */}
      <style>{`
        /* Hide tooltip on mobile */
        @media (max-width: 768px) {
          .desktop-only-tooltip {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
