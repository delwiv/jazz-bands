import { motion } from 'framer-motion'
import { useReducedMotion } from '~/hooks/useReducedMotion'

interface PaginationDotsProps {
  currentIndex: number
  totalImages: number
  onSelect: (index: number) => void
  className?: string
  dotClassName?: string
}

export function PaginationDots({
  currentIndex,
  totalImages,
  onSelect,
  className = '',
  dotClassName = '',
}: PaginationDotsProps) {
  if (totalImages <= 1) return null
  const reducedMotion = useReducedMotion()

  return (
    <div
      className={`absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-2 z-20 ${className}`}
    >
      {Array.from({ length: totalImages }).map((_, index) => (
        <motion.button
          key={`dot-${index}`}
          type="button"
          onClick={() => onSelect(index)}
          className={`focus-ring ${dotClassName}`}
          aria-label={`Go to image ${index + 1}`}
          aria-current={index === currentIndex ? 'true' : undefined}
          whileHover={!reducedMotion ? { scale: 1.2 } : undefined}
          whileTap={!reducedMotion ? { scale: 0.9 } : undefined}
        >
          <div
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex
                ? 'bg-white w-4'
                : 'bg-white/40 hover:bg-white/60'
            }`}
          />
        </motion.button>
      ))}
    </div>
  )
}
