import { useState, useMemo } from 'react'
import { useTheme } from '../theme/ThemeContext'
import { useUnifiedStorage } from '../hooks/useUnifiedStorage'
import { Modal } from './Modal'
import type { Generation } from '../types/models'

interface GalleryImagePickerProps {
  onSelect: (imageUrl: string | string[]) => void
  onClose: () => void
  multiSelect?: boolean
  galleryOnly?: boolean
}

export function GalleryImagePicker({ onSelect, onClose, multiSelect = false, galleryOnly = false }: GalleryImagePickerProps) {
  const { theme } = useTheme()
  const [generations] = useUnifiedStorage('generations', [], { skipLocalStorage: true })
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [activeTab, setActiveTab] = useState<'gallery' | 'upload'>(galleryOnly ? 'gallery' : 'gallery')

  // Filter to only show image generations
  const imageGenerations = useMemo(() => {
    let filtered = generations.filter((gen) => gen.outputData.type === 'image')

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((gen) => {
        const modelMatch = gen.modelName.toLowerCase().includes(query)
        const promptMatch = gen.inputData.prompt?.toLowerCase().includes(query) ?? false
        return modelMatch || promptMatch
      })
    }

    return filtered
  }, [generations, searchQuery])

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files) return

    const imageFiles = Array.from(files).filter((file) => file.type.startsWith('image/'))
    const base64Images = await Promise.all(imageFiles.map(convertFileToBase64))
    setUploadedImages((prev) => [...prev, ...base64Images])
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    await handleFiles(e.dataTransfer.files)
  }

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await handleFiles(e.target.files)
  }

  const handleImageClick = (gen: Generation) => {
    const content = gen.outputData.content
    const imageUrl = Array.isArray(content) ? content[0] : (content as string)

    if (multiSelect) {
      // Toggle selection in multi-select mode
      setSelectedImages((prev) => {
        if (prev.includes(imageUrl)) {
          return prev.filter((url) => url !== imageUrl)
        } else {
          return [...prev, imageUrl]
        }
      })
    } else {
      // Single select mode - select and close immediately
      onSelect(imageUrl)
      onClose()
    }
  }

  const handleUploadedImageClick = (imageUrl: string) => {
    if (multiSelect) {
      // Toggle selection in multi-select mode
      setSelectedImages((prev) => {
        if (prev.includes(imageUrl)) {
          return prev.filter((url) => url !== imageUrl)
        } else {
          return [...prev, imageUrl]
        }
      })
    } else {
      // Single select mode - select and close immediately
      onSelect(imageUrl)
      onClose()
    }
  }

  const handleConfirm = () => {
    if (multiSelect && selectedImages.length > 0) {
      onSelect(selectedImages)
      onClose()
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={multiSelect ? "Choose Images" : "Choose an image"}
      maxWidth="800px"
      footer={
        multiSelect ? (
          <div style={{ display: 'flex', gap: theme.spacing.sm, justifyContent: 'flex-end' }}>
            <button
              onClick={onClose}
              style={{
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                fontSize: theme.typography.sizes.base,
                fontWeight: theme.typography.weights.medium,
                color: theme.colors.text,
                backgroundColor: theme.colors.background,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.md,
                cursor: 'pointer',
                transition: `all ${theme.transitions.fast}`,
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedImages.length === 0}
              style={{
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                fontSize: theme.typography.sizes.base,
                fontWeight: theme.typography.weights.medium,
                color: selectedImages.length === 0 ? theme.colors.textTertiary : theme.colors.textInverse,
                background:
                  selectedImages.length === 0
                    ? theme.colors.surface
                    : `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`,
                border: 'none',
                borderRadius: theme.borderRadius.md,
                cursor: selectedImages.length === 0 ? 'not-allowed' : 'pointer',
                transition: `all ${theme.transitions.fast}`,
              }}
            >
              Add {selectedImages.length} image{selectedImages.length !== 1 ? 's' : ''}
            </button>
          </div>
        ) : undefined
      }
    >
      {/* Tabs */}
      {!galleryOnly && (
        <div
          style={{
            display: 'flex',
            gap: theme.spacing.xs,
            marginBottom: theme.spacing.md,
            borderBottom: `1px solid ${theme.colors.border}`,
          }}
        >
          <button
            onClick={() => setActiveTab('gallery')}
            style={{
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              fontSize: theme.typography.sizes.sm,
              fontWeight: theme.typography.weights.medium,
              color: activeTab === 'gallery' ? theme.colors.primary : theme.colors.textSecondary,
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${activeTab === 'gallery' ? theme.colors.primary : 'transparent'}`,
              cursor: 'pointer',
              transition: `all ${theme.transitions.fast}`,
            }}
          >
            Gallery {imageGenerations.length > 0 && `(${imageGenerations.length})`}
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            style={{
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              fontSize: theme.typography.sizes.sm,
              fontWeight: theme.typography.weights.medium,
              color: activeTab === 'upload' ? theme.colors.primary : theme.colors.textSecondary,
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${activeTab === 'upload' ? theme.colors.primary : 'transparent'}`,
              cursor: 'pointer',
              transition: `all ${theme.transitions.fast}`,
            }}
          >
            Upload {uploadedImages.length > 0 && `(${uploadedImages.length})`}
          </button>
        </div>
      )}

      {/* Gallery Tab */}
      {(galleryOnly || activeTab === 'gallery') && (
        <>
          {/* Search Bar */}
          <div style={{ marginBottom: theme.spacing.md }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by model or prompt..."
              // autoFocus
              style={{
                width: '100%',
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                fontSize: theme.typography.sizes.sm,
                color: theme.colors.text,
                backgroundColor: theme.colors.background,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.md,
                outline: 'none',
                transition: `all ${theme.transitions.fast}`,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = theme.colors.primary
                e.currentTarget.style.boxShadow = theme.shadows.sm
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = theme.colors.border
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
          </div>

          {/* Gallery Image Grid */}
          {imageGenerations.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: theme.spacing.xxl,
                color: theme.colors.textSecondary,
              }}
            >
              <p style={{ fontSize: theme.typography.sizes.base }}>
                {searchQuery.trim() ? 'No matching images found.' : 'No images in gallery yet.'}
              </p>
              <p style={{ fontSize: theme.typography.sizes.sm, marginTop: theme.spacing.sm }}>
                Generate images to see them here
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: theme.spacing.sm,
              }}
            >
              {imageGenerations.map((gen) => {
                const content = gen.outputData.content
                const imageUrl = Array.isArray(content) ? content[0] : (content as string)
                const hasMultiple = Array.isArray(content) && content.length > 1
                const isSelected = multiSelect && selectedImages.includes(imageUrl)

                return (
                  <div
                    key={gen.id}
                    onClick={() => handleImageClick(gen)}
                    style={{
                      aspectRatio: '1 / 1',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      borderRadius: theme.borderRadius.md,
                      border: isSelected
                        ? `3px solid ${theme.colors.gradientStart}`
                        : `2px solid ${theme.colors.border}`,
                      position: 'relative',
                      transition: `all ${theme.transitions.fast}`,
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = theme.colors.primary
                        e.currentTarget.style.transform = 'scale(1.05)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = theme.colors.border
                        e.currentTarget.style.transform = 'scale(1)'
                      }
                    }}
                  >
                    <img
                      src={imageUrl}
                      alt="Gallery"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                    {hasMultiple && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          padding: '2px 6px',
                          fontSize: '10px',
                          fontWeight: theme.typography.weights.bold,
                          color: theme.colors.textInverse,
                          backgroundColor: 'rgba(0, 0, 0, 0.7)',
                          borderRadius: '3px',
                        }}
                      >
                        +{(content as string[]).length - 1}
                      </div>
                    )}
                    {isSelected && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '4px',
                          left: '4px',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`,
                          color: theme.colors.textInverse,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          fontWeight: theme.typography.weights.bold,
                        }}
                      >
                        ✓
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Upload Tab */}
      {!galleryOnly && activeTab === 'upload' && (
        <>
          {/* Upload Section */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              marginBottom: uploadedImages.length > 0 ? theme.spacing.md : 0,
              padding: theme.spacing.xxl,
              border: `2px dashed ${isDragging ? theme.colors.primary : theme.colors.border}`,
              borderRadius: theme.borderRadius.md,
              backgroundColor: isDragging ? `${theme.colors.primary}10` : theme.colors.surface,
              textAlign: 'center',
              transition: `all ${theme.transitions.fast}`,
            }}
          >
            <input
              type="file"
              id="file-upload"
              multiple
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onChange={handleFileInput}
              style={{ display: 'none' }}
            />
            <label
              htmlFor="file-upload"
              style={{
                display: 'inline-block',
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                fontSize: theme.typography.sizes.sm,
                fontWeight: theme.typography.weights.medium,
                color: theme.colors.textInverse,
                background: `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`,
                borderRadius: theme.borderRadius.md,
                cursor: 'pointer',
                transition: `all ${theme.transitions.fast}`,
              }}
            >
              Choose Files
            </label>
            <p
              style={{
                fontSize: theme.typography.sizes.sm,
                color: theme.colors.textSecondary,
                marginTop: theme.spacing.md,
                marginBottom: 0,
              }}
            >
              or drag and drop images here
            </p>
          </div>

          {/* Uploaded Images Grid */}
          {uploadedImages.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: theme.spacing.sm,
              }}
            >
              {uploadedImages.map((imageUrl, index) => {
                const isSelected = multiSelect && selectedImages.includes(imageUrl)

                return (
                  <div
                    key={`uploaded-${imageUrl}-${index}`}
                    onClick={() => handleUploadedImageClick(imageUrl)}
                    style={{
                      aspectRatio: '1 / 1',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      borderRadius: theme.borderRadius.md,
                      border: isSelected
                        ? `3px solid ${theme.colors.gradientStart}`
                        : `2px solid ${theme.colors.border}`,
                      position: 'relative',
                      transition: `all ${theme.transitions.fast}`,
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = theme.colors.primary
                        e.currentTarget.style.transform = 'scale(1.05)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = theme.colors.border
                        e.currentTarget.style.transform = 'scale(1)'
                      }
                    }}
                  >
                    <img
                      src={imageUrl}
                      alt="Uploaded"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                    {isSelected && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '4px',
                          left: '4px',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`,
                          color: theme.colors.textInverse,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          fontWeight: theme.typography.weights.bold,
                        }}
                      >
                        ✓
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </Modal>
  )
}
