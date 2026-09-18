import { useUser } from '../contexts/UserContext'
import { useTheme } from '../theme/ThemeContext'
import { AnimatedToggle } from '../components/AnimatedToggle'
import { CustomDropdown, type AccentOption } from '../components/CustomDropdown'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClearAllStorage } from '../hooks/useUnifiedStorage'

export function Profile() {
  const navigate = useNavigate()
  const { user, signOut, usage, subscribe, subscriptionStatus } = useUser()
  const {
    theme,
    brightness,
    roundness,
    accent,
    customGradientStart,
    customGradientEnd,
    setBrightness,
    setRoundness,
    setAccent,
    setCustomGradient
  } = useTheme()

  // Local state for color pickers
  const [tempGradientStart, setTempGradientStart] = useState(customGradientStart)
  const [tempGradientEnd, setTempGradientEnd] = useState(customGradientEnd)

  // Dev tool - atomic storage clear
  const clearAllStorage = useClearAllStorage()

  // Accent options with gradients
  const accentOptions: AccentOption[] = [
    { value: 'cool', label: 'Cool', gradientStart: '#5B7FFF', gradientEnd: '#9F7FFF' },
    { value: 'warm', label: 'Warm', gradientStart: '#D35836', gradientEnd: '#E88468' },
    { value: 'lush', label: 'Lush', gradientStart: '#10B981', gradientEnd: '#14B8A6' },
    { value: 'gold', label: 'Gold', gradientStart: '#d1c866', gradientEnd: '#a79735' },
    { value: 'slime', label: 'Slime', gradientStart: '#89d784', gradientEnd: '#b3db5c' },
    { value: 'jewel', label: 'Jewel', gradientStart: '#2dae99', gradientEnd: '#833a7d' },
    { value: 'ruby', label: 'Ruby', gradientStart: '#df3434', gradientEnd: '#c20a1d' },
    { value: 'foam', label: 'Foam', gradientStart: '#6deec3', gradientEnd: '#a8e6d3' },
    { value: 'lilac', label: 'Lilac', gradientStart: '#6851d6', gradientEnd: '#c7d0e5' },
    { value: 'cosmic', label: 'Cosmic', gradientStart: '#698bf2', gradientEnd: '#bb50e2' },
    { value: 'leather', label: 'Leather', gradientStart: '#50372f', gradientEnd: '#7e5844' },
    { value: 'custom', label: 'Custom', gradientStart: customGradientStart, gradientEnd: customGradientEnd },
  ]

  return (
    <>
      <div style={{ padding: theme.spacing.lg, maxWidth: '1100px', marginInline: 'auto', marginTop: theme.spacing.lg }}>
        <h1
          style={{
            fontSize: theme.typography.sizes.xxl,
            fontWeight: theme.typography.weights.bold,
            color: theme.colors.text,
            marginBottom: theme.spacing.xxl,
          }}
        >
          Profile
        </h1>

        {/* Desktop Grid Layout */}
        <div className="desktop-profile-grid">
          {/* User Info & Subscription Combined */}
          <section
            style={{
              padding: theme.spacing.lg,
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.lg,
              border: `1px solid ${theme.colors.border}`,
              marginBottom: theme.spacing.lg,
            }}
          >
            {/* User Info */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.md,
                marginBottom: theme.spacing.lg,
                paddingBottom: theme.spacing.lg,
                borderBottom: `1px solid ${theme.colors.border}`,
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: theme.borderRadius.full,
                  backgroundImage: user?.avatarUrl
                    ? `url(${user.avatarUrl})`
                    : `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2
                  style={{
                    fontSize: theme.typography.sizes.lg,
                    fontWeight: theme.typography.weights.semibold,
                    color: theme.colors.text,
                    marginBottom: theme.spacing.xs,
                  }}
                >
                  {user?.email?.split('@')[0]}
                </h2>
                <p
                  style={{
                    fontSize: theme.typography.sizes.sm,
                    color: theme.colors.textSecondary,
                    marginBottom: theme.spacing.xs,
                  }}
                >
                  {user?.email}
                </p>
                {/* Subscription Tier */}
                <div
                  style={{
                    display: 'inline-block',
                    padding: `2px ${theme.spacing.sm}`,
                    fontSize: theme.typography.sizes.xs,
                    fontWeight: theme.typography.weights.semibold,
                    color: subscriptionStatus?.hasActiveSubscription ? theme.colors.wechatGreen : theme.colors.textTertiary,
                    backgroundColor: subscriptionStatus?.hasActiveSubscription ? `${theme.colors.wechatGreen}15` : theme.colors.backgroundElevated,
                    borderRadius: theme.borderRadius.sm,
                    border: `1px solid ${subscriptionStatus?.hasActiveSubscription ? `${theme.colors.wechatGreen}30` : theme.colors.border}`,
                  }}
                  title={subscriptionStatus?.plan.subtitle}
                >
                  {subscriptionStatus?.plan.name || 'Free Tier'}
                </div>
              </div>
            </div>

            {/* Credits */}
            <div style={{ marginBottom: theme.spacing.md }}>
              <h3
                style={{
                  fontSize: theme.typography.sizes.sm,
                  fontWeight: theme.typography.weights.medium,
                  color: theme.colors.textSecondary,
                  marginBottom: theme.spacing.sm,
                }}
              >
                Credits
              </h3>
              <div
                style={{
                  fontSize: theme.typography.sizes.xxxl,
                  fontWeight: theme.typography.weights.bold,
                  color: theme.colors.primary,
                  marginBottom: theme.spacing.xs,
                }}
              >
                {usage.remainingCredits.toLocaleString()}
              </div>
              <p
                style={{
                  fontSize: theme.typography.sizes.sm,
                  color: theme.colors.textSecondary,
                }}
              >
                of {usage.allocatedCredits.toLocaleString()} total credits
              </p>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
              <button
                onClick={subscribe}
                style={{
                  width: '100%',
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  fontSize: theme.typography.sizes.sm,
                  fontWeight: theme.typography.weights.semibold,
                  color: subscriptionStatus?.hasActiveSubscription ? theme.colors.text : theme.colors.textInverse,
                  background: subscriptionStatus?.hasActiveSubscription ? 'transparent' : theme.colors.wechatGreen,
                  border: `1px solid ${subscriptionStatus?.hasActiveSubscription ? theme.colors.border : theme.colors.wechatGreen}`,
                  borderRadius: theme.borderRadius.md,
                  cursor: 'pointer',
                  transition: `all ${theme.transitions.fast}`,
                }}
                onMouseEnter={(e) => {
                  if (subscriptionStatus?.hasActiveSubscription) {
                    e.currentTarget.style.backgroundColor = theme.colors.backgroundElevated
                    e.currentTarget.style.borderColor = theme.colors.primary
                  } else {
                    e.currentTarget.style.backgroundColor = theme.colors.wechatGreenDark
                  }
                }}
                onMouseLeave={(e) => {
                  if (subscriptionStatus?.hasActiveSubscription) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.borderColor = theme.colors.border
                  } else {
                    e.currentTarget.style.backgroundColor = theme.colors.wechatGreen
                  }
                }}
              >
                {subscriptionStatus?.hasActiveSubscription ? 'Manage Subscription' : 'Get More Credits'}
              </button>

              <button
                onClick={async () => {
                  navigate('/', { replace: true })
                  signOut()
                }}
                style={{
                  width: '100%',
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  fontSize: theme.typography.sizes.sm,
                  fontWeight: theme.typography.weights.medium,
                  color: theme.colors.textSecondary,
                  backgroundColor: 'transparent',
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.borderRadius.md,
                  cursor: 'pointer',
                  transition: `all ${theme.transitions.fast}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.textSecondary
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.border
                }}
              >
                Sign Out
              </button>
            </div>
          </section>
          {/* Settings */}
          <section
            style={{
              padding: theme.spacing.lg,
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.lg,
              border: `1px solid ${theme.colors.border}`,
              marginBottom: theme.spacing.lg,
            }}
          >
            <h3
              style={{
                fontSize: theme.typography.sizes.base,
                fontWeight: theme.typography.weights.semibold,
                color: theme.colors.text,
                marginBottom: theme.spacing.md,
              }}
            >
              Appearance
            </h3>

            {/* Theme Toggles */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: theme.spacing.lg,
              }}
            >
              {/* Brightness Toggle */}
              <div>
                <label
                  style={{
                    fontSize: theme.typography.sizes.sm,
                    color: theme.colors.textSecondary,
                    marginBottom: theme.spacing.xs,
                    display: 'block',
                  }}
                >
                  Brightness
                </label>
                <AnimatedToggle
                  options={[
                    { value: 'light', label: 'Light' },
                    { value: 'paper', label: 'Paper' },
                    { value: 'dark', label: 'Dark' },
                    { value: 'oled', label: 'OLED' },
                  ]}
                  selected={brightness}
                  onChange={setBrightness}
                />
              </div>

              {/* Roundness Toggle */}
              <div>
                <label
                  style={{
                    fontSize: theme.typography.sizes.sm,
                    color: theme.colors.textSecondary,
                    marginBottom: theme.spacing.xs,
                    display: 'block',
                  }}
                >
                  Corners
                </label>
                <AnimatedToggle
                  options={[
                    { value: 'sharp', label: 'Sharp' },
                    { value: 'round', label: 'Round' },
                  ]}
                  selected={roundness}
                  onChange={setRoundness}
                />
              </div>

              {/* Accent Dropdown */}
              <div>
                <CustomDropdown
                  options={accentOptions}
                  selected={accent}
                  onChange={(value) => setAccent(value as typeof accent)}
                  label="Accent"
                />
              </div>

              {/* Custom Gradient Pickers - only show when custom is selected */}
              {accent === 'custom' && (
                <div
                  style={{
                    padding: theme.spacing.md,
                    backgroundColor: theme.colors.backgroundElevated,
                    borderRadius: theme.borderRadius.md,
                    border: `1px solid ${theme.colors.border}`,
                  }}
                >
                  <label
                    style={{
                      fontSize: theme.typography.sizes.sm,
                      color: theme.colors.textSecondary,
                      marginBottom: theme.spacing.sm,
                      display: 'block',
                    }}
                  >
                    Custom Gradient Colors
                  </label>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md, marginBottom: theme.spacing.md }}>
                    {/* Gradient Start Color */}
                    <div>
                      <label
                        style={{
                          fontSize: theme.typography.sizes.xs,
                          color: theme.colors.textTertiary,
                          marginBottom: theme.spacing.xs,
                          display: 'block',
                        }}
                      >
                        Start Color
                      </label>
                      <div style={{ display: 'flex', gap: theme.spacing.sm, alignItems: 'center' }}>
                        <input
                          type="color"
                          value={tempGradientStart}
                          onChange={(e) => setTempGradientStart(e.target.value)}
                          style={{
                            width: '48px',
                            height: '48px',
                            border: `1px solid ${theme.colors.border}`,
                            borderRadius: theme.borderRadius.md,
                            cursor: 'pointer',
                          }}
                        />
                        <input
                          type="text"
                          value={tempGradientStart}
                          onChange={(e) => setTempGradientStart(e.target.value)}
                          placeholder="#5B7FFF"
                          style={{
                            flex: 1,
                            padding: theme.spacing.sm,
                            fontSize: theme.typography.sizes.sm,
                            fontFamily: theme.typography.fontFamilyMono,
                            color: theme.colors.text,
                            backgroundColor: theme.colors.surface,
                            border: `1px solid ${theme.colors.border}`,
                            borderRadius: theme.borderRadius.sm,
                            outline: 'none',
                          }}
                        />
                      </div>
                    </div>

                    {/* Gradient End Color */}
                    <div>
                      <label
                        style={{
                          fontSize: theme.typography.sizes.xs,
                          color: theme.colors.textTertiary,
                          marginBottom: theme.spacing.xs,
                          display: 'block',
                        }}
                      >
                        End Color
                      </label>
                      <div style={{ display: 'flex', gap: theme.spacing.sm, alignItems: 'center' }}>
                        <input
                          type="color"
                          value={tempGradientEnd}
                          onChange={(e) => setTempGradientEnd(e.target.value)}
                          style={{
                            width: '48px',
                            height: '48px',
                            border: `1px solid ${theme.colors.border}`,
                            borderRadius: theme.borderRadius.md,
                            cursor: 'pointer',
                          }}
                        />
                        <input
                          type="text"
                          value={tempGradientEnd}
                          onChange={(e) => setTempGradientEnd(e.target.value)}
                          placeholder="#9F7FFF"
                          style={{
                            flex: 1,
                            padding: theme.spacing.sm,
                            fontSize: theme.typography.sizes.sm,
                            fontFamily: theme.typography.fontFamilyMono,
                            color: theme.colors.text,
                            backgroundColor: theme.colors.surface,
                            border: `1px solid ${theme.colors.border}`,
                            borderRadius: theme.borderRadius.sm,
                            outline: 'none',
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Preview and Apply */}
                  <div
                    style={{
                      height: '48px',
                      background: `linear-gradient(135deg, ${tempGradientStart}, ${tempGradientEnd})`,
                      borderRadius: theme.borderRadius.md,
                      marginBottom: theme.spacing.md,
                      border: `1px solid ${theme.colors.border}`,
                    }}
                  />

                  <button
                    onClick={() => setCustomGradient(tempGradientStart, tempGradientEnd)}
                    style={{
                      width: '100%',
                      padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                      fontSize: theme.typography.sizes.sm,
                      fontWeight: theme.typography.weights.semibold,
                      color: theme.colors.textInverse,
                      background: `linear-gradient(135deg, ${tempGradientStart}, ${tempGradientEnd})`,
                      border: 'none',
                      borderRadius: theme.borderRadius.md,
                      cursor: 'pointer',
                      transition: `all ${theme.transitions.fast}`,
                    }}
                  >
                    Apply Custom Colors
                  </button>
                </div>
              )}
            </div>
          </section>

        </div>

        {/* Dangerous Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
          {/* Dangerous Actions Collapsible */}
          <details
            style={{
              padding: theme.spacing.lg,
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.lg,
              border: `1px solid ${theme.colors.border}`,
            }}
          >
            <summary
              style={{
                fontSize: theme.typography.sizes.sm,
                fontWeight: theme.typography.weights.semibold,
                color: theme.colors.textSecondary,
                cursor: 'pointer',
                listStyle: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.xs,
                userSelect: 'none',
              }}
            >
              <span style={{ fontSize: theme.typography.sizes.base }}>⚠️</span>
              <span>Dangerous Actions</span>
            </summary>

            <div style={{ marginTop: theme.spacing.md }}>
              {/* Clear Data Section */}
              <div
                style={{
                  padding: theme.spacing.md,
                  backgroundColor: `${theme.colors.error}08`,
                  borderRadius: theme.borderRadius.md,
                  border: `1px solid ${theme.colors.error}30`,
                }}
              >
                <h4
                  style={{
                    fontSize: theme.typography.sizes.sm,
                    fontWeight: theme.typography.weights.semibold,
                    color: theme.colors.error,
                    marginBottom: theme.spacing.xs,
                  }}
                >
                  Clear My App Data
                </h4>
                <p
                  style={{
                    fontSize: theme.typography.sizes.xs,
                    color: theme.colors.textSecondary,
                    lineHeight: theme.typography.lineHeights.normal,
                    marginBottom: theme.spacing.md,
                  }}
                >
                  This will attempt to clear all your generations, preferences, and chat history from this device and the cloud. This may not work predictably if you have active sessions on other devices.
                </p>
                <button
                  onClick={async () => {
                    if (!confirm('⚠️ This will delete all your data. This cannot be undone. Continue?')) return

                    clearAllStorage()

                    setTimeout(() => {
                      window.location.reload()
                    }, 1000)
                  }}
                  style={{
                    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                    fontSize: theme.typography.sizes.sm,
                    fontWeight: theme.typography.weights.medium,
                    color: theme.colors.error,
                    backgroundColor: 'transparent',
                    border: `1px solid ${theme.colors.error}`,
                    borderRadius: theme.borderRadius.md,
                    cursor: 'pointer',
                    transition: `all ${theme.transitions.fast}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${theme.colors.error}15`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  Clear All Data
                </button>
              </div>
            </div>
          </details>
        </div>
      </div>

      {/* CSS for desktop grid layout */}
      <style>{`
        /* Mobile: linear layout (default) */
        .desktop-profile-grid {
          display: block;
        }

        /* Hide disclosure triangle on summary */
        details summary::-webkit-details-marker {
          display: none;
        }

        details summary::marker {
          display: none;
        }

        /* Desktop: 2-column grid (user info + appearance in same row) */
        @media (min-width: 769px) {
          .desktop-profile-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: ${theme.spacing.lg};
            margin-bottom: ${theme.spacing.lg};
          }
        }
      `}</style>
    </>
  )
}
