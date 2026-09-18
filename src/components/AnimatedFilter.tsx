import { useEffect, useRef, useState } from 'react'
import { useTheme } from '../theme/ThemeContext'
import type { ModelCategory } from '../types/models'

type FilterOption = 'all' | ModelCategory

interface AnimatedFilterProps {
  selected: FilterOption
  onChange: (option: FilterOption) => void
}

const FILTER_OPTIONS: { value: FilterOption; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'text', label: 'Text' },
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
]

export function AnimatedFilter({ selected, onChange }: AnimatedFilterProps) {
  const { theme } = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [indicatorStyle, setIndicatorStyle] = useState<{
    left: number
    width: number
  } | null>(null)
  const isInitialMount = useRef(true)

  // Update indicator position when selection changes
  useEffect(() => {
    const selectedIndex = FILTER_OPTIONS.findIndex((opt) => opt.value === selected)
    const button = buttonRefs.current[selectedIndex]
    const container = containerRef.current

    if (button && container) {
      const containerRect = container.getBoundingClientRect()
      const buttonRect = button.getBoundingClientRect()

      setIndicatorStyle({
        left: buttonRect.left - containerRect.left,
        width: buttonRect.width,
      })

      // Mark as initialized after first render
      isInitialMount.current = false
    }
  }, [selected])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        display: 'flex',
        gap: theme.spacing.xs,
        backgroundColor: theme.colors.surface,
        padding: '4px',
        borderRadius: theme.borderRadius.lg,
        border: `1px solid ${theme.colors.border}`,
      }}
    >
      {/* Animated background indicator */}
      {indicatorStyle && (
        <div
          style={{
            position: 'absolute',
            top: '4px',
            left: indicatorStyle.left,
            width: indicatorStyle.width,
            height: 'calc(100% - 8px)',
            background: `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`,
            borderRadius: theme.borderRadius.md,
            transition: isInitialMount.current ? 'none' : `all ${theme.transitions.normal}`,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Filter buttons */}
      {FILTER_OPTIONS.map((option, index) => {
        const isSelected = selected === option.value

        return (
          <button
            key={option.value}
            ref={(el) => (buttonRefs.current[index] = el)}
            onClick={() => onChange(option.value)}
            style={{
              position: 'relative',
              flex: 1,
              padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
              fontSize: theme.typography.sizes.sm,
              fontWeight: theme.typography.weights.medium,
              color: isSelected ? theme.colors.textInverse : theme.colors.text,
              background: 'transparent',
              border: 'none',
              borderRadius: theme.borderRadius.md,
              cursor: 'pointer',
              transition: `color ${theme.transitions.fast}`,
              zIndex: 1,
            }}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
