import { useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '../../theme/ThemeContext'
import { AnimatedToggle } from '../AnimatedToggle'
import { useEffect, useRef } from 'react'
import { useSubscribeDev } from '@subscribe.dev/react'

interface NavItem {
  path: string
  label: string
}

const navItems: NavItem[] = [
  { path: '/', label: 'Home' },
  { path: '/runners', label: 'Runners' },
  { path: '/chat', label: 'Chat' },
  { path: '/gallery', label: 'Gallery' },
]

const protectedRoutes = ['/gallery']

function isNotProtected(item: NavItem) {
  return !protectedRoutes.includes(item.path)
}

export function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { theme } = useTheme()
  const { isSignedIn } = useSubscribeDev()
  const navRef = useRef<HTMLElement>(null)

  // Determine which nav item is currently active
  const getCurrentPath = (): string => {
    // Match exact path or prefix for sub-routes
    const current = navItems.find(item => {
      if (item.path === '/') {
        return location.pathname === '/'
      }
      return location.pathname.startsWith(item.path)
    })
    return current?.path || '/'
  }

  const currentPath = getCurrentPath()

  // Expose footer height as CSS variable
  useEffect(() => {
    if (navRef.current) {
      const updateHeight = () => {
        if (navRef.current) {
          const height = navRef.current.offsetHeight
          document.documentElement.style.setProperty('--footer-height', `${height}px`)
        }
      }

      updateHeight()

      const resizeObserver = new ResizeObserver(updateHeight)
      resizeObserver.observe(navRef.current)

      return () => {
        resizeObserver.disconnect()
      }
    }
  }, [])

  return (
    <nav
      ref={navRef}
      className="bottom-nav"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderTop: `1px solid ${theme.colors.border}`,
        padding: `${theme.spacing.sm}`,
        paddingBottom: `max(${theme.spacing.sm}, calc(${theme.spacing.sm} + env(safe-area-inset-bottom)))`,
        boxShadow: theme.shadows.md,
        flexShrink: 0,
      }}
    >
      <div style={{ maxWidth: '600px', width: '100%' }}>
        <AnimatedToggle
          options={navItems
            .filter(isSignedIn ? Boolean : isNotProtected) // Only show unprotected routes when not signed in
            .map(item => ({ value: item.path, label: item.label }))
          }
          selected={currentPath}
          onChange={(path) => {
            if (path === '/runners') {
              if (currentPath === '/runners') {
                sessionStorage.removeItem('lastRunnerModel')
                sessionStorage.removeItem('lastRunnerFormData')
                navigate('/runners')
              } else {
                if (!isSignedIn) {
                  sessionStorage.removeItem('lastRunnerModel')
                  sessionStorage.removeItem('lastRunnerFormData')
                }

                const lastModel = sessionStorage.getItem('lastRunnerModel')
                navigate(lastModel ? `/runners/${lastModel}` : '/runners')
              }
            } else {
              navigate(path)
            }
          }}
        />
      </div>

      {/* CSS for responsive bottom nav */}
      <style>{`
        @media (min-width: 769px) {
          .bottom-nav {
            display: none !important;
          }

          /* Collapse the grid row when bottom nav is hidden on desktop */
          .page-layout-root {
            grid-template-rows: auto 1fr 0 !important;
          }
        }
      `}</style>
    </nav>
  )
}
