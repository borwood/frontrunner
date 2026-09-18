import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import { useTheme } from '../theme/ThemeContext'
import { useUnifiedStorage } from '../hooks/useUnifiedStorage'
import { useFavorites } from '../contexts/FavoritesContext'
import { useGenerationQueue } from '../contexts/GenerationQueueContext'
import { useChat } from '../contexts/ChatContext'
import { DynamicInputForm } from '../components/DynamicInputForm'
import { PaginatedInputForm } from '../components/PaginatedInputForm'
import { DynamicOutputRenderer } from '../components/DynamicOutputRenderer'
import { FavoriteButton } from '../components/FavoriteButton'
import { GenerationModal } from '../components/GenerationModal'
import { MobileGrid, DesktopMasonryGrid } from '../components/grids'
import { Modal } from '../components/Modal'
import { SignInPromptModal } from '../components/SignInPromptModal'
import { CompactModelCard } from '../components/CompactModelCard'
import { getModelBySlug, getModelById } from '../types/models'
import { useAvailableFormHeight, useDynamicPagination, MOBILE_RUNNER_HEIGHTS } from '../hooks/useDynamicPagination'
import type { Generation } from '../types/models'

interface Template {
  id: string
  name: string
  modelId: string
  params: Record<string, any>
  createdAt: number
}

export function ModelRunner() {
  const { modelId } = useParams<{ modelId: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { client, usage, isSignedIn, signIn } = useUser()
  const { theme } = useTheme()
  const { isFavorite, toggleFavorite } = useFavorites()
  const { queueGeneration } = useGenerationQueue()
  const { createConversation } = useChat()
  const [generations] = useUnifiedStorage('generations', [], { skipLocalStorage: true })
  const [templates, setTemplates] = useUnifiedStorage('modelTemplates', [])

  // Check for remix/formData parameters in URL
  const remixPrompt = searchParams.get('remix')
  const formDataParam = searchParams.get('formData')

  // Initialize formData state with URL params if available
  const getInitialFormData = () => {
    if (formDataParam) {
      try {
        return JSON.parse(decodeURIComponent(formDataParam))
      } catch (e) {
        console.error('Failed to parse initial formData param:', e)
        return {}
      }
    }
    return {}
  }

  const [formData, setFormData] = useState<Record<string, any>>(getInitialFormData)
  const [formKey, setFormKey] = useState(0) // Counter to force form remount
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showLoadModal, setShowLoadModal] = useState(false)
  const [showSignInPrompt, setShowSignInPrompt] = useState(false)
  const [templateName, setTemplateName] = useState('')

  // Get model by slug (URL-friendly identifier like 'gpt-4o')
  const model = modelId ? getModelBySlug(modelId) : undefined

  // Persist current model and form data to sessionStorage
  useEffect(() => {
    if (model && modelId) {
      sessionStorage.setItem('lastRunnerModel', modelId)
      sessionStorage.setItem('lastRunnerFormData', JSON.stringify(formData))
    }
  }, [model, modelId, formData])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [output, setOutput] = useState<any | null>(null)
  const [selectedGeneration, setSelectedGeneration] = useState<Generation | null>(null)

  // Mobile pagination state
  const [currentPage, setCurrentPage] = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  // Filter generations for this specific model
  const modelGenerations = useMemo(() => {
    return generations.filter((gen) => gen.modelId === model?.id)
  }, [generations, model?.id])

  // Dynamic pagination based on available height
  const availableFormHeight = useAvailableFormHeight()
  const { paginatedFields, totalPages } = useDynamicPagination({
    fields: model?.inputSchema.fields || [],
    availableHeight: availableFormHeight,
  })

  // Reset to first page when model changes
  useEffect(() => {
    setCurrentPage(0)
  }, [model?.id])

  // Auto-open modal on mobile when new generation completes
  useEffect(() => {
    if (modelGenerations.length > 0 && !selectedGeneration) {
      // Get the most recent generation
      const latestGeneration = modelGenerations[0]
      // Only auto-open if it's very recent (within last 5 seconds)
      const isRecent = Date.now() - latestGeneration.timestamp < 5000

      if (isRecent) {
        setSelectedGeneration(latestGeneration)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelGenerations])

  // Swipe handlers for mobile
  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return
    setTouchEnd(e.targetTouches[0].clientX)
    // Note: touchAction: 'pan-y' CSS property handles preventing horizontal browser navigation
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe && currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1)
    }
    if (isRightSwipe && currentPage > 0) {
      setCurrentPage(currentPage - 1)
    }
  }

  if (!model) {
    return (
      <>
        <div style={{ padding: theme.spacing.lg }}>
          <p>Model not found</p>
        </div>
      </>
    )
  }

  const handleGenerate = async (formData: Record<string, any>) => {
    // Check authentication before generating
    if (!isSignedIn) {
      setShowSignInPrompt(true)
      return
    }

    if (!client) return

    setLoading(true)
    setError(null)
    setOutput(null)

    const startTime = Date.now()

    try {
      // Transform form data to API input format
      const input = model.inputSchema.transform
        ? model.inputSchema.transform(formData)
        : formData

      // Run the model and queue it for app-level handling
      const runResult = client.run(model.id, { input })
      const promise = Promise.resolve(runResult)

      // Queue the generation - this will be handled even if we navigate away
      queueGeneration(
        {
          id: `temp_${Date.now()}`, // Temporary ID, will be replaced with response.id
          modelId: model.id,
          modelName: model.name,
          inputData: formData,
          outputType: model.outputSchema.type,
          formData,
          startTime,
          extractFn: model.outputSchema.extract,
        },
        promise
      )

      // Wait for response to display output (but save happens in queue)
      const response = await promise

      // Extract output for display
      const extractedOutput = model.outputSchema.extract
        ? model.outputSchema.extract(response)
        : response.output

      setOutput(extractedOutput)

      // Refresh usage in background
      await usage.refreshUsage()
    } catch (err: any) {
      setError(err.message || 'Generation failed')
    } finally {
      setLoading(false)
    }
  }

  const handleRemix = (content: string) => {
    // Navigate to a text model with the content as prompt
    // Get GPT-4o by ID and use its slug for routing
    const textModel = getModelById('openai/gpt-4o')
    if (!textModel) return
    navigate(`/runners/${textModel.slug}?remix=${encodeURIComponent(content)}`)
  }

  const handleStartChat = (formData: Record<string, any>) => {
    if (!model) return

    // Get the prompt from the form data
    const prompt = formData.prompt || ''
    if (!prompt.trim()) return

    // Create a new conversation with this model
    createConversation(model.id, model.name)

    // Navigate to chat page with autoSend flag
    navigate('/chat', { state: { autoSend: prompt } })
  }

  // Template management functions
  const modelTemplates = useMemo(() => {
    return templates.filter((t) => t.modelId === model?.id)
  }, [templates, model?.id])

  const handleSaveTemplate = () => {
    if (!model || !templateName.trim()) return

    const newTemplate: Template = {
      id: `template_${Date.now()}`,
      name: templateName.trim(),
      modelId: model.id,
      params: formData,
      createdAt: Date.now(),
    }

    setTemplates([...templates, newTemplate])
    setTemplateName('')
    setShowSaveModal(false)
  }

  const handleLoadTemplate = (template: Template) => {
    setFormData(template.params)
    setShowLoadModal(false)
  }

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(templates.filter((t) => t.id !== templateId))
  }

  // Restore form data from URL params or sessionStorage on mount
  useEffect(() => {
    // Priority 1: formData from URL (remix with full form data)
    if (formDataParam) {
      try {
        const parsedFormData = JSON.parse(decodeURIComponent(formDataParam))
        setFormData(parsedFormData)
        setFormKey(prev => prev + 1) // Increment to force form remount
        // Clear URL params after loading to prevent re-applying on subsequent remounts
        navigate(`/runners/${modelId}`, { replace: true })
        return
      } catch (e) {
        console.error('Failed to parse formData param:', e)
      }
    }

    // Priority 2: remix prompt from URL (legacy support)
    if (remixPrompt) {
      setFormData({ prompt: remixPrompt })
      // Clear URL params after loading
      navigate(`/runners/${modelId}`, { replace: true })
      return
    }

    // Priority 3: Restore from sessionStorage (only if same model)
    const lastModel = sessionStorage.getItem('lastRunnerModel')
    const lastFormDataStr = sessionStorage.getItem('lastRunnerFormData')
    if (lastModel === modelId && lastFormDataStr) {
      try {
        const lastFormData = JSON.parse(lastFormDataStr)
        setFormData(lastFormData)
      } catch (e) {
        console.error('Failed to restore form data:', e)
      }
    }
  }, [modelId, searchParams, navigate])

  // Set initial form values based on URL params
  const initialFormValues = useMemo(() => {
    if (formDataParam) {
      try {
        return JSON.parse(decodeURIComponent(formDataParam))
      } catch (e) {
        console.error('Failed to parse formData param for initialValues:', e)
        return {}
      }
    }
    if (remixPrompt) {
      return { prompt: remixPrompt }
    }
    return {}
  }, [formDataParam, remixPrompt])

  // Determine if we should show the "Start Chat" button (for text models)
  const isTextModel = model?.outputSchema.type === 'text'
  const secondaryAction = isTextModel ? {
    label: 'Start Chat →',
    onClick: handleStartChat
  } : undefined

  // Template controls UI
  const templateControls = (
    <div style={{ display: 'flex', gap: theme.spacing.xs }}>
      <button
        type="button"
        onClick={() => setShowSaveModal(true)}
        style={{
          flex: 1,
          padding: `${theme.spacing.sm} ${theme.spacing.md}`,
          fontSize: theme.typography.sizes.sm,
          fontWeight: theme.typography.weights.medium,
          color: theme.colors.text,
          backgroundColor: theme.colors.surface,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.borderRadius.md,
          cursor: 'pointer',
          transition: `all ${theme.transitions.fast}`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = theme.colors.primary
          e.currentTarget.style.backgroundColor = theme.colors.backgroundElevated
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = theme.colors.border
          e.currentTarget.style.backgroundColor = theme.colors.surface
        }}
      >
        Save Template
      </button>
      <button
        type="button"
        onClick={() => setShowLoadModal(true)}
        disabled={modelTemplates.length === 0}
        style={{
          flex: 1,
          padding: `${theme.spacing.sm} ${theme.spacing.md}`,
          fontSize: theme.typography.sizes.sm,
          fontWeight: theme.typography.weights.medium,
          color: modelTemplates.length === 0 ? theme.colors.textTertiary : theme.colors.text,
          backgroundColor: theme.colors.surface,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.borderRadius.md,
          cursor: modelTemplates.length === 0 ? 'not-allowed' : 'pointer',
          transition: `all ${theme.transitions.fast}`,
        }}
        onMouseEnter={(e) => {
          if (modelTemplates.length > 0) {
            e.currentTarget.style.borderColor = theme.colors.primary
            e.currentTarget.style.backgroundColor = theme.colors.backgroundElevated
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = theme.colors.border
          e.currentTarget.style.backgroundColor = theme.colors.surface
        }}
      >
        Load Template {modelTemplates.length > 0 && `(${modelTemplates.length})`}
      </button>
    </div>
  )

  return (
    <>
      {/* Desktop version - unchanged */}
      <div className="desktop-runner" style={{ padding: theme.spacing.lg, maxWidth: '1200px', margin: '0 auto' }}>
        {/* Back Button */}
        <button
          onClick={() => {
            sessionStorage.removeItem('lastRunnerModel')
            sessionStorage.removeItem('lastRunnerFormData')
            navigate('/runners')
          }}
          style={{
            marginBottom: theme.spacing.lg,
            padding: `${theme.spacing.sm} ${theme.spacing.md}`,
            fontSize: theme.typography.sizes.sm,
            fontWeight: theme.typography.weights.medium,
            color: theme.colors.textSecondary,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.xs,
          }}
        >
          ← Back to Runners
        </button>

        {/* Remix Badge */}
        {(remixPrompt || formDataParam) && (
          <div
            style={{
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              backgroundColor: `${theme.colors.primary}15`,
              border: `1px solid ${theme.colors.primary}30`,
              borderRadius: theme.borderRadius.md,
              marginBottom: theme.spacing.md,
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.sm,
            }}
          >
            <span style={{ fontSize: '20px' }}>🔄</span>
            <span
              style={{
                fontSize: theme.typography.sizes.sm,
                color: theme.colors.text,
                fontWeight: theme.typography.weights.medium,
              }}
            >
              Reprompting previous generation
            </span>
          </div>
        )}

        {/* Model Info */}
        <div
          style={{
            padding: theme.spacing.lg,
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.lg,
            border: `1px solid ${theme.colors.border}`,
            marginBottom: theme.spacing.lg,
            position: 'relative',
          }}
        >
          {/* Favorite button in top-right corner */}
          <div style={{ position: 'absolute', top: theme.spacing.md, right: theme.spacing.md }}>
            <FavoriteButton
              isFavorite={isFavorite(model.id)}
              onToggle={() => toggleFavorite(model.id)}
              size="lg"
            />
          </div>

          {model.icon && (
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: theme.borderRadius.full,
              background: `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: theme.spacing.md,
              padding: theme.spacing.sm,
            }}>
              <img
                src={model.icon}
                alt={`${model.name} icon`}
                style={{
                  width: '70%',
                  height: '70%',
                  objectFit: 'contain',
                  filter: 'brightness(0) invert(1)',
                }}
              />
            </div>
          )}
          <h1
            style={{
              fontSize: theme.typography.sizes.xxl,
              fontWeight: theme.typography.weights.bold,
              color: theme.colors.text,
              marginBottom: theme.spacing.sm,
            }}
          >
            {model.name}
          </h1>
          <p
            style={{
              fontSize: theme.typography.sizes.base,
              color: theme.colors.textSecondary,
              marginBottom: theme.spacing.sm,
            }}
          >
            {model.description}
          </p>

          {/* Tags */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: theme.spacing.xs,
              marginBottom: theme.spacing.sm,
            }}
          >
            {model.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  padding: `2px ${theme.spacing.sm}`,
                  fontSize: theme.typography.sizes.xs,
                  fontWeight: theme.typography.weights.medium,
                  color: theme.colors.primary,
                  backgroundColor: `${theme.colors.primary}15`,
                  borderRadius: theme.borderRadius.sm,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Desktop Grid Layout */}
        <div className="desktop-runner-grid">
          {/* Left: Form */}
          <div
            style={{
              padding: theme.spacing.lg,
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.lg,
              border: `1px solid ${theme.colors.border}`,
            }}
          >
            <DynamicInputForm
              key={`${modelId}-${formKey}`}
              inputSchema={model.inputSchema}
              onSubmit={handleGenerate}
              loading={loading}
              submitButtonText={`Generate ${model.outputSchema.type === 'text' ? 'Text' : model.outputSchema.type === 'image' ? 'Image' : 'Output'}`}
              initialValues={initialFormValues}
              secondaryAction={secondaryAction}
              formData={formData}
              onFormDataChange={setFormData}
              templateControls={templateControls}
            />
          </div>

          {/* Right: Output */}
          <div
            style={{
              padding: theme.spacing.lg,
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.lg,
              border: `1px solid ${theme.colors.border}`,
              minHeight: '400px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {error ? (
              <div
                style={{
                  padding: theme.spacing.md,
                  backgroundColor: `${theme.colors.error}15`,
                  border: `1px solid ${theme.colors.error}`,
                  borderRadius: theme.borderRadius.md,
                  color: theme.colors.error,
                  fontSize: theme.typography.sizes.sm,
                }}
              >
                {error}
              </div>
            ) : output ? (
              <DynamicOutputRenderer
                type={model.outputSchema.type}
                content={output}
                remixable={model.outputSchema.remixable}
                onRemix={handleRemix}
              />
            ) : (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: theme.colors.textTertiary,
                  fontSize: theme.typography.sizes.base,
                  textAlign: 'center',
                }}
              >
                Output will appear here
              </div>
            )}
          </div>
        </div>

        {/* Mobile: Linear layout (existing) */}
        <div className="mobile-runner-linear">
          <div
            style={{
              padding: theme.spacing.lg,
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.lg,
              border: `1px solid ${theme.colors.border}`,
              marginBottom: theme.spacing.lg,
            }}
          >
            <DynamicInputForm
              key={`${modelId}-${formKey}`}
              inputSchema={model.inputSchema}
              onSubmit={handleGenerate}
              loading={loading}
              submitButtonText={`Generate ${model.outputSchema.type === 'text' ? 'Text' : model.outputSchema.type === 'image' ? 'Image' : 'Output'}`}
              initialValues={initialFormValues}
              secondaryAction={secondaryAction}
              formData={formData}
              onFormDataChange={setFormData}
              templateControls={templateControls}
            />
          </div>

          {error && (
            <div
              style={{
                padding: theme.spacing.md,
                backgroundColor: `${theme.colors.error}15`,
                border: `1px solid ${theme.colors.error}`,
                borderRadius: theme.borderRadius.md,
                color: theme.colors.error,
                fontSize: theme.typography.sizes.sm,
                marginBottom: theme.spacing.lg,
              }}
            >
              {error}
            </div>
          )}

          {output && (
            <DynamicOutputRenderer
              type={model.outputSchema.type}
              content={output}
              remixable={model.outputSchema.remixable}
              onRemix={handleRemix}
            />
          )}
        </div>

        {/* Previous Generations Gallery */}
        {modelGenerations.length > 0 && (
          <div style={{ marginTop: theme.spacing.xl }}>
            <h2
              style={{
                fontSize: theme.typography.sizes.xl,
                fontWeight: theme.typography.weights.bold,
                color: theme.colors.text,
                marginBottom: theme.spacing.md,
              }}
            >
              Previous Generations ({modelGenerations.length})
            </h2>

            {/* Mobile Grid */}
            <div style={{ marginBottom: theme.spacing.lg }} className="mobile-gallery">
              <MobileGrid
                generations={modelGenerations}
                onGenerationClick={setSelectedGeneration}
              />
            </div>

            {/* Desktop Masonry */}
            <div className="desktop-gallery">
              <DesktopMasonryGrid
                generations={modelGenerations}
                onGenerationClick={setSelectedGeneration}
                columnCount={3}
              />
            </div>
          </div>
        )}
      </div>

      {/* Mobile version - compact with dynamic paginated params */}
      <div className="mobile-runner">
        {/* Viewport-filling section: Back + Model + Form */}
        <div
          style={{
            height: 'calc(100dvh - var(--header-height, 0px) - var(--footer-height, 0px))',
            maxHeight: '900px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
        {/* Top Bar: Back Button + Template Controls */}
        <div
          style={{
            height: `${MOBILE_RUNNER_HEIGHTS.backButton}px`,
            padding: `${theme.spacing.xs} ${theme.spacing.md}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          {/* Back Button */}
          <button
            onClick={() => {
              sessionStorage.removeItem('lastRunnerModel')
              sessionStorage.removeItem('lastRunnerFormData')
              navigate('/runners')
            }}
            style={{
              padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
              fontSize: theme.typography.sizes.sm,
              fontWeight: theme.typography.weights.medium,
              color: theme.colors.textSecondary,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.xs,
            }}
          >
            ← Back
          </button>

          {/* Template Controls */}
          <div style={{ display: 'flex', gap: theme.spacing.xs }}>
            <button
              onClick={() => setShowSaveModal(true)}
              style={{
                padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                fontSize: theme.typography.sizes.sm,
                fontWeight: theme.typography.weights.medium,
                color: theme.colors.textSecondary,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.xs,
              }}
            >
              Save
            </button>
            <button
              onClick={() => setShowLoadModal(true)}
              disabled={modelTemplates.length === 0}
              style={{
                padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                fontSize: theme.typography.sizes.sm,
                fontWeight: theme.typography.weights.medium,
                color: modelTemplates.length === 0 ? theme.colors.textTertiary : theme.colors.textSecondary,
                background: 'none',
                border: 'none',
                cursor: modelTemplates.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.xs,
              }}
            >
              Load
            </button>
          </div>
        </div>

        {/* Remix Badge (if applicable) */}
        {(remixPrompt || formDataParam) && (
          <div
            style={{
              padding: `0 ${theme.spacing.md} ${theme.spacing.xs}`,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                backgroundColor: `${theme.colors.primary}15`,
                border: `1px solid ${theme.colors.primary}30`,
                borderRadius: theme.borderRadius.md,
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.xs,
              }}
            >
              <span style={{ fontSize: '16px' }}>🔄</span>
              <span
                style={{
                  fontSize: theme.typography.sizes.xs,
                  color: theme.colors.text,
                  fontWeight: theme.typography.weights.medium,
                }}
              >
                Reprompting
              </span>
            </div>
          </div>
        )}

        {/* Compact Model Card */}
        <div
          style={{
            padding: `0 ${theme.spacing.md} ${theme.spacing.sm}`,
            flexShrink: 0,
          }}
        >
          <CompactModelCard
            model={model}
            isFavorite={isFavorite(model.id)}
            onToggleFavorite={() => toggleFavorite(model.id)}
          />
        </div>

        {/* Parameters Form - Dynamically Paginated */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <PaginatedInputForm
            key={`${modelId}-${formKey}`}
            inputSchema={model.inputSchema}
            onSubmit={handleGenerate}
            loading={loading}
            submitButtonText={`Generate ${model.outputSchema.type === 'text' ? 'Text' : model.outputSchema.type === 'image' ? 'Image' : 'Output'}`}
            initialValues={initialFormValues}
            currentPage={currentPage}
            paginatedFields={paginatedFields}
            onPageChange={setCurrentPage}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            secondaryAction={secondaryAction}
            formData={formData}
            onFormDataChange={setFormData}
            templateControls={templateControls}
            modelId={model.id}
          />
        </div>
      </div>

      {/* Previous Generations Gallery - Below viewport-filling container */}
      {modelGenerations.length > 0 && (
        <div
          style={{
            padding: theme.spacing.md,
            paddingTop: theme.spacing.sm,
          }}
        >
          <h2
            style={{
              fontSize: theme.typography.sizes.base,
              fontWeight: theme.typography.weights.semibold,
              color: theme.colors.text,
              marginBottom: theme.spacing.sm,
            }}
          >
            Previous ({modelGenerations.length})
          </h2>

          {/* Mobile Grid */}
          <MobileGrid
            generations={modelGenerations}
            onGenerationClick={setSelectedGeneration}
          />
        </div>
      )}
      </div>

      {/* Generation Modal */}
      {selectedGeneration && (
        <GenerationModal
          generation={selectedGeneration}
          onClose={() => setSelectedGeneration(null)}
        />
      )}

      {/* Save Template Modal */}
      <Modal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        title="Save Template"
        maxWidth="400px"
        footer={
          <div style={{ display: 'flex', gap: theme.spacing.xs }}>
            <button
              onClick={() => setShowSaveModal(false)}
              style={{
                flex: 1,
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                fontSize: theme.typography.sizes.sm,
                fontWeight: theme.typography.weights.medium,
                color: theme.colors.text,
                backgroundColor: theme.colors.background,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.md,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveTemplate}
              disabled={!templateName.trim()}
              style={{
                flex: 1,
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                fontSize: theme.typography.sizes.sm,
                fontWeight: theme.typography.weights.semibold,
                color: theme.colors.textInverse,
                background: !templateName.trim()
                  ? theme.colors.disabled
                  : `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`,
                border: 'none',
                borderRadius: theme.borderRadius.md,
                cursor: !templateName.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              Save
            </button>
          </div>
        }
      >
        <p
          style={{
            fontSize: theme.typography.sizes.sm,
            color: theme.colors.textSecondary,
            marginBottom: theme.spacing.md,
            lineHeight: theme.typography.lineHeights.normal,
          }}
        >
          Save your current parameter settings to quickly reuse them later. Templates are saved per-model and synced across your devices.
        </p>
        <input
          type="text"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          placeholder="Enter template name..."
          autoFocus
          style={{
            width: '100%',
            padding: theme.spacing.sm,
            fontSize: theme.typography.sizes.sm,
            color: theme.colors.text,
            backgroundColor: theme.colors.background,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.borderRadius.md,
            outline: 'none',
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && templateName.trim()) {
              handleSaveTemplate()
            }
          }}
        />
      </Modal>

      {/* Load Template Modal */}
      <Modal
        isOpen={showLoadModal}
        onClose={() => setShowLoadModal(false)}
        title="Load Template"
        footer={
          <button
            onClick={() => setShowLoadModal(false)}
            style={{
              width: '100%',
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              fontSize: theme.typography.sizes.sm,
              fontWeight: theme.typography.weights.medium,
              color: theme.colors.text,
              backgroundColor: theme.colors.background,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.borderRadius.md,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
          {modelTemplates.map((template) => (
            <div
              key={template.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: theme.spacing.sm,
                backgroundColor: theme.colors.background,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.md,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: theme.typography.sizes.sm,
                    fontWeight: theme.typography.weights.semibold,
                    color: theme.colors.text,
                    marginBottom: '2px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {template.name}
                </div>
                <div
                  style={{
                    fontSize: theme.typography.sizes.xs,
                    color: theme.colors.textSecondary,
                  }}
                >
                  {new Date(template.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div style={{ display: 'flex', gap: theme.spacing.xs, flexShrink: 0, marginLeft: theme.spacing.sm }}>
                <button
                  onClick={() => handleLoadTemplate(template)}
                  style={{
                    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                    fontSize: theme.typography.sizes.xs,
                    fontWeight: theme.typography.weights.medium,
                    color: theme.colors.textInverse,
                    background: `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`,
                    border: 'none',
                    borderRadius: theme.borderRadius.sm,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Load
                </button>
                <button
                  onClick={() => handleDeleteTemplate(template.id)}
                  style={{
                    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                    fontSize: theme.typography.sizes.xs,
                    fontWeight: theme.typography.weights.medium,
                    color: theme.colors.error,
                    backgroundColor: 'transparent',
                    border: `1px solid ${theme.colors.error}`,
                    borderRadius: theme.borderRadius.sm,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* Sign In Prompt Modal */}
      <SignInPromptModal
        isOpen={showSignInPrompt}
        onClose={() => setShowSignInPrompt(false)}
        onSignIn={() => {
          setShowSignInPrompt(false)
          signIn()
        }}
        message="You need to sign in to generate content with this model."
      />

      {/* CSS for responsive layout */}
      <style>{`
        /* Mobile: hide desktop layouts */
        @media (max-width: 768px) {
          .desktop-gallery {
            display: none !important;
          }
          .desktop-runner {
            display: none !important;
          }
          .desktop-runner-grid {
            display: none !important;
          }
        }

        /* Desktop: hide mobile layouts, show grid */
        @media (min-width: 769px) {
          .mobile-gallery {
            display: none !important;
          }
          .mobile-runner {
            display: none !important;
          }
          .mobile-runner-linear {
            display: none !important;
          }

          .desktop-runner-grid {
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
