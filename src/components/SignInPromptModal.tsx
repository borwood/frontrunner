import { useTheme } from '../theme/ThemeContext'

interface SignInPromptModalProps {
  isOpen: boolean
  onClose: () => void
  onSignIn: () => void
  message?: string
}

export function SignInPromptModal({ isOpen, onClose, onSignIn, message }: SignInPromptModalProps) {
  const { theme } = useTheme()

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: theme.zIndex.modal - 1,
          display: 'grid',
          placeItems: 'center',
          padding: theme.spacing.md,
          animation: 'modalFadeIn 0.2s ease-out',
        }}
      >
        {/* Modal Container */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '400px',
            backgroundColor: theme.colors.background,
            borderRadius: theme.borderRadius.lg,
            boxShadow: theme.shadows.xl,
            animation: 'modalScaleIn 0.2s ease-out',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: theme.spacing.lg,
              borderBottom: `1px solid ${theme.colors.border}`,
            }}
          >
            <h2
              style={{
                fontSize: theme.typography.sizes.xl,
                fontWeight: theme.typography.weights.semibold,
                color: theme.colors.text,
                marginBottom: theme.spacing.sm,
              }}
            >
              Sign in required
            </h2>
            <p
              style={{
                fontSize: theme.typography.sizes.sm,
                color: theme.colors.textSecondary,
                lineHeight: theme.typography.lineHeights.normal,
                whiteSpace: 'pre-line'
              }}
            >
              {message || 'You need to sign in to perform this action.'}
            </p>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: theme.spacing.md,
              display: 'flex',
              gap: theme.spacing.sm,
            }}
          >
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                fontSize: theme.typography.sizes.sm,
                fontWeight: theme.typography.weights.medium,
                color: theme.colors.text,
                backgroundColor: theme.colors.surface,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.md,
                cursor: 'pointer',
                transition: `all ${theme.transitions.fast}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = theme.colors.primary
                e.currentTarget.style.backgroundColor = theme.colors.backgroundElevated
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = theme.colors.border
                e.currentTarget.style.backgroundColor = theme.colors.surface
              }}
            >
              Cancel
            </button>
            <button
              onClick={onSignIn}
              style={{
                flex: 1,
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                fontSize: theme.typography.sizes.sm,
                fontWeight: theme.typography.weights.semibold,
                color: theme.colors.textInverse,
                background: `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`,
                border: 'none',
                borderRadius: theme.borderRadius.md,
                cursor: 'pointer',
                transition: `transform ${theme.transitions.fast}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              Sign In
            </button>
          </div>
        </div>
      </div>

      {/* Animation keyframes */}
      <style>{`
        @keyframes modalFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes modalScaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </>
  )
}
