import { useState, useEffect } from 'react'
import type { InputField } from '../types/models'

// Height constants for mobile runner layout (adjustable)
export const MOBILE_RUNNER_HEIGHTS = {
  backButton: 48, // Back button height
  modelCard: 88, // Compact model info card height (reduced, no description visible)
  pageIndicators: 48, // Pagination dots + spacing (reduced)
  generateButton: 60, // Generate button + padding (reduced)
  fieldGap: 12, // Gap between fields
  fieldLabelHeight: 24, // Label + margin (reduced)
  fieldPadding: 12, // Padding inside form container (reduced)
} as const

interface UseDynamicPaginationOptions {
  fields: InputField[]
  availableHeight: number
}

/**
 * Estimates the height of a field based on its type
 * Updated for compact image upload components (combo button style with thumbnails)
 */
function estimateFieldHeight(field: InputField): number {
  const { fieldLabelHeight, fieldGap } = MOBILE_RUNNER_HEIGHTS

  // Base height includes label + gap
  let baseHeight = fieldLabelHeight + fieldGap

  // Add input height based on type
  // Image uploads now use compact buttons (~40-48px) instead of large previews
  switch (field.type) {
    case 'textarea':
      return baseHeight + 80 // Min height for textarea
    case 'slider':
      return baseHeight + 50 // Slider with input
    case 'image':
    case 'audio':
    case 'video':
      return baseHeight + 48 // Compact button with thumbnail (was 90px)
    case 'imageArray':
      return baseHeight + 48 // Compact multi-image button (was 110px)
    case 'boolean':
      return baseHeight + 36 // Toggle switch
    case 'select':
      return baseHeight + 40 // Dropdown
    default:
      return baseHeight + 40 // Text/number input
  }
}

/**
 * Dynamically paginate fields based on available height
 * Fields fill each page until they no longer fit, then overflow to next page
 */
export function useDynamicPagination({ fields, availableHeight }: UseDynamicPaginationOptions) {
  const [paginatedFields, setPaginatedFields] = useState<InputField[][]>([])

  // Calculate pagination based on estimated field heights
  useEffect(() => {
    if (fields.length === 0 || availableHeight <= 0) {
      setPaginatedFields([])
      return
    }

    // Reserve space for page indicators and generate button, but be less conservative
    // Pages can scroll vertically, so we can be more generous with space
    const fixedElementsHeight = MOBILE_RUNNER_HEIGHTS.pageIndicators + MOBILE_RUNNER_HEIGHTS.generateButton
    const formContentHeight = availableHeight - fixedElementsHeight

    if (formContentHeight <= 0) {
      // Not enough space, put all fields on one page anyway
      setPaginatedFields([fields])
      return
    }

    const pages: InputField[][] = []
    let currentPage: InputField[] = []
    let currentPageHeight = 0

    for (const field of fields) {
      const fieldHeight = estimateFieldHeight(field)

      // Check if adding this field would exceed available height
      // Use 90% of available height to leave some breathing room
      if (currentPageHeight + fieldHeight > formContentHeight * 0.9 && currentPage.length > 0) {
        // Start a new page
        pages.push(currentPage)
        currentPage = [field]
        currentPageHeight = fieldHeight
      } else {
        // Add to current page
        currentPage.push(field)
        currentPageHeight += fieldHeight
      }
    }

    // Add the last page if it has fields
    if (currentPage.length > 0) {
      pages.push(currentPage)
    }

    setPaginatedFields(pages)
  }, [fields, availableHeight])

  return {
    paginatedFields,
    totalPages: paginatedFields.length,
  }
}

/**
 * Hook to calculate available height for the form section
 * Returns the height that the form can use to fill the viewport
 */
export function useAvailableFormHeight() {
  const [availableHeight, setAvailableHeight] = useState(0)

  useEffect(() => {
    const calculateHeight = () => {
      // Get CSS variables for header and footer heights
      const headerHeight = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--header-height') || '0'
      )
      const footerHeight = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--footer-height') || '0'
      )

      // Calculate: viewport height - header - footer - back button - model card
      const viewportHeight = window.innerHeight
      const formSectionHeight = viewportHeight - headerHeight - footerHeight - MOBILE_RUNNER_HEIGHTS.backButton - MOBILE_RUNNER_HEIGHTS.modelCard

      setAvailableHeight(Math.max(0, formSectionHeight))
    }

    // Calculate on mount and window resize
    calculateHeight()
    window.addEventListener('resize', calculateHeight)

    // Also listen for CSS variable changes (when header/footer resize)
    const observer = new MutationObserver(calculateHeight)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style']
    })

    return () => {
      window.removeEventListener('resize', calculateHeight)
      observer.disconnect()
    }
  }, [])

  return availableHeight
}
