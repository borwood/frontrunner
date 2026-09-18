import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useTheme } from '../../theme/ThemeContext'
import { TopHeader } from './TopHeader'
import { BottomNav } from './BottomNav'

interface PageLayoutProps {
  children: ReactNode
  showHeader?: boolean
  showNav?: boolean
}

export function PageLayout({ children, showHeader = true, showNav = true }: PageLayoutProps) {
  const { theme } = useTheme()
  const location = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  const navbarHeight = '64px' // Fixed height

  // Reset scroll position to top whenever route changes
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0
    }
  }, [location.pathname])

  // Grid-based layout: header / content / footer
  // Benefits:
  // - Natural sticky behavior without position: sticky
  // - Content area automatically sized between header and footer
  // - No manual padding calculations needed
  // - Better scroll containment
  // Fixed sizes for predictable layout calculations
  const gridTemplateRows = `${showHeader ? 'auto' : '0'} 1fr ${showNav ? navbarHeight : '0'}`

  return (
    <div
      className="page-layout-root"
      style={{
        display: 'grid',
        gridTemplateRows,
        height: '100dvh', // Dynamic viewport height - accounts for mobile browser UI
        backgroundColor: theme.colors.background,
        overflow: 'hidden', // Prevent body scroll
        // Expose navbar height as CSS variable for child components
        ['--navbar-height' as any]: navbarHeight,
      }}
    >
      {showHeader && <TopHeader />}

      <main
        ref={mainRef}
        style={{
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch', // Enable momentum scrolling on iOS
          overscrollBehavior: 'contain', // Better scroll containment
          minHeight: 0, // Critical for grid children to allow scrolling
        }}
      >
        {children}
      </main>

      {showNav && <BottomNav />}
    </div>
  )
}
