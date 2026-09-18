import { memo } from 'react'
import type { Generation } from '../../types/models'
import { GenerationCard } from './GenerationCard'

interface MobileGridProps {
  generations: Generation[]
  onGenerationClick: (generation: Generation) => void
  showFavorites?: boolean
}

export const MobileGrid = memo(function MobileGrid({ generations, onGenerationClick, showFavorites = false }: MobileGridProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '2px',
        width: '100%',
        minWidth: 0,
      }}
      className="mobile-gallery"
    >
      {generations.map((gen) => (
        <GenerationCard
          key={gen.id}
          generation={gen}
          onClick={() => onGenerationClick(gen)}
          variant="mobile"
          showFavorite={showFavorites}
        />
      ))}
    </div>
  )
})
