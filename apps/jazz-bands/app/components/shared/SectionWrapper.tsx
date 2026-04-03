import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { useReducedMotion } from '~/hooks/useReducedMotion'
import { fadeUpVariants } from '~/lib/animationVariants'

interface SectionWrapperProps {
  children: React.ReactNode
  title?: ReactNode
  gradient?: 'default' | 'accent' | 'custom'
  className?: string
  id?: string
}

export function SectionWrapper({
  children,
  title,
  gradient = 'default',
  className = '',
  id,
}: SectionWrapperProps) {
  const isReducedMotion = useReducedMotion()

  // Glass effect for consistent appearance
  const glassClasses =
    'glass-card border border-white/5 rounded-3xl p-6 md:p-10'

  const gradients = {
    default: '',
    accent: '',
    custom: '',
  }

  return (
    <section
      id={id}
      className={`section-base ${gradients[gradient]} ${glassClasses} ${className}`}
      aria-labelledby={title ? 'title' : undefined}
    >
      <div className="container-max">
        {title && (
          <motion.h2
            id="title"
            className="text-4xl font-bold text-center mb-12 text-white"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeUpVariants}
            animate={!isReducedMotion}
          >
            {title}
          </motion.h2>
        )}
        {children}
      </div>
    </section>
  )
}
