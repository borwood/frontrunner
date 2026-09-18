import { useState } from 'react'
import { useTheme } from '../../theme/ThemeContext'
import { useChat } from '../../contexts/ChatContext'
import { SearchInput } from '../SearchInput'
import type { Conversation } from '../../contexts/ChatContext'

interface ConversationsDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSelectConversation: (conversation: Conversation) => void
  onNewConversation: () => void
}

export function ConversationsDrawer({
  isOpen,
  onClose,
  onSelectConversation,
  onNewConversation,
}: ConversationsDrawerProps) {
  const { theme } = useTheme()
  const { conversations, activeConversationId, deleteConversation, updateConversationTitle, editingTitleId, setEditingTitleId } = useChat()
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Filter conversations based on search query
  const filteredConversations = searchQuery.trim()
    ? conversations.filter((convo) => {
        const query = searchQuery.toLowerCase()
        return (
          convo.title.toLowerCase().includes(query) ||
          convo.modelName.toLowerCase().includes(query)
        )
      })
    : conversations

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: theme.zIndex.modal - 1,
          animation: 'modalFadeIn 0.2s ease-out',
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: '85%',
          maxWidth: '360px',
          backgroundColor: theme.colors.background,
          zIndex: theme.zIndex.modal,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: theme.shadows.xl,
          animation: 'slideInFromLeft 0.25s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: theme.spacing.md,
            paddingTop: `max(${theme.spacing.md}, env(safe-area-inset-top))`,
            backgroundColor: theme.colors.surface,
            borderBottom: `1px solid ${theme.colors.border}`,
            flexShrink: 0,
          }}
        >
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
                fontSize: theme.typography.sizes.xl,
                fontWeight: theme.typography.weights.bold,
                color: theme.colors.text,
              }}
            >
              Conversations
            </h2>
            <button
              onClick={onClose}
              style={{
                padding: theme.spacing.xs,
                fontSize: theme.typography.sizes.lg,
                color: theme.colors.textSecondary,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>

          <button
            onClick={() => {
              onNewConversation()
              onClose()
            }}
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
            New Chat
          </button>

          {/* Search Bar */}
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search conversations..."
            style={{ marginTop: theme.spacing.md }}
          />
        </div>

        {/* Conversations List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: theme.spacing.md,
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {conversations.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: theme.spacing.xl,
                color: theme.colors.textSecondary,
              }}
            >
              <p style={{ fontSize: theme.typography.sizes.sm, marginBottom: theme.spacing.xs }}>
                No conversations yet
              </p>
              <p style={{ fontSize: theme.typography.sizes.sm }}>
                Tap "New Chat" to start
              </p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: theme.spacing.xl,
                color: theme.colors.textSecondary,
              }}
            >
              <p style={{ fontSize: theme.typography.sizes.sm }}>
                No conversations match your search
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
              {filteredConversations.map((convo) => (
                <div
                  key={convo.id}
                  onClick={() => {
                    // Only navigate if not already active
                    if (convo.id !== activeConversationId) {
                      onSelectConversation(convo)
                      onClose()
                    }
                  }}
                  style={{
                    padding: theme.spacing.sm,
                    backgroundColor: convo.id === activeConversationId ? theme.colors.surface : theme.colors.background,
                    border: 'none',
                    borderRadius: theme.borderRadius.md,
                    cursor: 'pointer',
                    transition: `all ${theme.transitions.fast}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    position: 'relative',
                  }}
                >
                  {/* Active indicator gradient (like favorite models) */}
                  {convo.id === activeConversationId && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: `linear-gradient(135deg, ${theme.colors.gradientStart}10, ${theme.colors.gradientEnd}10)`,
                        borderRadius: theme.borderRadius.md,
                        pointerEvents: 'none',
                      }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0, zIndex: 1 }}>
                    {editingTitleId === convo.id ? (
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={() => {
                          if (editingTitle.trim()) {
                            updateConversationTitle(convo.id, editingTitle.trim())
                          }
                          setEditingTitleId(null)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (editingTitle.trim()) {
                              updateConversationTitle(convo.id, editingTitle.trim())
                            }
                            setEditingTitleId(null)
                          } else if (e.key === 'Escape') {
                            setEditingTitleId(null)
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                        style={{
                          width: '100%',
                          fontSize: theme.typography.sizes.sm,
                          fontWeight: theme.typography.weights.semibold,
                          color: theme.colors.text,
                          backgroundColor: theme.colors.background,
                          border: `1px solid ${theme.colors.primary}`,
                          borderRadius: theme.borderRadius.sm,
                          padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                          marginBottom: '2px',
                          outline: 'none',
                          fontFamily: theme.typography.fontFamily,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          fontSize: theme.typography.sizes.sm,
                          fontWeight: theme.typography.weights.semibold,
                          color: convo.id === activeConversationId ? theme.colors.gradientStart : theme.colors.text,
                          marginBottom: '2px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {convo.title}
                      </div>
                    )}
                    <div
                      style={{
                        fontSize: theme.typography.sizes.xs,
                        color: theme.colors.textSecondary,
                      }}
                    >
                      {convo.modelName} • {convo.messages.length} msg{convo.messages.length !== 1 ? 's' : ''}
                    </div>
                  </div>

                  {/* 3-dot menu */}
                  <div style={{ position: 'relative', alignSelf: 'center' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenMenuId(openMenuId === convo.id ? null : convo.id)
                      }}
                      style={{
                        padding: theme.spacing.xs,
                        fontSize: theme.typography.sizes.base,
                        color: theme.colors.textSecondary,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        marginLeft: theme.spacing.sm,
                        flexShrink: 0,
                        lineHeight: 1,
                        transition: `color ${theme.transitions.fast}`,
                        position: 'relative',
                        zIndex: 1,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = theme.colors.text
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = theme.colors.textSecondary
                      }}
                    >
                      ⋯
                    </button>

                    {/* Dropdown menu */}
                    {openMenuId === convo.id && (
                      <>
                        {/* Backdrop to close menu */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenMenuId(null)
                          }}
                          style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: theme.zIndex.modal - 1,
                          }}
                        />

                        {/* Menu dropdown */}
                        <div
                          style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            marginTop: theme.spacing.xs,
                            backgroundColor: theme.colors.surface,
                            border: `1px solid ${theme.colors.border}`,
                            borderRadius: theme.borderRadius.md,
                            boxShadow: theme.shadows.lg,
                            minWidth: '140px',
                            zIndex: theme.zIndex.modal + 2,
                            overflow: 'hidden',
                          }}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingTitleId(convo.id)
                              setEditingTitle(convo.title)
                              setOpenMenuId(null)
                            }}
                            style={{
                              width: '100%',
                              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                              fontSize: theme.typography.sizes.sm,
                              color: theme.colors.text,
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: `background-color ${theme.transitions.fast}`,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = theme.colors.hover
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                            }}
                          >
                            Edit Title
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteConversation(convo.id)
                              setOpenMenuId(null)
                            }}
                            style={{
                              width: '100%',
                              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                              fontSize: theme.typography.sizes.sm,
                              color: theme.colors.error,
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: `background-color ${theme.transitions.fast}`,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = theme.colors.hover
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Animation keyframes */}
      <style>{`
        @keyframes slideInFromLeft {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  )
}
