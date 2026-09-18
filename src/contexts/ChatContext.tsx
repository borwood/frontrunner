import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { useUnifiedStorage } from '../hooks/useUnifiedStorage'
import type { Conversation, ChatMessage } from '../types/chat'

// Re-export types for consumers
export type { Conversation, ChatMessage } from '../types/chat'

export type TextSize = 'sm' | 'md' | 'lg'

interface ChatContextValue {
  conversations: Conversation[]
  activeConversationId: string | null
  textSize: TextSize
  setTextSize: (size: TextSize) => void
  createConversation: (modelId: string, modelName: string, systemPrompt?: string) => string
  deleteConversation: (id: string) => void
  setActiveConversation: (id: string | null) => void
  getActiveConversation: () => Conversation | null
  addMessage: (conversationId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => string
  updateMessage: (conversationId: string, messageId: string, updates: Partial<ChatMessage>) => void
  updateConversationModel: (conversationId: string, modelId: string, modelName: string) => void
  updateSystemPrompt: (conversationId: string, systemPrompt: string) => void
  updateConversationTitle: (conversationId: string, title: string) => void
  updateConversationSettings: (conversationId: string, settings: { optimizeImageHistory?: boolean }) => void
  editingTitleId: string | null
  setEditingTitleId: (id: string | null) => void
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined)

export function ChatProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useUnifiedStorage('conversations', [])

  // Track session-only conversations (saved to sessionStorage, not cloud)
  // These get promoted to cloud storage when first message is added
  const [sessionConversations, setSessionConversations] = useState<Conversation[]>(() => {
    const stored = sessionStorage.getItem('sessionConversations')
    return stored ? JSON.parse(stored) : []
  })

  // Persist active conversation in sessionStorage only (not cloud)
  const [activeConversationId, setActiveConversationIdState] = useState<string | null>(() => {
    const stored = sessionStorage.getItem('activeConversationId')
    return stored || null
  })

  const setActiveConversationId = useCallback((id: string | null) => {
    setActiveConversationIdState(id)
    if (id) {
      sessionStorage.setItem('activeConversationId', id)
    } else {
      sessionStorage.removeItem('activeConversationId')
    }
  }, [])

  const [editingTitleId, setEditingTitleIdInternal] = useState<string | null>(null)
  const [textSize, setTextSize] = useUnifiedStorage('chatTextSize', 'md')

  const setEditingTitleId = useCallback((id: string | null) => {
    setEditingTitleIdInternal(id)
  }, [])

  // Only auto-select first conversation if we had one stored in session
  // (Don't auto-select on fresh session - show empty state instead)
  useEffect(() => {
    const hadStoredConversation = sessionStorage.getItem('activeConversationId')
    if (hadStoredConversation && !activeConversationId && conversations.length > 0) {
      setActiveConversationId(conversations[0].id)
    }
  }, [conversations, activeConversationId, setActiveConversationId])

  const createConversation = useCallback((modelId: string, modelName: string, systemPrompt: string = 'You are embedded in frontrunner, a web interface for calling dozens of generative AI APIs. You are being accessed through the Chat section, which features markdown rendering via ReactMarkdown. Good luck, have fun!') => {
    const id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newConversation: Conversation = {
      id,
      title: 'New Conversation',
      modelId,
      modelName,
      systemPrompt,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    // Save to sessionStorage only (not cloud) until first message
    setSessionConversations((prev) => {
      const updated = [newConversation, ...prev]
      sessionStorage.setItem('sessionConversations', JSON.stringify(updated))
      return updated
    })
    setActiveConversationId(id)
    return id
  }, [setActiveConversationId])

  const deleteConversation = useCallback((id: string) => {
    // Merge all conversations to find the position of the deleted item
    const allConversations = [...sessionConversations, ...conversations]
    const deletedIndex = allConversations.findIndex((c) => c.id === id)

    // Remove from both arrays
    setConversations((prev) => prev.filter((c) => c.id !== id))
    setSessionConversations((prev) => {
      const updated = prev.filter((c) => c.id !== id)
      sessionStorage.setItem('sessionConversations', JSON.stringify(updated))
      return updated
    })

    // If the deleted conversation was active, select the next available conversation
    if (activeConversationId === id) {
      // After deletion, the conversation at the same index becomes the "next" one
      // If that doesn't exist, try the previous one (index - 1)
      // If neither exists, set to null
      const remainingConversations = allConversations.filter((c) => c.id !== id)
      const nextConversation =
        remainingConversations[deletedIndex] || // Try same index (next item)
        remainingConversations[deletedIndex - 1] || // Try previous item
        null

      setActiveConversationId(nextConversation?.id ?? null)
    }
  }, [activeConversationId, setConversations, setActiveConversationId, conversations, sessionConversations])

  const setActiveConversation = useCallback((id: string | null) => {
    setActiveConversationId(id)
  }, [setActiveConversationId])

  const getActiveConversation = useCallback(() => {
    if (!activeConversationId) return null
    // Check both cloud-saved and session-only conversations
    return (
      conversations.find((c) => c.id === activeConversationId) ||
      sessionConversations.find((c) => c.id === activeConversationId) ||
      null
    )
  }, [activeConversationId, conversations, sessionConversations])

  const addMessage = useCallback((conversationId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>): string => {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const fullMessage: ChatMessage = {
      ...message,
      id: messageId,
      timestamp: Date.now(),
    }

    // Check if conversation is session-only - if so, promote it to cloud storage
    let wasPromoted = false
    setSessionConversations((prev) => {
      const sessionConv = prev.find((c) => c.id === conversationId)
      if (sessionConv) {
        wasPromoted = true
        // Found in session - promote to cloud storage with this message
        const updatedMessages = [fullMessage]

        // Auto-generate title from first user message
        let title = sessionConv.title
        if (title === 'New Conversation' && message.role === 'user') {
          let textContent = ''
          if (typeof message.content === 'string') {
            textContent = message.content
          } else if (Array.isArray(message.content)) {
            const textBlock = message.content.find(block => block.type === 'text')
            if (textBlock && 'text' in textBlock) {
              textContent = textBlock.text
            }
          }

          if (textContent.trim()) {
            title = textContent.slice(0, 50) + (textContent.length > 50 ? '...' : '')
          } else {
            title = 'Image message'
          }
        }

        const savedConv = {
          ...sessionConv,
          messages: updatedMessages,
          title,
          updatedAt: Date.now(),
        }

        setConversations((prevSaved) => [savedConv, ...prevSaved])

        // Remove from session-only and update sessionStorage
        const updated = prev.filter((c) => c.id !== conversationId)
        sessionStorage.setItem('sessionConversations', JSON.stringify(updated))
        return updated
      }
      return prev
    })

    // Only update if already in saved conversations (not just promoted)
    if (!wasPromoted) {
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id !== conversationId) return conv

          const updatedMessages = [...conv.messages, fullMessage]

          // Auto-generate title from first user message
          let title = conv.title
          if (title === 'New Conversation' && message.role === 'user') {
            let textContent = ''
            if (typeof message.content === 'string') {
              textContent = message.content
            } else if (Array.isArray(message.content)) {
              const textBlock = message.content.find(block => block.type === 'text')
              if (textBlock && 'text' in textBlock) {
                textContent = textBlock.text
              }
            }

            if (textContent.trim()) {
              title = textContent.slice(0, 50) + (textContent.length > 50 ? '...' : '')
            } else {
              title = 'Image message'
            }
          }

          return {
            ...conv,
            messages: updatedMessages,
            title,
            updatedAt: Date.now(),
          }
        })
      )
    }

    return messageId
  }, [setConversations])

  const updateMessage = useCallback((conversationId: string, messageId: string, updates: Partial<ChatMessage>) => {
    // Update in saved conversations
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id !== conversationId) return conv

        return {
          ...conv,
          messages: conv.messages.map((msg: ChatMessage) =>
            msg.id === messageId ? { ...msg, ...updates } : msg
          ),
          updatedAt: Date.now(),
        }
      })
    )

    // Also update in session conversations (streaming updates happen before first message is saved)
    setSessionConversations((prev) => {
      const updated = prev.map((conv) => {
        if (conv.id !== conversationId) return conv

        return {
          ...conv,
          messages: conv.messages.map((msg: ChatMessage) =>
            msg.id === messageId ? { ...msg, ...updates } : msg
          ),
          updatedAt: Date.now(),
        }
      })
      sessionStorage.setItem('sessionConversations', JSON.stringify(updated))
      return updated
    })
  }, [setConversations])

  const updateConversationModel = useCallback((conversationId: string, modelId: string, modelName: string) => {
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id !== conversationId) return conv
        return {
          ...conv,
          modelId,
          modelName,
          updatedAt: Date.now(),
        }
      })
    )
    setSessionConversations((prev) => {
      const updated = prev.map((conv) => {
        if (conv.id !== conversationId) return conv
        return {
          ...conv,
          modelId,
          modelName,
          updatedAt: Date.now(),
        }
      })
      sessionStorage.setItem('sessionConversations', JSON.stringify(updated))
      return updated
    })
  }, [setConversations])

  const updateSystemPrompt = useCallback((conversationId: string, systemPrompt: string) => {
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id !== conversationId) return conv
        return {
          ...conv,
          systemPrompt,
          updatedAt: Date.now(),
        }
      })
    )
    setSessionConversations((prev) => {
      const updated = prev.map((conv) => {
        if (conv.id !== conversationId) return conv
        return {
          ...conv,
          systemPrompt,
          updatedAt: Date.now(),
        }
      })
      sessionStorage.setItem('sessionConversations', JSON.stringify(updated))
      return updated
    })
  }, [setConversations])

  const updateConversationTitle = useCallback((conversationId: string, title: string) => {
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id !== conversationId) return conv
        return {
          ...conv,
          title,
          updatedAt: Date.now(),
        }
      })
    )
    setSessionConversations((prev) => {
      const updated = prev.map((conv) => {
        if (conv.id !== conversationId) return conv
        return {
          ...conv,
          title,
          updatedAt: Date.now(),
        }
      })
      sessionStorage.setItem('sessionConversations', JSON.stringify(updated))
      return updated
    })
  }, [setConversations])

  const updateConversationSettings = useCallback((conversationId: string, settings: { optimizeImageHistory?: boolean }) => {
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id !== conversationId) return conv
        return {
          ...conv,
          ...settings,
          updatedAt: Date.now(),
        }
      })
    )
    setSessionConversations((prev) => {
      const updated = prev.map((conv) => {
        if (conv.id !== conversationId) return conv
        return {
          ...conv,
          ...settings,
          updatedAt: Date.now(),
        }
      })
      sessionStorage.setItem('sessionConversations', JSON.stringify(updated))
      return updated
    })
  }, [setConversations])

  // Merge session and cloud conversations for UI
  const allConversations = [...sessionConversations, ...conversations]

  return (
    <ChatContext.Provider
      value={{
        conversations: allConversations,
        activeConversationId,
        textSize: textSize as TextSize,
        setTextSize,
        createConversation,
        deleteConversation,
        setActiveConversation,
        getActiveConversation,
        addMessage,
        updateMessage,
        updateConversationModel,
        updateSystemPrompt,
        updateConversationTitle,
        updateConversationSettings,
        editingTitleId,
        setEditingTitleId,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}
