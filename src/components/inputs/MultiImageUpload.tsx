import { useRef } from 'react'
import { useTheme } from '../../theme/ThemeContext'

interface MultiImageUploadProps {
  value: string[]
  onChange: (value: string[]) => void
  maxItems?: number
  placeholder?: string
  required?: boolean
  onGalleryClick?: () => void
}

export function MultiImageUpload({
  value = [],
  onChange,
  maxItems = 10,
  placeholder,
  required,
  onGalleryClick,
}: MultiImageUploadProps) {
  const { theme } = useTheme()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const remainingSlots = maxItems - value.length

    if (files.length === 0) return

    const filesToAdd = files.slice(0, remainingSlots)

    Promise.all(
      filesToAdd.map(
        (file) =>
          new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.readAsDataURL(file)
          })
      )
    ).then((newImages) => {
      onChange([...value, ...newImages])
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    })
  }

  const canAddMore = value.length < maxItems

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple
        onChange={handleFileChange}
        required={required && value.length === 0}
        style={{ display: 'none' }}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          height: '48px',
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.borderRadius.md,
          overflow: 'hidden',
          transition: `all ${theme.transitions.fast}`,
        }}
        onMouseEnter={(e) => {
          if (canAddMore) {
            e.currentTarget.style.borderColor = theme.colors.primary
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = theme.colors.border
        }}
      >
        {/* Main add images button */}
        <button
          type="button"
          onClick={() => canAddMore && fileInputRef.current?.click()}
          disabled={!canAddMore}
          style={{
            flex: 1,
            padding: `0 ${theme.spacing.sm}`,
            fontSize: theme.typography.sizes.base,
            fontWeight: theme.typography.weights.medium,
            color: canAddMore ? theme.colors.text : theme.colors.textTertiary,
            backgroundColor: theme.colors.background,
            border: 'none',
            cursor: canAddMore ? 'pointer' : 'not-allowed',
            transition: `all ${theme.transitions.fast}`,
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.sm,
          }}
          onMouseEnter={(e) => {
            if (canAddMore) {
              e.currentTarget.style.backgroundColor = theme.colors.surfaceHover
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = theme.colors.background
          }}
        >
          {/* Show compact thumbnails if images exist */}
          {value.length > 0 && (
            <div style={{ display: 'flex', gap: '4px', marginRight: theme.spacing.xs }}>
              {value.slice(0, 3).map((imageUrl, index) => (
                <img
                  key={index}
                  src={imageUrl}
                  alt={`Thumbnail ${index + 1}`}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: theme.borderRadius.sm,
                    objectFit: 'cover',
                    border: `1px solid ${theme.colors.border}`,
                  }}
                />
              ))}
              {value.length > 3 && (
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: theme.borderRadius.sm,
                    backgroundColor: theme.colors.surface,
                    border: `1px solid ${theme.colors.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: theme.typography.sizes.xs,
                    fontWeight: theme.typography.weights.bold,
                  }}
                >
                  +{value.length - 3}
                </div>
              )}
            </div>
          )}
          <span style={{ fontSize: '16px' }}>
            {value.length > 0 ? '🖼️' : '📁'}
          </span>
          <span style={{ flex: 1, textAlign: 'left' }}>
            {value.length > 0
              ? `${value.length} image${value.length !== 1 ? 's' : ''} selected`
              : placeholder || `Add Images (0/${maxItems})`}
          </span>
        </button>

        {/* Gallery button (when can add more) */}
        {canAddMore && onGalleryClick && (
          <button
            type="button"
            onClick={onGalleryClick}
            style={{
              padding: `0 ${theme.spacing.sm}`,
              fontSize: theme.typography.sizes.base,
              fontWeight: theme.typography.weights.medium,
              color: theme.colors.text,
              backgroundColor: theme.colors.background,
              border: 'none',
              borderLeft: `1px solid ${theme.colors.border}`,
              cursor: 'pointer',
              transition: `all ${theme.transitions.fast}`,
              minWidth: '80px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.surfaceHover
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.background
            }}
          >
            Gallery
          </button>
        )}

        {/* Clear button (when images exist) */}
        {value.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            style={{
              padding: `0 ${theme.spacing.sm}`,
              fontSize: theme.typography.sizes.sm,
              fontWeight: theme.typography.weights.medium,
              color: theme.colors.error,
              backgroundColor: theme.colors.background,
              border: 'none',
              borderLeft: `1px solid ${theme.colors.border}`,
              cursor: 'pointer',
              transition: `all ${theme.transitions.fast}`,
              minWidth: '60px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.error
              e.currentTarget.style.color = theme.colors.textInverse
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.background
              e.currentTarget.style.color = theme.colors.error
            }}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  )
}
