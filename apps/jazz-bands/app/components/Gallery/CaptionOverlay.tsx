import { motion } from 'framer-motion'
import { useReducedMotion } from '~/hooks/useReducedMotion'

interface CaptionOverlayProps {
  caption?: string
  isOpen?: boolean
  className?: string
  textClassName?: string
}

export function CaptionOverlay({
  caption,
  isOpen = true,
  className = '',
  textClassName = '',
}: CaptionOverlayProps) {
  const reducedMotion = useReducedMotion()

  if (!caption || !isOpen) return null

  return (
    <motion.div
      className={`absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-900/90 to-transparent ${className}`}
      initial={reducedMotion ? undefined : { opacity: 0, y: 20 }}
      animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
      transition={reducedMotion ? undefined : { duration: 0.3, delay: 0.2 }}
    >
      <p className={`text-white text-center text-lg ${textClassName}`}>
        {caption}
      </p>
    </motion.div>
  )
}
