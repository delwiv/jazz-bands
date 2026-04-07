import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { buttonVariants } from '~/lib/animationVariants'

interface NavigationArrowsProps {
  onPrevious: () => void
  onNext: () => void
  showPrevious: boolean
  showNext: boolean
  className?: string
  buttonClassName?: string
}

export function NavigationArrows({
  onPrevious,
  onNext,
  showPrevious,
  showNext,
  className = '',
  buttonClassName = '',
}: NavigationArrowsProps) {
  return (
    <>
      {showPrevious && (
        <button
          type="button"
          onClick={onPrevious}
          className={`absolute left-4 top-1/2 -translate-y-1/2 z-20 glass-card p-3 rounded-full border border-white/20 hover:bg-white/10 transition-colors focus-ring ${buttonClassName}`}
          aria-label="Previous image"
        >
          <motion.div
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </motion.div>
        </button>
      )}

      {showNext && (
        <button
          type="button"
          onClick={onNext}
          className={`absolute right-4 top-1/2 -translate-y-1/2 z-20 glass-card p-3 rounded-full border border-white/20 hover:bg-white/10 transition-colors focus-ring ${buttonClassName}`}
          aria-label="Next image"
        >
          <motion.div
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </motion.div>
        </button>
      )}
    </>
  )
}
