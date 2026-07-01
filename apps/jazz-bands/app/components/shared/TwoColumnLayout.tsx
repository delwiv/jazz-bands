import { AnimatePresence, motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { ImageGalleryProvider } from '~/contexts/ImageGalleryContext'
import { useReducedMotion } from '~/hooks/useReducedMotion'
import { pageVariants } from '~/lib/animationVariants'
import type { Band, GalleryImage, Recording } from '~/lib/types'
import { BackgroundLayer } from './BackgroundLayer'
import { Footer } from './Footer'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { StickyPlayer } from '../audio/StickyPlayer'

export interface TwoColumnLayoutProps {
  band: Band
  children: ReactNode | ReactNode[]
  images: GalleryImage[]
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
    <ImageGalleryProvider images={images}>
      <div className={`min-h-screen flex flex-col relative ${className}`}>
        <BackgroundLayer backgroundImage={band.backgroundImage} skipToContent />

        <div className="relative z-10 flex flex-col h-screen justify-stretch">
          <Header band={band} />

          <div className="flex relative lg:flex-row">
            {/* Main content area - scrolls on both desktop and mobile */}
            <main
              id="main-content"
              className="flex-1 min-h-[calc(100dvh-5rem)] grid items-stretch justify-stretch gap-8"
              style={{
                scrollbarGutter: 'stable',
              }}
            >
              {renderChildren()}

              {/* Footer inside scrollable main area */}
              <div className="justify-self-end items-end flex w-full pt-8 px-4">
                <Footer band={band} />
              </div>
            </main>

            {/* Sidebar - fixed on desktop, hidden on mobile */}
            <div className="hidden lg:flex lg:h-[calc(100dvh-4rem)] lg:w-1/4 3xl:w-1/5 lg:flex-col lg:sticky lg:right-0 lg:top-16 lg:bottom-0 lg:border-l lg:border-white/10  lg:backdrop-blur-sm lg:z-20">
              <div className="flex flex-col h-full overflow-y-auto scrollbar-hidden">
                <Sidebar
                  images={images}
                  initialTrack={initialTrack}
                  initialQueue={initialQueue}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile player only */}
        <div className="lg:hidden">
          <StickyPlayer initialTrack={initialTrack} initialQueue={initialQueue} />
        </div>
      </div>
    </ImageGalleryProvider>
  )
}
