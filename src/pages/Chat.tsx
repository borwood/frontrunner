import { useState, useRef, useEffect, useLayoutEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useTheme } from '../theme/ThemeContext'
import { useUser } from '../contexts/UserContext'
import { useChat } from '../contexts/ChatContext'
import { ChatMessage } from '../components/Chat/ChatMessage'
import { ConversationsDrawer } from '../components/Chat/ConversationsDrawer'
import { SettingsModal } from '../components/Chat/SettingsModal'
import { SearchInput } from '../components/SearchInput'
import { GalleryImagePicker } from '../components/GalleryImagePicker'
import { SignInPromptModal } from '../components/SignInPromptModal'
import { MODELS } from '../types/models'
import type { ChatMessage as ChatMessageType } from '../types/chat'

export function Chat() {
  const location = useLocation()
  const { theme } = useTheme()
  const { client, isSignedIn, signIn } = useUser()
  const {
    conversations,
    activeConversationId,
    createConversation,
    setActiveConversation,
    getActiveConversation,
    addMessage,
    updateMessage,
    deleteConversation,
    updateConversationModel,
    updateSystemPrompt,
    updateConversationTitle,
    updateConversationSettings,
    editingTitleId,
    setEditingTitleId,
  } = useChat()

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState<{ conversationId: string; content: string; modelId: string; modelName: string } | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [sidebarSearchQuery, setSidebarSearchQuery] = useState('')
  const [editingTitle, setEditingTitle] = useState('')
  const [isEditingMobileHeaderTitle, setIsEditingMobileHeaderTitle] = useState(false)
  const [hoveredConversationId, setHoveredConversationId] = useState<string | null>(null)
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const stored = sessionStorage.getItem('chatSidebarWidth')
    return stored ? parseInt(stored, 10) : 280
  })
  const [isResizing, setIsResizing] = useState(false)
  const [attachedImages, setAttachedImages] = useState<string[]>([]) // Array of image URLs/data URLs
  const [showImagePicker, setShowImagePicker] = useState(false)
  const [isKeyboardActive, setIsKeyboardActive] = useState(false) // Track mobile keyboard state
  const [showSignInPrompt, setShowSignInPrompt] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const mobileScrollContainerRef = useRef<HTMLDivElement>(null)
  const desktopScrollContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const activeConversation = getActiveConversation()
  const textModels = MODELS.filter((m) => m.category === 'text' && m.available !== false)

  // Memoize rendered messages to prevent re-rendering when input changes
  // Include streaming message if active for this conversation
  const renderedMessages = useMemo(
    () => {
      const messages = activeConversation?.messages || []
      const messageElements = messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))

      // Append streaming message if it's for the active conversation
      if (streamingMessage && streamingMessage.conversationId === activeConversation?.id) {
        const tempMessage: ChatMessageType = {
          id: 'streaming-temp',
          role: 'assistant',
          content: streamingMessage.content,
          timestamp: Date.now(),
          modelId: streamingMessage.modelId,
          modelName: streamingMessage.modelName,
        }
        messageElements.push(<ChatMessage key="streaming-temp" message={tempMessage} />)
      } else if (isStreaming && activeConversation?.id) {
        // Show empty message (loader) while waiting for first chunk
        const loadingMessage: ChatMessageType = {
          id: 'streaming-loading',
          role: 'assistant',
          content: '',
          timestamp: Date.now(),
          modelId: activeConversation.modelId,
          modelName: activeConversation.modelName,
        }
        messageElements.push(<ChatMessage key="streaming-loading" message={loadingMessage} />)
      }

      return messageElements
    },
    [activeConversation?.messages, activeConversation?.id, activeConversation?.modelId, activeConversation?.modelName, streamingMessage, isStreaming]
  )

  // Check if current model supports vision (image attachments)
  // If no active conversation, check default model
  const currentModel = activeConversation
    ? MODELS.find((m) => m.id === activeConversation.modelId)
    : textModels[0] // Use default model when no conversation
  const modelSupportsVision = currentModel?.tags.includes('vision') ?? false

  // Auto-scroll to bottom when messages change (after render completes)
  // Also scroll during streaming to follow the message as it grows
  useLayoutEffect(() => {
    if (!activeConversation?.messages.length && !streamingMessage && !isStreaming) return

    // Scroll both mobile and desktop containers to bottom
    // Only one will be visible at a time based on screen size
    if (mobileScrollContainerRef.current) {
      const container = mobileScrollContainerRef.current
      // Disable smooth scrolling temporarily for instant jump
      const originalBehavior = container.style.scrollBehavior
      container.style.scrollBehavior = 'auto'
      container.scrollTop = container.scrollHeight
      container.style.scrollBehavior = originalBehavior
    }
    if (desktopScrollContainerRef.current) {
      const container = desktopScrollContainerRef.current
      // Disable smooth scrolling temporarily for instant jump
      const originalBehavior = container.style.scrollBehavior
      container.style.scrollBehavior = 'auto'
      container.scrollTop = container.scrollHeight
      container.style.scrollBehavior = originalBehavior
    }
  }, [activeConversation?.messages, activeConversationId, streamingMessage, isStreaming])

  // Textarea auto-sizing removed - now uses flex to fill space in both states
  // When inactive/empty: fixed 28px height for compact inline layout
  // When active/has text: flex:1 fills available space, scrolls when content exceeds

  // Add body class when keyboard is active to control bottom nav visibility
  useEffect(() => {
    if (isKeyboardActive) {
      document.body.classList.add('chat-keyboard-active')
    } else {
      document.body.classList.remove('chat-keyboard-active')
    }
    return () => {
      document.body.classList.remove('chat-keyboard-active')
    }
  }, [isKeyboardActive])

  // Handle navigation state (autoSend, openDrawer, conversationId)
  useEffect(() => {
    const state = location.state as { autoSend?: string; openDrawer?: boolean; conversationId?: string } | null

    // Set active conversation if passed from navigation (e.g., clicking recent chat on home)
    if (state?.conversationId) {
      setActiveConversation(state.conversationId)
    }

    if (state?.autoSend && client && !loading) {
      setInput(state.autoSend)
      setTimeout(() => {
        handleSend()
      }, 100)
    }
    // Open drawer/sidebar if requested (e.g., from "View All" on home page)
    if (state?.openDrawer) {
      setIsDrawerOpen(true) // Mobile
      setIsDesktopSidebarOpen(true) // Desktop
    }
  }, [location.state, client, setActiveConversation])

  // Check for pending chat message after authentication
  useEffect(() => {
    if (isSignedIn && client) {
      const pendingMessage = sessionStorage.getItem('pendingChatMessage')
      const pendingImagesStr = sessionStorage.getItem('pendingChatImages')

      if (pendingMessage) {
        // Restore the message to input
        setInput(pendingMessage)

        // Restore attached images if any
        if (pendingImagesStr) {
          try {
            const images = JSON.parse(pendingImagesStr)
            setAttachedImages(images)
            sessionStorage.removeItem('pendingChatImages')
          } catch (e) {
            console.error('Failed to restore pending images:', e)
          }
        }

        // Clear the pending message
        sessionStorage.removeItem('pendingChatMessage')

        // Focus the textarea
        setTimeout(() => {
          textareaRef.current?.focus()
        }, 100)
      }
    }
  }, [isSignedIn, client])

  const handleNewConversation = () => {
    const defaultModel = textModels[0]
    if (defaultModel) {
      createConversation(defaultModel.id, defaultModel.name)
      setIsSettingsOpen(true)
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      const newWidth = Math.min(Math.max(200, e.clientX), 600)
      setSidebarWidth(newWidth)
      sessionStorage.setItem('chatSidebarWidth', newWidth.toString())
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing])

  const handleSend = async () => {
    if ((!input.trim() && attachedImages.length === 0)) return

    // Check authentication before sending
    if (!isSignedIn) {
      // Store the pending message in sessionStorage
      sessionStorage.setItem('pendingChatMessage', input)
      // Store attached images if any
      if (attachedImages.length > 0) {
        sessionStorage.setItem('pendingChatImages', JSON.stringify(attachedImages))
      }
      setShowSignInPrompt(true)
      return
    }

    if (!client) return

    let conversation = activeConversation

    if (!conversation) {
      const defaultModel = textModels[0]
      if (!defaultModel) return
      createConversation(defaultModel.id, defaultModel.name)
      await new Promise(resolve => setTimeout(resolve, 0))
      conversation = getActiveConversation()
      if (!conversation) return
    }

    const userMessage = input.trim()
    const imagesSnapshot = [...attachedImages]
    setInput('')
    setAttachedImages([])
    setLoading(true)

    // Build structured content if images are attached
    const userContent = imagesSnapshot.length > 0
      ? [
          ...(userMessage ? [{ type: 'text' as const, text: userMessage }] : []),
          ...imagesSnapshot.map(url => ({
            type: 'image_url' as const,
            image_url: { url }
          }))
        ]
      : userMessage

    try {
      // Build API payload - convert structured content back to API format
      // Filter out image attachments if model doesn't support vision OR if optimization is enabled
      const filterImagesFromContent = (content: typeof userContent, reason: 'incompatible' | 'optimization') => {
        if (Array.isArray(content)) {
          const textBlocks = content.filter(block => block.type === 'text')
          const hasImages = content.some(block => block.type === 'image_url')

          // If there were images, append a notice to the last text block (or create one)
          if (hasImages) {
            const noticeText = reason === 'incompatible'
              ? '[Image attachment removed due to incompatible model]'
              : '[Image attachment redacted for token optimization]'

            if (textBlocks.length > 0) {
              const lastTextBlock = textBlocks[textBlocks.length - 1]
              return [
                ...textBlocks.slice(0, -1),
                {
                  type: 'text' as const,
                  text: lastTextBlock.text + '\n\n' + noticeText
                }
              ]
            } else {
              // No text blocks, just the notice
              return [{ type: 'text' as const, text: noticeText }]
            }
          }
          return textBlocks
        }
        return content
      }

      const optimizeImages = conversation.optimizeImageHistory ?? false

      const apiMessages = [
        ...(conversation.systemPrompt
          ? [{ role: 'system' as const, content: conversation.systemPrompt }]
          : []),
        ...conversation.messages.map((m) => ({
          role: m.role as 'system' | 'user' | 'assistant',
          content: !modelSupportsVision
            ? filterImagesFromContent(m.content, 'incompatible')
            : optimizeImages
              ? filterImagesFromContent(m.content, 'optimization')
              : m.content,
        })),
        {
          role: 'user' as const,
          content: !modelSupportsVision
            ? filterImagesFromContent(userContent, 'incompatible')
            : userContent // Always include images in latest message when optimization is on
        },
      ]

      // Add user message to conversation AFTER building API payload
      addMessage(conversation.id, {
        role: 'user',
        content: userContent,
      })

      // Check if model supports streaming
      const model = MODELS.find(m => m.id === conversation.modelId)
      const shouldStream = model?.tags.includes('streaming') ?? false

      if (shouldStream) {
        // Streaming mode - keep message in component state only, persist once at end
        setIsStreaming(true)
        let latestContent = ''

        try {
          const response = client.run(conversation.modelId, {
            input: { messages: apiMessages },
            stream: true,
          })

          for await (const chunk of response as AsyncIterable<any>) {
            // Each chunk contains the full content so far, not incremental
            if (typeof chunk === 'string') {
              latestContent = chunk
            } else if (chunk && typeof chunk === 'object' && 'content' in chunk) {
              latestContent = chunk.content
            }

            // Update streaming state (NOT storage) - this triggers render only
            if (latestContent.trim()) {
              setStreamingMessage({
                conversationId: conversation.id,
                content: latestContent,
                modelId: conversation.modelId,
                modelName: conversation.modelName,
              })
            }
          }

          // Stream completed successfully - persist to storage once
          if (latestContent.trim()) {
            addMessage(conversation.id, {
              role: 'assistant',
              content: latestContent,
              modelId: conversation.modelId,
              modelName: conversation.modelName,
            })
          }
        } catch (streamErr: any) {
          console.error('Streaming error:', streamErr)
          const errorContent = latestContent || `Error: ${streamErr.message || 'Streaming failed'}`

          // Persist error to storage
          addMessage(conversation.id, {
            role: 'assistant',
            content: errorContent,
            modelId: conversation.modelId,
            modelName: conversation.modelName,
          })
        } finally {
          // Clear streaming state
          setStreamingMessage(null)
          setIsStreaming(false)
        }
      } else {
        // Non-streaming mode - show loader with empty message
        const placeholderMessageId = addMessage(conversation.id, {
          role: 'assistant',
          content: '',
          modelId: conversation.modelId,
          modelName: conversation.modelName,
        })

        try {
          const response = await client.run(conversation.modelId, {
            input: { messages: apiMessages },
          })

          const assistantMessage = response.output[0] as string

          // Update placeholder message with actual content
          updateMessage(conversation.id, placeholderMessageId, {
            content: assistantMessage,
          })
        } catch (nonStreamErr: any) {
          // Update placeholder with error message
          updateMessage(conversation.id, placeholderMessageId, {
            content: `Error: ${nonStreamErr.message || 'Failed to get response'}`,
          })
          throw nonStreamErr // Re-throw to be caught by outer catch
        }
      }
    } catch (err: any) {
      console.error('Chat error:', err)
      addMessage(conversation.id, {
        role: 'assistant',
        content: `Error: ${err.message || 'Failed to get response'}`,
        modelId: conversation.modelId,
        modelName: conversation.modelName,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!loading) {
        handleSend()
      }
    }
  }


  const inputAreaHeight = '130px'

  return (
    <>
      {/* Mobile Layout - Grid-based: messages / input */}
      <div
        className={`mobile-chat-layout ${isKeyboardActive ? 'keyboard-active' : ''}`}
        style={{
          display: 'grid',
          gridTemplateRows: (!input.trim() && !isKeyboardActive) ? `1fr auto` : `1fr ${inputAreaHeight}`,
          height: '100%',
          overflow: 'hidden',
          ['--input-area-height' as any]: inputAreaHeight,
        }}
      >
        {/* Messages Area - Scrollable with sticky header */}
        <div
          ref={mobileScrollContainerRef}
          style={{
            position: 'relative',
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: theme.spacing.md,
            paddingTop: 0,
            paddingBottom: 0,
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            minHeight: 0,
            width: '100%',
            maxWidth: '100%',
          }}
        >
          {/* Chat Header - Sticky with opaque background, extends to navbar width */}
          <div
            style={{
              position: 'sticky',
              top: 0,
              zIndex: theme.zIndex.sticky,
              backgroundColor: theme.colors.background,
              borderBottom: `1px solid ${theme.colors.border}`,
              paddingLeft: theme.spacing.md,
              paddingRight: theme.spacing.md,
              paddingTop: theme.spacing.md,
              paddingBottom: theme.spacing.md,
              marginLeft: `calc(-1 * ${theme.spacing.md})`,
              marginRight: `calc(-1 * ${theme.spacing.md})`,
              marginTop: 0,
            }}
          >
            {/* Combined Button + Title Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'stretch',
                height: '36px',
                backgroundColor: theme.colors.surface,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.md,
                overflow: 'hidden',
              }}
            >
              {/* Sidebar Button */}
              <button
                onClick={() => setIsDrawerOpen(true)}
                style={{
                  padding: `0 ${theme.spacing.sm}`,
                  fontSize: theme.typography.sizes.lg,
                  background: 'transparent',
                  border: 'none',
                  borderRight: `1px solid ${theme.colors.border}`,
                  cursor: 'pointer',
                  flexShrink: 0,
                  lineHeight: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '44px',
                }}
              >
                <span
                  key={`sidebar-hamburger-${theme.colors.gradientStart}`}
                  style={{
                    background: `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  ☰
                </span>
              </button>

              {/* Editable Title */}
              {activeConversation ? (
                isEditingMobileHeaderTitle ? (
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onBlur={() => {
                      if (editingTitle.trim()) {
                        updateConversationTitle(activeConversation.id, editingTitle.trim())
                      }
                      setIsEditingMobileHeaderTitle(false)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (editingTitle.trim()) {
                          updateConversationTitle(activeConversation.id, editingTitle.trim())
                        }
                        setIsEditingMobileHeaderTitle(false)
                      } else if (e.key === 'Escape') {
                        setIsEditingMobileHeaderTitle(false)
                      }
                    }}
                    autoFocus
                    style={{
                      flex: 1,
                      padding: `0 ${theme.spacing.sm}`,
                      fontSize: theme.typography.sizes.base,
                      fontWeight: theme.typography.weights.semibold,
                      color: theme.colors.text,
                      backgroundColor: 'transparent',
                      border: 'none',
                      outline: 'none',
                    }}
                  />
                ) : (
                  <div
                    onClick={() => {
                      setEditingTitle(activeConversation.title)
                      setIsEditingMobileHeaderTitle(true)
                    }}
                    style={{
                      flex: 1,
                      padding: `0 ${theme.spacing.sm}`,
                      fontSize: theme.typography.sizes.base,
                      fontWeight: theme.typography.weights.semibold,
                      color: theme.colors.text,
                      cursor: 'pointer',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {activeConversation.title}
                  </div>
                )
              ) : isEditingMobileHeaderTitle ? (
                <input
                  type="text"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onBlur={() => {
                    if (editingTitle.trim()) {
                      // Create new conversation with custom title
                      const defaultModel = textModels[0]
                      if (defaultModel) {
                        createConversation(defaultModel.id, defaultModel.name)
                        // Wait for conversation to be created, then update title
                        setTimeout(() => {
                          const newConvo = getActiveConversation()
                          if (newConvo) {
                            updateConversationTitle(newConvo.id, editingTitle.trim())
                          }
                        }, 0)
                      }
                    }
                    setIsEditingMobileHeaderTitle(false)
                    setEditingTitle('')
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (editingTitle.trim()) {
                        // Create new conversation with custom title
                        const defaultModel = textModels[0]
                        if (defaultModel) {
                          createConversation(defaultModel.id, defaultModel.name)
                          // Wait for conversation to be created, then update title
                          setTimeout(() => {
                            const newConvo = getActiveConversation()
                            if (newConvo) {
                              updateConversationTitle(newConvo.id, editingTitle.trim())
                            }
                          }, 0)
                        }
                      }
                      setIsEditingMobileHeaderTitle(false)
                      setEditingTitle('')
                    } else if (e.key === 'Escape') {
                      setIsEditingMobileHeaderTitle(false)
                      setEditingTitle('')
                    }
                  }}
                  autoFocus
                  placeholder="New conversation"
                  style={{
                    flex: 1,
                    padding: `0 ${theme.spacing.sm}`,
                    fontSize: theme.typography.sizes.base,
                    fontWeight: theme.typography.weights.semibold,
                    color: theme.colors.text,
                    backgroundColor: 'transparent',
                    border: 'none',
                    outline: 'none',
                  }}
                />
              ) : (
                <div
                  onClick={() => {
                    setEditingTitle('')
                    setIsEditingMobileHeaderTitle(true)
                  }}
                  style={{
                    flex: 1,
                    padding: `0 ${theme.spacing.sm}`,
                    fontSize: theme.typography.sizes.base,
                    fontWeight: theme.typography.weights.semibold,
                    color: theme.colors.textSecondary,
                    display: 'flex',
                    alignItems: 'center',
                    fontStyle: 'italic',
                    cursor: 'pointer',
                  }}
                >
                  No conversation selected
                </div>
              )}
            </div>
          </div>

          {/* Messages content */}
          {!activeConversation || activeConversation.messages.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '300px',
                textAlign: 'center',
                padding: theme.spacing.lg,
              }}
            >
              <h2
                style={{
                  fontSize: theme.typography.sizes.lg,
                  fontWeight: theme.typography.weights.semibold,
                  color: theme.colors.text,
                  marginBottom: theme.spacing.xs,
                }}
              >
                Start a conversation
              </h2>
              <p
                style={{
                  fontSize: theme.typography.sizes.sm,
                  color: theme.colors.textSecondary,
                  maxWidth: '300px',
                }}
              >
                Type a message below or tap ☰ to manage conversations
              </p>
            </div>
          ) : (
            <div style={{ paddingTop: theme.spacing.md }}>
              {renderedMessages}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area - Inline at Bottom */}
        <div
          className="chat-input-area"
          style={{
            padding: theme.spacing.md,
            paddingBottom: `max(${theme.spacing.md}, env(safe-area-inset-bottom))`,
            backgroundColor: theme.colors.background,
            borderTop: `1px solid ${theme.colors.border}`,
            display: 'flex',
            flexDirection: 'column',
            height: (!input.trim() && !isKeyboardActive) ? 'auto' : '100%', // Auto height when empty/inactive
          }}
        >
          {/* Attached Images Preview */}

          {/* Message Input Container */}
          <div
            className="message-input-container"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: theme.spacing.sm,
              flex: (input.trim() || isKeyboardActive) ? 1 : 'initial',
              minHeight: 0,
            }}
          >
            {/* Message Input Container - Single bordered box */}
            <div
              style={{
                backgroundColor: theme.colors.surface,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.lg,
                padding: theme.spacing.sm,
                display: 'flex',
                flexDirection: (!input.trim() && !isKeyboardActive) ? 'row' : 'column',
                alignItems: (!input.trim() && !isKeyboardActive) ? 'center' : 'stretch',
                gap: theme.spacing.sm,
                transition: `border-color ${theme.transitions.fast}, box-shadow ${theme.transitions.fast}`,
                maxWidth: '100%',
                width: '100%',
                flex: (input.trim() || isKeyboardActive) ? 1 : 'initial',
                minHeight: 0,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = theme.colors.primary
                e.currentTarget.style.boxShadow = theme.shadows.sm
              }}
              onBlur={(e) => {
                const target = e.currentTarget
                setTimeout(() => {
                  if (target) {
                    target.style.borderColor = theme.colors.border
                    target.style.boxShadow = 'none'
                  }
                }, 50)
              }}
            >
              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message..."
                className="chat-textarea"
                style={{
                  flex: 1,
                  width: '100%',
                  minWidth: 0,
                  minHeight: (!input.trim() && !isKeyboardActive) ? '28px' : 0,
                  height: (!input.trim() && !isKeyboardActive) ? '28px' : 'auto',
                  padding: (!input.trim() && !isKeyboardActive) ? '6px 0' : 0,
                  fontSize: theme.typography.sizes.sm,
                  color: theme.colors.text,
                  backgroundColor: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontFamily: theme.typography.fontFamily,
                  resize: 'none',
                  overflowY: (input.trim() || isKeyboardActive) ? 'auto' : 'hidden',
                  lineHeight: (!input.trim() && !isKeyboardActive) ? '16px' : theme.typography.lineHeights.normal,
                }}
                onFocus={() => setIsKeyboardActive(true)}
                onBlur={() => {
                  setTimeout(() => {
                    setIsKeyboardActive(false)
                  }, 50)
                }}
              />

              {/* Buttons Row */}
              <div
                style={{
                  display: 'flex',
                  gap: (!input.trim() && !isKeyboardActive) ? theme.spacing.xs : theme.spacing.sm,
                  alignItems: 'center',
                  flexShrink: 0,
                }}
              >
                {/* Image Attach Button */}
                <button
                onClick={() => setShowImagePicker(true)}
                disabled={loading || !modelSupportsVision}
                title={modelSupportsVision ? "Attach images from gallery" : "Current model doesn't support images"}
                  style={{
                    flexShrink: 0,
                    width: (!input.trim() && !isKeyboardActive) ? '28px' : '32px',
                    height: (!input.trim() && !isKeyboardActive) ? '28px' : '32px',
                    background: attachedImages.length > 0
                      ? `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`
                      : 'transparent',
                    border: `1px solid ${attachedImages.length > 0 ? 'transparent' : theme.colors.border}`,
                    borderRadius: theme.borderRadius.md,
                    cursor: (loading || !modelSupportsVision) ? 'not-allowed' : 'pointer',
                    opacity: modelSupportsVision ? 1 : 0.5,
                    transition: `all ${theme.transitions.fast}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onMouseEnter={(e) => {
                    if (!loading && attachedImages.length === 0 && modelSupportsVision) {
                      e.currentTarget.style.borderColor = theme.colors.primary
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading && attachedImages.length === 0 && modelSupportsVision) {
                      e.currentTarget.style.borderColor = theme.colors.border
                    }
                  }}
                >
                {attachedImages.length > 0 ? (
                  <span
                    style={{
                      fontSize: theme.typography.sizes.sm,
                      fontWeight: theme.typography.weights.bold,
                      color: theme.colors.textInverse,
                    }}
                  >
                    {attachedImages.length}
                  </span>
                ) : (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={(loading || !modelSupportsVision) ? theme.colors.disabled : `url(#gradient-image-textarea-${theme.colors.gradientStart.replace('#', '')})`}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ flexShrink: 0 }}
                  >
                    <defs>
                      <linearGradient id={`gradient-image-textarea-${theme.colors.gradientStart.replace('#', '')}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={theme.colors.gradientStart} />
                        <stop offset="100%" stopColor={theme.colors.gradientEnd} />
                      </linearGradient>
                    </defs>
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                )}
                </button>

                {/* Settings Button */}
                <button
                    onClick={() => {
                      if (!activeConversation) {
                        handleNewConversation()
                      } else {
                        setIsSettingsOpen(true)
                      }
                    }}
                    title="Chat settings"
                    style={{
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing.xs,
                      padding: (!input.trim() && !isKeyboardActive) ? `${theme.spacing.xs} ${theme.spacing.xs}` : `${theme.spacing.xs} ${theme.spacing.sm}`,
                      height: (!input.trim() && !isKeyboardActive) ? '28px' : '32px',
                      fontSize: theme.typography.sizes.xs,
                      fontWeight: theme.typography.weights.medium,
                      backgroundColor: 'transparent',
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.borderRadius.md,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      transition: `all ${theme.transitions.fast}`,
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) {
                        e.currentTarget.style.borderColor = theme.colors.primary
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!loading) {
                        e.currentTarget.style.borderColor = theme.colors.border
                      }
                    }}
                  >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={loading ? theme.colors.disabled : `url(#gradient-settings-textarea-${theme.colors.gradientStart.replace('#', '')})`}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ flexShrink: 0 }}
                >
                  <defs>
                    <linearGradient id={`gradient-settings-textarea-${theme.colors.gradientStart.replace('#', '')}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={theme.colors.gradientStart} />
                      <stop offset="100%" stopColor={theme.colors.gradientEnd} />
                    </linearGradient>
                  </defs>
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2a10 10 0 0 1 10 10 10 10 0 0 1-10 10A10 10 0 0 1 2 12 10 10 0 0 1 12 2z" opacity="0" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                  <span style={{ whiteSpace: 'nowrap', color: loading ? theme.colors.disabled : theme.colors.textSecondary }}>
                    {activeConversation?.modelName || textModels[0]?.name || 'Settings'}
                  </span>
                </button>

                {(input.trim() || isKeyboardActive) && <div style={{ flex: 1 }} />}

                {/* Send Button */}
                <button
                    onClick={handleSend}
                    disabled={(!input.trim() && attachedImages.length === 0) || loading}
                    title="Send message"
                    style={{
                      flexShrink: 0,
                      width: (!input.trim() && !isKeyboardActive) ? '28px' : '32px',
                      height: (!input.trim() && !isKeyboardActive) ? '28px' : '32px',
                      borderRadius: theme.borderRadius.md,
                      border: 'none',
                      background: (!input.trim() && attachedImages.length === 0) || loading
                        ? 'transparent'
                        : `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`,
                      opacity: (!input.trim() && attachedImages.length === 0) || loading ? 0.4 : 1,
                      cursor: (!input.trim() && attachedImages.length === 0) || loading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: `all ${theme.transitions.fast}`,
                    }}
                  >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={(!input.trim() && attachedImages.length === 0) || loading ? theme.colors.textTertiary : theme.colors.textInverse}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                    <path d="M22 2L11 13" />
                    <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div
        className="desktop-chat-layout"
        style={{
          display: 'none',
          flexDirection: 'row',
          height: '100%',
          overflow: 'hidden',
          backgroundColor: theme.colors.background,
        }}
      >
        {/* Sidebar - Conversations List */}
        <div
          style={{
            width: isDesktopSidebarOpen ? `${sidebarWidth}px` : '0px',
            height: '100%',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: theme.colors.surface,
            borderRight: `1px solid ${theme.colors.border}`,
            position: 'relative',
            overflow: 'hidden',
            transition: isResizing ? 'none' : `width ${theme.transitions.normal}`,
          }}
        >
          {isDesktopSidebarOpen && (
          <>
          {/* Sidebar Header */}
          <div
            style={{
              padding: theme.spacing.sm,
              borderBottom: `1px solid ${theme.colors.border}`,
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: theme.spacing.sm,
            }}
          >
            {/* Buttons Row */}
            <div
              style={{
                display: 'flex',
                gap: theme.spacing.sm,
              }}
            >
              <button
                onClick={() => {
                  if (!isSignedIn) {
                    setShowSignInPrompt(true)
                  } else {
                    handleNewConversation()
                  }
                }}
                style={{
                  flex: 1,
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  fontSize: theme.typography.sizes.sm,
                  fontWeight: theme.typography.weights.semibold,
                  color: theme.colors.textInverse,
                  background: !isSignedIn
                    ? theme.colors.disabled
                    : `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`,
                  border: 'none',
                  borderRadius: theme.borderRadius.md,
                  cursor: !isSignedIn ? 'not-allowed' : 'pointer',
                  opacity: !isSignedIn ? 0.6 : 1,
                  transition: `transform ${theme.transitions.fast}`,
                }}
                onMouseEnter={(e) => {
                  if (isSignedIn) {
                    e.currentTarget.style.transform = 'scale(1.02)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (isSignedIn) {
                    e.currentTarget.style.transform = 'scale(1)'
                  }
                }}
              >
                New Chat
              </button>
              <button
                onClick={() => setIsDesktopSidebarOpen(false)}
                title="Close sidebar"
                style={{
                  padding: theme.spacing.xs,
                  background: 'none',
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.borderRadius.md,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: `all ${theme.transitions.fast}`,
                  width: '36px',
                  height: '36px',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.primary
                  e.currentTarget.style.backgroundColor = theme.colors.hover
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.border
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={theme.colors.text}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Search Bar */}
            <SearchInput
              value={sidebarSearchQuery}
              onChange={setSidebarSearchQuery}
              placeholder="Search conversations..."
            />
          </div>

          {/* Conversations List */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: theme.spacing.sm,
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
                <p style={{ fontSize: theme.typography.sizes.sm }}>
                  No conversations yet
                </p>
              </div>
            ) : (() => {
              const filteredConversations = sidebarSearchQuery.trim()
                ? conversations.filter((convo) => {
                    const query = sidebarSearchQuery.toLowerCase()
                    return (
                      convo.title.toLowerCase().includes(query) ||
                      convo.modelName.toLowerCase().includes(query)
                    )
                  })
                : conversations

              return filteredConversations.length === 0 ? (
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
                  {filteredConversations.map((convo) => {
                  const isActive = convo.id === activeConversationId
                  const isHovered = convo.id === hoveredConversationId

                  return (
                  <div
                    key={convo.id}
                    onClick={() => setActiveConversation(convo.id)}
                    onMouseEnter={() => setHoveredConversationId(convo.id)}
                    onMouseLeave={() => setHoveredConversationId(null)}
                    style={{
                      padding: theme.spacing.sm,
                      backgroundColor: isActive ? theme.colors.surface : (isHovered ? theme.colors.hover : theme.colors.background),
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
                    {/* Active indicator gradient (like mobile) */}
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
                            fontWeight: theme.typography.weights.medium,
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
                            fontWeight: theme.typography.weights.medium,
                            color: isActive ? theme.colors.gradientStart : theme.colors.text,
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
                    {isSignedIn && (
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
                                  setEditingTitle(convo.title)
                                  setEditingTitleId(convo.id)
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
                    )}
                  </div>
                  )
                  })}
                </div>
              )
            })()}
          </div>

          {/* Resize Handle */}
          <div
            onMouseDown={handleMouseDown}
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              width: '4px',
              cursor: 'col-resize',
              backgroundColor: isResizing ? theme.colors.primary : 'transparent',
              transition: isResizing ? 'none' : `background-color ${theme.transitions.fast}`,
              zIndex: 10,
            }}
            onMouseEnter={(e) => {
              if (!isResizing) {
                e.currentTarget.style.backgroundColor = theme.colors.border
              }
            }}
            onMouseLeave={(e) => {
              if (!isResizing) {
                e.currentTarget.style.backgroundColor = 'transparent'
              }
            }}
          />
          </>
          )}

        </div>

        {/* Main Chat Area */}
        <div
          style={{
            flex: 1,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: theme.colors.background,
            position: 'relative',
          }}
        >
          {/* Open Sidebar Button (when sidebar is closed) */}
          {!isDesktopSidebarOpen && (
            <button
              onClick={() => setIsDesktopSidebarOpen(true)}
              title="Open sidebar"
              style={{
                position: 'absolute',
                top: theme.spacing.md,
                left: theme.spacing.md,
                zIndex: 10,
                padding: theme.spacing.xs,
                background: theme.colors.surface,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.md,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: `all ${theme.transitions.fast}`,
                width: '36px',
                height: '36px',
                boxShadow: theme.shadows.md,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = theme.colors.primary
                e.currentTarget.style.backgroundColor = theme.colors.hover
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = theme.colors.border
                e.currentTarget.style.backgroundColor = theme.colors.surface
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke={theme.colors.text}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          )}

          {/* Messages Area */}
          <div
            ref={desktopScrollContainerRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: theme.spacing.lg,
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain',
              width: '100%',
              maxWidth: '100%',
            }}
          >
            <div
              style={{
                maxWidth: '800px',
                margin: '0 auto',
                width: '100%',
              }}
            >
              {!activeConversation || activeConversation.messages.length === 0 ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '400px',
                    textAlign: 'center',
                    padding: theme.spacing.lg,
                  }}
                >
                  <h2
                    style={{
                      fontSize: theme.typography.sizes.xl,
                      fontWeight: theme.typography.weights.semibold,
                      color: theme.colors.text,
                      marginBottom: theme.spacing.sm,
                    }}
                  >
                    Start a conversation
                  </h2>
                  <p
                    style={{
                      fontSize: theme.typography.sizes.base,
                      color: theme.colors.textSecondary,
                      maxWidth: '400px',
                    }}
                  >
                    Select a conversation or create a new one to get started
                  </p>
                </div>
              ) : (
                <>
                  {renderedMessages}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>
          </div>

          {/* Input Area */}
          <div
            style={{
              padding: theme.spacing.lg,
              paddingBottom: `max(${theme.spacing.lg}, env(safe-area-inset-bottom))`,
              backgroundColor: theme.colors.background,
              borderTop: `1px solid ${theme.colors.border}`,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                maxWidth: '800px',
                margin: '0 auto',
                width: '100%',
                paddingLeft: 'calc(40px + 16px)', // Match icon width + gap on desktop
              }}
              className="desktop-input-offset"
            >
              {/* Attached Images Preview */}
              {attachedImages.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    gap: theme.spacing.xs,
                    flexWrap: 'wrap',
                    padding: theme.spacing.xs,
                  }}
                >
                  {attachedImages.map((url, idx) => (
                    <div
                      key={idx}
                      style={{
                        position: 'relative',
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) => {
                        const btn = e.currentTarget.querySelector('button') as HTMLElement
                        if (btn) btn.style.opacity = '1'
                      }}
                      onMouseLeave={(e) => {
                        const btn = e.currentTarget.querySelector('button') as HTMLElement
                        if (btn) btn.style.opacity = '0'
                      }}
                    >
                      <img
                        src={url}
                        alt="Attached"
                        style={{
                          width: '80px',
                          height: '80px',
                          objectFit: 'cover',
                          borderRadius: theme.borderRadius.md,
                          border: `2px solid ${theme.colors.border}`,
                        }}
                      />
                      <button
                        onClick={() => setAttachedImages(prev => prev.filter((_, i) => i !== idx))}
                        style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '-8px',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          border: 'none',
                          background: theme.colors.surface,
                          color: theme.colors.text,
                          fontSize: '14px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          lineHeight: 1,
                          opacity: 0,
                          transition: `opacity ${theme.transitions.fast}`,
                          boxShadow: theme.shadows.md,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Message Input Container - Single bordered box */}
              <div
                style={{
                  backgroundColor: theme.colors.surface,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.borderRadius.lg,
                  padding: theme.spacing.sm,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: theme.spacing.sm,
                  transition: `border-color ${theme.transitions.fast}, box-shadow ${theme.transitions.fast}`,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.primary
                  e.currentTarget.style.boxShadow = theme.shadows.sm
                }}
                onBlur={(e) => {
                  const target = e.currentTarget
                  setTimeout(() => {
                    if (target) {
                      target.style.borderColor = theme.colors.border
                      target.style.boxShadow = 'none'
                    }
                  }, 50)
                }}
              >
                {/* Textarea Row */}
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  style={{
                    width: '100%',
                    padding: 0,
                    fontSize: theme.typography.sizes.base,
                    color: theme.colors.text,
                    backgroundColor: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontFamily: theme.typography.fontFamily,
                    resize: 'none',
                    minHeight: '24px',
                    maxHeight: '200px',
                    lineHeight: theme.typography.lineHeights.normal,
                  }}
                />

                {/* Buttons Row */}
                <div
                  style={{
                    display: 'flex',
                    gap: theme.spacing.sm,
                    alignItems: 'center',
                  }}
                >
                  {/* Image Attach Button */}
                  <button
                    onClick={() => setShowImagePicker(true)}
                    disabled={loading || !modelSupportsVision}
                    title={modelSupportsVision ? "Attach images from gallery" : "Current model doesn't support images"}
                    style={{
                      flexShrink: 0,
                      width: '36px',
                      height: '36px',
                      background: attachedImages.length > 0
                        ? `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`
                        : 'transparent',
                      border: `1px solid ${attachedImages.length > 0 ? 'transparent' : theme.colors.border}`,
                      borderRadius: theme.borderRadius.md,
                      cursor: (loading || !modelSupportsVision) ? 'not-allowed' : 'pointer',
                      opacity: modelSupportsVision ? 1 : 0.5,
                      transition: `all ${theme.transitions.fast}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onMouseEnter={(e) => {
                      if (!loading && attachedImages.length === 0 && modelSupportsVision) {
                        e.currentTarget.style.borderColor = theme.colors.primary
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!loading && attachedImages.length === 0 && modelSupportsVision) {
                        e.currentTarget.style.borderColor = theme.colors.border
                      }
                    }}
                  >
                    {attachedImages.length > 0 ? (
                      <span
                        style={{
                          fontSize: theme.typography.sizes.sm,
                          fontWeight: theme.typography.weights.bold,
                          color: theme.colors.textInverse,
                        }}
                      >
                        {attachedImages.length}
                      </span>
                    ) : (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={(loading || !modelSupportsVision) ? theme.colors.disabled : `url(#gradient-image-desktop-${theme.colors.gradientStart.replace('#', '')})`}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ flexShrink: 0 }}
                      >
                        <defs>
                          <linearGradient id={`gradient-image-desktop-${theme.colors.gradientStart.replace('#', '')}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={theme.colors.gradientStart} />
                            <stop offset="100%" stopColor={theme.colors.gradientEnd} />
                          </linearGradient>
                        </defs>
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    )}
                  </button>

                  {/* Settings Button */}
                  <button
                    onClick={() => {
                      if (!activeConversation) {
                        handleNewConversation()
                      } else {
                        setIsSettingsOpen(true)
                      }
                    }}
                    title="Chat settings"
                    style={{
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing.xs,
                      padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                      height: '36px',
                      fontSize: theme.typography.sizes.sm,
                      fontWeight: theme.typography.weights.medium,
                      backgroundColor: 'transparent',
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.borderRadius.md,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      transition: `all ${theme.transitions.fast}`,
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) {
                        e.currentTarget.style.borderColor = theme.colors.primary
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!loading) {
                          e.currentTarget.style.borderColor = theme.colors.border
                        }
                      }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={loading ? theme.colors.disabled : `url(#gradient-settings-desktop-${theme.colors.gradientStart.replace('#', '')})`}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ flexShrink: 0 }}
                      >
                        <defs>
                          <linearGradient id={`gradient-settings-desktop-${theme.colors.gradientStart.replace('#', '')}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={theme.colors.gradientStart} />
                            <stop offset="100%" stopColor={theme.colors.gradientEnd} />
                          </linearGradient>
                        </defs>
                        <circle cx="12" cy="12" r="3" />
                        <path d="M12 2a10 10 0 0 1 10 10 10 10 0 0 1-10 10A10 10 0 0 1 2 12 10 10 0 0 1 12 2z" opacity="0" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                      </svg>
                    <span style={{ whiteSpace: 'nowrap', color: loading ? theme.colors.disabled : theme.colors.textSecondary }}>
                      {activeConversation?.modelName || textModels[0]?.name || 'Settings'}
                    </span>
                  </button>

                  <div style={{ flex: 1 }} />

                  {/* Send Button */}
                  <button
                    onClick={handleSend}
                    disabled={(!input.trim() && attachedImages.length === 0) || loading}
                    title="Send message"
                    style={{
                      flexShrink: 0,
                      width: '36px',
                      height: '36px',
                      borderRadius: theme.borderRadius.md,
                      border: 'none',
                      background: (!input.trim() && attachedImages.length === 0) || loading
                        ? 'transparent'
                        : `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`,
                      opacity: (!input.trim() && attachedImages.length === 0) || loading ? 0.4 : 1,
                      cursor: (!input.trim() && attachedImages.length === 0) || loading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: `all ${theme.transitions.fast}`,
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={(!input.trim() && attachedImages.length === 0) || loading ? theme.colors.textTertiary : theme.colors.textInverse}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 2L11 13" />
                      <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conversations Drawer */}
      <ConversationsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSelectConversation={(convo) => setActiveConversation(convo.id)}
        onNewConversation={handleNewConversation}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        conversation={activeConversation}
        onUpdateModel={(modelId, modelName) => {
          if (activeConversation) {
            updateConversationModel(activeConversation.id, modelId, modelName)
          }
        }}
        onUpdateSystemPrompt={(systemPrompt) => {
          if (activeConversation) {
            updateSystemPrompt(activeConversation.id, systemPrompt)
          }
        }}
        onUpdateSettings={(settings) => {
          if (activeConversation) {
            updateConversationSettings(activeConversation.id, settings)
          }
        }}
      />

      {/* Image Picker Modal */}
      {showImagePicker && (
        <GalleryImagePicker
          onSelect={(images) => {
            const urls = Array.isArray(images) ? images : [images]
            setAttachedImages(urls)
          }}
          onClose={() => setShowImagePicker(false)}
          multiSelect={true}
        />
      )}

      {/* Sign In Prompt Modal */}
      <SignInPromptModal
        isOpen={showSignInPrompt}
        onClose={() => setShowSignInPrompt(false)}
        onSignIn={() => {
          setShowSignInPrompt(false)
          signIn()
        }}
        message={"You need to sign in to send messages.\nYour message will be ready to send after you sign in."}
      />

      {/* Responsive CSS */}
      <style>{`
        @media (max-width: 768px) {
          /* Hide bottom nav when keyboard is active on mobile */
          body.chat-keyboard-active nav.bottom-nav {
            display: none !important;
          }

          /* When keyboard is active, collapse the navbar grid row and expand main container */
          body.chat-keyboard-active .page-layout-root {
            /* Target the PageLayout root div - collapse bottom nav row to 0 */
            grid-template-rows: auto 1fr 0 !important;
          }

          body.chat-keyboard-active main {
            padding-bottom: 0 !important;
          }

          /*
           * Input area grows by EXACTLY the nav bar height
           * Normal: var(--input-area-height) (defined in gridTemplateRows)
           * Keyboard active: var(--input-area-height) + var(--navbar-height)
           * No header row since it's now floating inside messages area
           */
          body.chat-keyboard-active .mobile-chat-layout {
            grid-template-rows: 1fr calc(var(--input-area-height) + var(--navbar-height)) !important;
          }

          /* Message Input Container should grow to fill available space in input area */
          body.chat-keyboard-active .message-input-container {
            flex: 1 !important;
            transition: flex 150ms ease;
          }

          .message-input-container {
            transition: flex 150ms ease;
          }

          /* Textarea row should also grow */
          body.chat-keyboard-active .textarea-row {
            flex: 1 !important;
            align-items: stretch !important;
            transition: flex 150ms ease;
          }

          .textarea-row {
            transition: flex 150ms ease;
          }

          /* Textarea itself grows to fill the row */
          body.chat-keyboard-active .chat-textarea {
            min-height: 80px !important;
            height: 100% !important;
          }
        }

        @keyframes slideInFromLeft {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @media (min-width: 769px) {
          .mobile-chat-layout {
            display: none !important;
          }
          .desktop-chat-layout {
            display: flex !important;
          }
        }

        @media (max-width: 768px) {
          .desktop-input-offset {
            padding-left: 0 !important;
          }
        }
      `}</style>
    </>
  )
}
