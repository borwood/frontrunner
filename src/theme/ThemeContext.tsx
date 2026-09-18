import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import type { Theme } from './theme'
import { createTheme, defaultThemeOptions } from './theme'
import type { Brightness, Roundness, Accent } from './theme'
import { useUnifiedStorage } from '../hooks/useUnifiedStorage'

interface ThemeContextValue {
  theme: Theme
  brightness: Brightness
  roundness: Roundness
  accent: Accent
  customGradientStart: string
  customGradientEnd: string
  setBrightness: (brightness: Brightness) => void
  setRoundness: (roundness: Roundness) => void
  setAccent: (accent: Accent) => void
  setCustomGradient: (start: string, end: string) => void
  // Legacy helpers for backward compatibility
  isDark: boolean
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Use unified storage for theme options (local + cloud sync, single atomic key)
  const [themeOptions, setThemeOptions] = useUnifiedStorage(
    'themeOptions',
    defaultThemeOptions
  )

  // Fallback to defaults if theme options is null
  const options = themeOptions || defaultThemeOptions

  const setBrightness = (brightness: Brightness) => {
    setThemeOptions((prev) => ({ ...(prev || defaultThemeOptions), brightness }))
  }

  const setRoundness = (roundness: Roundness) => {
    setThemeOptions((prev) => ({ ...(prev || defaultThemeOptions), roundness }))
  }

  const setAccent = (accent: Accent) => {
    setThemeOptions((prev) => ({ ...(prev || defaultThemeOptions), accent }))
  }

  const setCustomGradient = (start: string, end: string) => {
    setThemeOptions((prev) => ({
      ...(prev || defaultThemeOptions),
      customGradientStart: start,
      customGradientEnd: end,
      accent: 'custom', // Automatically switch to custom accent
    }))
  }

  const toggleTheme = () => {
    setBrightness(options.brightness === 'dark' ? 'light' : 'dark')
  }

  const value: ThemeContextValue = {
    theme: createTheme(options),
    brightness: options.brightness,
    roundness: options.roundness,
    accent: options.accent,
    customGradientStart: options.customGradientStart || '#5B7FFF',
    customGradientEnd: options.customGradientEnd || '#9F7FFF',
    setBrightness,
    setRoundness,
    setAccent,
    setCustomGradient,
    isDark: options.brightness === 'dark',
    toggleTheme,
  }

  const theme = createTheme(options)

  return (
    <ThemeContext.Provider value={value}>
      {children}
      {/* Global scrollbar styling */}
      <style>{`
        /* Webkit browsers (Chrome, Safari, Edge) */
        ::-webkit-scrollbar {
          width: 12px;
          height: 12px;
        }

        ::-webkit-scrollbar-track {
          background: ${theme.colors.background};
          border-radius: ${theme.borderRadius.sm};
        }

        ::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd});
          border-radius: ${theme.borderRadius.sm};
          border: 2px solid ${theme.colors.background};
        }

        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, ${theme.colors.gradientStart}dd, ${theme.colors.gradientEnd}dd);
        }

        ::-webkit-scrollbar-thumb:active {
          background: linear-gradient(135deg, ${theme.colors.gradientStart}bb, ${theme.colors.gradientEnd}bb);
        }

        /* Firefox */
        * {
          scrollbar-width: thin;
          scrollbar-color: ${theme.colors.gradientStart} ${theme.colors.background};
        }

        /* Ensure smooth scrolling on all elements */
        * {
          scroll-behavior: smooth;
        }
      `}</style>
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
