import { useRef } from 'react'
import { useTheme } from '../../theme/ThemeContext'

interface FileUploadProps {
  value: string | null
  onChange: (value: string | null) => void
  accept: string
  placeholder?: string
  required?: boolean
  fileType: 'image' | 'audio' | 'video'
  onGalleryClick?: () => void
}

export function FileUpload({
  value,
  onChange,
  accept,
  placeholder,
  required,
  fileType,
  onGalleryClick,
}: FileUploadProps) {
  const { theme } = useTheme()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        onChange(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleClear = () => {
    onChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const renderThumbnail = () => {
    if (!value) return null

    switch (fileType) {
      case 'image':
        return (
          <img
            src={value}
            alt="Thumbnail"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: theme.borderRadius.sm,
              objectFit: 'cover',
              border: `1px solid ${theme.colors.border}`,
              flexShrink: 0,
            }}
          />
        )

      case 'audio':
        return (
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
              fontSize: '16px',
              flexShrink: 0,
            }}
          >
            🎵
          </div>
        )

      case 'video':
        return (
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
              fontSize: '16px',
              flexShrink: 0,
            }}
          >
            🎬
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept={fileType === 'image' ? 'image/jpeg,image/jpg,image/png,image/webp' : accept}
        onChange={handleFileChange}
        required={required && !value}
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
          e.currentTarget.style.borderColor = theme.colors.primary
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = theme.colors.border
        }}
      >
        {/* Main upload/change button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          style={{
            flex: 1,
            padding: `0 ${theme.spacing.sm}`,
            fontSize: theme.typography.sizes.base,
            fontWeight: theme.typography.weights.medium,
            color: theme.colors.text,
            backgroundColor: theme.colors.background,
            border: 'none',
            cursor: 'pointer',
            transition: `all ${theme.transitions.fast}`,
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.sm,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme.colors.surfaceHover
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = theme.colors.background
          }}
        >
          {value ? (
            <>
              {renderThumbnail()}
              <span style={{ flex: 1, textAlign: 'left' }}>
                Change {fileType}
              </span>
            </>
          ) : (
            <>
              <span style={{ fontSize: '16px' }}>
                {fileType === 'audio' ? '🎵' : fileType === 'video' ? '🎬' : '📁'}
              </span>
              <span>{placeholder || `Choose ${fileType}`}</span>
            </>
          )}
        </button>

        {/* Gallery button (images only, no value) */}
        {fileType === 'image' && !value && onGalleryClick && (
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

        {/* Clear button (when value exists) */}
        {value && (
          <button
            type="button"
            onClick={handleClear}
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
