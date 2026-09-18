import { useTheme } from '../../theme/ThemeContext'

interface BooleanToggleProps {
  value: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}

export function BooleanToggle({ value, onChange, disabled = false }: BooleanToggleProps) {
  const { theme } = useTheme()

  const handleClick = () => {
    if (!disabled) {
      onChange(!value)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      handleClick()
    }
  }

  const toggleWidth = '48px'
  const toggleHeight = '28px'
  const circleSize = '22px'
  const circleOffset = '3px'

  return (
    <div
      role="switch"
      aria-checked={value}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      style={{
        position: 'relative',
        width: toggleWidth,
        height: toggleHeight,
        backgroundColor: value
          ? theme.colors.primary
          : theme.colors.border,
        borderRadius: theme.borderRadius.full,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: `background-color ${theme.transitions.fast}`,
        opacity: disabled ? 0.5 : 1,
        outline: 'none',
      }}
      onFocus={(e) => {
        e.currentTarget.style.boxShadow = `0 0 0 3px ${theme.colors.focus}`
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: circleOffset,
          left: value ? `calc(${toggleWidth} - ${circleSize} - ${circleOffset})` : circleOffset,
          width: circleSize,
          height: circleSize,
          backgroundColor: theme.colors.backgroundElevated,
          borderRadius: theme.borderRadius.full,
          transition: `left ${theme.transitions.fast}`,
          boxShadow: theme.shadows.sm,
        }}
      />
    </div>
  )
}
