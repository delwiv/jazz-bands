import { AnimatePresence, motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { useReducedMotion } from '~/hooks/useReducedMotion'
import { pageVariants } from '~/lib/animationVariants'
import type { Band } from '~/lib/types'
import { BackgroundLayer } from './BackgroundLayer'
import { Footer } from './Footer'
import { Header } from './Header'

interface LayoutProps {
  band: Band
  children?: ReactNode | ReactNode[]
}

export function Layout({ band, children }: LayoutProps) {
  const reducedMotion = useReducedMotion()

  const childrenArray = children ? [children].flat() : []

  if (reducedMotion) {
    return (
      <div className="min-h-screen flex flex-col pb-16 md:pb-20 relative">
        <BackgroundLayer backgroundImage={band.backgroundImage} skipToContent />

        <div className="relative z-10 flex flex-col flex-1">
          <Header band={band} />
          <main id="main-content" className="flex flex-col flex-1">
            {childrenArray}
          </main>
          <Footer band={band} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col pb-16 md:pb-20 relative">
      <BackgroundLayer backgroundImage={band.backgroundImage} skipToContent />

      <div className="relative z-10 flex flex-col flex-1">
        <Header band={band} />
        <main id="main-content" className="flex flex-col flex-1">
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
    </div>
  )
}
