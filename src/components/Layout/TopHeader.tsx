import { useUser } from '../../contexts/UserContext'
import { useTheme } from '../../theme/ThemeContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useGalleryContext } from '../../contexts/GalleryContext'
import { useRunnersContext } from '../../contexts/RunnersContext'
import { useChat } from '../../contexts/ChatContext'
import { JobsDropdown } from './JobsDropdown'
import { SearchInput } from '../SearchInput'

export function TopHeader() {
  const { user, usage, isSignedIn, subscribe, signIn } = useUser()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const isGalleryPage = location.pathname === '/gallery'
  const isRunnersPage = location.pathname.startsWith('/runners')
  const isChatPage = location.pathname === '/chat'
  const { searchQuery: gallerySearchQuery, setSearchQuery: setGallerySearchQuery } = useGalleryContext()
  const { searchQuery: runnersSearchQuery, setSearchQuery: setRunnersSearchQuery } = useRunnersContext()
  const { getActiveConversation, updateConversationTitle } = useChat()

  const activeConversation = getActiveConversation()
  const [isEditingHeaderTitle, setIsEditingHeaderTitle] = useState(false)
  const [editingTitle, setEditingTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const headerRef = useRef<HTMLElement>(null)

  // Focus the input when entering edit mode
  useEffect(() => {
    if (isEditingHeaderTitle && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 0)
    }
  }, [isEditingHeaderTitle])

  // Expose header height as CSS variable
  useEffect(() => {
    if (headerRef.current) {
      const updateHeight = () => {
        if (headerRef.current) {
          const height = headerRef.current.offsetHeight
          document.documentElement.style.setProperty('--header-height', `${height}px`)
        }
      }

      updateHeight()

      const resizeObserver = new ResizeObserver(updateHeight)
      resizeObserver.observe(headerRef.current)

      return () => {
        resizeObserver.disconnect()
      }
    }
  }, [])

  let showLoading = false

  const displayCredits = usage?.remainingCredits ?? '...'

  return (
    <header
      ref={headerRef}
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        padding: `${theme.spacing.md} ${theme.spacing.lg}`,
        paddingTop: `max(16px, env(safe-area-inset-top))`,
        backgroundColor: theme.colors.surface,
        borderBottom: `1px solid ${theme.colors.border}`,
        boxShadow: theme.shadows.sm,
        gap: theme.spacing.md,
      }}
    >
      {/* Left section: User avatar OR Sign In button + Desktop Nav */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.md,
          flexShrink: 0,
          justifySelf: 'start',
        }}
      >
        {isSignedIn ? (
          <button
            onClick={() => navigate('/profile')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.sm,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              transition: `opacity ${theme.transitions.fast}`,
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.7'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1'
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: theme.borderRadius.full,
                ...(user?.avatarUrl
                  ? {
                      backgroundImage: `url(${user.avatarUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }
                  : {
                      backgroundImage: `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`,
                    }),
              }}
            />
            <span
              style={{
                fontSize: theme.typography.sizes.sm,
                fontWeight: theme.typography.weights.medium,
                color: theme.colors.text,
              }}
              className="desktop-only-username"
            >
              {user?.email?.split('@')[0]}
            </span>
          </button>
        ) : (
          <button
            onClick={signIn}
            style={{
              padding: `${theme.spacing.xs} ${theme.spacing.md}`,
              fontSize: theme.typography.sizes.sm,
              fontWeight: theme.typography.weights.semibold,
              color: theme.colors.textInverse,
              background: `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`,
              border: 'none',
              borderRadius: theme.borderRadius.full,
              cursor: 'pointer',
              transition: `all ${theme.transitions.fast}`,
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1'
            }}
          >
            Sign In
          </button>
        )}

        {/* Desktop Navigation Links */}
        <nav
          className="desktop-nav"
          style={{
            display: 'none',
            alignItems: 'center',
            gap: theme.spacing.sm,
            flexShrink: 0,
          }}
        >
        <button
          onClick={() => navigate('/')}
          style={{
            padding: `${theme.spacing.xs} ${theme.spacing.md}`,
            fontSize: theme.typography.sizes.sm,
            fontWeight: theme.typography.weights.medium,
            color: location.pathname === '/' ? theme.colors.primary : theme.colors.textSecondary,
            backgroundColor: location.pathname === '/' ? theme.colors.surfaceHover : 'transparent',
            border: 'none',
            borderRadius: theme.borderRadius.md,
            cursor: 'pointer',
            transition: `all ${theme.transitions.fast}`,
          }}
          onMouseEnter={(e) => {
            if (location.pathname !== '/') {
              e.currentTarget.style.color = theme.colors.text
              e.currentTarget.style.backgroundColor = theme.colors.hover
            }
          }}
          onMouseLeave={(e) => {
            if (location.pathname !== '/') {
              e.currentTarget.style.color = theme.colors.textSecondary
              e.currentTarget.style.backgroundColor = 'transparent'
            }
          }}
        >
          Home
        </button>

        <button
          onClick={() => {
            if (isRunnersPage) {
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
          }}
          style={{
            padding: `${theme.spacing.xs} ${theme.spacing.md}`,
            fontSize: theme.typography.sizes.sm,
            fontWeight: theme.typography.weights.medium,
            color: isRunnersPage ? theme.colors.primary : theme.colors.textSecondary,
            backgroundColor: isRunnersPage ? theme.colors.surfaceHover : 'transparent',
            border: 'none',
            borderRadius: theme.borderRadius.md,
            cursor: 'pointer',
            transition: `all ${theme.transitions.fast}`,
          }}
          onMouseEnter={(e) => {
            if (!isRunnersPage) {
              e.currentTarget.style.color = theme.colors.text
              e.currentTarget.style.backgroundColor = theme.colors.hover
            }
          }}
          onMouseLeave={(e) => {
            if (!isRunnersPage) {
              e.currentTarget.style.color = theme.colors.textSecondary
              e.currentTarget.style.backgroundColor = 'transparent'
            }
          }}
        >
          Runners
        </button>

        <button
          onClick={() => navigate('/chat')}
          style={{
            padding: `${theme.spacing.xs} ${theme.spacing.md}`,
            fontSize: theme.typography.sizes.sm,
            fontWeight: theme.typography.weights.medium,
            color: location.pathname === '/chat' ? theme.colors.primary : theme.colors.textSecondary,
            backgroundColor: location.pathname === '/chat' ? theme.colors.surfaceHover : 'transparent',
            border: 'none',
            borderRadius: theme.borderRadius.md,
            cursor: 'pointer',
            transition: `all ${theme.transitions.fast}`,
          }}
          onMouseEnter={(e) => {
            if (location.pathname !== '/chat') {
              e.currentTarget.style.color = theme.colors.text
              e.currentTarget.style.backgroundColor = theme.colors.hover
            }
          }}
          onMouseLeave={(e) => {
            if (location.pathname !== '/chat') {
              e.currentTarget.style.color = theme.colors.textSecondary
              e.currentTarget.style.backgroundColor = 'transparent'
            }
          }}
        >
          Chat
        </button>

        {isSignedIn && (
          <button
            onClick={() => navigate('/gallery')}
            style={{
              padding: `${theme.spacing.xs} ${theme.spacing.md}`,
              fontSize: theme.typography.sizes.sm,
              fontWeight: theme.typography.weights.medium,
              color: location.pathname === '/gallery' ? theme.colors.primary : theme.colors.textSecondary,
              backgroundColor: location.pathname === '/gallery' ? theme.colors.surfaceHover : 'transparent',
              border: 'none',
              borderRadius: theme.borderRadius.md,
              cursor: 'pointer',
              transition: `all ${theme.transitions.fast}`,
            }}
            onMouseEnter={(e) => {
              if (location.pathname !== '/gallery') {
                e.currentTarget.style.color = theme.colors.text
                e.currentTarget.style.backgroundColor = theme.colors.hover
              }
            }}
            onMouseLeave={(e) => {
              if (location.pathname !== '/gallery') {
                e.currentTarget.style.color = theme.colors.textSecondary
                e.currentTarget.style.backgroundColor = 'transparent'
              }
            }}
          >
            Gallery
          </button>
        )}
      </nav>
      </div>

      {/* Center section: Search bars / Chat Title */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gridColumn: '2',
        }}
      >
        {isGalleryPage && (
          <div className="desktop-search">
            <SearchInput
              value={gallerySearchQuery}
              onChange={setGallerySearchQuery}
              placeholder="Search by model or prompt..."
              style={{ width: '400px' }}
            />
          </div>
        )}

        {/* Desktop Runners Search */}
        {isRunnersPage && (
          <div className="desktop-search">
            <SearchInput
              value={runnersSearchQuery}
              onChange={setRunnersSearchQuery}
              placeholder="Search models..."
              style={{ width: '400px' }}
            />
          </div>
        )}

        {/* Desktop Chat Title (editable) */}
        {isChatPage && activeConversation && isSignedIn && (
          <div className="desktop-chat-title">
            {isEditingHeaderTitle ? (
              <input
                ref={inputRef}
                type="text"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onBlur={() => {
                  if (editingTitle.trim() && editingTitle.trim() !== activeConversation.title) {
                    updateConversationTitle(activeConversation.id, editingTitle.trim())
                  }
                  setIsEditingHeaderTitle(false)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (editingTitle.trim() && editingTitle.trim() !== activeConversation.title) {
                      updateConversationTitle(activeConversation.id, editingTitle.trim())
                    }
                    setIsEditingHeaderTitle(false)
                  } else if (e.key === 'Escape') {
                    setIsEditingHeaderTitle(false)
                  }
                }}
                autoFocus
                onFocus={(e) => e.target.select()}
                style={{
                  width: '400px',
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  fontSize: theme.typography.sizes.sm,
                  fontWeight: theme.typography.weights.semibold,
                  color: theme.colors.text,
                  backgroundColor: theme.colors.surface,
                  border: `1px solid ${theme.colors.primary}`,
                  borderRadius: theme.borderRadius.lg,
                  outline: 'none',
                  fontFamily: theme.typography.fontFamily,
                  textAlign: 'center',
                }}
              />
            ) : (
              <div
                onClick={() => {
                  setEditingTitle(activeConversation.title)
                  setIsEditingHeaderTitle(true)
                }}
                style={{
                  width: '400px',
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  fontSize: theme.typography.sizes.sm,
                  fontWeight: theme.typography.weights.semibold,
                  color: theme.colors.text,
                  cursor: 'pointer',
                  textAlign: 'center',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  transition: `all ${theme.transitions.fast}`,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.borderRadius.lg,
                  backgroundColor: theme.colors.surface,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = theme.colors.primary
                  e.currentTarget.style.borderColor = theme.colors.primary
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = theme.colors.text
                  e.currentTarget.style.borderColor = theme.colors.border
                }}
              >
                {activeConversation.title}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right section: Credits, Jobs (only when signed in) */}
      {isSignedIn && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.md,
            flexShrink: 0,
            justifySelf: 'end',
          }}
        >
        <button
          onClick={subscribe}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.xs,
            padding: `${theme.spacing.xs} ${theme.spacing.md}`,
            backgroundColor: theme.colors.backgroundElevated,
            borderRadius: theme.borderRadius.full,
            border: `1px solid ${theme.colors.border}`,
            flexShrink: 0,
            cursor: 'pointer',
            transition: `all ${theme.transitions.fast}`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme.colors.surface
            e.currentTarget.style.borderColor = theme.colors.primary
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = theme.colors.backgroundElevated
            e.currentTarget.style.borderColor = theme.colors.border
          }}
        >
          <span
            style={{
              fontSize: theme.typography.sizes.sm,
              fontWeight: theme.typography.weights.semibold,
              color: theme.colors.text,
              opacity: showLoading ? 0.5 : 1,
              transition: theme.transitions.fast,
            }}
          >
            {showLoading ? '...' : `${displayCredits} credits`}
          </span>
        </button>

        <JobsDropdown />
        </div>
      )}

      {/* CSS for responsive header */}
      <style>{`
        /* Mobile: hide desktop elements and use flexible grid */
        @media (max-width: 768px) {
          .desktop-search {
            display: none !important;
          }
          .desktop-chat-title {
            display: none !important;
          }
          .desktop-nav {
            display: none !important;
          }

          /* On mobile, use auto columns to prevent overflow */
          header {
            grid-template-columns: auto 1fr auto !important;
            gap: ${theme.spacing.xs} !important;
            padding: ${theme.spacing.xs} ${theme.spacing.md} !important;
            padding-top: max(8px, env(safe-area-inset-top)) !important;
            padding-bottom: ${theme.spacing.xs} !important;
          }

          /* Ensure right section doesn't overflow */
          header > div:last-child {
            min-width: 0 !important;
            gap: ${theme.spacing.sm} !important;
          }

          /* Reduce padding on buttons for mobile */
          header button {
            padding: ${theme.spacing.xs} ${theme.spacing.sm} !important;
          }
        }

        /* Desktop: show nav, search, and chat title */
        @media (min-width: 769px) {
          .desktop-nav {
            display: flex !important;
          }
          .desktop-chat-title {
            display: block !important;
          }
        }

        /* Hide username on smaller mobile screens */
        @media (max-width: 600px) {
          .desktop-only-username {
            display: none !important;
          }
        }

        /* When header gets too cramped, wrap to multi-row layout */
        @media (min-width: 769px) and (max-width: 1200px) {
          header {
            grid-template-columns: 1fr auto !important;
            grid-template-rows: auto auto !important;
            row-gap: ${theme.spacing.md} !important;
          }

          /* Row 1: Left section and right section (credits) */
          header > div:first-child {
            grid-column: 1 !important;
            grid-row: 1 !important;
            justify-self: start !important;
          }

          header > div:last-child {
            grid-column: 2 !important;
            grid-row: 1 !important;
            justify-self: end !important;
          }

          /* Row 2: Center section (search/chat title) spans full width */
          header > div:nth-child(2) {
            grid-column: 1 / -1 !important;
            grid-row: 2 !important;
            justify-self: center !important;
          }
        }

        /* Wide screens: single row with perfect centering */
        @media (min-width: 1201px) {
          header {
            grid-template-columns: 1fr auto 1fr !important;
          }
        }
      `}</style>
    </header>
  )
}
