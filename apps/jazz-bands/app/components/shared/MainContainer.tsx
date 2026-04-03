import { motion } from 'framer-motion'
import React from 'react'
import { useReducedMotion } from '~/hooks/useReducedMotion'

interface MainContainerProps {
  children: React.ReactNode
}

export function MainContainer({ children }: MainContainerProps) {
  const reducedMotion = useReducedMotion()
  const childrenArray = React.Children.toArray(children)

  return (
    <div className="flex flex-col gap-12 px-4 max-w-7xl mx-auto">
      {childrenArray.map((child, index) => {
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
      })}
    </div>
  )
}
