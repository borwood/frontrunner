/**
 * frontrunner Theme System
 *
 * Mobile-first design inspired by WeChat's clean interface
 * with customizable gradients
 *
 * CRITICAL: All components must use these theme tokens.
 * NO hard-coded styles allowed.
 */

export interface Theme {
  colors: {
    // Primary brand colors
    primary: string
    primaryLight: string
    primaryDark: string

    // WeChat-inspired green
    wechatGreen: string
    wechatGreenLight: string
    wechatGreenDark: string

    // Theme gradients
    gradientStart: string
    gradientEnd: string

    // Background colors
    background: string
    backgroundElevated: string
    surface: string
    surfaceHover: string

    // Text colors
    text: string
    textSecondary: string
    textTertiary: string
    textInverse: string

    // Semantic colors
    success: string
    warning: string
    error: string
    info: string

    // Border colors
    border: string
    borderLight: string
    borderDark: string

    // Interactive states
    hover: string
    active: string
    disabled: string
    focus: string
  }

  spacing: {
    xs: string
    sm: string
    md: string
    lg: string
    xl: string
    xxl: string
  }

  typography: {
    fontFamily: string
    fontFamilyMono: string

    sizes: {
      xs: string
      sm: string
      base: string
      lg: string
      xl: string
      xxl: string
      xxxl: string
    }

    weights: {
      normal: number
      medium: number
      semibold: number
      bold: number
    }

    lineHeights: {
      tight: number
      normal: number
      relaxed: number
    }
  }

  borderRadius: {
    none: string
    sm: string
    md: string
    lg: string
    xl: string
    full: string
  }

  shadows: {
    none: string
    sm: string
    md: string
    lg: string
    xl: string
  }

  transitions: {
    fast: string
    normal: string
    slow: string
  }

  breakpoints: {
    mobile: string
    tablet: string
    desktop: string
  }

  zIndex: {
    base: number
    dropdown: number
    sticky: number
    modal: number
    popover: number
    toast: number
  }
}

// Light theme (default, WeChat-inspired)
export const lightTheme: Theme = {
  colors: {
    primary: '#5B7FFF',
    primaryLight: '#7B9FFF',
    primaryDark: '#3B5FDF',

    wechatGreen: '#07C160',
    wechatGreenLight: '#2DD27F',
    wechatGreenDark: '#05A050',

    gradientStart: '#5B7FFF',
    gradientEnd: '#9F7FFF',

    background: '#F7F7F7',
    backgroundElevated: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceHover: '#F5F5F5',

    text: '#1A1A1A',
    textSecondary: '#606060',
    textTertiary: '#8C8C8C',
    textInverse: '#FFFFFF',

    success: '#07C160',
    warning: '#FF9800',
    error: '#FA5151',
    info: '#5B7FFF',

    border: '#E5E5E5',
    borderLight: '#F0F0F0',
    borderDark: '#D0D0D0',

    hover: 'rgba(0, 0, 0, 0.05)',
    active: 'rgba(0, 0, 0, 0.1)',
    disabled: 'rgba(0, 0, 0, 0.25)',
    focus: 'rgba(91, 127, 255, 0.2)',
  },

  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },

  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontFamilyMono: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',

    sizes: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      xxl: '24px',
      xxxl: '32px',
    },

    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },

    lineHeights: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  borderRadius: {
    none: '0',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },

  shadows: {
    none: 'none',
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.07)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.15)',
  },

  transitions: {
    fast: '150ms ease',
    normal: '250ms ease',
    slow: '350ms ease',
  },

  breakpoints: {
    mobile: '640px',
    tablet: '768px',
    desktop: '1024px',
  },

  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    modal: 1200,
    popover: 1300,
    toast: 1400,
  },
}

// Paper theme (warm light, reduced contrast for easier reading)
export const paperTheme: Theme = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,

    background: '#F5F1E8',
    backgroundElevated: '#FAF6ED',
    surface: '#FAF6ED',
    surfaceHover: '#F0EBE0',

    text: '#2A2520',
    textSecondary: '#6B6560',
    textTertiary: '#9B9590',
    textInverse: '#FAF6ED',

    border: '#E5DFD0',
    borderLight: '#EDE9DC',
    borderDark: '#D5CFC0',

    hover: 'rgba(42, 37, 32, 0.04)',
    active: 'rgba(42, 37, 32, 0.08)',
    disabled: 'rgba(42, 37, 32, 0.25)',
  },
}

// Dark theme
export const darkTheme: Theme = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,

    background: '#121212',
    backgroundElevated: '#1E1E1E',
    surface: '#1E1E1E',
    surfaceHover: '#282828',

    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    textTertiary: '#707070',
    textInverse: '#1A1A1A',

    border: '#2A2A2A',
    borderLight: '#222222',
    borderDark: '#3A3A3A',

    hover: 'rgba(255, 255, 255, 0.05)',
    active: 'rgba(255, 255, 255, 0.1)',
    disabled: 'rgba(255, 255, 255, 0.25)',
  },
}

// Sharp theme (ultra-minimal rounded corners, iOS 6 inspired)
export const sharpTheme: Theme = {
  ...lightTheme,
  borderRadius: {
    none: '0',
    sm: '0',
    md: '2px',
    lg: '2px',
    xl: '4px',
    full: '9999px',
  },
}

// Sharp dark theme with red-orange clay accents
export const sharpDarkTheme: Theme = {
  ...darkTheme,
  colors: {
    ...darkTheme.colors,

    // Red-orange clay gradient (primary brand)
    primary: '#D35836',
    primaryLight: '#E77756',
    primaryDark: '#B83A1B',

    // Red-orange clay gradient
    gradientStart: '#D35836',
    gradientEnd: '#E88468',

    // Keep WeChat green for success states
    wechatGreen: '#07C160',
    wechatGreenLight: '#2DD27F',
    wechatGreenDark: '#05A050',

    // Sharp dark backgrounds (pure black base)
    background: '#000000',
    backgroundElevated: '#0F0F0F',
    surface: '#0F0F0F',
    surfaceHover: '#1A1A1A',

    // High contrast text
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    textTertiary: '#707070',
    textInverse: '#000000',

    // Clay-tinted semantic colors
    success: '#07C160',
    warning: '#E88468',
    error: '#D35836',
    info: '#E77756',

    // Minimal borders
    border: '#1A1A1A',
    borderLight: '#141414',
    borderDark: '#2A2A2A',

    hover: 'rgba(211, 88, 54, 0.1)',
    active: 'rgba(211, 88, 54, 0.2)',
    disabled: 'rgba(255, 255, 255, 0.25)',
    focus: 'rgba(211, 88, 54, 0.3)',
  },
  borderRadius: {
    none: '0',
    sm: '0',
    md: '2px',
    lg: '2px',
    xl: '4px',
    full: '9999px',
  },
}

// Theme customization options
export type Brightness = 'light' | 'paper' | 'dark' | 'oled'
export type Roundness = 'sharp' | 'round'
export type Accent = 'cool' | 'warm' | 'lush' | 'gold' | 'slime' | 'jewel' | 'ruby' | 'foam' | 'lilac' | 'cosmic' | 'leather' | 'custom'

export interface ThemeOptions {
  brightness: Brightness
  roundness: Roundness
  accent: Accent
  customGradientStart?: string
  customGradientEnd?: string
}

// Accent color palettes
const coolAccent = {
  gradientStart: '#5B7FFF',
  gradientEnd: '#9F7FFF',
  primary: '#5B7FFF',
  primaryLight: '#7B9FFF',
  primaryDark: '#3B5FDF',
  info: '#5B7FFF',
  focus: 'rgba(91, 127, 255, 0.2)',
}

const warmAccent = {
  gradientStart: '#D35836',
  gradientEnd: '#E88468',
  primary: '#D35836',
  primaryLight: '#E77756',
  primaryDark: '#B83A1B',
  info: '#E77756',
  focus: 'rgba(211, 88, 54, 0.3)',
}

const lushAccent = {
  gradientStart: '#10B981',
  gradientEnd: '#14B8A6',
  primary: '#10B981',
  primaryLight: '#34D399',
  primaryDark: '#059669',
  info: '#14B8A6',
  focus: 'rgba(16, 185, 129, 0.2)',
}

const goldAccent = {
  gradientStart: '#d1c866',
  gradientEnd: '#a79735',
  primary: '#d1c866',
  primaryLight: '#e0d97f',
  primaryDark: '#a79735',
  info: '#d1c866',
  focus: 'rgba(209, 200, 102, 0.2)',
}

const slimeAccent = {
  gradientStart: '#89d784',
  gradientEnd: '#b3db5c',
  primary: '#89d784',
  primaryLight: '#a3e19e',
  primaryDark: '#6fc569',
  info: '#b3db5c',
  focus: 'rgba(137, 215, 132, 0.2)',
}

const jewelAccent = {
  gradientStart: '#2dae99',
  gradientEnd: '#833a7d',
  primary: '#2dae99',
  primaryLight: '#4ec9b3',
  primaryDark: '#22897d',
  info: '#833a7d',
  focus: 'rgba(45, 174, 153, 0.2)',
}

const rubyAccent = {
  gradientStart: '#df3434',
  gradientEnd: '#c20a1d',
  primary: '#df3434',
  primaryLight: '#e95555',
  primaryDark: '#c20a1d',
  info: '#df3434',
  focus: 'rgba(223, 52, 52, 0.2)',
}

const foamAccent = {
  gradientStart: '#6deec3',
  gradientEnd: '#a8e6d3',
  primary: '#6deec3',
  primaryLight: '#8ff2d0',
  primaryDark: '#4ddbad',
  info: '#a8e6d3',
  focus: 'rgba(109, 238, 195, 0.2)',
}

const lilacAccent = {
  gradientStart: '#6851d6',
  gradientEnd: '#c7d0e5',
  primary: '#6851d6',
  primaryLight: '#8872e0',
  primaryDark: '#5240ba',
  info: '#c7d0e5',
  focus: 'rgba(104, 81, 214, 0.2)',
}

const cosmicAccent = {
  gradientStart: '#698bf2',
  gradientEnd: '#bb50e2',
  primary: '#698bf2',
  primaryLight: '#89a4f5',
  primaryDark: '#4f6fde',
  info: '#bb50e2',
  focus: 'rgba(105, 139, 242, 0.2)',
}

const leatherAccent = {
  gradientStart: '#50372f',
  gradientEnd: '#7e5844',
  primary: '#7e5844',
  primaryLight: '#9a6f5a',
  primaryDark: '#50372f',
  info: '#7e5844',
  focus: 'rgba(126, 88, 68, 0.2)',
}

// Roundness values
const sharpRoundness = {
  none: '0',
  sm: '0',
  md: '2px',
  lg: '2px',
  xl: '4px',
  full: '9999px',
}

const roundRoundness = {
  none: '0',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
}

// Helper to generate accent colors from gradient colors
function generateAccentColors(gradientStart: string, gradientEnd: string) {
  // For custom colors, we'll use the gradientStart as the primary
  // and derive light/dark variants with simple adjustments
  return {
    gradientStart,
    gradientEnd,
    primary: gradientStart,
    primaryLight: gradientStart, // Could be enhanced with color manipulation
    primaryDark: gradientStart,
    info: gradientStart,
    focus: `${gradientStart}33`, // 20% opacity
  }
}

// Generate theme dynamically based on options
export function createTheme(options: ThemeOptions): Theme {
  const { brightness, roundness, accent, customGradientStart, customGradientEnd } = options

  // Base theme colors
  const isLight = brightness === 'light'
  const isPaper = brightness === 'paper'
  const isOLED = brightness === 'oled'

  // Determine if we should use custom colors for hover states
  const useCustomHover = accent === 'custom' && customGradientStart
  const customHoverColor = customGradientStart ? customGradientStart : '#FFFFFF'

  const baseColors = isLight ? {
    background: '#F7F7F7',
    backgroundElevated: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceHover: '#F5F5F5',
    text: '#1A1A1A',
    textSecondary: '#606060',
    textTertiary: '#8C8C8C',
    textInverse: '#FFFFFF',
    border: '#E5E5E5',
    borderLight: '#F0F0F0',
    borderDark: '#D0D0D0',
    hover: 'rgba(0, 0, 0, 0.05)',
    active: 'rgba(0, 0, 0, 0.1)',
    disabled: 'rgba(0, 0, 0, 0.25)',
  } : isPaper ? {
    background: '#F5F1E8',
    backgroundElevated: '#FAF6ED',
    surface: '#FAF6ED',
    surfaceHover: '#F0EBE0',
    text: '#2A2520',
    textSecondary: '#6B6560',
    textTertiary: '#9B9590',
    textInverse: '#FAF6ED',
    border: '#E5DFD0',
    borderLight: '#EDE9DC',
    borderDark: '#D5CFC0',
    hover: 'rgba(42, 37, 32, 0.04)',
    active: 'rgba(42, 37, 32, 0.08)',
    disabled: 'rgba(42, 37, 32, 0.25)',
  } : isOLED ? {
    // OLED mode uses pure black for maximum contrast and power savings
    background: '#000000',
    backgroundElevated: '#0A0A0A',
    surface: '#0A0A0A',
    surfaceHover: '#1A1A1A',
    text: '#FFFFFF',
    textSecondary: '#A0A0A0',
    textTertiary: '#606060',
    textInverse: '#000000',
    border: '#202020',
    borderLight: '#0F0F0F',
    borderDark: '#2A2A2A',
    hover: useCustomHover ? `${customHoverColor}26` : accent === 'warm' ? 'rgba(211, 88, 54, 0.15)' : accent === 'lush' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.08)',
    active: useCustomHover ? `${customHoverColor}40` : accent === 'warm' ? 'rgba(211, 88, 54, 0.25)' : accent === 'lush' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.15)',
    disabled: 'rgba(255, 255, 255, 0.25)',
  } : {
    // Dark mode uses gray backgrounds
    background: '#121212',
    backgroundElevated: '#1E1E1E',
    surface: '#1E1E1E',
    surfaceHover: '#282828',
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    textTertiary: '#707070',
    textInverse: '#1A1A1A',
    border: '#2A2A2A',
    borderLight: '#222222',
    borderDark: '#3A3A3A',
    hover: useCustomHover ? `${customHoverColor}1A` : accent === 'warm' ? 'rgba(211, 88, 54, 0.1)' : accent === 'lush' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.05)',
    active: useCustomHover ? `${customHoverColor}33` : accent === 'warm' ? 'rgba(211, 88, 54, 0.2)' : accent === 'lush' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.1)',
    disabled: 'rgba(255, 255, 255, 0.25)',
  }

  // Accent colors
  const accentColors = accent === 'custom' && customGradientStart && customGradientEnd
    ? generateAccentColors(customGradientStart, customGradientEnd)
    : accent === 'cool' ? coolAccent
    : accent === 'warm' ? warmAccent
    : accent === 'lush' ? lushAccent
    : accent === 'gold' ? goldAccent
    : accent === 'slime' ? slimeAccent
    : accent === 'jewel' ? jewelAccent
    : accent === 'ruby' ? rubyAccent
    : accent === 'foam' ? foamAccent
    : accent === 'lilac' ? lilacAccent
    : accent === 'cosmic' ? cosmicAccent
    : accent === 'leather' ? leatherAccent
    : coolAccent

  // Border radius
  const borderRadiusValues = roundness === 'sharp' ? sharpRoundness : roundRoundness

  // Adjust warning/error colors for warm/lush accents
  const semanticColors = accent === 'warm' ? {
    warning: '#E88468',
    error: '#D35836',
  } : accent === 'lush' ? {
    warning: '#F59E0B',
    error: '#EF4444',
  } : {
    warning: '#FF9800',
    error: '#FA5151',
  }

  return {
    colors: {
      ...baseColors,
      ...accentColors,
      ...semanticColors,

      // WeChat green (always the same)
      wechatGreen: '#07C160',
      wechatGreenLight: '#2DD27F',
      wechatGreenDark: '#05A050',
      success: '#07C160',
    },

    spacing: {
      xs: '4px',
      sm: '8px',
      md: '16px',
      lg: '24px',
      xl: '32px',
      xxl: '48px',
    },

    typography: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      fontFamilyMono: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',

      sizes: {
        xs: '12px',
        sm: '14px',
        base: '16px',
        lg: '18px',
        xl: '20px',
        xxl: '24px',
        xxxl: '32px',
      },

      weights: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
      },

      lineHeights: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.75,
      },
    },

    borderRadius: borderRadiusValues,

    shadows: {
      none: 'none',
      sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px rgba(0, 0, 0, 0.07)',
      lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
      xl: '0 20px 25px rgba(0, 0, 0, 0.15)',
    },

    transitions: {
      fast: '150ms ease',
      normal: '250ms ease',
      slow: '350ms ease',
    },

    breakpoints: {
      mobile: '640px',
      tablet: '768px',
      desktop: '1024px',
    },

    zIndex: {
      base: 0,
      dropdown: 1000,
      sticky: 1100,
      modal: 1200,
      popover: 1300,
      toast: 1400,
    },
  }
}

// Default theme options (sharp dark warm - the current default)
export const defaultThemeOptions: ThemeOptions = {
  brightness: 'dark',
  roundness: 'sharp',
  accent: 'warm',
}

// Export default theme
export const defaultTheme = createTheme(defaultThemeOptions)
