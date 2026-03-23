import { AnimatePresence, motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { useReducedMotion } from '~/hooks/useReducedMotion'
import { pageVariants } from '~/lib/animationVariants'
import type { Band } from '~/lib/types'
import { Footer } from './Footer'
import { Header } from './Header'

interface LayoutProps {
  band: Band
  children?: ReactNode | ReactNode[]
}

export function Layout({ band, children }: LayoutProps) {
  const reducedMotion = useReducedMotion()

  // Handle single child or array of children
  const childrenArray = children ? [children].flat() : []

  // If reduced motion is enabled, render children without animation wrapper
  if (reducedMotion) {
    return (
      <div className="min-h-screen flex flex-col">
        <a
          href="#main-content"
          className="skip-to-content absolute top-0 left-0 z-50 -translate-y-full bg-blue-600 text-white px-4 py-2 transition-transform focus:translate-y-0"
        >
          Skip to main content
        </a>
        <Header band={band} />
        <main id="main-content" className="flex flex-col flex-1 pb-24">
          {childrenArray}
        </main>
        <Footer band={band} />
      </div>
    )
  }

  // Render with animations
  return (
    <div className="min-h-screen flex flex-col">
      <a
        href="#main-content"
        className="skip-to-content absolute top-0 left-0 z-50 -translate-y-full bg-blue-600 text-white px-4 py-2 transition-transform focus:translate-y-0"
      >
        Skip to main content
      </a>
      <Header band={band} />
      <main id="main-content" className="flex flex-col flex-1 pb-24">
        <AnimatePresence mode="wait">
          {childrenArray.map((child, index) => (
            <motion.div
              key={index}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {child}
            </motion.div>
          ))}
        </AnimatePresence>
      </main>
      <Footer band={band} />
    </div>
  )
}
