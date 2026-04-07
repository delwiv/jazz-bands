import { motion } from 'framer-motion'
import React from 'react'
import { useReducedMotion } from '~/hooks/useReducedMotion'

export interface MainContainerProps {
  children: React.ReactNode
  variant?: 'default' | 'glass'
  title?: React.ReactNode
  id?: string
  className?: string
  hero?: React.ReactNode
}

export function MainContainer({
  children,
  variant = 'default',
  title,
  id,
  className = '',
  hero,
}: MainContainerProps) {
  const reducedMotion = useReducedMotion()
  const childrenArray = React.Children.toArray(children)

  const renderChildren = () =>
    childrenArray.map((child, index) => {
      if (!React.isValidElement(child)) {
        return child
      }

      const element = child as React.ReactElement
      const key = element.key ?? `section-${index}`

      return (
        <motion.div
          key={key}
          initial={!reducedMotion ? { opacity: 0, y: 20 } : undefined}
          animate={!reducedMotion ? { opacity: 1, y: 0 } : undefined}
          transition={
            !reducedMotion
              ? { duration: 0.5, ease: 'easeOut', delay: index * 0.1 }
              : undefined
          }
          viewport={{ once: true }}
        >
          {child}
        </motion.div>
      )
    })

  const containerContent = (
    <div id={id} className="flex flex-col gap-12">
      {title && (
        <motion.h2
          id={`${id || ''}-title`}
          initial={!reducedMotion ? { opacity: 0, y: 20 } : undefined}
          animate={!reducedMotion ? { opacity: 1, y: 0 } : undefined}
          transition={
            !reducedMotion ? { duration: 0.5, ease: 'easeOut' } : undefined
          }
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-lgmt-bold text-white mb-4"
        >
          {title}
        </motion.h2>
      )}
      {renderChildren()}
    </div>
  )

  const hasTitle = title != null
  const titleId = id ? `${id}-title` : undefined

  const glassCardContent =
    variant === 'glass' ? (
      <div className="glass-card p-6">
        <div className="container-max">{containerContent}</div>
      </div>
    ) : (
      containerContent
    )

  return (
    <div
      className={`mx-auto ${className} relative`}
      role={hasTitle ? 'region' : undefined}
      aria-labelledby={hasTitle ? titleId : undefined}
    >
      {/* {hero && ( */}
      {/*   <div className="relative"> */}
      {/*     {hero} */}
      {/*     <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/80 to-transparent bottom-0 pointer-events-none" /> */}
      {/*   </div> */}
      {/* )} */}

      <div className="p-4">{glassCardContent}</div>
    </div>
  )
}
