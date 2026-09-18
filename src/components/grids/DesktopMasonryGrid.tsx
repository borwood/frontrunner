import { useMemo, memo } from 'react'
import { useTheme } from '../../theme/ThemeContext'
import type { Generation } from '../../types/models'
import { GenerationCard } from './GenerationCard'

interface DesktopMasonryGridProps {
  generations: Generation[]
  onGenerationClick: (generation: Generation) => void
  columnCount?: number
  showFavorites?: boolean
}

export const DesktopMasonryGrid = memo(function DesktopMasonryGrid({
  generations,
  onGenerationClick,
  columnCount = 4,
  showFavorites = false
}: DesktopMasonryGridProps) {
  const { theme } = useTheme()

  // Distribute generations into columns for masonry layout
  const columns = useMemo(() => {
    const cols: typeof generations[] = Array.from({ length: columnCount }, () => [])

    generations.forEach((gen, index) => {
      cols[index % columnCount].push(gen)
    })

    return cols
  }, [generations, columnCount])

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
        gap: theme.spacing.md,
        alignItems: 'start',
      }}
      className="desktop-gallery"
    >
      {columns.map((column, colIndex) => (
        <div
          key={colIndex}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing.md,
          }}
        >
          {column.map((gen) => (
            <GenerationCard
              key={gen.id}
              generation={gen}
              onClick={() => onGenerationClick(gen)}
              variant="desktop"
              showFavorite={showFavorites}
            />
          ))}
        </div>
      ))}
    </div>
  )
})
