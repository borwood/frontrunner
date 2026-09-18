import { useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import { useTheme } from '../theme/ThemeContext'
import { useUnifiedStorage } from '../hooks/useUnifiedStorage'
import { useFavorites } from '../contexts/FavoritesContext'
import { useGenerationFavorites } from '../contexts/GenerationFavoritesContext'
import { useChat } from '../contexts/ChatContext'
import { getModelById } from '../types/models'
import type { Generation, ModelConfig } from '../types/models'
import { useMemo, useState, useEffect } from 'react'
import { GenerationModal } from '../components/GenerationModal'
import { ModelIcon } from '../components/ModelIcon'
import { MobileGrid, DesktopMasonryGrid } from '../components/grids'

export function Home() {
  const navigate = useNavigate()
  const { isSignedIn, signIn, usage, user } = useUser()
  const { theme } = useTheme()
  const [generations] = useUnifiedStorage('generations', [], { skipLocalStorage: true })
  const { favorites: favoriteModelIds } = useFavorites()
  const { favoriteGenerations: favoriteGenerationIds } = useGenerationFavorites()
  const { conversations } = useChat()
  const [selectedGeneration, setSelectedGeneration] = useState<Generation | null>(null)
  const [columnCount, setColumnCount] = useState(3)

  // Calculate responsive column count based on window width
  useEffect(() => {
    const calculateColumns = () => {
      const width = window.innerWidth
      if (width >= 1600) {
        setColumnCount(5)
      } else if (width >= 1200) {
        setColumnCount(4)
      } else if (width >= 900) {
        setColumnCount(3)
      } else {
        setColumnCount(2)
      }
    }

    calculateColumns()
    window.addEventListener('resize', calculateColumns)
    return () => window.removeEventListener('resize', calculateColumns)
  }, [])

  // Get favorite generations
  const favoriteGenerations = useMemo(() => {
    if (!favoriteGenerationIds || favoriteGenerationIds.length === 0) return []
    return generations.filter((gen) => favoriteGenerationIds.includes(gen.id))
  }, [generations, favoriteGenerationIds])

  // Get recent generations (last 20, sorted by timestamp)
  const recentGenerations = useMemo(() => {
    return [...generations]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 20)
  }, [generations])

  // Create mood board: mix of favorites and recent, up to 12 items
  const moodBoardGenerations = useMemo(() => {
    // Start with favorites
    const favorites = [...favoriteGenerations]

    // Get recent that aren't already favorites
    const recentNonFavorites = recentGenerations.filter(
      (gen) => !favoriteGenerationIds.includes(gen.id)
    )

    // Combine and shuffle using Fisher-Yates algorithm
    const combined = [...favorites, ...recentNonFavorites]
    const shuffled = [...combined]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }

    // Return up to 12 items
    return shuffled.slice(0, 12)
  }, [favoriteGenerations, recentGenerations, favoriteGenerationIds])

  // Get favorite models
  const favoriteModels = useMemo(() => {
    if (!favoriteModelIds || favoriteModelIds.length === 0) return []
    return favoriteModelIds.map((id) => getModelById(id)).filter(Boolean)
  }, [favoriteModelIds])

  // Get recent chats (sorted by updatedAt)
  const recentChats = useMemo(() => {
    return [...conversations].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5)
  }, [conversations])

  // Get time-based greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    const greetings = {
      morning: ['Good morning', 'Rise and shine', 'Morning', 'Top of the morning'],
      afternoon: ['Good afternoon', 'Hey there', 'Afternoon'],
      evening: ['Good evening', 'Evening', 'Hey'],
      night: ['Good night', 'Still up', 'Burning the midnight oil'],
    }

    let timeGreetings: string[]
    if (hour >= 5 && hour < 12) {
      timeGreetings = greetings.morning
    } else if (hour >= 12 && hour < 17) {
      timeGreetings = greetings.afternoon
    } else if (hour >= 17 && hour < 21) {
      timeGreetings = greetings.evening
    } else {
      timeGreetings = greetings.night
    }

    return timeGreetings[Math.floor(Math.random() * timeGreetings.length)]
  }, [])

  if (!isSignedIn) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          padding: theme.spacing.lg,
          backgroundColor: theme.colors.background,
          textAlign: 'center',
        }}
      >
        {/* Hero Section */}
        <div style={{ maxWidth: '800px', marginBottom: theme.spacing.xxl }}>
          <div
            style={{
              display: 'inline-block',
              padding: `${theme.spacing.xs} ${theme.spacing.md}`,
              background: `linear-gradient(135deg, ${theme.colors.gradientStart}20, ${theme.colors.gradientEnd}20)`,
              border: `1px solid ${theme.colors.gradientStart}40`,
              borderRadius: theme.borderRadius.full,
              fontSize: theme.typography.sizes.sm,
              fontWeight: theme.typography.weights.medium,
              color: theme.colors.primary,
              marginBottom: theme.spacing.lg,
            }}
          >
            frontrunner
          </div>

          <h1
            style={{
              fontSize: 'clamp(32px, 5vw, 48px)',
              fontWeight: theme.typography.weights.bold,
              color: theme.colors.text,
              marginBottom: theme.spacing.md,
              lineHeight: theme.typography.lineHeights.tight,
            }}
          >
            Run AI models.
            <br />
            <span
              style={{
                background: `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Save everything.
            </span>
          </h1>

          <p
            style={{
              fontSize: theme.typography.sizes.lg,
              color: theme.colors.textSecondary,
              marginBottom: theme.spacing.xxl,
              lineHeight: theme.typography.lineHeights.relaxed,
            }}
          >
            Access 20+ AI models for text, images, and video.
            <br />
            Save outputs, remix generations, and build your creative library.
          </p>

          <button
            onClick={signIn}
            style={{
              padding: `${theme.spacing.md} ${theme.spacing.xl}`,
              fontSize: theme.typography.sizes.lg,
              fontWeight: theme.typography.weights.semibold,
              color: theme.colors.textInverse,
              background: `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`,
              border: 'none',
              borderRadius: theme.borderRadius.lg,
              cursor: 'pointer',
              boxShadow: theme.shadows.lg,
              transition: `all ${theme.transitions.fast}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = theme.shadows.xl
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = theme.shadows.lg
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.98)'
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
          >
            Sign In to Start
          </button>
        </div>

        {/* Features Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: theme.spacing.lg,
            maxWidth: '1000px',
            width: '100%',
          }}
        >
          {[
            {
              title: 'Multiple AI Models',
              description: 'GPT-4, Claude, Flux, and more in one place',
            },
            {
              title: 'Persistent Gallery',
              description: 'Every generation saved automatically',
            },
            {
              title: 'Fluid Remixing',
              description: 'Use outputs as inputs for new generations',
            },
          ].map((feature, idx) => (
            <div
              key={idx}
              style={{
                padding: theme.spacing.lg,
                backgroundColor: theme.colors.surface,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.lg,
                textAlign: 'left',
              }}
            >
              <h3
                style={{
                  fontSize: theme.typography.sizes.lg,
                  fontWeight: theme.typography.weights.semibold,
                  color: theme.colors.text,
                  marginBottom: theme.spacing.xs,
                }}
              >
                {feature.title}
              </h3>
              <p
                style={{
                  fontSize: theme.typography.sizes.sm,
                  color: theme.colors.textSecondary,
                  lineHeight: theme.typography.lineHeights.relaxed,
                }}
              >
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <div style={{ padding: theme.spacing.md, maxWidth: '1100px', marginInline: 'auto', marginTop: theme.spacing.lg }}>
        {/* Welcome Section */}
        <section style={{ marginBottom: theme.spacing.md }}>
          <h1
            style={{
              fontSize: theme.typography.sizes.xl,
              fontWeight: theme.typography.weights.bold,
              color: theme.colors.text,
              marginBottom: theme.spacing.xs,
            }}
          >
            {greeting},{' '}
            <span style={{ color: theme.colors.gradientStart, textTransform: 'capitalize' }}>
              {user?.email?.split('@')[0] || 'friend'}
            </span>
            !
          </h1>
          <p
            style={{
              fontSize: theme.typography.sizes.sm,
              color: theme.colors.textSecondary,
            }}
          >
            <strong>{usage.remainingCredits.toLocaleString()}</strong> credits remaining
          </p>
        </section>

        {/* Desktop: Grid layout */}
        <div className="desktop-home-grid">
          {/* Recent Chats */}
          <section style={{ marginBottom: theme.spacing.lg }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: theme.spacing.sm,
            }}
          >
            <h2
              style={{
                fontSize: theme.typography.sizes.lg,
                fontWeight: theme.typography.weights.semibold,
                color: theme.colors.text,
              }}
            >
              Recent Chats
            </h2>
            <button
              onClick={() => navigate('/chat', { state: { openDrawer: true } })}
              style={{
                padding: `${theme.spacing.xs} ${theme.spacing.md}`,
                fontSize: theme.typography.sizes.sm,
                fontWeight: theme.typography.weights.medium,
                color: theme.colors.primary,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              View All →
            </button>
          </div>

          {recentChats.length === 0 ? (
            <div
              style={{
                padding: theme.spacing.xl,
                textAlign: 'center',
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.lg,
                border: `1px solid ${theme.colors.border}`,
              }}
            >
              <p style={{ color: theme.colors.textSecondary, fontSize: theme.typography.sizes.sm, marginBottom: theme.spacing.md }}>
                No chats yet. Start a conversation!
              </p>
              <button
                onClick={() => navigate('/chat')}
                style={{
                  padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                  fontSize: theme.typography.sizes.sm,
                  fontWeight: theme.typography.weights.semibold,
                  color: theme.colors.textInverse,
                  background: `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`,
                  border: 'none',
                  borderRadius: theme.borderRadius.md,
                  cursor: 'pointer',
                  transition: `transform ${theme.transitions.fast}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                Start Chatting
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', backgroundColor: theme.colors.border, borderRadius: theme.borderRadius.md, overflow: 'hidden' }}>
              {recentChats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => navigate('/chat', { state: { conversationId: chat.id } })}
                  style={{
                    padding: theme.spacing.md,
                    backgroundColor: theme.colors.surface,
                    cursor: 'pointer',
                    transition: `all ${theme.transitions.fast}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme.colors.surfaceHover
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = theme.colors.surface
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: theme.spacing.md }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3
                        style={{
                          fontSize: theme.typography.sizes.base,
                          fontWeight: theme.typography.weights.semibold,
                          color: theme.colors.text,
                          marginBottom: '2px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {chat.title}
                      </h3>
                      <div
                        style={{
                          fontSize: theme.typography.sizes.xs,
                          color: theme.colors.textSecondary,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {chat.modelName} · {chat.messages.length} message{chat.messages.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: theme.typography.sizes.xs,
                        color: theme.colors.textTertiary,
                        flexShrink: 0,
                        textAlign: 'right',
                        display: 'flex',
                        alignItems: 'center',
                        gap: theme.spacing.xs,
                      }}
                    >
                      <span>{new Date(chat.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      <span style={{ fontSize: theme.typography.sizes.sm, opacity: 0.5 }}>›</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

          {/* Favorite Models */}
          <section style={{ marginBottom: theme.spacing.lg }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: theme.spacing.sm,
            }}
          >
            <h2
              style={{
                fontSize: theme.typography.sizes.lg,
                fontWeight: theme.typography.weights.semibold,
                color: theme.colors.text,
              }}
            >
              Favorite Models
            </h2>
            <button
              onClick={() => navigate('/runners')}
              style={{
                padding: `${theme.spacing.xs} ${theme.spacing.md}`,
                fontSize: theme.typography.sizes.sm,
                fontWeight: theme.typography.weights.medium,
                color: theme.colors.primary,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              View All →
            </button>
          </div>

          {favoriteModels.length === 0 ? (
            <div
              style={{
                padding: theme.spacing.md,
                textAlign: 'center',
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
                border: `1px solid ${theme.colors.border}`,
              }}
            >
              <p style={{ color: theme.colors.textSecondary, fontSize: theme.typography.sizes.sm }}>
                No favorite models yet. Star models on the Runners page.
              </p>
            </div>
          ) : (
            <>
              <div
                className="favorite-models-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: theme.spacing.md,
                  padding: theme.spacing.sm,
                }}
              >
                {favoriteModels.filter((model): model is ModelConfig => model !== undefined).map((model) => (
                  <ModelIcon key={model.id} model={model} size="md" />
                ))}
              </div>

              <style>{`
                /* Mobile: 3 columns */
                @media (max-width: 768px) {
                  .favorite-models-grid {
                    grid-template-columns: repeat(3, 1fr) !important;
                  }
                }

                /* Tablet: 4 columns */
                @media (min-width: 769px) and (max-width: 1024px) {
                  .favorite-models-grid {
                    grid-template-columns: repeat(4, 1fr) !important;
                  }
                }

                /* Desktop: 6 columns */
                @media (min-width: 1025px) {
                  .favorite-models-grid {
                    grid-template-columns: repeat(6, 1fr) !important;
                  }
                }
              `}</style>
            </>
          )}
        </section>
        </div>

        {/* Mood Board - Mix of favorites and recent */}
        <section>
          {moodBoardGenerations.length === 0 ? (
            <div
              style={{
                padding: theme.spacing.md,
                textAlign: 'center',
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
                border: `1px solid ${theme.colors.border}`,
              }}
            >
              <p style={{ color: theme.colors.textSecondary, fontSize: theme.typography.sizes.sm }}>
                No generations yet. Start creating to see your work here.
              </p>
            </div>
          ) : (
            <>
              {/* Mobile: Simple grid */}
              <div className="mobile-favorite-generations">
                <MobileGrid
                  generations={moodBoardGenerations}
                  onGenerationClick={setSelectedGeneration}
                  showFavorites={true}
                />
              </div>

              {/* Desktop: Masonry columns */}
              <div className="desktop-favorite-generations">
                <DesktopMasonryGrid
                  generations={moodBoardGenerations}
                  onGenerationClick={setSelectedGeneration}
                  columnCount={columnCount}
                  showFavorites={true}
                />
              </div>
            </>
          )}
        </section>
      </div>

      {/* Generation Modal */}
      {selectedGeneration && (
        <GenerationModal
          generation={selectedGeneration}
          onClose={() => setSelectedGeneration(null)}
        />
      )}

      {/* CSS for desktop grid layout */}
      <style>{`
        /* Mobile: linear layout (default) */
        .desktop-home-grid {
          display: block;
        }

        .mobile-favorite-generations {
          display: grid;
        }

        .desktop-favorite-generations {
          display: none;
        }

        /* Desktop: 2-column grid for chats and favs */
        @media (min-width: 769px) {
          .desktop-home-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: ${theme.spacing.lg};
            margin-bottom: ${theme.spacing.lg};
          }

          .mobile-favorite-generations {
            display: none !important;
          }

          .desktop-favorite-generations {
            display: block !important;
          }
        }
      `}</style>
    </>
  )
}
