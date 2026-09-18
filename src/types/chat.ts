// ============================================================================
// CHAT TYPES
// ============================================================================

// Content types for multi-modal messages (text + images)
export type TextContentBlock = {
  type: 'text'
  text: string
}

export type ImageContentBlock = {
  type: 'image_url'
  image_url: {
    url: string // data URL or HTTP URL
  }
}

export type MessageContentBlock = TextContentBlock | ImageContentBlock

// Content can be a simple string (legacy/text-only) or structured blocks (multi-modal)
export type MessageContent = string | MessageContentBlock[]

export interface ChatMessage {
  id: string
  role: 'system' | 'user' | 'assistant'
  content: MessageContent
  timestamp: number
  // Track which model generated this message (for assistant messages only)
  modelId?: string
  modelName?: string
}

export interface Conversation {
  id: string
  title: string
  modelId: string
  modelName: string
  systemPrompt: string
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
  // Optimization settings
  optimizeImageHistory?: boolean // Only send images in latest message
}

export interface ConversationMetadata {
  id: string
  title: string
  modelName: string
  messageCount: number
  updatedAt: number
}
