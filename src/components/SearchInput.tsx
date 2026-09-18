import { useTheme } from '../theme/ThemeContext'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  style?: React.CSSProperties
}

export function SearchInput({ value, onChange, placeholder = 'Search...', style }: SearchInputProps) {
  const { theme } = useTheme()

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        ...style,
      }}
    >
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: `${theme.spacing.sm} ${theme.spacing.md}`,
          paddingRight: value ? `calc(${theme.spacing.md} + 24px)` : theme.spacing.md,
          fontSize: theme.typography.sizes.sm,
          color: theme.colors.text,
          backgroundColor: theme.colors.background,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.borderRadius.md,
          outline: 'none',
          transition: `all ${theme.transitions.fast}`,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = theme.colors.primary
          e.currentTarget.style.boxShadow = theme.shadows.sm
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = theme.colors.border
          e.currentTarget.style.boxShadow = 'none'
        }}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          style={{
            position: 'absolute',
            right: theme.spacing.xs,
            top: '50%',
            transform: 'translateY(-50%)',
            width: '24px',
            height: '24px',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: theme.typography.sizes.lg,
            color: theme.colors.textSecondary,
            background: 'none',
            border: 'none',
            borderRadius: theme.borderRadius.full,
            cursor: 'pointer',
            transition: `all ${theme.transitions.fast}`,
            lineHeight: 1,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = theme.colors.text
            e.currentTarget.style.backgroundColor = theme.colors.hover
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = theme.colors.textSecondary
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
          aria-label="Clear search"
        >
          ×
        </button>
      )}
    </div>
  )
}
