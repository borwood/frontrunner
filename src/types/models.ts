// ============================================================================
// MODEL CONFIGURATION TYPES
// ============================================================================

// Helper function to get icon path based on model company
function getIconPath(modelId: string): string {
  // Extract company from model ID (e.g., 'openai/gpt-4o' -> 'openai')
  const company = modelId.split('/')[0]

  // Map company names to icon filenames
  const iconMap: Record<string, string> = {
    'openai': '/icons/openai.svg',
    'anthropic': '/icons/anthropic.svg',
    'meta-llama': '/icons/meta.svg',
    'deepseek': '/icons/deepseek.svg',
    'google': '/icons/google.svg',
    'black-forest-labs': '/icons/black-forest-labs.svg',
    'alibaba': '/icons/alibabacloud.svg',
    'kwaivgi': '/icons/kling.svg',
    'bytedance': '/icons/bytedance.svg',
    'sync': '/icons/audio.svg', // Using audio icon as placeholder
  }

  return iconMap[company] || '/icons/frontrunner.svg' // Default icon
}

export type ModelCategory = 'text' | 'image' | 'video' | 'vision' | 'code'

export type InputFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'slider'
  | 'image'
  | 'messages'
  | 'boolean'      // Toggle switch for boolean values
  | 'audio'        // Audio file upload
  | 'video'        // Video file upload
  | 'imageArray'   // Multiple image uploads

export interface InputField {
  name: string
  label: string
  type: InputFieldType
  placeholder?: string
  required?: boolean
  defaultValue?: any
  min?: number
  max?: number
  step?: number
  options?: Array<{ value: string | number; label: string }> // for select fields
  multiline?: boolean // for text fields
  description?: string
  nullable?: boolean // Field can be null/undefined
  accept?: string // File input accept attribute (e.g., "image/*", "audio/*", "video/*")
  maxItems?: number // Maximum number of items for array inputs
}

export interface InputSchema {
  fields: InputField[]
  // Function to transform form data into the API request format
  transform?: (formData: Record<string, any>) => Record<string, any>
}

export type OutputType = 'text' | 'image' | 'video' | 'audio' | 'json' | 'markdown'

export interface OutputSchema {
  type: OutputType
  // Function to extract the display content from the API response
  extract?: (response: any) => any
  // Whether this output can be used as input to other models
  remixable?: boolean
}

export interface ModelConfig {
  id: string
  slug: string // URL-friendly identifier (e.g., 'gpt-4o', 'flux-schnell')
  name: string
  category: ModelCategory
  tags: string[] // e.g., ['fast', 'creative', 'conversation', 'vision']
  description: string
  icon: string
  inputSchema: InputSchema
  outputSchema: OutputSchema
  featured?: boolean // Show on home page
  available?: boolean // Enable/disable model without removing from registry
}

// ============================================================================
// GENERATION HISTORY TYPES
// ============================================================================

export interface Generation {
  id: string
  timestamp: number
  modelId: string
  modelName: string
  inputData: {
    prompt?: string
    messages?: Array<{ role: string; content: string }>
    image?: string // base64 or URL
    settings?: Record<string, any>
  }
  formData?: Record<string, any> // Original form values for remixing
  outputData: {
    type: OutputType
    content: string | string[]
  }
  metadata: {
    credits?: number
    duration: number
    status: 'succeeded' | 'failed'
    error?: string
  }
}

// ============================================================================
// MODEL REGISTRY
// ============================================================================

export const MODELS: ModelConfig[] = [
  // TEXT GENERATION MODELS
  /*{
    id: 'perplexity/llama-3.1-sonar-huge-128k-online',
    slug: 'TEST',
    name: 'TEST',
    category: 'text',
    tags: ['powerful', 'reasoning', 'analysis', 'complex', 'next-gen', 'vision', 'test'],
    description: 'Test',
    icon: getIconPath('test/test'),
    featured: true,
    available: true,
    inputSchema: {
      fields: [
        {
          name: 'system_prompt',
          label: 'System Prompt',
          type: 'textarea',
          placeholder: 'You are a helpful assistant...',
          required: false,
        },
        {
          name: 'prompt',
          label: 'Your Message',
          type: 'textarea',
          placeholder: 'Ask me anything...',
          required: true,
        },
      ],
      transform: (data) => {
        let messages = []
        if (data.system_prompt) {
          messages.push({ role: 'system', content: data.system_prompt })
        }
        messages.push({ role: 'user', content: data.prompt })
        return {
          messages: messages,
        }
      }
    },
    outputSchema: {
      type: 'text',
      extract: (response) => response.output[0],
      remixable: false,
    },
  },*/
  {
    id: 'openai/gpt-4o',
    slug: 'gpt-4o',
    name: 'GPT-4o',
    category: 'text',
    tags: ['conversation', 'reasoning', 'creative', 'long-context', 'streaming', 'vision'],
    description: 'Most capable model for complex reasoning and creative writing',
    icon: getIconPath('openai/gpt-4o'),
    featured: true,
    available: true,
    inputSchema: {
      fields: [
        {
          name: 'prompt',
          label: 'Your Message',
          type: 'textarea',
          placeholder: 'Ask me anything...',
          required: true,
        },
      ],
      transform: (data) => ({
        messages: [{ role: 'user', content: data.prompt }],
      }),
    },
    outputSchema: {
      type: 'text',
      extract: (response) => response.output[0],
      remixable: true,
    },
  },
  {
    id: 'openai/gpt-4o-mini',
    slug: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    category: 'text',
    tags: ['fast', 'conversation', 'efficient', 'streaming', 'vision'],
    description: 'Faster and more affordable for everyday tasks',
    icon: getIconPath('openai/gpt-4o-mini'),
    featured: false,
    available: true,
    inputSchema: {
      fields: [
        {
          name: 'prompt',
          label: 'Your Message',
          type: 'textarea',
          placeholder: 'Ask me anything...',
          required: true,
        },
      ],
      transform: (data) => ({
        messages: [{ role: 'user', content: data.prompt }],
      }),
    },
    outputSchema: {
      type: 'text',
      extract: (response) => response.output[0],
      remixable: true,
    },
  },

  // OpenAI GPT-4 Models
  {
    id: 'openai/gpt-4-turbo',
    slug: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    category: 'text',
    tags: ['powerful', 'reasoning', 'creative', 'streaming', 'vision'],
    description: 'Balanced speed and capability for complex tasks',
    icon: getIconPath('openai/gpt-4-turbo'),
    featured: false,
    available: true,
    inputSchema: {
      fields: [
        {
          name: 'prompt',
          label: 'Your Message',
          type: 'textarea',
          placeholder: 'Ask me anything...',
          required: true,
        },
      ],
      transform: (data) => ({
        messages: [{ role: 'user', content: data.prompt }],
      }),
    },
    outputSchema: {
      type: 'text',
      extract: (response) => response.output[0],
      remixable: true,
    },
  },
  {
    id: 'openai/gpt-3.5-turbo',
    slug: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    category: 'text',
    tags: ['fast', 'efficient', 'conversation'],
    description: 'Fast and efficient for everyday conversations',
    icon: getIconPath('openai/gpt-3.5-turbo'),
    featured: false,
    available: true,
    inputSchema: {
      fields: [
        {
          name: 'prompt',
          label: 'Your Message',
          type: 'textarea',
          placeholder: 'Ask me anything...',
          required: true,
        },
      ],
      transform: (data) => ({
        messages: [{ role: 'user', content: data.prompt }],
      }),
    },
    outputSchema: {
      type: 'text',
      extract: (response) => response.output[0],
      remixable: true,
    },
  },
  // Anthropic Claude Models
  {
    id: 'anthropic/claude-3.5-sonnet',
    slug: 'claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    category: 'text',
    tags: ['intelligent', 'reasoning', 'creative', 'analysis', 'streaming', 'vision'],
    description: 'Advanced reasoning and analysis with nuanced understanding',
    icon: getIconPath('anthropic/claude-3.5-sonnet'),
    featured: true,
    available: true,
    inputSchema: {
      fields: [
        {
          name: 'prompt',
          label: 'Your Message',
          type: 'textarea',
          placeholder: 'Ask me anything...',
          required: true,
        },
      ],
      transform: (data) => ({
        messages: [{ role: 'user', content: data.prompt }],
      }),
    },
    outputSchema: {
      type: 'text',
      extract: (response) => response.output[0],
      remixable: true,
    },
  },
  {
    id: 'anthropic/claude-3-opus',
    slug: 'claude-3-opus',
    name: 'Claude 3 Opus',
    category: 'text',
    tags: ['powerful', 'reasoning', 'analysis', 'complex', 'streaming', 'vision'],
    description: 'Most capable Claude model for highly complex tasks',
    icon: getIconPath('anthropic/claude-3-opus'),
    featured: false,
    available: true,
    inputSchema: {
      fields: [
        {
          name: 'prompt',
          label: 'Your Message',
          type: 'textarea',
          placeholder: 'Ask me anything...',
          required: true,
        },
      ],
      transform: (data) => ({
        messages: [{ role: 'user', content: data.prompt }],
      }),
    },
    outputSchema: {
      type: 'text',
      extract: (response) => response.output[0],
      remixable: true,
    },
  },
  {
    id: 'anthropic/claude-3-haiku',
    slug: 'claude-3-haiku',
    name: 'Claude 3 Haiku',
    category: 'text',
    tags: ['fast', 'efficient', 'affordable', 'streaming', 'vision'],
    description: 'Fast and efficient Claude model for quick tasks',
    icon: getIconPath('anthropic/claude-3-haiku'),
    featured: false,
    available: true,
    inputSchema: {
      fields: [
        {
          name: 'prompt',
          label: 'Your Message',
          type: 'textarea',
          placeholder: 'Ask me anything...',
          required: true,
        },
      ],
      transform: (data) => ({
        messages: [{ role: 'user', content: data.prompt }],
      }),
    },
    outputSchema: {
      type: 'text',
      extract: (response) => response.output[0],
      remixable: true,
    },
  },

  // Meta Llama Models
  {
    id: 'meta-llama/llama-3.1-70b-instruct',
    slug: 'llama-3.1-70b',
    name: 'Llama 3.1 70B',
    category: 'text',
    tags: ['powerful', 'open-source', 'reasoning', 'streaming'],
    description: 'Meta\'s powerful open-source model for complex tasks',
    icon: getIconPath('meta-llama/llama-3.1-70b-instruct'),
    featured: false,
    available: true,
    inputSchema: {
      fields: [
        {
          name: 'prompt',
          label: 'Your Message',
          type: 'textarea',
          placeholder: 'Ask me anything...',
          required: true,
        },
      ],
      transform: (data) => ({
        messages: [{ role: 'user', content: data.prompt }],
      }),
    },
    outputSchema: {
      type: 'text',
      extract: (response) => response.output[0],
      remixable: true,
    },
  },
  {
    id: 'meta-llama/llama-3.1-405b-instruct',
    slug: 'llama-3.1-405b',
    name: 'Llama 3.1 405B',
    category: 'text',
    tags: ['powerful', 'open-source', 'reasoning', 'long-context', 'streaming'],
    description: 'Meta\'s largest and most capable open-source model',
    icon: getIconPath('meta-llama/llama-3.1-405b-instruct'),
    featured: true,
    available: true,
    inputSchema: {
      fields: [
        {
          name: 'prompt',
          label: 'Your Message',
          type: 'textarea',
          placeholder: 'Ask me anything...',
          required: true,
        },
      ],
      transform: (data) => ({
        messages: [{ role: 'user', content: data.prompt }],
      }),
    },
    outputSchema: {
      type: 'text',
      extract: (response) => response.output[0],
      remixable: true,
    },
  },
  {
    id: 'meta-llama/llama-3.2-90b-vision-instruct',
    slug: 'llama-3.2-90b-vision',
    name: 'Llama 3.2 90B Vision',
    category: 'text',
    tags: ['powerful', 'open-source', 'vision', 'multimodal', 'streaming'],
    description: 'Meta\'s multimodal model with vision capabilities',
    icon: getIconPath('meta-llama/llama-3.2-90b-vision-instruct'),
    featured: false,
    available: true,
    inputSchema: {
      fields: [
        {
          name: 'prompt',
          label: 'Your Message',
          type: 'textarea',
          placeholder: 'Ask me anything...',
          required: true,
        },
      ],
      transform: (data) => ({
        messages: [{ role: 'user', content: data.prompt }],
      }),
    },
    outputSchema: {
      type: 'text',
      extract: (response) => response.output[0],
      remixable: true,
    },
  },

  // DeepSeek Models
  {
    id: 'deepseek/deepseek-chat',
    slug: 'deepseek-chat',
    name: 'DeepSeek Chat',
    category: 'text',
    tags: ['efficient', 'affordable', 'conversation', 'streaming'],
    description: 'Cost-effective Chinese model for general chat',
    icon: getIconPath('deepseek/deepseek-chat'),
    featured: false,
    available: true,
    inputSchema: {
      fields: [
        {
          name: 'prompt',
          label: 'Your Message',
          type: 'textarea',
          placeholder: 'Ask me anything...',
          required: true,
        },
      ],
      transform: (data) => ({
        messages: [{ role: 'user', content: data.prompt }],
      }),
    },
    outputSchema: {
      type: 'text',
      extract: (response) => response.output[0],
      remixable: true,
    },
  },

  // NEW GENERATION MODELS
  {
    id: 'openai/gpt-5-mini',
    slug: 'gpt-5-mini',
    name: 'GPT-5 Mini',
    category: 'text',
    tags: ['fast', 'conversation', 'efficient', 'next-gen', 'streaming', 'vision'],
    description: 'Next generation efficient model for everyday tasks',
    icon: getIconPath('openai/gpt-5-mini'),
    featured: false,
    available: true,
    inputSchema: {
      fields: [
        {
          name: 'prompt',
          label: 'Your Message',
          type: 'textarea',
          placeholder: 'Ask me anything...',
          required: true,
        },
      ],
      transform: (data) => ({
        messages: [{ role: 'user', content: data.prompt }],
      }),
    },
    outputSchema: {
      type: 'text',
      extract: (response) => response.output[0],
      remixable: true,
    },
  },
  {
    id: 'openai/gpt-5',
    slug: 'gpt-5',
    name: 'GPT-5',
    category: 'text',
    tags: ['conversation', 'reasoning', 'creative', 'next-gen', 'powerful', 'streaming', 'vision'],
    description: 'Next generation model with enhanced reasoning and creativity',
    icon: getIconPath('openai/gpt-5'),
    featured: true,
    available: true,
    inputSchema: {
      fields: [
        {
          name: 'prompt',
          label: 'Your Message',
          type: 'textarea',
          placeholder: 'Ask me anything...',
          required: true,
        },
      ],
      transform: (data) => ({
        messages: [{ role: 'user', content: data.prompt }],
      }),
    },
    outputSchema: {
      type: 'text',
      extract: (response) => response.output[0],
      remixable: true,
    },
  },
  {
    id: 'google/gemini-2.5-pro',
    slug: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    category: 'text',
    tags: ['powerful', 'reasoning', 'multimodal', 'google', 'long-context', 'streaming', 'vision'],
    description: 'Google\'s most capable model with advanced reasoning',
    icon: getIconPath('google/gemini-2.5-pro'),
    featured: true,
    available: true,
    inputSchema: {
      fields: [
        {
          name: 'prompt',
          label: 'Your Message',
          type: 'textarea',
          placeholder: 'Ask me anything...',
          required: true,
        },
      ],
      transform: (data) => ({
        messages: [{ role: 'user', content: data.prompt }],
      }),
    },
    outputSchema: {
      type: 'text',
      extract: (response) => response.output[0],
      remixable: true,
    },
  },
  {
    id: 'google/gemini-2.5-flash',
    slug: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    category: 'text',
    tags: ['fast', 'efficient', 'multimodal', 'google', 'streaming', 'vision'],
    description: 'Google\'s fast and efficient multimodal model',
    icon: getIconPath('google/gemini-2.5-flash'),
    featured: false,
    available: true,
    inputSchema: {
      fields: [
        {
          name: 'prompt',
          label: 'Your Message',
          type: 'textarea',
          placeholder: 'Ask me anything...',
          required: true,
        },
      ],
      transform: (data) => ({
        messages: [{ role: 'user', content: data.prompt }],
      }),
    },
    outputSchema: {
      type: 'text',
      extract: (response) => response.output[0],
      remixable: true,
    },
  },
  {
    id: 'anthropic/claude-opus-4.1',
    slug: 'claude-opus-4.1',
    name: 'Claude Opus 4.1',
    category: 'text',
    tags: ['powerful', 'reasoning', 'analysis', 'complex', 'next-gen', 'streaming', 'vision'],
    description: 'Enhanced Opus with improved reasoning and analysis',
    icon: getIconPath('anthropic/claude-opus-4.1'),
    featured: false,
    available: true,
    inputSchema: {
      fields: [
        {
          name: 'prompt',
          label: 'Your Message',
          type: 'textarea',
          placeholder: 'Ask me anything...',
          required: true,
        },
      ],
      transform: (data) => ({
        messages: [{ role: 'user', content: data.prompt }],
      }),
    },
    outputSchema: {
      type: 'text',
      extract: (response) => response.output[0],
      remixable: true,
    },
  },
  {
    id: 'anthropic/claude-opus-4',
    slug: 'claude-opus-4',
    name: 'Claude Opus 4',
    category: 'text',
    tags: ['powerful', 'reasoning', 'analysis', 'complex', 'next-gen', 'streaming', 'vision'],
    description: 'Next generation Opus for highly complex tasks',
    icon: getIconPath('anthropic/claude-opus-4'),
    featured: true,
    available: true,
    inputSchema: {
      fields: [
        {
          name: 'prompt',
          label: 'Your Message',
          type: 'textarea',
          placeholder: 'Ask me anything...',
          required: true,
        },
      ],
      transform: (data) => ({
        messages: [{ role: 'user', content: data.prompt }],
      }),
    },
    outputSchema: {
      type: 'text',
      extract: (response) => response.output[0],
      remixable: true,
    },
  },
  {
    id: 'anthropic/claude-sonnet-4',
    slug: 'claude-sonnet-4',
    name: 'Claude Sonnet 4',
    category: 'text',
    tags: ['intelligent', 'reasoning', 'creative', 'analysis', 'next-gen', 'streaming', 'vision'],
    description: 'Next generation Sonnet with enhanced capabilities',
    icon: getIconPath('anthropic/claude-sonnet-4'),
    featured: true,
    available: true,
    inputSchema: {
      fields: [
        {
          name: 'prompt',
          label: 'Your Message',
          type: 'textarea',
          placeholder: 'Ask me anything...',
          required: true,
        },
      ],
      transform: (data) => ({
        messages: [{ role: 'user', content: data.prompt }],
      }),
    },
    outputSchema: {
      type: 'text',
      extract: (response) => response.output[0],
      remixable: true,
    },
  },

  // IMAGE GENERATION MODELS
  {
    id: 'black-forest-labs/flux-schnell',
    slug: 'flux-schnell',
    name: 'FLUX Schnell',
    category: 'image',
    tags: ['fast', 'high-quality', 'creative'],
    description: 'Fast, high-quality image generation with 4-step inference',
    icon: getIconPath('black-forest-labs/flux-schnell'),
    featured: false,
    available: true,
    inputSchema: {
      fields: [
        {
          name: 'prompt',
          label: 'Prompt',
          type: 'textarea',
          placeholder: 'A beautiful sunset over mountains...',
          required: true,
          description: 'Prompt for generated image',
        },
        {
          name: 'aspect_ratio',
          label: 'Aspect Ratio',
          type: 'select',
          defaultValue: '1:1',
          options: [
            { value: '1:1', label: 'Square (1:1)' },
            { value: '16:9', label: 'Landscape (16:9)' },
            { value: '21:9', label: 'Ultrawide (21:9)' },
            { value: '9:16', label: 'Portrait (9:16)' },
            { value: '9:21', label: 'Tall Portrait (9:21)' },
            { value: '4:3', label: 'Standard (4:3)' },
            { value: '3:4', label: 'Portrait (3:4)' },
          ],
        },
        {
          name: 'num_outputs',
          label: 'Number of Images',
          type: 'slider',
          min: 1,
          max: 4,
          step: 1,
          defaultValue: 1,
        },
        {
          name: 'num_inference_steps',
          label: 'Inference Steps',
          type: 'slider',
          min: 1,
          max: 4,
          step: 1,
          defaultValue: 4,
          description: '4 is recommended, lower = faster but lower quality',
        },
        {
          name: 'seed',
          label: 'Seed',
          type: 'number',
          nullable: true,
          description: 'Random seed for reproducible generation',
        },
        {
          name: 'output_format',
          label: 'Output Format',
          type: 'select',
          defaultValue: 'webp',
          options: [
            { value: 'webp', label: 'WebP' },
            { value: 'jpg', label: 'JPEG' },
            { value: 'png', label: 'PNG' },
          ],
        },
        {
          name: 'output_quality',
          label: 'Output Quality',
          type: 'slider',
          min: 0,
          max: 100,
          step: 1,
          defaultValue: 80,
          description: '0-100, not relevant for PNG',
        },
        {
          name: 'go_fast',
          label: 'Fast Mode (FP8)',
          type: 'boolean',
          defaultValue: true,
          description: 'Use FP8 quantized model for speed (non-deterministic)',
        },
        {
          name: 'megapixels',
          label: 'Megapixels',
          type: 'select',
          defaultValue: '1',
          options: [
            { value: '0.25', label: '0.25 MP' },
            { value: '1', label: '1 MP' },
          ],
        },
        {
          name: 'disable_safety_checker',
          label: 'Disable Safety Checker',
          type: 'boolean',
          defaultValue: false,
        },
      ],
    },
    outputSchema: {
      type: 'image',
      extract: (response) => response.output,
      remixable: true,
    },
  },
  {
    id: 'black-forest-labs/flux-kontext-max',
    slug: 'flux-kontext-max',
    name: 'FLUX Kontext Max',
    category: 'image',
    tags: ['high-quality', 'creative', 'image-to-image', 'editing'],
    description: 'Advanced image generation and editing with reference image support',
    icon: getIconPath('black-forest-labs/flux-kontext-max'),
    featured: true,
    available: true,
    inputSchema: {
      fields: [
        {
          name: 'prompt',
          label: 'Prompt',
          type: 'textarea',
          placeholder: 'Describe what you want to generate or how to edit the image...',
          required: true,
          description: 'Text description or editing instruction',
        },
        {
          name: 'input_image',
          label: 'Input Image (optional)',
          type: 'image',
          nullable: true,
          description: 'Reference image for editing or style transfer',
        },
        {
          name: 'aspect_ratio',
          label: 'Aspect Ratio',
          type: 'select',
          defaultValue: 'match_input_image',
          options: [
            { value: '1:1', label: 'Square (1:1)' },
            { value: '16:9', label: 'Landscape (16:9)' },
            { value: '9:16', label: 'Portrait (9:16)' },
            { value: '4:3', label: 'Standard (4:3)' },
            { value: '3:4', label: 'Portrait (3:4)' },
            { value: 'match_input_image', label: 'Match Input Image' },
          ],
          description: 'Aspect ratio (use match_input_image with reference image)',
        },
        {
          name: 'output_format',
          label: 'Output Format',
          type: 'select',
          defaultValue: 'png',
          options: [
            { value: 'png', label: 'PNG' },
            { value: 'jpg', label: 'JPEG' },
            { value: 'webp', label: 'WebP' },
          ],
        },
        {
          name: 'prompt_upsampling',
          label: 'Prompt Upsampling',
          type: 'boolean',
          defaultValue: false,
          description: 'Automatic prompt improvement',
        },
        {
          name: 'safety_tolerance',
          label: 'Safety Tolerance',
          type: 'slider',
          min: 0,
          max: 6,
          step: 1,
          defaultValue: 2,
          description: 'Safety tolerance (0=strict, 6=permissive, max 2 with input images)',
        },
        {
          name: 'seed',
          label: 'Seed',
          type: 'number',
          nullable: true,
          description: 'Random seed for reproducible generation',
        },
      ],
    },
    outputSchema: {
      type: 'image',
      extract: (response) => response.output,
      remixable: true,
    },
  },
  {
    id: 'google/nano-banana',
    slug: 'nano-banana',
    name: 'Nano Banana',
    category: 'image',
    tags: ['fast', 'multimodal', 'google'],
    description: 'Google\'s nano model for fast image generation',
    icon: getIconPath('google/nano-banana'),
    featured: false,
    available: true,
    inputSchema: {
      fields: [
        {
          name: 'prompt',
          label: 'Prompt',
          type: 'textarea',
          placeholder: 'A text description of the image...',
          required: true,
        },
        {
          name: 'image_input',
          label: 'Input Images (reference)',
          type: 'imageArray',
          nullable: true,
          maxItems: 3,
          description: 'Input images to transform or use as reference',
        },
        {
          name: 'aspect_ratio',
          label: 'Aspect Ratio',
          type: 'select',
          defaultValue: 'match_input_image',
          options: [
            { value: '1:1', label: 'Square (1:1)' },
            { value: '16:9', label: 'Landscape (16:9)' },
            { value: '9:16', label: 'Portrait (9:16)' },
            { value: '4:3', label: 'Standard (4:3)' },
            { value: '3:4', label: 'Portrait (3:4)' },
            { value: 'match_input_image', label: 'Match Input Image' },
          ],
        },
        {
          name: 'output_format',
          label: 'Output Format',
          type: 'select',
          defaultValue: 'jpg',
          options: [
            { value: 'jpg', label: 'JPEG' },
            { value: 'png', label: 'PNG' },
          ],
        },
      ],
    },
    outputSchema: {
      type: 'image',
      extract: (response) => response.output,
      remixable: true,
    },
  },

  // AUDIO GENERATION MODELS

  // VIDEO GENERATION MODELS
  {
    id: 'wan-video/wan-2.2-5b-fast',
    slug: 'wan-2.2-5b-fast',
    name: 'Wan Video 2.2 Fast',
    category: 'video',
    tags: ['fast', 'text-to-video', 'image-to-video'],
    description: 'Fast text-to-video and image-to-video generation',
    icon: '/icons/wan-qwen.svg',
    featured: true,
    available: true,
    inputSchema: {
      fields: [
        {
          name: 'prompt',
          label: 'Prompt',
          type: 'textarea',
          placeholder: 'A robot dancing in the rain...',
          required: true,
        },
        {
          name: 'image',
          label: 'Input Image (optional)',
          type: 'image',
          nullable: true,
          description: 'Input image to generate video from',
        },
        {
          name: 'num_frames',
          label: 'Number of Frames',
          type: 'slider',
          min: 81,
          max: 121,
          step: 1,
          defaultValue: 121,
          description: '81 frames give the best results',
        },
        {
          name: 'resolution',
          label: 'Resolution',
          type: 'select',
          defaultValue: '720p',
          options: [
            { value: '480p', label: '480p' },
            { value: '720p', label: '720p' },
          ],
        },
        {
          name: 'aspect_ratio',
          label: 'Aspect Ratio',
          type: 'select',
          defaultValue: '16:9',
          options: [
            { value: '16:9', label: '16:9 (Landscape)' },
            { value: '9:16', label: '9:16 (Portrait)' },
          ],
          description: '16:9 = 832x480px, 9:16 = 480x832px',
        },
        {
          name: 'frames_per_second',
          label: 'Frames Per Second',
          type: 'slider',
          min: 5,
          max: 30,
          step: 1,
          defaultValue: 24,
          description: 'Pricing based on 16 fps',
        },
        {
          name: 'go_fast',
          label: 'Fast Mode',
          type: 'boolean',
          defaultValue: true,
        },
        {
          name: 'disable_safety_checker',
          label: 'Disable Safety Checker',
          type: 'boolean',
          defaultValue: false,
        },
        {
          name: 'seed',
          label: 'Seed (optional)',
          type: 'number',
          nullable: true,
        },
      ],
    },
    outputSchema: {
      type: 'video',
      extract: (response) => response.output,
      remixable: true,
    },
  },
  {
    id: 'wan-video/wan-2.5-i2v',
    slug: 'wan-2.5-i2v',
    name: 'Wan Video 2.5 I2V',
    category: 'video',
    tags: ['image-to-video', 'audio-sync', 'high-quality'],
    description: 'Image-to-video with optional audio synchronization',
    icon: '/icons/wan-qwen.svg',
    featured: false,
    available: true,
    inputSchema: {
      fields: [
        {
          name: 'prompt',
          label: 'Prompt',
          type: 'textarea',
          placeholder: 'A person walking through a forest...',
          required: true,
        },
        {
          name: 'image',
          label: 'Input Image',
          type: 'image',
          required: true,
          description: 'Input image for video generation',
        },
        {
          name: 'audio',
          label: 'Audio File (optional)',
          type: 'audio',
          nullable: true,
          description: 'Audio file (wav/mp3, 3-30s) for voice/music sync',
        },
        {
          name: 'negative_prompt',
          label: 'Negative Prompt',
          type: 'textarea',
          placeholder: 'Things to avoid...',
        },
        {
          name: 'duration',
          label: 'Duration (seconds)',
          type: 'select',
          defaultValue: 5,
          options: [
            { value: 5, label: '5 seconds' },
            { value: 10, label: '10 seconds' },
          ],
        },
        {
          name: 'resolution',
          label: 'Resolution',
          type: 'select',
          defaultValue: '720p',
          options: [
            { value: '480p', label: '480p' },
            { value: '720p', label: '720p' },
            { value: '1080p', label: '1080p' },
          ],
        },
        {
          name: 'enable_prompt_expansion',
          label: 'Enable Prompt Expansion',
          type: 'boolean',
          defaultValue: true,
          description: 'Use prompt optimizer',
        },
        {
          name: 'seed',
          label: 'Seed (optional)',
          type: 'number',
          nullable: true,
        },
      ],
    },
    outputSchema: {
      type: 'video',
      extract: (response) => response.output,
      remixable: true,
    },
  },
  {
    id: 'kwaivgi/kling-v2.5-turbo-pro',
    slug: 'kling-v2.5-turbo-pro',
    name: 'Kling v2.5 Turbo Pro',
    category: 'video',
    tags: ['text-to-video', 'image-to-video', 'fast', 'high-quality'],
    description: 'Fast, high-quality video generation',
    icon: getIconPath('kwaivgi/kling-v2.5-turbo-pro'),
    featured: false,
    available: true,
    inputSchema: {
      fields: [
        {
          name: 'prompt',
          label: 'Prompt',
          type: 'textarea',
          placeholder: 'A cinematic shot of...',
          required: true,
        },
        {
          name: 'negative_prompt',
          label: 'Negative Prompt',
          type: 'textarea',
          placeholder: 'Things to avoid...',
        },
        {
          name: 'start_image',
          label: 'First Frame Image (optional)',
          type: 'image',
          nullable: true,
        },
        {
          name: 'aspect_ratio',
          label: 'Aspect Ratio',
          type: 'select',
          defaultValue: '16:9',
          options: [
            { value: '16:9', label: '16:9 (Landscape)' },
            { value: '9:16', label: '9:16 (Portrait)' },
            { value: '1:1', label: '1:1 (Square)' },
          ],
          description: 'Ignored if start_image is provided',
        },
        {
          name: 'duration',
          label: 'Duration (seconds)',
          type: 'select',
          defaultValue: 5,
          options: [
            { value: 5, label: '5 seconds' },
            { value: 10, label: '10 seconds' },
          ],
        },
      ],
    },
    outputSchema: {
      type: 'video',
      extract: (response) => response.output,
      remixable: true,
    },
  },
  {
    id: 'openai/sora-2',
    slug: 'sora-2',
    name: 'Sora 2',
    category: 'video',
    tags: ['text-to-video', 'openai', 'high-quality'],
    description: 'OpenAI\'s advanced text-to-video model',
    icon: getIconPath('openai/sora-2'),
    featured: true,
    available: true,
    inputSchema: {
      fields: [
        {
          name: 'prompt',
          label: 'Prompt',
          type: 'textarea',
          placeholder: 'A text description of the video...',
          required: true,
        },
        {
          name: 'input_reference',
          label: 'Reference Image (optional)',
          type: 'image',
          nullable: true,
          description: 'Optional image to use as first frame (must match aspect ratio)',
        },
        {
          name: 'seconds',
          label: 'Duration (seconds)',
          type: 'select',
          defaultValue: 4,
          options: [
            { value: 4, label: '4 seconds' },
            { value: 8, label: '8 seconds' },
            { value: 12, label: '12 seconds' },
          ],
        },
        {
          name: 'aspect_ratio',
          label: 'Aspect Ratio',
          type: 'select',
          defaultValue: 'portrait',
          options: [
            { value: 'portrait', label: 'Portrait (720x1280)' },
            { value: 'landscape', label: 'Landscape (1280x720)' },
          ],
        },
      ],
    },
    outputSchema: {
      type: 'video',
      extract: (response) => response.output,
      remixable: true,
    },
  },
  /*{ // Currently disabled models due to replicate API mystery
    id: 'openai/sora-2-pro-standard',
    slug: 'sora-2-pro-standard',
    name: 'Sora 2 Pro (Standard Res)',
    category: 'video',
    tags: ['text-to-video', 'image-to-video', 'openai', 'high-quality', '720p'],
    description: 'OpenAI\'s professional video model with 720p standard resolution',
    icon: getIconPath('openai/sora-2-pro-standard'),
    featured: true,
    available: true,
    inputSchema: {
      fields: [
        {
          name: 'prompt',
          label: 'Prompt',
          type: 'textarea',
          placeholder: 'A text description of the video...',
          required: true,
          description: 'A text description of the video to generate',
        },
        {
          name: 'input_reference',
          label: 'Reference Image (optional)',
          type: 'image',
          nullable: true,
          description: 'Optional image to use as first frame (must match aspect ratio)',
        },
        {
          name: 'seconds',
          label: 'Duration (seconds)',
          type: 'select',
          defaultValue: 4,
          options: [
            { value: 4, label: '4 seconds' },
            { value: 8, label: '8 seconds' },
            { value: 12, label: '12 seconds' },
          ],
          description: 'Duration of the video in seconds',
        },
        {
          name: 'aspect_ratio',
          label: 'Aspect Ratio',
          type: 'select',
          defaultValue: 'portrait',
          options: [
            { value: 'portrait', label: 'Portrait (720x1280)' },
            { value: 'landscape', label: 'Landscape (1280x720)' },
          ],
          description: 'Portrait is 720x1280, landscape is 1280x720',
        },
      ],
    },
    outputSchema: {
      type: 'video',
      extract: (response) => response.output,
      remixable: true,
    },
  },
  {
    id: 'openai/sora-2-pro-high',
    slug: 'sora-2-pro-high',
    name: 'Sora 2 Pro (High Res)',
    category: 'video',
    tags: ['text-to-video', 'image-to-video', 'openai', 'high-quality', '1024p'],
    description: 'OpenAI\'s professional video model with 1024p high resolution',
    icon: getIconPath('openai/sora-2-pro-high'),
    featured: true,
    available: true,
    inputSchema: {
      fields: [
        {
          name: 'prompt',
          label: 'Prompt',
          type: 'textarea',
          placeholder: 'A text description of the video...',
          required: true,
          description: 'A text description of the video to generate',
        },
        {
          name: 'input_reference',
          label: 'Reference Image (optional)',
          type: 'image',
          nullable: true,
          description: 'Optional image to use as first frame (must match aspect ratio)',
        },
        {
          name: 'seconds',
          label: 'Duration (seconds)',
          type: 'select',
          defaultValue: 4,
          options: [
            { value: 4, label: '4 seconds' },
            { value: 8, label: '8 seconds' },
            { value: 12, label: '12 seconds' },
          ],
          description: 'Duration of the video in seconds',
        },
        {
          name: 'aspect_ratio',
          label: 'Aspect Ratio',
          type: 'select',
          defaultValue: 'portrait',
          options: [
            { value: 'portrait', label: 'Portrait (720x1280)' },
            { value: 'landscape', label: 'Landscape (1280x720)' },
          ],
          description: 'Portrait is 720x1280, landscape is 1280x720',
        },
      ],
    },
    outputSchema: {
      type: 'video',
      extract: (response) => response.output,
      remixable: true,
    },
  },*/
  {
    id: 'bytedance/seedance-1-lite',
    slug: 'seedance-1-lite',
    name: 'SeeDance 1 Lite',
    category: 'video',
    tags: ['text-to-video', 'image-to-video', 'dance', 'animation'],
    description: 'Fast video generation with character consistency',
    icon: getIconPath('bytedance/seedance-1-lite'),
    featured: false,
    available: true,
    inputSchema: {
      fields: [
        {
          name: 'prompt',
          label: 'Prompt',
          type: 'textarea',
          placeholder: 'A person dancing gracefully...',
          required: true,
        },
        {
          name: 'image',
          label: 'First Frame Image (optional)',
          type: 'image',
          nullable: true,
          description: 'Input image for image-to-video',
        },
        {
          name: 'last_frame_image',
          label: 'Last Frame Image (optional)',
          type: 'image',
          nullable: true,
          description: 'Only works with first frame image',
        },
        {
          name: 'reference_images',
          label: 'Reference Images (1-4)',
          type: 'imageArray',
          nullable: true,
          maxItems: 4,
          description: 'Guide generation for characters, clothing, environments. Cannot use with 1080p or frame images.',
        },
        {
          name: 'duration',
          label: 'Duration (seconds)',
          type: 'slider',
          min: 2,
          max: 12,
          step: 1,
          defaultValue: 5,
        },
        {
          name: 'resolution',
          label: 'Resolution',
          type: 'select',
          defaultValue: '720p',
          options: [
            { value: '480p', label: '480p' },
            { value: '720p', label: '720p' },
          ],
          description: '1080p not available with reference images',
        },
        {
          name: 'aspect_ratio',
          label: 'Aspect Ratio',
          type: 'select',
          defaultValue: '16:9',
          options: [
            { value: '16:9', label: '16:9' },
            { value: '9:16', label: '9:16' },
            { value: '1:1', label: '1:1' },
          ],
          description: 'Ignored if image is provided',
        },
        /*{
          name: 'fps',
          label: 'Frames Per Second',
          type: 'select',
          defaultValue: 24,
          options: [
            { value: 16, label: '16 FPS' },
            { value: 24, label: '24 FPS' },
            { value: 30, label: '30 FPS' },
          ],
        },*/ // FPS fixed at 24 apparently, removing option
        {
          name: 'camera_fixed',
          label: 'Fixed Camera',
          type: 'boolean',
          defaultValue: false,
        },
        {
          name: 'seed',
          label: 'Seed (optional)',
          type: 'number',
          nullable: true,
        },
      ],
    },
    outputSchema: {
      type: 'video',
      extract: (response) => response.output,
      remixable: true,
    },
  },
  {
    id: 'bytedance/seedance-1-pro',
    slug: 'seedance-1-pro',
    name: 'SeeDance 1 Pro',
    category: 'video',
    tags: ['text-to-video', 'image-to-video', 'dance', 'animation', 'high-quality'],
    description: 'High-quality video generation with character consistency',
    icon: getIconPath('bytedance/seedance-1-pro'),
    featured: false,
    available: true,
    inputSchema: {
      fields: [
        {
          name: 'prompt',
          label: 'Prompt',
          type: 'textarea',
          placeholder: 'A person dancing gracefully...',
          required: true,
        },
        {
          name: 'image',
          label: 'First Frame Image (optional)',
          type: 'image',
          nullable: true,
          description: 'Input image for image-to-video',
        },
        {
          name: 'last_frame_image',
          label: 'Last Frame Image (optional)',
          type: 'image',
          nullable: true,
          description: 'Only works with first frame image',
        },
        {
          name: 'duration',
          label: 'Duration (seconds)',
          type: 'slider',
          min: 2,
          max: 12,
          step: 1,
          defaultValue: 5,
        },
        {
          name: 'resolution',
          label: 'Resolution',
          type: 'select',
          defaultValue: '1080p',
          options: [
            { value: '480p', label: '480p' },
            { value: '720p', label: '720p' },
            { value: '1080p', label: '1080p' },
          ],
        },
        {
          name: 'aspect_ratio',
          label: 'Aspect Ratio',
          type: 'select',
          defaultValue: '16:9',
          options: [
            { value: '16:9', label: '16:9' },
            { value: '9:16', label: '9:16' },
            { value: '1:1', label: '1:1' },
          ],
          description: 'Ignored if image is provided',
        },
        {
          name: 'camera_fixed',
          label: 'Fixed Camera',
          type: 'boolean',
          defaultValue: false,
        },
        {
          name: 'seed',
          label: 'Seed (optional)',
          type: 'number',
          nullable: true,
        },
      ],
    },
    outputSchema: {
      type: 'video',
      extract: (response) => response.output,
      remixable: true,
    },
  },
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getModelById(id: string): ModelConfig | undefined {
  return MODELS.find((m) => m.id === id)
}

export function getModelBySlug(slug: string): ModelConfig | undefined {
  return MODELS.find((m) => m.slug === slug)
}

export function getModelsByCategory(category: ModelCategory): ModelConfig[] {
  return MODELS.filter((m) => m.category === category && m.available !== false)
}

export function getModelsByTag(tag: string): ModelConfig[] {
  return MODELS.filter((m) => m.tags.includes(tag) && m.available !== false)
}

export function getFeaturedModels(): ModelConfig[] {
  return MODELS.filter((m) => m.featured && m.available !== false)
}

export function getAllCategories(): ModelCategory[] {
  return Array.from(new Set(MODELS.map((m) => m.category)))
}

export function getAllTags(): string[] {
  return Array.from(new Set(MODELS.flatMap((m) => m.tags)))
}
