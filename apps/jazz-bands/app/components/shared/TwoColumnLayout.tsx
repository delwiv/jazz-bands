import { AnimatePresence, motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { useReducedMotion } from '~/hooks/useReducedMotion'
import { pageVariants } from '~/lib/animationVariants'
import type { Band, GalleryImage, Recording } from '~/lib/types'
import { ImageGalleryProvider } from '~/contexts/ImageGalleryContext'
import { Footer } from './Footer'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

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
                   initialTrack={initialTrack}
                   initialQueue={initialQueue}
                   images={images}
                 />
               </div>
             </div>
           </div>
         </div>
       </div>
     </ImageGalleryProvider>
  )
}
