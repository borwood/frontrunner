import { useState, useEffect } from 'react'
import { useTheme } from '../../theme/ThemeContext'

interface EnhancedSliderProps {
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step?: number
  showInput?: boolean
}

export function EnhancedSlider({
  value,
  onChange,
  min,
  max,
  step = 1,
  showInput = true,
}: EnhancedSliderProps) {
  const { theme } = useTheme()
  const [localValue, setLocalValue] = useState(String(value))

  useEffect(() => {
    setLocalValue(String(value))
  }, [value])

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value)
    onChange(newValue)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value)
  }

  const handleInputBlur = () => {
    const numValue = parseFloat(localValue)
    if (!isNaN(numValue)) {
      const clampedValue = Math.max(min, Math.min(max, numValue))
      onChange(clampedValue)
      setLocalValue(String(clampedValue))
    } else {
      setLocalValue(String(value))
    }
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur()
    }
  }

  // const percentage = ((value - min) / (max - min)) * 100

  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          display: 'flex',
          gap: theme.spacing.md,
          alignItems: 'center',
          marginBottom: theme.spacing.xs,
        }}
      >
        {/* Slider */}
        <div style={{
          flex: 1,
          position: 'relative',
          touchAction: 'pan-y', // Allow vertical scroll, prevent horizontal browser navigation
        }}>
          <input
            type="range"
            value={value}
            onChange={handleSliderChange}
            min={min}
            max={max}
            step={step}
            style={{
              width: '100%',
              height: '6px',
              appearance: 'none',
              WebkitAppearance: 'none',
              backgroundColor: theme.colors.border,
              borderRadius: theme.borderRadius.full,
              outline: 'none',
              cursor: 'pointer',
              touchAction: 'pan-y', // Allow vertical scroll, prevent horizontal browser navigation
            }}
          />
          <style>
            {`
              input[type="range"]::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 18px;
                height: 18px;
                background: ${theme.colors.primary};
                border-radius: 50%;
                cursor: pointer;
                box-shadow: ${theme.shadows.sm};
                transition: transform ${theme.transitions.fast};
              }
              input[type="range"]::-webkit-slider-thumb:hover {
                transform: scale(1.15);
              }
              input[type="range"]::-moz-range-thumb {
                width: 18px;
                height: 18px;
                background: ${theme.colors.primary};
                border: none;
                border-radius: 50%;
                cursor: pointer;
                box-shadow: ${theme.shadows.sm};
                transition: transform ${theme.transitions.fast};
              }
              input[type="range"]::-moz-range-thumb:hover {
                transform: scale(1.15);
              }
            `}
          </style>
        </div>

        {/* Numeric Input */}
        {showInput && (
          <input
            type="number"
            value={localValue}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            min={min}
            max={max}
            step={step}
            style={{
              width: '80px',
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              fontSize: theme.typography.sizes.base,
              fontFamily: theme.typography.fontFamily,
              color: theme.colors.text,
              backgroundColor: theme.colors.background,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.borderRadius.md,
              textAlign: 'center',
              outline: 'none',
              transition: `border-color ${theme.transitions.fast}`,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = theme.colors.primary
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = theme.colors.border
              handleInputBlur()
            }}
          />
        )}
      </div>

      {/* Min/Max Labels */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: theme.typography.sizes.xs,
          color: theme.colors.textTertiary,
        }}
      >
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}
