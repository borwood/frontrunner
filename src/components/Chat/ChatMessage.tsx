import { memo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkEmoji from 'remark-emoji'
import remarkBreaks from 'remark-breaks'
import { useTheme } from '../../theme/ThemeContext'
import { useUser } from '../../contexts/UserContext'
import { useChat } from '../../contexts/ChatContext'
import { getModelById } from '../../types/models'
import type { ChatMessage as ChatMessageType, MessageContentBlock } from '../../types/chat'

interface ChatMessageProps {
  message: ChatMessageType
}

export const ChatMessage = memo(function ChatMessage({ message }: ChatMessageProps) {
  const { theme } = useTheme()
  const { user } = useUser()
  const { textSize } = useChat()

  if (message.role === 'system') {
    return null
  }

  const isUser = message.role === 'user'

  // Map text size to actual font size
  const getFontSize = () => {
    switch (textSize) {
      case 'sm':
        return theme.typography.sizes.sm
      case 'lg':
        return theme.typography.sizes.lg
      default: // 'md'
        return theme.typography.sizes.base
    }
  }

  const fontSize = getFontSize()

  // Check if message is empty (waiting for response) - must check BEFORE processing content
  // Defensive: handle null/undefined content, empty arrays, and empty strings
  const isEmpty = !isUser && (
    !message.content || // null/undefined
    (typeof message.content === 'string' && message.content.trim() === '') ||
    (Array.isArray(message.content) && (
      message.content.length === 0 || // empty array
      message.content.every(block =>
        block.type === 'text' && (!block.text || block.text.trim() === '')
      )
    ))
  )

  // Check if content is structured (array) or simple string
  const contentBlocks: MessageContentBlock[] = Array.isArray(message.content)
    ? message.content
    : [{ type: 'text' as const, text: message.content as string }]

  // Separate images and text
  const imageBlocks = contentBlocks.filter(block => block.type === 'image_url')
  const textBlocks = contentBlocks.filter(block => block.type === 'text')

  // Get model info for assistant messages
  const modelInfo = !isUser && message.modelId ? getModelById(message.modelId) : null

  return (
    <div
      style={{
        width: '100%',
        marginBottom: theme.spacing.lg,
        animation: 'fadeInMessage 0.3s ease-out',
      }}
    >
      {/* Desktop: Row layout with avatar/icon on the side */}
      <div
        className="desktop-message-layout"
        style={{
          display: 'none', // Hidden by default, shown on desktop via CSS
          flexDirection: 'row',
          gap: theme.spacing.md,
          alignItems: 'flex-start',
        }}
      >
        {/* Avatar/Icon Column */}
        <div
          style={{
            flexShrink: 0,
            width: '40px',
            height: '40px',
            marginTop: theme.spacing.md, // Offset down by chat bubble's top padding
          }}
        >
          {isUser ? (
            // User profile picture
            user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt="User avatar"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: theme.borderRadius.full,
                  objectFit: 'cover',
                }}
              />
            ) : (
              // Fallback user icon
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: theme.borderRadius.full,
                  background: `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: theme.typography.sizes.lg,
                  fontWeight: theme.typography.weights.bold,
                  color: theme.colors.textInverse,
                }}
              >
                {user?.email?.charAt(0).toUpperCase() || '?'}
              </div>
            )
          ) : (
            // Model icon (circular like on home page)
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: theme.borderRadius.full,
                background: `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `2px solid ${theme.colors.border}`,
                boxShadow: theme.shadows.sm,
                padding: '6px',
              }}
            >
              {modelInfo?.icon ? (
                <img
                  src={modelInfo.icon}
                  alt={`${modelInfo.name} icon`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    filter: 'brightness(0) invert(1)',
                  }}
                />
              ) : (
                <div
                  style={{
                    fontSize: theme.typography.sizes.base,
                    color: theme.colors.textInverse,
                    fontWeight: theme.typography.weights.bold,
                  }}
                >
                  AI
                </div>
              )}
            </div>
          )}
        </div>

        {/* Message Content Column */}
        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <div
            style={{
              padding: theme.spacing.md,
              borderRadius: theme.borderRadius.lg,
              backgroundColor: isUser
                ? theme.colors.surface
                : isEmpty
                ? theme.colors.surface
                : 'transparent',
              border: 'none',
              position: 'relative',
              background: isUser
                ? `linear-gradient(135deg, ${theme.colors.gradientStart}30, ${theme.colors.gradientEnd}30)`
                : 'transparent',
              overflowWrap: 'break-word',
              wordBreak: 'break-word',
              hyphens: 'auto',
              minHeight: isEmpty ? '60px' : 'auto',
              display: isEmpty ? 'flex' : 'block',
              alignItems: isEmpty ? 'center' : 'normal',
              justifyContent: isEmpty ? 'center' : 'normal',
            }}
          >
            {isEmpty && (
              <>
                <div className="loader" style={{
                  color: theme.colors.primary,
                  fontSize: '7px',
                  position: 'relative',
                  textIndent: '-9999em',
                  transform: 'translateZ(0)',
                }}></div>
                <style>{`
                  .loader, .loader:before, .loader:after {
                    border-radius: 50%;
                    width: 2.5em;
                    height: 2.5em;
                    animation-fill-mode: both;
                    animation: bblFadInOut 1.8s infinite ease-in-out;
                  }
                  .loader {
                    animation-delay: -0.16s;
                  }
                  .loader:before,
                  .loader:after {
                    content: '';
                    position: absolute;
                    top: 0;
                  }
                  .loader:before {
                    left: -3.5em;
                    animation-delay: -0.32s;
                  }
                  .loader:after {
                    left: 3.5em;
                  }
                  @keyframes bblFadInOut {
                    0%, 80%, 100% { box-shadow: 0 2.5em 0 -1.3em }
                    40% { box-shadow: 0 2.5em 0 0 }
                  }
                `}</style>
              </>
            )}
            {/* Render images in a row if present */}
            {imageBlocks.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  gap: theme.spacing.xs,
                  flexWrap: 'wrap',
                  marginBottom: textBlocks.length > 0 ? theme.spacing.sm : 0,
                }}
              >
                {imageBlocks.map((block, idx) => (
                  <img
                    key={idx}
                    src={block.image_url.url}
                    alt="Attached"
                    style={{
                      width: '120px',
                      height: '120px',
                      borderRadius: theme.borderRadius.md,
                      border: `1px solid ${theme.colors.border}`,
                      objectFit: 'cover',
                      cursor: 'pointer',
                    }}
                    onClick={() => window.open(block.image_url.url, '_blank')}
                  />
                ))}
              </div>
            )}

            {/* Render text blocks */}
            {textBlocks.map((block, idx) => (
              <div
                key={idx}
                style={{
                  fontSize: fontSize,
                  color: theme.colors.text,
                  lineHeight: theme.typography.lineHeights.normal,
                }}
                className="chat-message-content"
              >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkEmoji, remarkBreaks]}
                    components={{
                  // Links - gradient start color
                  a: ({ node, children, ...props }) => (
                    <a
                      {...props}
                      style={{
                        color: theme.colors.gradientStart,
                        textDecoration: 'none',
                        borderBottom: `1px solid ${theme.colors.gradientStart}40`,
                        transition: `all ${theme.transitions.fast}`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderBottomColor = theme.colors.gradientStart
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderBottomColor = `${theme.colors.gradientStart}40`
                      }}
                    >
                      {children}
                    </a>
                  ),
                  // Inline code - gradient end color
                  code: ({ node, className, children, ...props }) => {
                    const isInline = !className?.includes('language-')
                    return isInline ? (
                      <code
                        className={className}
                        {...props}
                        style={{
                          color: theme.colors.gradientEnd,
                          backgroundColor: `${theme.colors.gradientEnd}15`,
                          padding: '2px 6px',
                          borderRadius: theme.borderRadius.sm,
                          fontFamily: theme.typography.fontFamilyMono,
                          fontSize: '0.9em',
                          fontWeight: theme.typography.weights.medium,
                        }}
                      >
                        {children}
                      </code>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    )
                  },
                  // Code blocks - boxed with border
                  pre: ({ node, children, ...props }) => (
                    <pre
                      {...props}
                      style={{
                        padding: theme.spacing.md,
                        backgroundColor: theme.colors.backgroundElevated,
                        border: `1px solid ${theme.colors.border}`,
                        borderLeft: `3px solid ${theme.colors.gradientStart}`,
                        borderRadius: theme.borderRadius.md,
                        overflow: 'auto',
                        margin: `${theme.spacing.sm} 0`,
                        boxShadow: theme.shadows.sm,
                        fontFamily: theme.typography.fontFamilyMono,
                      }}
                    >
                      {children}
                    </pre>
                  ),
                  // Blockquote - styled with gradient accent
                  blockquote: ({ node, children, ...props }) => (
                    <blockquote
                      {...props}
                      style={{
                        margin: `${theme.spacing.sm} 0`,
                        padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                        borderLeft: `4px solid ${theme.colors.gradientStart}`,
                        backgroundColor: `${theme.colors.gradientStart}10`,
                        borderRadius: theme.borderRadius.sm,
                        fontStyle: 'italic',
                        color: theme.colors.textSecondary,
                      }}
                    >
                      {children}
                    </blockquote>
                  ),
                  // Horizontal rule - gradient line
                  hr: () => (
                    <hr
                      style={{
                        border: 'none',
                        height: '2px',
                        background: `linear-gradient(90deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`,
                        margin: `${theme.spacing.md} 0`,
                        borderRadius: theme.borderRadius.sm,
                        opacity: 0.5,
                      }}
                    />
                  ),
                  // Tables - styled with borders and hover effects
                  table: ({ node, children, ...props }) => (
                    <div style={{ overflowX: 'auto', margin: `${theme.spacing.sm} 0` }}>
                      <table
                        {...props}
                        style={{
                          width: '100%',
                          borderCollapse: 'collapse',
                          backgroundColor: theme.colors.surface,
                          border: `1px solid ${theme.colors.border}`,
                          borderRadius: theme.borderRadius.md,
                          overflow: 'hidden',
                        }}
                      >
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({ node, children, ...props }) => (
                    <thead
                      {...props}
                      style={{
                        background: `linear-gradient(135deg, ${theme.colors.gradientStart}20, ${theme.colors.gradientEnd}20)`,
                        borderBottom: `2px solid ${theme.colors.gradientStart}`,
                      }}
                    >
                      {children}
                    </thead>
                  ),
                  th: ({ node, children, ...props }) => (
                    <th
                      {...props}
                      style={{
                        padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                        textAlign: 'left',
                        fontWeight: theme.typography.weights.semibold,
                        color: theme.colors.text,
                        borderRight: `1px solid ${theme.colors.border}`,
                      }}
                    >
                      {children}
                    </th>
                  ),
                  td: ({ node, children, ...props }) => (
                    <td
                      {...props}
                      style={{
                        padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                        borderTop: `1px solid ${theme.colors.border}`,
                        borderRight: `1px solid ${theme.colors.border}`,
                        color: theme.colors.text,
                      }}
                    >
                      {children}
                    </td>
                  ),
                  tr: ({ node, children, ...props }) => (
                    <tr
                      {...props}
                      style={{
                        transition: `background-color ${theme.transitions.fast}`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = theme.colors.hover
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      {children}
                    </tr>
                  ),
                  // Task lists - styled checkboxes
                  input: ({ node, ...props }) => {
                    if (props.type === 'checkbox') {
                      return (
                        <input
                          {...props}
                          style={{
                            marginRight: theme.spacing.xs,
                            accentColor: theme.colors.gradientStart,
                            cursor: 'pointer',
                            width: '16px',
                            height: '16px',
                          }}
                          disabled
                        />
                      )
                    }
                    return <input {...props} />
                  },
                }}
              >
                {block.text}
              </ReactMarkdown>
              </div>
            ))}

            {!isEmpty && (
              <div
                style={{
                  fontSize: theme.typography.sizes.xs,
                  color: theme.colors.textTertiary,
                  marginTop: theme.spacing.xs,
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.xs,
                }}
              >
                <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                {!isUser && message.modelName && (
                  <>
                    <span>•</span>
                    <span
                      key={`model-name-desktop-${message.id}-${theme.colors.gradientStart}`}
                      style={{
                        background: `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        fontWeight: theme.typography.weights.medium,
                      }}
                    >
                      {message.modelName}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile: Original centered layout (no avatars) */}
      <div
        className="mobile-message-layout"
        style={{
          display: 'block', // Shown by default, hidden on desktop via CSS
        }}
      >
        <div
          style={{
            padding: theme.spacing.md,
            borderRadius: theme.borderRadius.lg,
            // User messages: opaque gradient background
            // Assistant messages: transparent/invisible bubble (or surface when empty for loader)
            backgroundColor: isUser
              ? theme.colors.surface
              : isEmpty
              ? theme.colors.surface
              : 'transparent',
            border: 'none',
            position: 'relative',
            // User messages get opaque gradient background
            background: isUser
              ? `linear-gradient(135deg, ${theme.colors.gradientStart}30, ${theme.colors.gradientEnd}30)`
              : 'transparent',
            overflowWrap: 'break-word',
            wordBreak: 'break-word',
            hyphens: 'auto',
            minHeight: isEmpty ? '60px' : 'auto',
            display: isEmpty ? 'flex' : 'block',
            alignItems: isEmpty ? 'center' : 'normal',
            justifyContent: isEmpty ? 'center' : 'normal',
          }}
        >
          {isEmpty && (
            <>
              <div className="loader-mobile" style={{
                color: theme.colors.primary,
                fontSize: '7px',
                position: 'relative',
                textIndent: '-9999em',
                transform: 'translateZ(0)',
              }}></div>
              <style>{`
                .loader-mobile, .loader-mobile:before, .loader-mobile:after {
                  border-radius: 50%;
                  width: 2.5em;
                  height: 2.5em;
                  animation-fill-mode: both;
                  animation: bblFadInOutMobile 1.8s infinite ease-in-out;
                }
                .loader-mobile {
                  animation-delay: -0.16s;
                }
                .loader-mobile:before,
                .loader-mobile:after {
                  content: '';
                  position: absolute;
                  top: 0;
                }
                .loader-mobile:before {
                  left: -3.5em;
                  animation-delay: -0.32s;
                }
                .loader-mobile:after {
                  left: 3.5em;
                }
                @keyframes bblFadInOutMobile {
                  0%, 80%, 100% { box-shadow: 0 2.5em 0 -1.3em }
                  40% { box-shadow: 0 2.5em 0 0 }
                }
              `}</style>
            </>
          )}

        {/* Render images in a row if present */}
        {imageBlocks.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: theme.spacing.xs,
              flexWrap: 'wrap',
              marginBottom: textBlocks.length > 0 ? theme.spacing.sm : 0,
            }}
          >
            {imageBlocks.map((block, idx) => (
              <img
                key={idx}
                src={block.image_url.url}
                alt="Attached"
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: theme.borderRadius.md,
                  border: `1px solid ${theme.colors.border}`,
                  objectFit: 'cover',
                  cursor: 'pointer',
                }}
                onClick={() => window.open(block.image_url.url, '_blank')}
              />
            ))}
          </div>
        )}

        {/* Render text blocks */}
        {textBlocks.map((block, idx) => (
          <div
            key={idx}
            style={{
              fontSize: fontSize,
              color: theme.colors.text,
              lineHeight: theme.typography.lineHeights.normal,
            }}
            className="chat-message-content"
          >
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkEmoji, remarkBreaks]}
                components={{
              // Links - gradient start color
              a: ({ node, children, ...props }) => (
                <a
                  {...props}
                  style={{
                    color: theme.colors.gradientStart,
                    textDecoration: 'none',
                    borderBottom: `1px solid ${theme.colors.gradientStart}40`,
                    transition: `all ${theme.transitions.fast}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderBottomColor = theme.colors.gradientStart
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderBottomColor = `${theme.colors.gradientStart}40`
                  }}
                >
                  {children}
                </a>
              ),
              // Inline code - gradient end color
              code: ({ node, className, children, ...props }) => {
                const isInline = !className?.includes('language-')
                return isInline ? (
                  <code
                    className={className}
                    {...props}
                    style={{
                      color: theme.colors.gradientEnd,
                      backgroundColor: `${theme.colors.gradientEnd}15`,
                      padding: '2px 6px',
                      borderRadius: theme.borderRadius.sm,
                      fontFamily: theme.typography.fontFamilyMono,
                      fontSize: '0.9em',
                      fontWeight: theme.typography.weights.medium,
                    }}
                  >
                    {children}
                  </code>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                )
              },
              // Code blocks - boxed with border
              pre: ({ node, children, ...props }) => (
                <pre
                  {...props}
                  style={{
                    padding: theme.spacing.md,
                    backgroundColor: theme.colors.backgroundElevated,
                    border: `1px solid ${theme.colors.border}`,
                    borderLeft: `3px solid ${theme.colors.gradientStart}`,
                    borderRadius: theme.borderRadius.md,
                    overflow: 'auto',
                    margin: `${theme.spacing.sm} 0`,
                    boxShadow: theme.shadows.sm,
                    fontFamily: theme.typography.fontFamilyMono,
                  }}
                >
                  {children}
                </pre>
              ),
              // Blockquote - styled with gradient accent
              blockquote: ({ node, children, ...props }) => (
                <blockquote
                  {...props}
                  style={{
                    margin: `${theme.spacing.sm} 0`,
                    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                    borderLeft: `4px solid ${theme.colors.gradientStart}`,
                    backgroundColor: `${theme.colors.gradientStart}10`,
                    borderRadius: theme.borderRadius.sm,
                    fontStyle: 'italic',
                    color: theme.colors.textSecondary,
                  }}
                >
                  {children}
                </blockquote>
              ),
              // Horizontal rule - gradient line
              hr: () => (
                <hr
                  style={{
                    border: 'none',
                    height: '2px',
                    background: `linear-gradient(90deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`,
                    margin: `${theme.spacing.md} 0`,
                    borderRadius: theme.borderRadius.sm,
                    opacity: 0.5,
                  }}
                />
              ),
              // Tables - styled with borders and hover effects
              table: ({ node, children, ...props }) => (
                <div style={{ overflowX: 'auto', margin: `${theme.spacing.sm} 0` }}>
                  <table
                    {...props}
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      backgroundColor: theme.colors.surface,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.borderRadius.md,
                      overflow: 'hidden',
                    }}
                  >
                    {children}
                  </table>
                </div>
              ),
              thead: ({ node, children, ...props }) => (
                <thead
                  {...props}
                  style={{
                    background: `linear-gradient(135deg, ${theme.colors.gradientStart}20, ${theme.colors.gradientEnd}20)`,
                    borderBottom: `2px solid ${theme.colors.gradientStart}`,
                  }}
                >
                  {children}
                </thead>
              ),
              th: ({ node, children, ...props }) => (
                <th
                  {...props}
                  style={{
                    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                    textAlign: 'left',
                    fontWeight: theme.typography.weights.semibold,
                    color: theme.colors.text,
                    borderRight: `1px solid ${theme.colors.border}`,
                  }}
                >
                  {children}
                </th>
              ),
              td: ({ node, children, ...props }) => (
                <td
                  {...props}
                  style={{
                    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                    borderTop: `1px solid ${theme.colors.border}`,
                    borderRight: `1px solid ${theme.colors.border}`,
                    color: theme.colors.text,
                  }}
                >
                  {children}
                </td>
              ),
              tr: ({ node, children, ...props }) => (
                <tr
                  {...props}
                  style={{
                    transition: `background-color ${theme.transitions.fast}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme.colors.hover
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  {children}
                </tr>
              ),
              // Task lists - styled checkboxes
              input: ({ node, ...props }) => {
                if (props.type === 'checkbox') {
                  return (
                    <input
                      {...props}
                      style={{
                        marginRight: theme.spacing.xs,
                        accentColor: theme.colors.gradientStart,
                        cursor: 'pointer',
                        width: '16px',
                        height: '16px',
                      }}
                      disabled
                    />
                  )
                }
                return <input {...props} />
              },
            }}
          >
            {block.text}
          </ReactMarkdown>
          </div>
        ))}

        {!isEmpty && (
          <div
            style={{
              fontSize: theme.typography.sizes.xs,
              color: theme.colors.textTertiary,
              marginTop: theme.spacing.xs,
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.xs,
            }}
          >
            <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
            {!isUser && message.modelName && (
              <>
                <span>•</span>
                <span
                  key={`model-name-mobile-${message.id}-${theme.colors.gradientStart}`}
                  style={{
                    background: `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontWeight: theme.typography.weights.medium,
                  }}
                >
                  {message.modelName}
                </span>
              </>
            )}
          </div>
        )}
        </div>
      </div>

      {/* Global styles for markdown */}
      <style>{`
        @keyframes fadeInMessage {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .chat-message-content p {
          margin: 0 0 ${theme.spacing.sm} 0;
        }
        .chat-message-content p:last-child {
          margin: 0;
        }
        .chat-message-content pre code {
          padding: 0;
          background: none;
          color: ${theme.colors.text};
          font-family: ${theme.typography.fontFamilyMono};
          font-size: 0.9em;
        }
        .chat-message-content ul, .chat-message-content ol {
          margin: ${theme.spacing.sm} 0;
          padding-left: ${theme.spacing.lg};
        }
        .chat-message-content li {
          margin: ${theme.spacing.xs} 0;
        }
        /* Task lists */
        .chat-message-content ul.contains-task-list {
          list-style: none;
          padding-left: ${theme.spacing.md};
        }
        .chat-message-content .task-list-item {
          display: flex;
          align-items: center;
          margin: ${theme.spacing.xs} 0;
        }
        .chat-message-content h1, .chat-message-content h2, .chat-message-content h3 {
          margin: ${theme.spacing.md} 0 ${theme.spacing.sm} 0;
          color: ${theme.colors.text};
        }
        .chat-message-content h1:first-child, .chat-message-content h2:first-child, .chat-message-content h3:first-child {
          margin-top: 0;
        }
        .chat-message-content blockquote p:last-child {
          margin-bottom: 0;
        }

        /* Responsive layout toggle */
        @media (max-width: 768px) {
          .desktop-message-layout {
            display: none !important;
          }
          .mobile-message-layout {
            display: block !important;
          }
        }

        @media (min-width: 769px) {
          .desktop-message-layout {
            display: flex !important;
          }
          .mobile-message-layout {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
})
