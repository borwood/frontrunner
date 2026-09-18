import { useTheme } from '../theme/ThemeContext'
import type { OutputType } from '../types/models'

interface DynamicOutputRendererProps {
  type: OutputType
  content: any
  remixable?: boolean
  onRemix?: (content: string) => void
}

export function DynamicOutputRenderer({
  type,
  content,
  remixable = false,
  onRemix,
}: DynamicOutputRendererProps) {
  const { theme } = useTheme()

  const renderContent = () => {
    switch (type) {
      case 'text':
        return (
          <p
            style={{
              fontSize: theme.typography.sizes.base,
              color: theme.colors.text,
              lineHeight: theme.typography.lineHeights.relaxed,
              whiteSpace: 'pre-wrap',
            }}
          >
            {content}
          </p>
        )

      case 'markdown':
        // For now, render as text. Could integrate a markdown renderer later
        return (
          <div
            style={{
              fontSize: theme.typography.sizes.base,
              color: theme.colors.text,
              lineHeight: theme.typography.lineHeights.relaxed,
            }}
          >
            {content}
          </div>
        )

      case 'image':
        // Handle both single image and array of images
        if (Array.isArray(content)) {
          return (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: theme.spacing.md,
              }}
            >
              {content.map((imageUrl, index) => (
                <img
                  key={index}
                  src={imageUrl}
                  alt={`Generated ${index + 1}`}
                  style={{
                    width: '100%',
                    borderRadius: theme.borderRadius.md,
                    border: `1px solid ${theme.colors.border}`,
                  }}
                />
              ))}
            </div>
          )
        }
        return (
          <img
            src={content}
            alt="Generated"
            style={{
              width: '100%',
              borderRadius: theme.borderRadius.md,
              border: `1px solid ${theme.colors.border}`,
            }}
          />
        )

      case 'video':
        // Handle both single video and array of videos
        if (Array.isArray(content)) {
          return (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: theme.spacing.md,
              }}
            >
              {content.map((videoUrl, index) => (
                <video
                  key={index}
                  src={videoUrl}
                  controls
                  style={{
                    width: '100%',
                    borderRadius: theme.borderRadius.md,
                    border: `1px solid ${theme.colors.border}`,
                    backgroundColor: theme.colors.background,
                  }}
                />
              ))}
            </div>
          )
        }
        return (
          <video
            src={content}
            controls
            style={{
              width: '100%',
              borderRadius: theme.borderRadius.md,
              border: `1px solid ${theme.colors.border}`,
              backgroundColor: theme.colors.background,
            }}
          />
        )

      case 'audio':
        // Handle both single audio and array of audio
        if (Array.isArray(content)) {
          return (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: theme.spacing.sm,
              }}
            >
              {content.map((audioUrl, index) => (
                <div
                  key={index}
                  style={{
                    padding: theme.spacing.md,
                    backgroundColor: theme.colors.background,
                    borderRadius: theme.borderRadius.md,
                  }}
                >
                  <div
                    style={{
                      fontSize: theme.typography.sizes.xs,
                      color: theme.colors.textSecondary,
                      marginBottom: theme.spacing.xs,
                    }}
                  >
                    Audio {index + 1}
                  </div>
                  <audio
                    src={audioUrl}
                    controls
                    style={{
                      width: '100%',
                    }}
                  />
                </div>
              ))}
            </div>
          )
        }
        return (
          <div
            style={{
              padding: theme.spacing.md,
              backgroundColor: theme.colors.background,
              borderRadius: theme.borderRadius.md,
            }}
          >
            <audio
              src={content}
              controls
              style={{
                width: '100%',
              }}
            />
          </div>
        )

      case 'json':
        return (
          <pre
            style={{
              fontSize: theme.typography.sizes.sm,
              color: theme.colors.text,
              backgroundColor: theme.colors.background,
              padding: theme.spacing.md,
              borderRadius: theme.borderRadius.md,
              overflow: 'auto',
              maxHeight: '400px',
            }}
          >
            {JSON.stringify(content, null, 2)}
          </pre>
        )

      default:
        return (
          <div
            style={{
              fontSize: theme.typography.sizes.base,
              color: theme.colors.textSecondary,
            }}
          >
            {String(content)}
          </div>
        )
    }
  }

  return (
    <div
      style={{
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        border: `1px solid ${theme.colors.border}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: theme.spacing.md,
        }}
      >
        <h3
          style={{
            fontSize: theme.typography.sizes.base,
            fontWeight: theme.typography.weights.semibold,
            color: theme.colors.text,
          }}
        >
          Result
        </h3>
        {remixable && onRemix && type === 'text' && (
          <button
            onClick={() => onRemix(content)}
            style={{
              padding: `${theme.spacing.xs} ${theme.spacing.md}`,
              fontSize: theme.typography.sizes.sm,
              fontWeight: theme.typography.weights.medium,
              color: theme.colors.primary,
              backgroundColor: `${theme.colors.primary}15`,
              border: `1px solid ${theme.colors.primary}30`,
              borderRadius: theme.borderRadius.md,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.xs,
            }}
          >
            Remix
          </button>
        )}
      </div>
      {renderContent()}
    </div>
  )
}
