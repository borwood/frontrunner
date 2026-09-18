import { useState, useEffect } from 'react'
import { useTheme } from '../theme/ThemeContext'
import { useGenerationQueue } from '../contexts/GenerationQueueContext'
import type { InputSchema, InputField } from '../types/models'
import { BooleanToggle } from './inputs/BooleanToggle'
import { FileUpload } from './inputs/FileUpload'
import { MultiImageUpload } from './inputs/MultiImageUpload'
import { EnhancedSlider } from './inputs/EnhancedSlider'
import { Dropdown } from './Dropdown'
import { GalleryImagePicker } from './GalleryImagePicker'

interface PaginatedInputFormProps {
  inputSchema: InputSchema
  onSubmit: (data: Record<string, any>) => void
  loading: boolean
  submitButtonText?: string
  initialValues?: Record<string, any>
  currentPage: number
  paginatedFields: InputField[][]
  onPageChange: (page: number) => void
  onTouchStart: (e: React.TouchEvent) => void
  onTouchMove: (e: React.TouchEvent) => void
  onTouchEnd: () => void
  secondaryAction?: {
    label: string
    onClick: (data: Record<string, any>) => void
  }
  formData?: Record<string, any>
  onFormDataChange?: (data: Record<string, any>) => void
  templateControls?: React.ReactNode
  modelId?: string
}

export function PaginatedInputForm({
  inputSchema,
  onSubmit,
  loading,
  submitButtonText = 'Generate',
  initialValues = {},
  currentPage,
  paginatedFields,
  onPageChange,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  secondaryAction,
  formData: externalFormData,
  onFormDataChange,
  templateControls,
  modelId,
}: PaginatedInputFormProps) {
  const { theme } = useTheme()
  const { activeJobs } = useGenerationQueue()
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(false)
  const [galleryPickerState, setGalleryPickerState] = useState<{
    isOpen: boolean
    fieldName: string | null
    maxItems: number
    multiSelect: boolean
  }>({ isOpen: false, fieldName: null, maxItems: 10, multiSelect: false })

  // Filter jobs for this specific model
  const modelJobs = modelId ? activeJobs.filter(job => job.modelId === modelId) : []

  // Initialize form data with default values from schema
  const getInitialFormData = () => {
    const defaults: Record<string, any> = {}
    inputSchema.fields.forEach((field) => {
      if (field.defaultValue !== undefined) {
        defaults[field.name] = field.defaultValue
      }
    })
    return { ...defaults, ...initialValues }
  }

  const [internalFormData, setInternalFormData] = useState<Record<string, any>>(getInitialFormData())

  // Use external formData if provided, otherwise use internal state
  const formData = externalFormData !== undefined ? externalFormData : internalFormData

  // Reinitialize form data when schema changes (e.g., switching models)
  useEffect(() => {
    const newData = getInitialFormData()
    if (onFormDataChange) {
      onFormDataChange(newData)
    } else {
      setInternalFormData(newData)
    }
  }, [inputSchema])

  const handleChange = (name: string, value: any) => {
    const newData = { ...formData, [name]: value }
    if (onFormDataChange) {
      onFormDataChange(newData)
    } else {
      setInternalFormData(newData)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Prevent double-click
    if (isSubmitDisabled) return

    // Validate required fields
    const missingFields = inputSchema.fields
      .filter((field) => field.required && !formData[field.name])
      .map((field) => field.label)

    if (missingFields.length > 0) {
      alert(`Please fill in required fields: ${missingFields.join(', ')}`)
      return
    }

    // Disable submit for 500ms to prevent double-click
    setIsSubmitDisabled(true)
    setTimeout(() => setIsSubmitDisabled(false), 500)

    // Clean form data: remove nullable fields that are null/undefined/empty
    const cleanedData: Record<string, any> = {}

    inputSchema.fields.forEach((field) => {
      const value = formData[field.name]

      // Skip nullable fields that are empty
      if (field.nullable && (value === null || value === undefined || value === '')) {
        return
      }

      // Skip empty arrays for imageArray fields
      if (field.type === 'imageArray' && Array.isArray(value) && value.length === 0) {
        return
      }

      // Include all other values
      if (value !== undefined) {
        cleanedData[field.name] = value
      }
    })

    onSubmit(cleanedData)
  }

  const renderField = (field: InputField) => {
    const value = formData[field.name] ?? field.defaultValue ?? ''

    const fieldStyle = {
      width: '100%',
      padding: theme.spacing.sm,
      fontSize: theme.typography.sizes.base,
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.text,
      backgroundColor: theme.colors.background,
      border: `1px solid ${theme.colors.border}`,
      borderRadius: theme.borderRadius.md,
      outline: 'none',
      transition: `border-color ${theme.transitions.fast}`,
    }

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            style={{
              ...fieldStyle,
              minHeight: '80px',
              resize: 'vertical',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = theme.colors.primary
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = theme.colors.border
            }}
          />
        )

      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            style={fieldStyle}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = theme.colors.primary
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = theme.colors.border
            }}
          />
        )

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleChange(field.name, parseFloat(e.target.value))}
            placeholder={field.placeholder}
            required={field.required}
            min={field.min}
            max={field.max}
            step={field.step}
            style={fieldStyle}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = theme.colors.primary
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = theme.colors.border
            }}
          />
        )

      case 'select':
        return (
          <Dropdown
            options={(field.options || []).map(opt => ({
              value: String(opt.value),
              label: opt.label
            }))}
            value={value !== undefined && value !== null ? String(value) : ''}
            onChange={(newValue) => {
              // Convert back to number if the original option was a number
              const originalOption = field.options?.find(opt => String(opt.value) === newValue)
              handleChange(field.name, originalOption?.value || newValue)
            }}
            placeholder={field.placeholder || 'Select an option...'}
          />
        )

      case 'slider':
        return (
          <EnhancedSlider
            value={value || field.defaultValue || field.min || 0}
            onChange={(newValue) => handleChange(field.name, newValue)}
            min={field.min || 0}
            max={field.max || 100}
            step={field.step || 1}
            showInput={true}
          />
        )

      case 'boolean':
        return (
          <BooleanToggle
            value={value ?? field.defaultValue ?? false}
            onChange={(newValue) => handleChange(field.name, newValue)}
          />
        )

      case 'image':
        return (
          <FileUpload
            value={value || null}
            onChange={(newValue) => handleChange(field.name, newValue)}
            accept={field.accept || 'image/*'}
            placeholder={field.placeholder}
            required={field.required}
            fileType="image"
            onGalleryClick={() =>
              setGalleryPickerState({
                isOpen: true,
                fieldName: field.name,
                maxItems: 1,
                multiSelect: false,
              })
            }
          />
        )

      case 'audio':
        return (
          <FileUpload
            value={value || null}
            onChange={(newValue) => handleChange(field.name, newValue)}
            accept={field.accept || 'audio/*'}
            placeholder={field.placeholder}
            required={field.required}
            fileType="audio"
          />
        )

      case 'video':
        return (
          <FileUpload
            value={value || null}
            onChange={(newValue) => handleChange(field.name, newValue)}
            accept={field.accept || 'video/*'}
            placeholder={field.placeholder}
            required={field.required}
            fileType="video"
          />
        )

      case 'imageArray':
        return (
          <MultiImageUpload
            value={value || []}
            onChange={(newValue) => handleChange(field.name, newValue)}
            maxItems={field.maxItems || 10}
            placeholder={field.placeholder}
            required={field.required}
            onGalleryClick={() =>
              setGalleryPickerState({
                isOpen: true,
                fieldName: field.name,
                maxItems: field.maxItems || 10,
                multiSelect: true,
              })
            }
          />
        )

      default:
        return null
    }
  }

  const isValid = inputSchema.fields
    .filter((field) => field.required)
    .every((field) => formData[field.name])

  const totalPages = paginatedFields.length

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Template Controls */}
      {templateControls && (
        <div style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}`, paddingBottom: 0, flexShrink: 0 }}>
          {templateControls}
        </div>
      )}

      {/* Swipeable pages container */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          touchAction: 'pan-y', // Allow vertical scroll, prevent horizontal browser navigation
          minHeight: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            height: '100%',
            transform: `translateX(-${currentPage * 100}%)`,
            transition: theme.transitions.normal,
          }}
        >
          {paginatedFields.map((pageFields, pageIndex) => (
            <div
              key={pageIndex}
              style={{
                minWidth: '100%',
                height: '100%',
                padding: theme.spacing.md,
                paddingTop: theme.spacing.sm,
                paddingBottom: theme.spacing.sm,
                display: 'flex',
                flexDirection: 'column',
                gap: theme.spacing.sm,
                overflowY: 'auto',
                overflowX: 'hidden',
              }}
            >
              {pageFields.map((field) => (
                <div key={field.name}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: theme.typography.sizes.sm,
                      fontWeight: theme.typography.weights.medium,
                      color: theme.colors.text,
                      marginBottom: theme.spacing.xs,
                    }}
                  >
                    {field.label}
                    {field.required && (
                      <span style={{ color: theme.colors.error, marginLeft: '2px' }}>*</span>
                    )}
                  </label>
                  {renderField(field)}
                  {field.description && (
                    <div
                      style={{
                        marginTop: theme.spacing.xs,
                        fontSize: theme.typography.sizes.xs,
                        color: theme.colors.textTertiary,
                      }}
                    >
                      {field.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Page indicators */}
      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: theme.spacing.sm,
            padding: `${theme.spacing.md} 0`,
            flexShrink: 0,
          }}
        >
          {paginatedFields.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => onPageChange(index)}
              style={{
                width: '12px',
                height: '12px',
                borderRadius: theme.borderRadius.full,
                border: 'none',
                backgroundColor: index === currentPage ? theme.colors.primary : theme.colors.border,
                cursor: 'pointer',
                padding: 0,
                transition: `all ${theme.transitions.fast}`,
              }}
              aria-label={`Go to page ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Generate button - split if secondaryAction is provided */}
      <div style={{ padding: `0 ${theme.spacing.md} ${theme.spacing.md}`, flexShrink: 0 }}>
        {secondaryAction ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'stretch',
              height: '48px',
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.borderRadius.md,
              overflow: 'hidden',
              background: isSubmitDisabled || !isValid
                ? theme.colors.disabled
                : `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`,
            }}
          >
            {/* Jobs Indicator Section */}
            {modelJobs.length > 0 && (
              <div
                style={{
                  padding: `0 ${theme.spacing.xs}`,
                  background: 'rgba(0, 0, 0, 0.15)',
                  borderRight: `1px solid rgba(255, 255, 255, 0.2)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '48px',
                  gap: theme.spacing.xs,
                }}
              >
                {/* Animated Grid Loader */}
                <div
                  style={{
                    position: 'relative',
                    width: '18px',
                    height: '18px',
                    display: 'inline-block',
                  }}
                >
                  <div style={{ position: 'absolute', width: '4px', height: '4px', borderRadius: '50%', background: theme.colors.textInverse, top: '1px', left: '1px', animation: 'lds-grid 1.2s linear infinite', animationDelay: '0s' }} />
                  <div style={{ position: 'absolute', width: '4px', height: '4px', borderRadius: '50%', background: theme.colors.textInverse, top: '1px', left: '7px', animation: 'lds-grid 1.2s linear infinite', animationDelay: '-0.4s' }} />
                  <div style={{ position: 'absolute', width: '4px', height: '4px', borderRadius: '50%', background: theme.colors.textInverse, top: '1px', left: '13px', animation: 'lds-grid 1.2s linear infinite', animationDelay: '-0.8s' }} />
                  <div style={{ position: 'absolute', width: '4px', height: '4px', borderRadius: '50%', background: theme.colors.textInverse, top: '7px', left: '1px', animation: 'lds-grid 1.2s linear infinite', animationDelay: '-0.4s' }} />
                  <div style={{ position: 'absolute', width: '4px', height: '4px', borderRadius: '50%', background: theme.colors.textInverse, top: '7px', left: '7px', animation: 'lds-grid 1.2s linear infinite', animationDelay: '-0.8s' }} />
                  <div style={{ position: 'absolute', width: '4px', height: '4px', borderRadius: '50%', background: theme.colors.textInverse, top: '7px', left: '13px', animation: 'lds-grid 1.2s linear infinite', animationDelay: '-1.2s' }} />
                  <div style={{ position: 'absolute', width: '4px', height: '4px', borderRadius: '50%', background: theme.colors.textInverse, top: '13px', left: '1px', animation: 'lds-grid 1.2s linear infinite', animationDelay: '-0.8s' }} />
                  <div style={{ position: 'absolute', width: '4px', height: '4px', borderRadius: '50%', background: theme.colors.textInverse, top: '13px', left: '7px', animation: 'lds-grid 1.2s linear infinite', animationDelay: '-1.2s' }} />
                  <div style={{ position: 'absolute', width: '4px', height: '4px', borderRadius: '50%', background: theme.colors.textInverse, top: '13px', left: '13px', animation: 'lds-grid 1.2s linear infinite', animationDelay: '-1.6s' }} />
                </div>
                <span
                  style={{
                    fontSize: theme.typography.sizes.sm,
                    fontWeight: theme.typography.weights.bold,
                    color: theme.colors.textInverse,
                  }}
                >
                  {modelJobs.length}
                </span>
              </div>
            )}

            {/* Generate Button */}
            <button
              type="submit"
              disabled={loading || isSubmitDisabled || !isValid}
              style={{
                flex: 1,
                padding: `0 ${theme.spacing.sm}`,
                fontSize: theme.typography.sizes.base,
                fontWeight: theme.typography.weights.semibold,
                color: theme.colors.textInverse,
                background: 'transparent',
                border: 'none',
                borderRight: `1px solid rgba(255, 255, 255, 0.2)`,
                cursor: isSubmitDisabled || !isValid ? 'not-allowed' : 'pointer',
                transition: `all ${theme.transitions.fast}`,
              }}
            >
              {loading ? 'Generating...' : submitButtonText}
            </button>

            {/* Secondary Action Button */}
            <button
              type="button"
              disabled={isSubmitDisabled || !isValid}
              onClick={(e) => {
                e.preventDefault()
                if (!loading && isValid) {
                  secondaryAction.onClick(formData)
                }
              }}
              style={{
                flex: 1,
                padding: `0 ${theme.spacing.sm}`,
                fontSize: theme.typography.sizes.base,
                fontWeight: theme.typography.weights.semibold,
                color: theme.colors.textInverse,
                background: 'transparent',
                border: 'none',
                cursor: isSubmitDisabled || !isValid ? 'not-allowed' : 'pointer',
                transition: `all ${theme.transitions.fast}`,
              }}
            >
              {secondaryAction.label}
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'stretch',
              height: '48px',
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.borderRadius.md,
              overflow: 'hidden',
              background: isSubmitDisabled || !isValid
                ? theme.colors.disabled
                : `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`,
            }}
          >
            {/* Jobs Indicator Section */}
            {modelJobs.length > 0 && (
              <div
                style={{
                  padding: `0 ${theme.spacing.sm}`,
                  background: 'rgba(0, 0, 0, 0.15)',
                  borderRight: `1px solid rgba(255, 255, 255, 0.2)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '56px',
                  gap: theme.spacing.xs,
                }}
              >
                {/* Animated Grid Loader */}
                <div
                  style={{
                    position: 'relative',
                    width: '18px',
                    height: '18px',
                    display: 'inline-block',
                  }}
                >
                  <div style={{ position: 'absolute', width: '4px', height: '4px', borderRadius: '50%', background: theme.colors.textInverse, top: '1px', left: '1px', animation: 'lds-grid 1.2s linear infinite', animationDelay: '0s' }} />
                  <div style={{ position: 'absolute', width: '4px', height: '4px', borderRadius: '50%', background: theme.colors.textInverse, top: '1px', left: '7px', animation: 'lds-grid 1.2s linear infinite', animationDelay: '-0.4s' }} />
                  <div style={{ position: 'absolute', width: '4px', height: '4px', borderRadius: '50%', background: theme.colors.textInverse, top: '1px', left: '13px', animation: 'lds-grid 1.2s linear infinite', animationDelay: '-0.8s' }} />
                  <div style={{ position: 'absolute', width: '4px', height: '4px', borderRadius: '50%', background: theme.colors.textInverse, top: '7px', left: '1px', animation: 'lds-grid 1.2s linear infinite', animationDelay: '-0.4s' }} />
                  <div style={{ position: 'absolute', width: '4px', height: '4px', borderRadius: '50%', background: theme.colors.textInverse, top: '7px', left: '7px', animation: 'lds-grid 1.2s linear infinite', animationDelay: '-0.8s' }} />
                  <div style={{ position: 'absolute', width: '4px', height: '4px', borderRadius: '50%', background: theme.colors.textInverse, top: '7px', left: '13px', animation: 'lds-grid 1.2s linear infinite', animationDelay: '-1.2s' }} />
                  <div style={{ position: 'absolute', width: '4px', height: '4px', borderRadius: '50%', background: theme.colors.textInverse, top: '13px', left: '1px', animation: 'lds-grid 1.2s linear infinite', animationDelay: '-0.8s' }} />
                  <div style={{ position: 'absolute', width: '4px', height: '4px', borderRadius: '50%', background: theme.colors.textInverse, top: '13px', left: '7px', animation: 'lds-grid 1.2s linear infinite', animationDelay: '-1.2s' }} />
                  <div style={{ position: 'absolute', width: '4px', height: '4px', borderRadius: '50%', background: theme.colors.textInverse, top: '13px', left: '13px', animation: 'lds-grid 1.2s linear infinite', animationDelay: '-1.6s' }} />
                </div>
                <span
                  style={{
                    fontSize: theme.typography.sizes.sm,
                    fontWeight: theme.typography.weights.bold,
                    color: theme.colors.textInverse,
                  }}
                >
                  {modelJobs.length}
                </span>
              </div>
            )}

            {/* Generate Button */}
            <button
              type="submit"
              disabled={loading || isSubmitDisabled || !isValid}
              style={{
                flex: 1,
                padding: `0 ${theme.spacing.md}`,
                fontSize: theme.typography.sizes.base,
                fontWeight: theme.typography.weights.semibold,
                color: theme.colors.textInverse,
                background: 'transparent',
                border: 'none',
                cursor: isSubmitDisabled || !isValid ? 'not-allowed' : 'pointer',
                transition: `all ${theme.transitions.fast}`,
              }}
            >
              {loading ? 'Generating...' : submitButtonText}
            </button>
          </div>
        )}
      </div>

      {/* Animation CSS for jobs loader */}
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

      {/* Gallery Image Picker Modal */}
      {galleryPickerState.isOpen && galleryPickerState.fieldName && (
        <GalleryImagePicker
          onSelect={(imageUrl) => {
            if (galleryPickerState.multiSelect) {
              // Multi-select mode (imageArray)
              const urls = Array.isArray(imageUrl) ? imageUrl : [imageUrl]
              const currentValue = formData[galleryPickerState.fieldName!] || []
              const remainingSlots = galleryPickerState.maxItems - currentValue.length
              const urlsToAdd = urls.slice(0, remainingSlots)

              if (urlsToAdd.length > 0) {
                handleChange(galleryPickerState.fieldName!, [...currentValue, ...urlsToAdd])
              }
            } else {
              // Single select mode (image)
              const url = Array.isArray(imageUrl) ? imageUrl[0] : imageUrl
              handleChange(galleryPickerState.fieldName!, url)
            }
            setGalleryPickerState({ isOpen: false, fieldName: null, maxItems: 10, multiSelect: false })
          }}
          onClose={() => setGalleryPickerState({ isOpen: false, fieldName: null, maxItems: 10, multiSelect: false })}
          multiSelect={galleryPickerState.multiSelect}
          galleryOnly
        />
      )}
    </form>
  )
}
