import type { ReactNode } from 'react'
import { useTheme } from '../theme/ThemeContext'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  maxWidth?: string
  showCloseButton?: boolean
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = '500px',
  showCloseButton = true,
}: ModalProps) {
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
            maxWidth,
            maxHeight: '80vh',
            backgroundColor: theme.colors.background,
            borderRadius: theme.borderRadius.lg,
            boxShadow: theme.shadows.xl,
            display: 'grid',
            gridTemplateRows: 'auto 1fr auto',
            animation: 'modalScaleIn 0.2s ease-out',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: theme.spacing.md,
              backgroundColor: theme.colors.surface,
              borderBottom: `1px solid ${theme.colors.border}`,
              borderTopLeftRadius: theme.borderRadius.lg,
              borderTopRightRadius: theme.borderRadius.lg,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h2
                style={{
                  fontSize: theme.typography.sizes.lg,
                  fontWeight: theme.typography.weights.semibold,
                  color: theme.colors.text,
                }}
              >
                {title}
              </h2>
              {showCloseButton && (
                <button
                  onClick={onClose}
                  style={{
                    padding: theme.spacing.xs,
                    fontSize: theme.typography.sizes.xl,
                    color: theme.colors.textSecondary,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div
            style={{
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: theme.spacing.md,
              WebkitOverflowScrolling: 'touch',
              minHeight: 0,
            }}
          >
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div
              style={{
                padding: theme.spacing.md,
                backgroundColor: theme.colors.surface,
                borderTop: `1px solid ${theme.colors.border}`,
                borderBottomLeftRadius: theme.borderRadius.lg,
                borderBottomRightRadius: theme.borderRadius.lg,
              }}
            >
              {footer}
            </div>
          )}
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
