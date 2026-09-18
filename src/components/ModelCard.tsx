import { useNavigate } from 'react-router-dom'
import { useTheme } from '../theme/ThemeContext'
import type { ModelConfig } from '../types/models'

interface ModelCardProps {
  model: ModelConfig
  showTags?: boolean
}

export function ModelCard({ model, showTags = true }: ModelCardProps) {
  const navigate = useNavigate()
  const { theme } = useTheme()

  return (
    <div
      onClick={() => navigate(`/runners/${model.slug}`)}
      style={{
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        border: `1px solid ${theme.colors.border}`,
        cursor: 'pointer',
        transition: `all ${theme.transitions.normal}`,
        boxShadow: theme.shadows.sm,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = theme.shadows.md
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = theme.shadows.sm
      }}
    >
      {model.icon ? (
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: theme.borderRadius.full,
          background: `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: theme.spacing.sm,
          padding: theme.spacing.xs,
        }}>
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
      ) : (
        <div style={{
          fontSize: '32px',
          marginBottom: theme.spacing.sm,
          color: theme.colors.textInverse,
        }}>
          {model.name.charAt(0).toUpperCase()}
        </div>
      )}
      <h3
        style={{
          fontSize: theme.typography.sizes.lg,
          fontWeight: theme.typography.weights.semibold,
          color: theme.colors.text,
          marginBottom: theme.spacing.xs,
        }}
      >
        {model.name}
      </h3>
      <p
        style={{
          fontSize: theme.typography.sizes.sm,
          color: theme.colors.textSecondary,
          marginBottom: theme.spacing.sm,
          minHeight: '40px',
        }}
      >
        {model.description}
      </p>

      {/* Tags */}
      {showTags && model.tags.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: theme.spacing.xs,
            marginBottom: theme.spacing.sm,
          }}
        >
          {model.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              style={{
                padding: `2px ${theme.spacing.sm}`,
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
          {model.tags.length > 3 && (
            <span
              style={{
                padding: `2px ${theme.spacing.sm}`,
                fontSize: theme.typography.sizes.xs,
                fontWeight: theme.typography.weights.medium,
                color: theme.colors.textTertiary,
                backgroundColor: theme.colors.border,
                borderRadius: theme.borderRadius.sm,
              }}
            >
              +{model.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
