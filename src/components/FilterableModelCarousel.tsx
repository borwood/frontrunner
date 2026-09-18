import { useMemo } from 'react'
import { ModelCarousel } from './ModelCarousel'
import type { ModelConfig, ModelCategory } from '../types/models'

interface FilterableModelCarouselProps {
  models: ModelConfig[]
  size?: 'sm' | 'md' | 'lg'
  itemsPerView?: number
  // Filter options
  category?: ModelCategory
  tag?: string
  tags?: string[] // Match ANY of these tags
  featured?: boolean
  available?: boolean
  // Custom filter function
  filter?: (model: ModelConfig) => boolean
}

/**
 * ModelCarousel with built-in filtering capabilities
 * Dynamically filters models based on category, tags, or custom logic
 */
export function FilterableModelCarousel({
  models,
  size = 'md',
  itemsPerView,
  category,
  tag,
  tags,
  featured,
  available = true,
  filter,
}: FilterableModelCarouselProps) {
  const filteredModels = useMemo(() => {
    let result = models

    // Filter by availability
    if (available !== undefined) {
      result = result.filter((m) => m.available !== false)
    }

    // Filter by category
    if (category) {
      result = result.filter((m) => m.category === category)
    }

    // Filter by single tag
    if (tag) {
      result = result.filter((m) => m.tags.includes(tag))
    }

    // Filter by multiple tags (match ANY)
    if (tags && tags.length > 0) {
      result = result.filter((m) => tags.some((t) => m.tags.includes(t)))
    }

    // Filter by featured
    if (featured !== undefined) {
      result = result.filter((m) => m.featured === featured)
    }

    // Apply custom filter
    if (filter) {
      result = result.filter(filter)
    }

    return result
  }, [models, category, tag, tags, featured, available, filter])

  return <ModelCarousel models={filteredModels} size={size} itemsPerView={itemsPerView} />
}
