import { useState, useRef, useEffect } from 'react'
import { useTheme } from '../theme/ThemeContext'

export interface AccentOption {
  value: string
  label: string
  gradientStart: string
  gradientEnd: string
}

interface CustomDropdownProps {
  options: AccentOption[]
  selected: string
  onChange: (value: string) => void
  label?: string
}

export function CustomDropdown({ options, selected, onChange, label }: CustomDropdownProps) {
  const { theme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => opt.value === selected)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {label && (
        <label
          style={{
            fontSize: theme.typography.sizes.sm,
            color: theme.colors.textSecondary,
            marginBottom: theme.spacing.xs,
            display: 'block',
          }}
        >
          {label}
        </label>
      )}

      {/* Selected option display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: theme.spacing.md,
          fontSize: theme.typography.sizes.sm,
          fontWeight: theme.typography.weights.medium,
          color: theme.colors.text,
          backgroundColor: theme.colors.surface,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.borderRadius.md,
          cursor: 'pointer',
          transition: `all ${theme.transitions.fast}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: theme.spacing.md,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, flex: 1 }}>
          {/* Gradient preview pill */}
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: theme.borderRadius.full,
              background: `linear-gradient(135deg, ${selectedOption?.gradientStart}, ${selectedOption?.gradientEnd})`,
              border: `1px solid ${theme.colors.border}`,
            }}
          />
          <span>{selectedOption?.label}</span>
        </div>
        <span style={{ fontSize: theme.typography.sizes.xs, color: theme.colors.textTertiary }}>
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            backgroundColor: theme.colors.surface,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.borderRadius.md,
            boxShadow: theme.shadows.lg,
            zIndex: theme.zIndex.dropdown,
            maxHeight: '320px',
            overflowY: 'auto',
          }}
        >
          {options.map((option) => {
            const isSelected = selected === option.value

            return (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                style={{
                  width: '100%',
                  padding: theme.spacing.md,
                  fontSize: theme.typography.sizes.sm,
                  fontWeight: isSelected ? theme.typography.weights.semibold : theme.typography.weights.medium,
                  color: theme.colors.text,
                  backgroundColor: isSelected ? theme.colors.backgroundElevated : 'transparent',
                  border: 'none',
                  borderBottom: `1px solid ${theme.colors.border}`,
                  cursor: 'pointer',
                  transition: `all ${theme.transitions.fast}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = theme.colors.surfaceHover
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
                {/* Gradient preview pill */}
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: theme.borderRadius.full,
                    background: `linear-gradient(135deg, ${option.gradientStart}, ${option.gradientEnd})`,
                    border: `1px solid ${theme.colors.border}`,
                    flexShrink: 0,
                  }}
                />
                <span>{option.label}</span>
                {isSelected && (
                  <span style={{ marginLeft: 'auto', color: theme.colors.primary }}>✓</span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
