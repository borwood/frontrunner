import { useState } from 'react'
import { useTheme } from '../theme/ThemeContext'
import { FavoriteButton } from './FavoriteButton'
import { Modal } from './Modal'
import type { ModelConfig } from '../types/models'

interface CompactModelCardProps {
  model: ModelConfig
  isFavorite: boolean
  onToggleFavorite: () => void
}

export function CompactModelCard({ model, isFavorite, onToggleFavorite }: CompactModelCardProps) {
  const { theme } = useTheme()
  const [showInfoModal, setShowInfoModal] = useState(false)

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.sm,
          padding: theme.spacing.sm,
          backgroundColor: theme.colors.surface,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.borderRadius.md,
          position: 'relative',
        }}
      >
        {/* Model Icon - Circular */}
        {model.icon && (
          <div
            style={{
              width: '40px',
              height: '40px',
              minWidth: '40px',
              borderRadius: theme.borderRadius.full,
              background: `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: theme.spacing.xs,
            }}
          >
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
          </div>
        )}

        {/* Model Name & Tags */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {/* Model Name with Info Icon */}
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
            <h1
              style={{
                fontSize: theme.typography.sizes.sm,
                fontWeight: theme.typography.weights.bold,
                color: theme.colors.text,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                margin: 0,
              }}
            >
              {model.name}
            </h1>
            <button
              onClick={() => setShowInfoModal(true)}
              style={{
                width: '18px',
                height: '18px',
                minWidth: '18px',
                borderRadius: theme.borderRadius.full,
                border: `1px solid ${theme.colors.border}`,
                backgroundColor: theme.colors.background,
                color: theme.colors.textSecondary,
                fontSize: '11px',
                fontWeight: theme.typography.weights.semibold,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: `all ${theme.transitions.fast}`,
                padding: 0,
                lineHeight: 1,
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.backgroundElevated
                e.currentTarget.style.borderColor = theme.colors.primary
                e.currentTarget.style.color = theme.colors.primary
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.background
                e.currentTarget.style.borderColor = theme.colors.border
                e.currentTarget.style.color = theme.colors.textSecondary
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.background
                e.currentTarget.style.borderColor = theme.colors.border
                e.currentTarget.style.color = theme.colors.textSecondary
              }}
            >
              i
            </button>
          </div>

          {/* Horizontally Scrollable Tags */}
          <div
            style={{
              display: 'flex',
              gap: '4px',
              overflowX: 'auto',
              overflowY: 'hidden',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              touchAction: 'pan-x', // Only allow horizontal scroll, prevent back gesture
            }}
            className="hide-scrollbar"
          >
            {model.tags.map((tag: string) => (
              <span
                key={tag}
                style={{
                  padding: `2px 6px`,
                  fontSize: '9px',
                  fontWeight: theme.typography.weights.medium,
                  color: theme.colors.primary,
                  backgroundColor: `${theme.colors.primary}15`,
                  borderRadius: theme.borderRadius.sm,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Favorite Button */}
        <div style={{ flexShrink: 0 }}>
          <FavoriteButton
            isFavorite={isFavorite}
            onToggle={onToggleFavorite}
            size="md"
          />
        </div>
      </div>

      {/* Hide scrollbar CSS */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* Info Modal */}
      <Modal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        title={model.name}
        maxWidth="500px"
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing.md,
          }}
        >
          {/* Model Icon (larger in modal) */}
          {model.icon && (
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: theme.borderRadius.lg,
                background: `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: theme.spacing.sm,
                margin: '0 auto',
              }}
            >
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
            </div>
          )}

          {/* Description */}
          <p
            style={{
              fontSize: theme.typography.sizes.base,
              color: theme.colors.text,
              lineHeight: theme.typography.lineHeights.relaxed,
              margin: 0,
            }}
          >
            {model.description}
          </p>

          {/* All Tags */}
          <div>
            <h3
              style={{
                fontSize: theme.typography.sizes.sm,
                fontWeight: theme.typography.weights.semibold,
                color: theme.colors.textSecondary,
                marginBottom: theme.spacing.xs,
              }}
            >
              Tags
            </h3>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: theme.spacing.xs,
              }}
            >
              {model.tags.map((tag: string) => (
                <span
                  key={tag}
                  style={{
                    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                    fontSize: theme.typography.sizes.xs,
                    fontWeight: theme.typography.weights.medium,
                    color: theme.colors.primary,
                    backgroundColor: `${theme.colors.primary}15`,
                    borderRadius: theme.borderRadius.sm,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}
