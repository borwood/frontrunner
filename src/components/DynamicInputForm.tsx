import { useState, useEffect } from 'react'
import { useTheme } from '../theme/ThemeContext'
import type { InputSchema, InputField } from '../types/models'
import { BooleanToggle } from './inputs/BooleanToggle'
import { FileUpload } from './inputs/FileUpload'
import { MultiImageUpload } from './inputs/MultiImageUpload'
import { EnhancedSlider } from './inputs/EnhancedSlider'
import { Dropdown } from './Dropdown'
import { GalleryImagePicker } from './GalleryImagePicker'

interface DynamicInputFormProps {
  inputSchema: InputSchema
  onSubmit: (data: Record<string, any>) => void
  loading: boolean
  submitButtonText?: string
  initialValues?: Record<string, any>
  secondaryAction?: {
    label: string
    onClick: (data: Record<string, any>) => void
  }
  formData?: Record<string, any>
  onFormDataChange?: (data: Record<string, any>) => void
  templateControls?: React.ReactNode
}

export function DynamicInputForm({
  inputSchema,
  onSubmit,
  loading,
  submitButtonText = 'Generate',
  initialValues = {},
  secondaryAction,
  formData: externalFormData,
  onFormDataChange,
  templateControls,
}: DynamicInputFormProps) {
  const { theme } = useTheme()
  const [galleryPickerState, setGalleryPickerState] = useState<{
    isOpen: boolean
    fieldName: string | null
    maxItems: number
    multiSelect: boolean
  }>({ isOpen: false, fieldName: null, maxItems: 10, multiSelect: false })

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

  // const handleImageUpload = (name: string, file: File) => {
  //   const reader = new FileReader()
  //   reader.onloadend = () => {
  //     handleChange(name, reader.result as string)
  //   }
  //   reader.readAsDataURL(file)
  // }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required fields
    const missingFields = inputSchema.fields
      .filter((field) => field.required && !formData[field.name])
      .map((field) => field.label)

    if (missingFields.length > 0) {
      alert(`Please fill in required fields: ${missingFields.join(', ')}`)
      return
    }

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
      padding: theme.spacing.md,
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
              minHeight: '120px',
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

  return (
    <form onSubmit={handleSubmit}>
      {/* Template Controls */}
      {templateControls && (
        <div style={{ marginBottom: theme.spacing.lg }}>
          {templateControls}
        </div>
      )}

      {inputSchema.fields.map((field) => (
        <div
          key={field.name}
          style={{
            marginBottom: theme.spacing.lg,
          }}
        >
          <label
            style={{
              display: 'block',
              fontSize: theme.typography.sizes.sm,
              fontWeight: theme.typography.weights.medium,
              color: theme.colors.text,
              marginBottom: theme.spacing.sm,
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

      {/* Submit button - split if secondaryAction is provided */}
      {secondaryAction ? (
        <div style={{ display: 'flex', gap: theme.spacing.xs }}>
          <button
            type="submit"
            disabled={loading || !isValid}
            style={{
              flex: 1,
              padding: `${theme.spacing.md} ${theme.spacing.xl}`,
              fontSize: theme.typography.sizes.lg,
              fontWeight: theme.typography.weights.semibold,
              color: theme.colors.textInverse,
              background:
                loading || !isValid
                  ? theme.colors.disabled
                  : `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`,
              border: 'none',
              borderRadius: theme.borderRadius.lg,
              cursor: loading || !isValid ? 'not-allowed' : 'pointer',
              boxShadow: theme.shadows.md,
              transition: `all ${theme.transitions.fast}`,
            }}
          >
            {loading ? 'Generating...' : submitButtonText}
          </button>
          <button
            type="button"
            disabled={loading || !isValid}
            onClick={(e) => {
              e.preventDefault()
              if (!loading && isValid) {
                secondaryAction.onClick(formData)
              }
            }}
            style={{
              flex: 1,
              padding: `${theme.spacing.md} ${theme.spacing.xl}`,
              fontSize: theme.typography.sizes.lg,
              fontWeight: theme.typography.weights.semibold,
              color: theme.colors.textInverse,
              background:
                loading || !isValid
                  ? theme.colors.disabled
                  : `linear-gradient(135deg, ${theme.colors.gradientEnd}, ${theme.colors.gradientStart})`,
              border: 'none',
              borderRadius: theme.borderRadius.lg,
              cursor: loading || !isValid ? 'not-allowed' : 'pointer',
              boxShadow: theme.shadows.md,
              transition: `all ${theme.transitions.fast}`,
            }}
          >
            {secondaryAction.label}
          </button>
        </div>
      ) : (
        <button
          type="submit"
          disabled={loading || !isValid}
          style={{
            width: '100%',
            padding: `${theme.spacing.md} ${theme.spacing.xl}`,
            fontSize: theme.typography.sizes.lg,
            fontWeight: theme.typography.weights.semibold,
            color: theme.colors.textInverse,
            background:
              loading || !isValid
                ? theme.colors.disabled
                : `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`,
            border: 'none',
            borderRadius: theme.borderRadius.lg,
            cursor: loading || !isValid ? 'not-allowed' : 'pointer',
            boxShadow: theme.shadows.md,
            transition: `all ${theme.transitions.fast}`,
          }}
        >
          {loading ? 'Generating...' : submitButtonText}
        </button>
      )}

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
