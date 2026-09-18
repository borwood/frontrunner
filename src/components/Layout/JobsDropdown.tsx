import { useState, useRef, useEffect } from 'react'
import { useTheme } from '../../theme/ThemeContext'
import { useGenerationQueue } from '../../contexts/GenerationQueueContext'

function formatElapsedTime(startTime: number): string {
  const elapsed = Math.floor((Date.now() - startTime) / 1000)
  if (elapsed < 60) return `${elapsed}s`
  const minutes = Math.floor(elapsed / 60)
  const seconds = elapsed % 60
  return `${minutes}m ${seconds}s`
}

export function JobsDropdown() {
  const { theme } = useTheme()
  const { activeJobs } = useGenerationQueue()
  const [isOpen, setIsOpen] = useState(false)
  const [elapsedTimes, setElapsedTimes] = useState<Record<string, string>>({})
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Update elapsed times every second
  useEffect(() => {
    if (activeJobs.length === 0) return

    const interval = setInterval(() => {
      const times: Record<string, string> = {}
      activeJobs.forEach(job => {
        times[job.id] = formatElapsedTime(job.startTime)
      })
      setElapsedTimes(times)
    }, 1000)

    return () => clearInterval(interval)
  }, [activeJobs])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Don't render if no active jobs
  if (activeJobs.length === 0) return null

  return (
    <div ref={dropdownRef} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.xs,
          padding: `${theme.spacing.xs} ${theme.spacing.md}`,
          backgroundColor: theme.colors.backgroundElevated,
          borderRadius: theme.borderRadius.full,
          border: `1px solid ${theme.colors.border}`,
          cursor: 'pointer',
          transition: `all ${theme.transitions.fast}`,
          position: 'relative',
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
        {/* Animated Grid Loader */}
        <div
          style={{
            position: 'relative',
            width: '24px',
            height: '24px',
            display: 'inline-block',
          }}
        >
          <div style={{ position: 'absolute', width: '5px', height: '5px', borderRadius: '50%', background: `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`, top: '2px', left: '2px', animation: 'lds-grid 1.2s linear infinite', animationDelay: '0s' }} />
          <div style={{ position: 'absolute', width: '5px', height: '5px', borderRadius: '50%', background: `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`, top: '2px', left: '9.5px', animation: 'lds-grid 1.2s linear infinite', animationDelay: '-0.4s' }} />
          <div style={{ position: 'absolute', width: '5px', height: '5px', borderRadius: '50%', background: `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`, top: '2px', left: '17px', animation: 'lds-grid 1.2s linear infinite', animationDelay: '-0.8s' }} />
          <div style={{ position: 'absolute', width: '5px', height: '5px', borderRadius: '50%', background: `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`, top: '9.5px', left: '2px', animation: 'lds-grid 1.2s linear infinite', animationDelay: '-0.4s' }} />
          <div style={{ position: 'absolute', width: '5px', height: '5px', borderRadius: '50%', background: `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`, top: '9.5px', left: '9.5px', animation: 'lds-grid 1.2s linear infinite', animationDelay: '-0.8s' }} />
          <div style={{ position: 'absolute', width: '5px', height: '5px', borderRadius: '50%', background: `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`, top: '9.5px', left: '17px', animation: 'lds-grid 1.2s linear infinite', animationDelay: '-1.2s' }} />
          <div style={{ position: 'absolute', width: '5px', height: '5px', borderRadius: '50%', background: `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`, top: '17px', left: '2px', animation: 'lds-grid 1.2s linear infinite', animationDelay: '-0.8s' }} />
          <div style={{ position: 'absolute', width: '5px', height: '5px', borderRadius: '50%', background: `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`, top: '17px', left: '9.5px', animation: 'lds-grid 1.2s linear infinite', animationDelay: '-1.2s' }} />
          <div style={{ position: 'absolute', width: '5px', height: '5px', borderRadius: '50%', background: `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`, top: '17px', left: '17px', animation: 'lds-grid 1.2s linear infinite', animationDelay: '-1.6s' }} />
        </div>

        {/* Job Count Badge */}
        <span
          style={{
            fontSize: theme.typography.sizes.sm,
            fontWeight: theme.typography.weights.semibold,
            color: theme.colors.text,
          }}
        >
          {activeJobs.length}
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '280px',
            maxHeight: '400px',
            overflowY: 'auto',
            backgroundColor: theme.colors.surface,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.borderRadius.lg,
            boxShadow: theme.shadows.lg,
            zIndex: theme.zIndex.dropdown,
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: theme.spacing.md,
              borderBottom: `1px solid ${theme.colors.border}`,
            }}
          >
            <h3
              style={{
                fontSize: theme.typography.sizes.sm,
                fontWeight: theme.typography.weights.semibold,
                color: theme.colors.text,
                margin: 0,
              }}
            >
              Active Jobs ({activeJobs.length})
            </h3>
          </div>

          {/* Job List */}
          <div style={{ padding: theme.spacing.xs }}>
            {activeJobs.map((job) => (
              <div
                key={job.id}
                style={{
                  padding: theme.spacing.md,
                  borderRadius: theme.borderRadius.md,
                  backgroundColor: theme.colors.backgroundElevated,
                  marginBottom: theme.spacing.xs,
                  transition: `background-color ${theme.transitions.fast}`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: theme.spacing.sm,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: theme.typography.sizes.sm,
                        fontWeight: theme.typography.weights.medium,
                        color: theme.colors.text,
                        marginBottom: theme.spacing.xs,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {job.modelName}
                    </div>
                    <div
                      style={{
                        fontSize: theme.typography.sizes.xs,
                        color: theme.colors.textSecondary,
                      }}
                    >
                      {elapsedTimes[job.id] || '0s'}
                    </div>
                  </div>

                  {/* Mini Loader */}
                  <div
                    style={{
                      position: 'relative',
                      width: '16px',
                      height: '16px',
                      flexShrink: 0,
                    }}
                  >
                    <div style={{ position: 'absolute', width: '3px', height: '3px', borderRadius: '50%', background: theme.colors.primary, top: '1px', left: '1px', animation: 'lds-grid 1.2s linear infinite', animationDelay: '0s' }} />
                    <div style={{ position: 'absolute', width: '3px', height: '3px', borderRadius: '50%', background: theme.colors.primary, top: '1px', left: '6.5px', animation: 'lds-grid 1.2s linear infinite', animationDelay: '-0.4s' }} />
                    <div style={{ position: 'absolute', width: '3px', height: '3px', borderRadius: '50%', background: theme.colors.primary, top: '1px', left: '12px', animation: 'lds-grid 1.2s linear infinite', animationDelay: '-0.8s' }} />
                    <div style={{ position: 'absolute', width: '3px', height: '3px', borderRadius: '50%', background: theme.colors.primary, top: '6.5px', left: '1px', animation: 'lds-grid 1.2s linear infinite', animationDelay: '-0.4s' }} />
                    <div style={{ position: 'absolute', width: '3px', height: '3px', borderRadius: '50%', background: theme.colors.primary, top: '6.5px', left: '6.5px', animation: 'lds-grid 1.2s linear infinite', animationDelay: '-0.8s' }} />
                    <div style={{ position: 'absolute', width: '3px', height: '3px', borderRadius: '50%', background: theme.colors.primary, top: '6.5px', left: '12px', animation: 'lds-grid 1.2s linear infinite', animationDelay: '-1.2s' }} />
                    <div style={{ position: 'absolute', width: '3px', height: '3px', borderRadius: '50%', background: theme.colors.primary, top: '12px', left: '1px', animation: 'lds-grid 1.2s linear infinite', animationDelay: '-0.8s' }} />
                    <div style={{ position: 'absolute', width: '3px', height: '3px', borderRadius: '50%', background: theme.colors.primary, top: '12px', left: '6.5px', animation: 'lds-grid 1.2s linear infinite', animationDelay: '-1.2s' }} />
                    <div style={{ position: 'absolute', width: '3px', height: '3px', borderRadius: '50%', background: theme.colors.primary, top: '12px', left: '12px', animation: 'lds-grid 1.2s linear infinite', animationDelay: '-1.6s' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Animation CSS */}
      <style>{`
        @keyframes lds-grid {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  )
}
