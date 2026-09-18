import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTheme } from '../theme/ThemeContext'

interface AnimatedToggleOption<T extends string> {
  value: T
  label: string
}

interface AnimatedToggleProps<T extends string> {
  options: AnimatedToggleOption<T>[]
  selected: T
  onChange: (value: T) => void
  delayIndicator?: number // Delay in ms before showing indicator (for modals)
}

export function AnimatedToggle<T extends string>({ options, selected, onChange, delayIndicator }: AnimatedToggleProps<T>) {
  const { theme } = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [indicatorStyle, setIndicatorStyle] = useState<{
    left: number
    width: number
  } | null>(null)
  const [showIndicator, setShowIndicator] = useState(!delayIndicator)
  const isInitialMount = useRef(true)

  // Update indicator position when selection changes
  // Use useLayoutEffect to calculate position before browser paints
  useLayoutEffect(() => {
    const selectedIndex = options.findIndex((opt) => opt.value === selected)
    const button = buttonRefs.current[selectedIndex]
    const container = containerRef.current

    if (button && container) {
      const containerRect = container.getBoundingClientRect()
      const buttonRect = button.getBoundingClientRect()

      setIndicatorStyle({
        left: buttonRect.left - containerRect.left,
        width: buttonRect.width,
      })

      // Mark that we're no longer on initial mount after first position is set
      if (isInitialMount.current) {
        isInitialMount.current = false
      }

      // After position is set, delay showing indicator if requested (for modals)
      if (delayIndicator && !showIndicator) {
        const timer = setTimeout(() => {
          setShowIndicator(true)
        }, delayIndicator)
        return () => clearTimeout(timer)
      }
    }
  }, [selected, options, delayIndicator, showIndicator])

  // Update indicator position on resize
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateOnResize = () => {
      const selectedIndex = options.findIndex((opt) => opt.value === selected)
      const button = buttonRefs.current[selectedIndex]

      if (button && container) {
        const containerRect = container.getBoundingClientRect()
        const buttonRect = button.getBoundingClientRect()

        setIndicatorStyle({
          left: buttonRect.left - containerRect.left,
          width: buttonRect.width,
        })
      }
    }

    const resizeObserver = new ResizeObserver(updateOnResize)
    resizeObserver.observe(container)

    // Also listen to window resize as a fallback
    window.addEventListener('resize', updateOnResize)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateOnResize)
    }
  }, [selected, options])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        display: 'flex',
        gap: theme.spacing.xs,
        backgroundColor: theme.colors.surface,
        padding: '4px',
        borderRadius: theme.borderRadius.md,
        border: `1px solid ${theme.colors.border}`,
      }}
    >
      {/* Animated background indicator - only render when positioned and ready to show */}
      {indicatorStyle && showIndicator && (
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
            opacity: delayIndicator ? 0 : 1,
            animation: delayIndicator ? 'fadeIn 0.2s ease-out forwards' : 'none',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Toggle buttons */}
      {options.map((option, index) => {
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

      {/* Fade in animation */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
