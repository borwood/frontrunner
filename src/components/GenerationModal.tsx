import { useState, useRef, useEffect } from 'react'
import { useTheme } from '../theme/ThemeContext'
import { useNavigate } from 'react-router-dom'
import { useGenerationFavorites } from '../contexts/GenerationFavoritesContext'
import { useUnifiedStorage } from '../hooks/useUnifiedStorage'
import { DynamicOutputRenderer } from './DynamicOutputRenderer'
import { Modal } from './Modal'
import { getModelById } from '../types/models'
import type { Generation } from '../types/models'

interface GenerationModalProps {
  generation: Generation
  onClose: () => void
}

export function GenerationModal({ generation, onClose }: GenerationModalProps) {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const { isFavorite, toggleFavorite } = useGenerationFavorites()
  const [, setGenerations] = useUnifiedStorage('generations', [], { skipLocalStorage: true })
  const model = getModelById(generation.modelId)
  // Initialize isMobile synchronously to prevent flash of desktop layout
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768)
  const isGenerationFavorite = isFavorite(generation.id)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  // const [isClosing, setIsClosing] = useState(false)
  // Mobile drawer state (simplified like Gallery)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerHeight, setDrawerHeight] = useState(80) // Collapsed: show handle + model name
  const [isDrawerDragging, setIsDrawerDragging] = useState(false)
  const [dragStartY, setDragStartY] = useState(0)
  const [dragStartHeight, setDragStartHeight] = useState(0)
  const imageRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const drawerRef = useRef<HTMLDivElement>(null)

  const MAX_DRAWER_HEIGHT = Math.min(window.innerHeight * 0.7, 500)
  const MIN_DRAWER_HEIGHT = 80

  // Detect mobile - only updates on resize now, initial value is set above
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Disable body scroll on mobile when modal is open
  useEffect(() => {
    if (isMobile) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [isMobile])

  const handleRemix = () => {
    if (!model) return
    // Use the saved formData if available, otherwise fall back to inputData.prompt
    if (generation.formData) {
      const formDataParam = encodeURIComponent(JSON.stringify(generation.formData))
      navigate(`/runners/${model.slug}?formData=${formDataParam}`)
    } else {
      // Legacy support for old generations without formData
      const prompt = generation.inputData.prompt || ''
      navigate(`/runners/${model.slug}?remix=${encodeURIComponent(prompt)}`)
    }

    // Scroll back to the top
    document.querySelector('#root main:first-of-type')?.scrollTo(0, 0)

    // Close modal after navigation
    onClose()
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this generation?')) {
      // Remove the generation from storage
      setGenerations(prev => prev.filter((gen) => gen.id !== generation.id))
      // Delay close to ensure state update completes
      setTimeout(() => {
        onClose()
      }, 0)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent | React.TouchEvent) => {
    // Allow backdrop close on both mobile and desktop
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // Touch handlers for pinch-zoom and pan (no swipe-to-dismiss)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && scale > 1) {
      // Panning when zoomed
      setIsDragging(true)
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      })
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging && scale > 1) {
      // Pan when zoomed
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      })
    } else if (e.touches.length === 2) {
      // Pinch zoom
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      )

      if (!imageRef.current) return
      const baseDistance = imageRef.current.getAttribute('data-distance')
      if (!baseDistance) {
        imageRef.current.setAttribute('data-distance', String(distance))
        return
      }

      const newScale = Math.min(Math.max(1, (distance / Number(baseDistance)) * scale), 4)
      setScale(newScale)
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)

    if (imageRef.current) {
      imageRef.current.removeAttribute('data-distance')
    }

    // Reset if zoomed out completely
    if (scale <= 1) {
      setScale(1)
      setPosition({ x: 0, y: 0 })
    }
  }

  // Drawer drag handlers (same pattern as Gallery)
  const handleDrawerTouchStart = (e: React.TouchEvent) => {
    setIsDrawerDragging(true)
    setDragStartY(e.touches[0].clientY)
    setDragStartHeight(drawerHeight)
  }

  const handleDrawerTouchMove = (e: React.TouchEvent) => {
    if (!isDrawerDragging) return

    const currentY = e.touches[0].clientY
    const deltaY = dragStartY - currentY // Negative = dragging down, Positive = dragging up
    const newHeight = Math.max(MIN_DRAWER_HEIGHT, Math.min(MAX_DRAWER_HEIGHT, dragStartHeight + deltaY))

    setDrawerHeight(newHeight)
  }

  const handleDrawerTouchEnd = () => {
    setIsDrawerDragging(false)

    // Snap to open or closed based on threshold
    if (drawerHeight > (MIN_DRAWER_HEIGHT + MAX_DRAWER_HEIGHT) / 2) {
      setDrawerHeight(MAX_DRAWER_HEIGHT)
      setDrawerOpen(true)
    } else {
      setDrawerHeight(MIN_DRAWER_HEIGHT)
      setDrawerOpen(false)
    }
  }

  const toggleDrawer = () => {
    if (drawerOpen) {
      setDrawerHeight(MIN_DRAWER_HEIGHT)
      setDrawerOpen(false)
    } else {
      setDrawerHeight(MAX_DRAWER_HEIGHT)
      setDrawerOpen(true)
    }
  }

  const isImageType = generation.outputData.type === 'image'

  // Unified Mobile View (all output types)
  if (isMobile) {
    // Create translucent version of theme background
    const getTranslucentBackground = () => {
      const bg = theme.colors.background
      // Extract hex color and convert to rgba with 0.92 alpha
      if (bg.startsWith('#')) {
        const hex = bg.replace('#', '')
        const r = parseInt(hex.substring(0, 2), 16)
        const g = parseInt(hex.substring(2, 4), 16)
        const b = parseInt(hex.substring(4, 6), 16)
        return `rgba(${r}, ${g}, ${b}, 0.95)`
      }
      return 'rgba(0, 0, 0, 0.92)' // Fallback
    }

    return (
      <div
        ref={containerRef}
        onClick={handleBackdropClick}
        onTouchEnd={handleBackdropClick}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: getTranslucentBackground(),
          zIndex: theme.zIndex.toast + 100,
          display: 'flex',
          flexDirection: 'column',
          animation: 'modalFadeIn 0.25s ease-out',
        }}
      >
        {/* Top Overlay - Model Info & Close */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            padding: theme.spacing.md,
            paddingTop: '20px',
            zIndex: 20,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            pointerEvents: 'none',
          }}
        >
          <div style={{ flex: 1, pointerEvents: 'auto' }}>
            <button
              onClick={() => {
                if (model?.slug) {
                  navigate(`/runners/${model.slug}`)
                }
              }}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: model?.slug ? 'pointer' : 'default',
                textAlign: 'left',
                marginBottom: theme.spacing.xs,
              }}
            >
              <p
                style={{
                  fontSize: theme.typography.sizes.sm,
                  fontWeight: theme.typography.weights.bold,
                  color: theme.colors.text,
                  textDecoration: model?.slug ? 'underline' : 'none',
                  textDecorationColor: `${theme.colors.text}80`,
                }}
              >
                {generation.modelName}
              </p>
            </button>
            <p
              style={{
                fontSize: theme.typography.sizes.xs,
                color: theme.colors.text,
                opacity: 0.9,
              }}
            >
              {new Date(generation.timestamp).toLocaleDateString()}
            </p>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              background: 'none',
              border: 'none',
              color: theme.colors.text,
              fontSize: theme.typography.sizes.xl,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              marginLeft: theme.spacing.sm,
              pointerEvents: 'auto',
            }}
          >
            ×
          </button>
        </div>

        {/* Content Area - Unified minimal rendering for all types */}
        <div
          ref={imageRef}
          onTouchStart={isImageType ? handleTouchStart : undefined}
          onTouchMove={isImageType ? handleTouchMove : undefined}
          onTouchEnd={isImageType ? (e) => {
            handleTouchEnd()
            e.stopPropagation()
          } : undefined}
          onClick={handleBackdropClick}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: isImageType ? 'hidden' : 'auto',
            touchAction: isImageType ? 'none' : 'auto',
            padding: theme.spacing.md,
          }}
        >
          {/* Image Output */}
          {generation.outputData.type === 'image' && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`,
                padding: '1px',
                borderRadius: theme.borderRadius.md,
                maxWidth: scale === 1 ? 'calc(100% - 32px)' : 'none',
                maxHeight: scale === 1 ? 'calc(100% - 32px)' : 'none',
                margin: scale === 1 ? '16px' : 0,
                transform: `translate(${position.x}px, ${position.y}px)`,
                transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
                animation: 'imageScaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              <img
                src={
                  Array.isArray(generation.outputData.content)
                    ? generation.outputData.content[0]
                    : generation.outputData.content
                }
                alt="Generated"
                style={{
                  width: scale === 1 ? '100%' : `${scale * 100}%`,
                  height: 'auto',
                  display: 'block',
                  userSelect: 'none',
                  borderRadius: theme.borderRadius.md,
                }}
                draggable={false}
              />
            </div>
          )}

          {/* Video Output */}
          {generation.outputData.type === 'video' && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`,
                padding: '1px',
                borderRadius: theme.borderRadius.md,
                maxWidth: 'calc(100% - 32px)',
                maxHeight: 'calc(100% - 32px)',
                margin: '16px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
                animation: 'imageScaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              <video
                src={
                  Array.isArray(generation.outputData.content)
                    ? generation.outputData.content[0]
                    : generation.outputData.content
                }
                controls
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  userSelect: 'none',
                  borderRadius: theme.borderRadius.md,
                  backgroundColor: theme.colors.background,
                }}
              />
            </div>
          )}

          {/* Audio Output */}
          {generation.outputData.type === 'audio' && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`,
                padding: '1px',
                borderRadius: theme.borderRadius.lg,
                maxWidth: 'calc(100% - 32px)',
                width: '400px',
                margin: '16px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
                animation: 'imageScaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              <div
                style={{
                  padding: theme.spacing.xl,
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.borderRadius.lg,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: theme.spacing.md,
                }}
              >
                <div
                  style={{
                    fontSize: '64px',
                  }}
                >
                  🎵
                </div>
                <audio
                  src={
                    Array.isArray(generation.outputData.content)
                      ? generation.outputData.content[0]
                      : generation.outputData.content
                  }
                  controls
                  style={{
                    width: '100%',
                  }}
                />
              </div>
            </div>
          )}

          {/* Text Output */}
          {generation.outputData.type === 'text' && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`,
                padding: '1px',
                borderRadius: theme.borderRadius.lg,
                maxWidth: 'calc(100% - 32px)',
                maxHeight: 'calc(100% - 32px)',
                margin: '16px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
                animation: 'imageScaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              <div
                style={{
                  padding: theme.spacing.lg,
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.borderRadius.lg,
                  overflowY: 'auto',
                  maxHeight: 'calc(100vh - 300px)',
                }}
              >
                <p
                  style={{
                    fontSize: theme.typography.sizes.base,
                    color: theme.colors.text,
                    lineHeight: theme.typography.lineHeights.relaxed,
                    whiteSpace: 'pre-wrap',
                    margin: 0,
                  }}
                >
                  {generation.outputData.content}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Drawer - Swipeable Details */}
        <div
          ref={drawerRef}
          onTouchStart={handleDrawerTouchStart}
          onTouchMove={handleDrawerTouchMove}
          onTouchEnd={handleDrawerTouchEnd}
          onClick={toggleDrawer}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: theme.colors.backgroundElevated,
            backdropFilter: 'blur(20px)',
            borderTopLeftRadius: theme.borderRadius.lg,
            borderTopRightRadius: theme.borderRadius.lg,
            borderTop: `1px solid ${theme.colors.border}`,
            zIndex: 20,
            height: `${drawerHeight}px`,
            transition: isDrawerDragging ? 'none' : `height ${theme.transitions.normal}`,
            overflowY: drawerOpen ? 'auto' : 'hidden',
            cursor: 'pointer',
            touchAction: 'none',
          }}
        >
          {/* Handle Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: `${theme.spacing.sm} 0`,
            }}
          >
            <div
              style={{
                width: '40px',
                height: '4px',
                borderRadius: theme.borderRadius.full,
                background: `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`,
                opacity: 0.5,
              }}
            />
          </div>

          {/* Collapsed View - Prompt Preview & Star Button */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.sm,
              padding: `0 ${theme.spacing.md} ${theme.spacing.md}`,
            }}
          >
            {generation.inputData.prompt && (
              <p
                style={{
                  flex: 1,
                  fontSize: theme.typography.sizes.xs,
                  color: theme.colors.textSecondary,
                  lineHeight: theme.typography.lineHeights.normal,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  minWidth: 0,
                }}
              >
                "{generation.inputData.prompt}"
              </p>
            )}

            {/* Star Button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleFavorite(generation.id)
              }}
              style={{
                width: '44px',
                height: '44px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                padding: 0,
                transition: `transform ${theme.transitions.fast}`,
              }}
              onTouchStart={(e) => {
                e.currentTarget.style.transform = 'scale(0.9)'
              }}
              onTouchEnd={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
              }}
              aria-label={isGenerationFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <span
                key={`star-mobile-${generation.id}-${isGenerationFavorite ? theme.colors.gradientStart : 'unfavorited'}`}
                style={{
                  fontSize: theme.typography.sizes.xxl,
                  lineHeight: 1,
                  background: isGenerationFavorite
                    ? `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`
                    : theme.colors.textTertiary,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  display: 'inline-block',
                }}
              >
                ★
              </span>
            </button>
          </div>

          {/* Expanded View - Full Details */}
          {drawerOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                padding: theme.spacing.md,
                paddingTop: 0,
              }}
            >
              {/* Full Prompt */}
              {generation.inputData.prompt && (
                <div style={{ marginBottom: theme.spacing.md }}>
                  <p
                    style={{
                      fontSize: theme.typography.sizes.xs,
                      fontWeight: theme.typography.weights.semibold,
                      color: theme.colors.textTertiary,
                      marginBottom: theme.spacing.xs,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Prompt
                  </p>
                  <p
                    style={{
                      fontSize: theme.typography.sizes.sm,
                      color: theme.colors.text,
                      lineHeight: theme.typography.lineHeights.normal,
                    }}
                  >
                    {generation.inputData.prompt}
                  </p>
                </div>
              )}

              {/* Model Name */}
              <div style={{ marginBottom: theme.spacing.md }}>
                <p
                  style={{
                    fontSize: theme.typography.sizes.xs,
                    fontWeight: theme.typography.weights.semibold,
                    color: theme.colors.textTertiary,
                    marginBottom: theme.spacing.xs,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Model
                </p>
                <button
                  onClick={() => {
                    if (model?.slug) {
                      navigate(`/runners/${model.slug}`)
                    }
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: model?.slug ? 'pointer' : 'default',
                    textAlign: 'left',
                  }}
                >
                  <p
                    style={{
                      fontSize: theme.typography.sizes.sm,
                      color: theme.colors.gradientStart,
                      textDecoration: model?.slug ? 'underline' : 'none',
                      textDecorationColor: `${theme.colors.gradientStart}80`,
                    }}
                  >
                    {generation.modelName}
                  </p>
                </button>
              </div>

              {/* Timestamp */}
              <div style={{ marginBottom: theme.spacing.md }}>
                <p
                  style={{
                    fontSize: theme.typography.sizes.xs,
                    fontWeight: theme.typography.weights.semibold,
                    color: theme.colors.textTertiary,
                    marginBottom: theme.spacing.xs,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Created
                </p>
                <p
                  style={{
                    fontSize: theme.typography.sizes.sm,
                    color: theme.colors.text,
                  }}
                >
                  {new Date(generation.timestamp).toLocaleString()}
                </p>
              </div>

              {/* Duration */}
              <div style={{ marginBottom: theme.spacing.lg }}>
                <p
                  style={{
                    fontSize: theme.typography.sizes.xs,
                    fontWeight: theme.typography.weights.semibold,
                    color: theme.colors.textTertiary,
                    marginBottom: theme.spacing.xs,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Duration
                </p>
                <p
                  style={{
                    fontSize: theme.typography.sizes.sm,
                    color: theme.colors.text,
                  }}
                >
                  {(generation.metadata.duration / 1000).toFixed(2)}s
                </p>
              </div>

              {/* Action Buttons - Split Button Pattern */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'stretch',
                  height: '48px',
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.borderRadius.md,
                  overflow: 'hidden',
                  background: `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`,
                }}
              >
                {/* Download Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    const content = Array.isArray(generation.outputData.content)
                      ? generation.outputData.content[0]
                      : generation.outputData.content
                    const link = document.createElement('a')
                    link.href = content
                    link.download = `generation-${generation.id}.${generation.outputData.type === 'image' ? 'png' : generation.outputData.type === 'video' ? 'mp4' : 'txt'}`
                    link.click()
                  }}
                  style={{
                    padding: `0 ${theme.spacing.md}`,
                    fontSize: theme.typography.sizes.base,
                    fontWeight: theme.typography.weights.semibold,
                    color: theme.colors.textInverse,
                    background: 'transparent',
                    border: 'none',
                    borderRight: `1px solid rgba(255, 255, 255, 0.2)`,
                    cursor: 'pointer',
                    transition: `all ${theme.transitions.fast}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-label="Download"
                >
                  Download
                </button>

                {/* Reprompt Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemix()
                  }}
                  style={{
                    flex: 1,
                    padding: `0 ${theme.spacing.sm}`,
                    fontSize: theme.typography.sizes.base,
                    fontWeight: theme.typography.weights.semibold,
                    color: theme.colors.textInverse,
                    background: 'transparent',
                    border: 'none',
                    borderRight: `1px solid rgba(255, 255, 255, 0.2)`,
                    cursor: 'pointer',
                    transition: `all ${theme.transitions.fast}`,
                  }}
                >
                  Reprompt
                </button>

                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete()
                  }}
                  style={{
                    padding: `0 ${theme.spacing.md}`,
                    fontSize: theme.typography.sizes.base,
                    fontWeight: theme.typography.weights.semibold,
                    color: theme.colors.textInverse,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    transition: `all ${theme.transitions.fast}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-label="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Desktop View - Using Modal component
  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={generation.modelName}
      maxWidth="800px"
      footer={
        /* Split Button Group: Download, Reprompt, Delete */
        <div
          style={{
            display: 'flex',
            alignItems: 'stretch',
            height: '48px',
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.borderRadius.md,
            overflow: 'hidden',
            background: `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`,
          }}
        >
          {/* Download Button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              const content = Array.isArray(generation.outputData.content)
                ? generation.outputData.content[0]
                : generation.outputData.content
              const link = document.createElement('a')
              link.href = content
              link.download = `generation-${generation.id}.${generation.outputData.type === 'image' ? 'png' : generation.outputData.type === 'video' ? 'mp4' : 'txt'}`
              link.click()
            }}
            style={{
              padding: `0 ${theme.spacing.md}`,
              fontSize: theme.typography.sizes.base,
              fontWeight: theme.typography.weights.semibold,
              color: theme.colors.textInverse,
              background: 'transparent',
              border: 'none',
              borderRight: `1px solid rgba(255, 255, 255, 0.2)`,
              cursor: 'pointer',
              transition: `all ${theme.transitions.fast}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Download"
          >
            Download
          </button>

          {/* Reprompt Button */}
          <button
            onClick={handleRemix}
            style={{
              flex: 1,
              padding: `0 ${theme.spacing.lg}`,
              fontSize: theme.typography.sizes.base,
              fontWeight: theme.typography.weights.semibold,
              color: theme.colors.textInverse,
              background: 'transparent',
              border: 'none',
              borderRight: `1px solid rgba(255, 255, 255, 0.2)`,
              cursor: 'pointer',
              transition: `all ${theme.transitions.fast}`,
            }}
          >
            Reprompt
          </button>

          {/* Delete Button */}
          <button
            onClick={handleDelete}
            style={{
              padding: `0 ${theme.spacing.md}`,
              fontSize: theme.typography.sizes.base,
              fontWeight: theme.typography.weights.semibold,
              color: theme.colors.textInverse,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: `all ${theme.transitions.fast}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Delete"
          >
            Delete
          </button>
        </div>
      }
    >
      {/* Top Row: Timestamp + Favorite Star */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: theme.spacing.lg,
        }}
      >
        <p
          style={{
            fontSize: theme.typography.sizes.sm,
            color: theme.colors.textSecondary,
          }}
        >
          {new Date(generation.timestamp).toLocaleString()}
        </p>

        {/* Favorite Star Button */}
        <button
          onClick={() => toggleFavorite(generation.id)}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            fontSize: theme.typography.sizes.xxl,
            lineHeight: 1,
            transition: `transform ${theme.transitions.fast}`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
          }}
          aria-label={isGenerationFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <span
            key={`star-desktop-${generation.id}-${isGenerationFavorite ? theme.colors.gradientStart : 'unfavorited'}`}
            style={{
              background: isGenerationFavorite
                ? `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`
                : theme.colors.textTertiary,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              display: 'inline-block',
            }}
          >
            ★
          </span>
        </button>
      </div>

      {/* Output */}
      <div style={{ marginBottom: theme.spacing.lg }}>
        <DynamicOutputRenderer
          type={generation.outputData.type}
          content={generation.outputData.content}
          remixable={false}
          onRemix={() => {}}
        />
      </div>

      {/* Metadata */}
      <div
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.md,
          padding: theme.spacing.lg,
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
          Generation Details
        </h3>

        {/* Prompt */}
        {generation.inputData.prompt && (
          <div style={{ marginBottom: theme.spacing.md }}>
            <p
              style={{
                fontSize: theme.typography.sizes.xs,
                fontWeight: theme.typography.weights.semibold,
                color: theme.colors.textSecondary,
                marginBottom: theme.spacing.xs,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Prompt
            </p>
            <p
              style={{
                fontSize: theme.typography.sizes.sm,
                color: theme.colors.text,
                lineHeight: theme.typography.lineHeights.normal,
                whiteSpace: 'pre-wrap',
              }}
            >
              {generation.inputData.prompt}
            </p>
          </div>
        )}

        {/* Settings */}
        {generation.inputData.settings &&
          Object.keys(generation.inputData.settings).length > 0 && (
            <div style={{ marginBottom: theme.spacing.md }}>
              <p
                style={{
                  fontSize: theme.typography.sizes.xs,
                  fontWeight: theme.typography.weights.semibold,
                  color: theme.colors.textSecondary,
                  marginBottom: theme.spacing.xs,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Settings
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                  gap: theme.spacing.sm,
                }}
              >
                {Object.entries(generation.inputData.settings).map(([key, value]) => (
                  <div key={key}>
                    <p
                      style={{
                        fontSize: theme.typography.sizes.xs,
                        color: theme.colors.textTertiary,
                      }}
                    >
                      {key}
                    </p>
                    <p
                      style={{
                        fontSize: theme.typography.sizes.sm,
                        color: theme.colors.text,
                        fontWeight: theme.typography.weights.medium,
                      }}
                    >
                      {String(value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Duration */}
        <div>
          <p
            style={{
              fontSize: theme.typography.sizes.xs,
              fontWeight: theme.typography.weights.semibold,
              color: theme.colors.textSecondary,
              marginBottom: theme.spacing.xs,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Duration
          </p>
          <p
            style={{
              fontSize: theme.typography.sizes.sm,
              color: theme.colors.text,
            }}
          >
            {(generation.metadata.duration / 1000).toFixed(2)}s
          </p>
        </div>
      </div>
    </Modal>
  )
}
