import { AnimatePresence, motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { useReducedMotion } from '~/hooks/useReducedMotion'
import { pageVariants } from '~/lib/animationVariants'

interface PageTransitionProps {
  children: ReactNode
}

/**
 * PageTransition wrapper component for smooth page transitions
 * Wraps page content in AnimatePresence for enter/exit animations
 * Respects user's reduced motion preference
 */
export function PageTransition({ children }: PageTransitionProps) {
  const reducedMotion = useReducedMotion()

  if (reducedMotion) {
    return <>{children}</>
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="page-content"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
