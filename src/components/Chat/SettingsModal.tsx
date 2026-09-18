import { useState, useEffect, useMemo } from 'react'
import { useTheme } from '../../theme/ThemeContext'
import { useChat, type TextSize } from '../../contexts/ChatContext'
import { MODELS } from '../../types/models'
import type { Conversation } from '../../contexts/ChatContext'
import { Dropdown } from '../Dropdown'
import { AnimatedToggle } from '../AnimatedToggle'
import { useFavorites } from '../../contexts/FavoritesContext'
import { Modal } from '../Modal'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  conversation: Conversation | null
  onUpdateModel: (modelId: string, modelName: string) => void
  onUpdateSystemPrompt: (systemPrompt: string) => void
  onUpdateSettings: (settings: { optimizeImageHistory?: boolean }) => void
}

export function SettingsModal({
  isOpen,
  onClose,
  conversation,
  onUpdateModel,
  onUpdateSystemPrompt,
  onUpdateSettings,
}: SettingsModalProps) {
  const { theme } = useTheme()
  const { textSize, setTextSize } = useChat()
  const { favorites } = useFavorites()
  const [selectedModelId, setSelectedModelId] = useState(conversation?.modelId || '')
  const [systemPrompt, setSystemPrompt] = useState(conversation?.systemPrompt || '')
  const [optimizeImageHistory, setOptimizeImageHistory] = useState(conversation?.optimizeImageHistory ?? false)

  // Sort text models: favorites first, then alphabetically
  const textModels = useMemo(() => {
    const filtered = MODELS.filter((m) => m.category === 'text' && m.available !== false)
    return filtered.sort((a, b) => {
      const aIsFavorite = favorites.includes(a.id)
      const bIsFavorite = favorites.includes(b.id)

      // Favorites first
      if (aIsFavorite && !bIsFavorite) return -1
      if (!aIsFavorite && bIsFavorite) return 1

      // Then alphabetically by name
      return a.name.localeCompare(b.name)
    })
  }, [favorites])

  // Sync settings when conversation changes
  useEffect(() => {
    if (conversation) {
      setSelectedModelId(conversation.modelId)
      setSystemPrompt(conversation.systemPrompt)
      setOptimizeImageHistory(conversation.optimizeImageHistory ?? false)
    }
  }, [conversation?.id])

  const handleApply = () => {
    if (!conversation) return

    // Update model if changed
    if (selectedModelId !== conversation.modelId) {
      const newModel = textModels.find((m) => m.id === selectedModelId)
      if (newModel) {
        onUpdateModel(newModel.id, newModel.name)
      }
    }

    // Update system prompt if changed
    if (systemPrompt !== conversation.systemPrompt) {
      onUpdateSystemPrompt(systemPrompt)
    }

    // Update optimization settings if changed
    if (optimizeImageHistory !== (conversation.optimizeImageHistory ?? false)) {
      onUpdateSettings({ optimizeImageHistory })
    }

    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chat Settings"
      footer={
        conversation ? (
          <button
            onClick={handleApply}
            style={{
              width: '100%',
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              fontSize: theme.typography.sizes.sm,
              fontWeight: theme.typography.weights.semibold,
              color: theme.colors.textInverse,
              background: `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`,
              border: 'none',
              borderRadius: theme.borderRadius.md,
              cursor: 'pointer',
              transition: `transform ${theme.transitions.fast}`,
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.98)'
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            Apply Changes
          </button>
        ) : undefined
      }
    >
      {!conversation ? (
            <div
              style={{
                textAlign: 'center',
                padding: theme.spacing.xl,
                color: theme.colors.textSecondary,
              }}
            >
              <p style={{ fontSize: theme.typography.sizes.sm }}>No active conversation</p>
            </div>
          ) : (
            <>
              {/* Text Size Selector */}
              <div style={{ marginBottom: theme.spacing.lg }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: theme.typography.sizes.sm,
                    fontWeight: theme.typography.weights.medium,
                    color: theme.colors.textSecondary,
                    marginBottom: theme.spacing.sm,
                  }}
                >
                  Text Size
                </label>
                <AnimatedToggle
                  options={[
                    { value: 'sm', label: 'Sm' },
                    { value: 'md', label: 'Md' },
                    { value: 'lg', label: 'Lg' },
                  ]}
                  selected={textSize}
                  onChange={(value) => setTextSize(value as TextSize)}
                  delayIndicator={150}
                />
              </div>

              {/* Model Selector */}
              <div style={{ marginBottom: theme.spacing.lg }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: theme.typography.sizes.sm,
                    fontWeight: theme.typography.weights.medium,
                    color: theme.colors.textSecondary,
                    marginBottom: theme.spacing.xs,
                  }}
                >
                  Model
                </label>
                <Dropdown
                  options={textModels.map((model) => {
                    const isFavorite = favorites.includes(model.id)
                    return {
                      value: model.id,
                      label: model.name,
                      prefix: isFavorite ? '★' : undefined,
                    }
                  })}
                  value={selectedModelId}
                  onChange={setSelectedModelId}
                  placeholder="Select a model..."
                  zIndex={theme.zIndex.modal + 10}
                />
              </div>

              {/* System Prompt */}
              <div style={{ marginBottom: theme.spacing.lg }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: theme.typography.sizes.sm,
                    fontWeight: theme.typography.weights.medium,
                    color: theme.colors.textSecondary,
                    marginBottom: theme.spacing.xs,
                  }}
                >
                  System Prompt
                </label>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="Optional instructions for the AI..."
                  style={{
                    width: '100%',
                    minHeight: '120px',
                    padding: theme.spacing.sm,
                    fontSize: theme.typography.sizes.sm,
                    color: theme.colors.text,
                    backgroundColor: theme.colors.surface,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.borderRadius.md,
                    outline: 'none',
                    fontFamily: theme.typography.fontFamily,
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Optimizations Section */}
              <div style={{ marginBottom: theme.spacing.md }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: theme.typography.sizes.sm,
                    fontWeight: theme.typography.weights.medium,
                    color: theme.colors.textSecondary,
                    marginBottom: theme.spacing.sm,
                  }}
                >
                  Optimizations
                </label>

                {/* Optimize Image History Toggle */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: theme.spacing.sm,
                    backgroundColor: theme.colors.surface,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.borderRadius.md,
                  }}
                >
                  <div style={{ flex: 1, marginRight: theme.spacing.md }}>
                    <div
                      style={{
                        fontSize: theme.typography.sizes.sm,
                        color: theme.colors.text,
                        marginBottom: '2px',
                      }}
                    >
                      Only send images in latest message
                    </div>
                    <div
                      style={{
                        fontSize: theme.typography.sizes.xs,
                        color: theme.colors.textSecondary,
                        lineHeight: theme.typography.lineHeights.tight,
                      }}
                    >
                      Reduces token usage by stripping images from conversation history
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={optimizeImageHistory}
                    onChange={(e) => setOptimizeImageHistory(e.target.checked)}
                    style={{
                      width: '20px',
                      height: '20px',
                      cursor: 'pointer',
                      accentColor: theme.colors.primary,
                      flexShrink: 0,
                    }}
                  />
                </div>
              </div>
            </>
          )}
    </Modal>
  )
}
