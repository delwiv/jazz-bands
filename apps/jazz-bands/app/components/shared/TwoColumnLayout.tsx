import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useReducedMotion } from '~/hooks/useReducedMotion'
import { pageVariants } from '~/lib/animationVariants'
import type { Band, Recording } from '~/lib/types'
import type { Image } from './ImageModal'
import { Footer } from './Footer'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

export interface TwoColumnLayoutProps {
  band: Band
  children: ReactNode | ReactNode[]
  images: Image[]
  initialTrack?: Recording | null
  initialQueue?: Recording[]
  className?: string
}

export function TwoColumnLayout({
  band,
  children,
  images,
  initialTrack = null,
  initialQueue = [],
  className = '',
}: TwoColumnLayoutProps) {
  const reducedMotion = useReducedMotion()
  const childrenArray = children ? [children].flat() : []
  const hasBackgroundImage = band.backgroundImage != null

  const renderChildren = () =>
    reducedMotion ? (
      childrenArray
    ) : (
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
    )

  return (
    <div className={`min-h-screen flex flex-col relative ${className}`}>
      {hasBackgroundImage ? (
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat z-0"
          style={{
            backgroundImage: `url(${band.backgroundImage})`,
            backgroundPosition: 'center top',
          }}
        />
      ) : (
        <div className="fixed inset-0 bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 z-0" />
      )}

      <div className="fixed inset-0 bg-slate-950/50 z-0" />

      <a
        href="#main-content"
        className="skip-to-content absolute top-0 left-0 z-50 -translate-y-full bg-blue-600 text-white px-4 py-2 transition-transform focus:translate-y-0"
      >
        Skip to main content
      </a>

      <div className="relative z-10 flex flex-col h-screen">
         <Header band={band} />

         <div className="relative flex flex-1 lg:flex-row overflow-hidden">
           {/* Main content area - scrolls on both desktop and mobile */}
           <main
             id="main-content"
             className="flex-1 overflow-y-auto px-3 md:px-6 pb-12 lg:pr-[350px]"
             style={{
               scrollbarGutter: 'stable'
             }}
           >
             {renderChildren()}

             {/* Footer inside scrollable main area */}
             <div className="pt-4">
               <Footer band={band} />
             </div>
           </main>

           {/* Sidebar - fixed on desktop, hidden on mobile */}
           <div className="hidden lg:flex lg:flex-col lg:w-87.5 lg:absolute lg:right-0 lg:top-0 lg:bottom-0 lg:border-l lg:border-white/10 lg:bg-white/[0.02] lg:backdrop-blur-sm lg:z-20">
             <div className="flex flex-col h-full overflow-y-auto scrollbar-hidden">
               <Sidebar
                 initialTrack={initialTrack}
                 initialQueue={initialQueue}
                 images={images}
               />
             </div>
           </div>
         </div>
       </div>
    </div>
  )
}
