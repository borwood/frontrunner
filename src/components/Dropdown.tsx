import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTheme } from '../theme/ThemeContext'

export interface DropdownOption {
  value: string
  label: string
  prefix?: string
}

interface DropdownProps {
  options: DropdownOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  zIndex?: number
}

export function Dropdown({ options, value, onChange, placeholder, disabled, zIndex }: DropdownProps) {
  const { theme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0, renderAbove: false })
  const dropdownRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)

  // Update dropdown position when opened
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const dropdownMaxHeight = 240
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top

      // If not enough space below but more space above, render above
      const renderAbove = spaceBelow < dropdownMaxHeight && spaceAbove > spaceBelow

      setDropdownPosition({
        top: renderAbove ? window.innerHeight - rect.top + 4 : rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        renderAbove,
      })
    }
  }, [isOpen])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const isInsideButton = dropdownRef.current?.contains(target)
      const isInsideMenu = menuRef.current?.contains(target)

      if (!isInsideButton && !isInsideMenu) {
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
    <div
      ref={dropdownRef}
      style={{
        position: 'relative',
        width: '100%',
      }}
    >
      {/* Selected value button */}
      <button
        type="button"
        ref={buttonRef}
        onClick={() => {
          if (!disabled) {

            setIsOpen(!isOpen)
          }
        }}
        disabled={disabled}
        style={{
          width: '100%',
          padding: `${theme.spacing.sm} ${theme.spacing.md}`,
          fontSize: theme.typography.sizes.sm,
          color: selectedOption ? theme.colors.text : theme.colors.textSecondary,
          backgroundColor: theme.colors.surface,
          border: `1px solid ${isOpen ? theme.colors.primary : theme.colors.border}`,
          borderRadius: theme.borderRadius.md,
          cursor: disabled ? 'not-allowed' : 'pointer',
          textAlign: 'left',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          transition: `all ${theme.transitions.fast}`,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <span>
          {selectedOption ? (
            <>
              {selectedOption.prefix && (
                <span style={{ color: theme.colors.gradientStart, marginRight: '6px' }}>
                  {selectedOption.prefix}
                </span>
              )}
              {selectedOption.label}
            </>
          ) : (
            placeholder || 'Select...'
          )}
        </span>
        <span
          style={{
            fontSize: theme.typography.sizes.xs,
            color: theme.colors.textSecondary,
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: `transform ${theme.transitions.fast}`,
          }}
        >
          ▼
        </span>
      </button>

      {/* Dropdown menu - render in portal to escape overflow:hidden */}
      {isOpen && !disabled && createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            ...(dropdownPosition.renderAbove
              ? { bottom: `${dropdownPosition.top}px` }
              : { top: `${dropdownPosition.top}px` }
            ),
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
            backgroundColor: theme.colors.surface,
            border: `2px solid ${theme.colors.primary}`,
            borderRadius: theme.borderRadius.md,
            boxShadow: theme.shadows.lg,
            zIndex: zIndex ?? 9999,
            maxHeight: '240px',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {options.map((option) => (
            <button
              type="button"
              key={option.value}
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
              style={{
                width: '100%',
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                fontSize: theme.typography.sizes.sm,
                color: option.value === value ? theme.colors.primary : theme.colors.text,
                backgroundColor: option.value === value ? `${theme.colors.primary}10` : 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                transition: `all ${theme.transitions.fast}`,
                fontWeight: option.value === value ? theme.typography.weights.semibold : theme.typography.weights.normal,
              }}
              onMouseEnter={(e) => {
                if (option.value !== value) {
                  e.currentTarget.style.backgroundColor = theme.colors.hover
                }
              }}
              onMouseLeave={(e) => {
                if (option.value !== value) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                } else {
                  e.currentTarget.style.backgroundColor = `${theme.colors.primary}10`
                }
              }}
            >
              {option.prefix && (
                <span style={{ color: theme.colors.gradientStart, marginRight: '6px' }}>
                  {option.prefix}
                </span>
              )}
              {option.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  )
}
