import { memo } from 'react'
import { useTheme } from '../../theme/ThemeContext'
import { useGenerationFavorites } from '../../contexts/GenerationFavoritesContext'
import { VideoThumbnail } from '../VideoThumbnail'
import type { Generation } from '../../types/models'

interface GenerationCardProps {
  generation: Generation
  onClick: () => void
  variant?: 'mobile' | 'desktop'
  showFavorite?: boolean
}

export const GenerationCard = memo(function GenerationCard({ generation: gen, onClick, variant = 'mobile', showFavorite = false }: GenerationCardProps) {
  const { theme } = useTheme()
  const { isFavorite } = useGenerationFavorites()

  const isMobile = variant === 'mobile'

  return (
    <div
      onClick={onClick}
      style={{
        aspectRatio: isMobile ? '1 / 1' : undefined,
        cursor: 'pointer',
        overflow: 'hidden',
        backgroundColor: theme.colors.surface,
        position: 'relative',
        borderRadius: isMobile ? theme.borderRadius.sm : theme.borderRadius.lg,
        border: isMobile ? `2px solid ${theme.colors.border}` : `1px solid ${theme.colors.border}`,
        transition: `all ${theme.transitions.fast}`,
        breakInside: isMobile ? undefined : 'avoid',
        minWidth: 0,
        width: '100%',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = theme.colors.primary
        if (isMobile) {
          e.currentTarget.style.transform = 'scale(1.02)'
        } else {
          e.currentTarget.style.boxShadow = theme.shadows.md
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = theme.colors.border
        if (isMobile) {
          e.currentTarget.style.transform = 'scale(1)'
        } else {
          e.currentTarget.style.boxShadow = 'none'
        }
      }}
    >
      {/* Favorite Star Badge */}
      {showFavorite && isFavorite(gen.id) && (
        <div
          style={{
            position: 'absolute',
            top: isMobile ? '4px' : theme.spacing.sm,
            left: isMobile ? '4px' : theme.spacing.sm,
            width: isMobile ? '18px' : '24px',
            height: isMobile ? '18px' : '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isMobile ? '12px' : '14px',
            color: theme.colors.primary,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            borderRadius: '50%',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        >
          ★
        </div>
      )}

      {/* Image Output */}
      {gen.outputData.type === 'image' && (
        <>
          {Array.isArray(gen.outputData.content) ? (
            <div style={{ position: 'relative' }}>
              <img
                src={gen.outputData.content[0]}
                alt="Generated"
                loading="lazy"
                style={{
                  width: '100%',
                  height: isMobile ? '100%' : 'auto',
                  objectFit: isMobile ? 'cover' : 'contain',
                  display: 'block',
                }}
              />
              {gen.outputData.content.length > 1 && (
                <div
                  style={{
                    position: 'absolute',
                    top: isMobile ? '4px' : theme.spacing.sm,
                    right: isMobile ? '4px' : theme.spacing.sm,
                    padding: isMobile ? '2px 6px' : `${theme.spacing.xs} ${theme.spacing.sm}`,
                    fontSize: isMobile ? '10px' : theme.typography.sizes.xs,
                    fontWeight: theme.typography.weights.bold,
                    color: theme.colors.textInverse,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    borderRadius: isMobile ? '3px' : theme.borderRadius.sm,
                  }}
                >
                  +{gen.outputData.content.length - 1}
                </div>
              )}
            </div>
          ) : (
            <img
              src={gen.outputData.content as string}
              alt="Generated"
              loading="lazy"
              style={{
                width: '100%',
                height: isMobile ? '100%' : 'auto',
                objectFit: isMobile ? 'cover' : 'contain',
                display: 'block',
              }}
            />
          )}
        </>
      )}

      {/* Video Output */}
      {gen.outputData.type === 'video' && (
        <div style={{ position: 'relative', height: '100%' }}>
          <VideoThumbnail
            videoUrl={
              Array.isArray(gen.outputData.content)
                ? gen.outputData.content[0]
                : (gen.outputData.content as string)
            }
            alt="Video thumbnail"
            style={{
              width: '100%',
              height: isMobile ? '100%' : 'auto',
              objectFit: 'cover',
              display: 'block',
              backgroundColor: theme.colors.background,
            }}
          />
          {/* Play Icon Overlay */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: isMobile ? '32px' : '48px',
              height: isMobile ? '32px' : '48px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`,
              opacity: 0.85,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: isMobile ? '10px solid white' : '14px solid white',
                borderTop: isMobile ? '6px solid transparent' : '9px solid transparent',
                borderBottom: isMobile ? '6px solid transparent' : '9px solid transparent',
                marginLeft: isMobile ? '3px' : '4px',
              }}
            />
          </div>
        </div>
      )}

      {/* Audio Output */}
      {gen.outputData.type === 'audio' && (
        <div
          style={{
            width: '100%',
            height: isMobile ? '100%' : undefined,
            padding: isMobile ? undefined : theme.spacing.lg,
            backgroundColor: theme.colors.background,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: isMobile ? undefined : '150px',
          }}
        >
          <div
            style={{
              fontSize: isMobile ? '32px' : '48px',
              marginBottom: isMobile ? undefined : theme.spacing.md,
            }}
          >
            🎵
          </div>
          {!isMobile && (
            <p
              style={{
                fontSize: theme.typography.sizes.sm,
                color: theme.colors.textSecondary,
                textAlign: 'center',
              }}
            >
              {gen.modelName}
            </p>
          )}
        </div>
      )}

      {/* Text Output */}
      {gen.outputData.type === 'text' && (
        <div
          style={{
            width: '100%',
            height: isMobile ? '100%' : undefined,
            padding: isMobile ? '8px' : theme.spacing.lg,
            backgroundColor: theme.colors.background,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <p
            style={{
              fontSize: isMobile ? '10px' : theme.typography.sizes.sm,
              color: theme.colors.text,
              lineHeight: isMobile ? '1.3' : theme.typography.lineHeights.normal,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: isMobile ? 5 : 6,
              WebkitBoxOrient: 'vertical',
              textAlign: 'center',
            }}
          >
            {gen.outputData.content as string}
          </p>
        </div>
      )}
    </div>
  )
})
