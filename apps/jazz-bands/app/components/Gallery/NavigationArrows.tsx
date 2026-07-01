import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { buttonVariants } from '~/lib/animationVariants'
import { useReducedMotion } from '~/hooks/useReducedMotion'
import { useIntl } from 'react-intl'

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
  const reducedMotion = useReducedMotion()
  const intl = useIntl()

  const arrowMotionProps = !reducedMotion
    ? {
        variants: buttonVariants,
        whileHover: 'hover' as const,
        whileTap: 'tap' as const,
      }
    : {}

  return (
    <>
      {showPrevious && (
        <button
          type="button"
          onClick={onPrevious}
          className={`absolute left-4 top-1/2 -translate-y-1/2 z-20 glass-card p-3 rounded-full border border-white/20 hover:bg-white/10 transition-colors focus-ring ${buttonClassName}`}
          aria-label={intl.formatMessage({ id: 'gallery.previousImage' }) || 'Previous image'}
        >
          <motion.div
            {...arrowMotionProps}
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
          aria-label={intl.formatMessage({ id: 'gallery.nextImage' }) || 'Next image'}
        >
          <motion.div
            {...arrowMotionProps}
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </motion.div>
        </button>
      )}
    </>
  )
}
