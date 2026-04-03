import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useKeyPress } from '~/hooks/useKeyPress'
import { useReducedMotion } from '~/hooks/useReducedMotion'
import { useSwipe } from '~/hooks/useSwipe'
import type { GalleryImage } from '~/lib/types'
import { CaptionOverlay } from './CaptionOverlay'
import { NavigationArrows } from './NavigationArrows'
import { PaginationDots } from './PaginationDots'

export interface ImageViewerProps {
  images: GalleryImage[]
  isOpen: boolean
  onClose: () => void
  initialIndex: number
}

export function ImageViewer({
  isOpen,
  onClose,
  images,
  initialIndex,
}: ImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const reducedMotion = useReducedMotion()

  const updateIndex = useCallback(
    (index: number) => {
      setCurrentIndex((index + images.length) % images.length)
    },
    [images.length],
  )

  const nextImage = useCallback(() => {
    updateIndex(currentIndex + 1)
  }, [currentIndex, updateIndex])

  const prevImage = useCallback(() => {
    updateIndex(currentIndex - 1)
  }, [currentIndex, updateIndex])

  useKeyPress({
    keys: ['Escape', 'ArrowLeft', 'ArrowRight'],
    onKeyPress: (key) => {
      if (key === 'Escape') onClose()
      else if (key === 'ArrowLeft') prevImage()
      else if (key === 'ArrowRight') nextImage()
    },
    enabled: isOpen,
  })

  const swipeHandlers = useSwipe({
    onSwipeLeft: prevImage,
    onSwipeRight: nextImage,
    threshold: 50,
  })

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex)
    }
  }, [isOpen, initialIndex])

  if (!images.length) return null

  const currentImage = images[currentIndex]
  const isSingleImage = images.length === 1
  const slideVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.3 } },
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-lg"
          {...(reducedMotion ? {} : swipeHandlers)}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-20 glass-card p-2 rounded-full border border-white/20 hover:bg-white/10 transition-colors focus-ring"
            aria-label="Close viewer"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          <NavigationArrows
            onPrevious={prevImage}
            onNext={nextImage}
            showPrevious={!isSingleImage}
            showNext={!isSingleImage}
          />

          <div className="w-full h-full flex items-center justify-center p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                className="w-full h-full flex items-center justify-center"
                variants={reducedMotion ? undefined : slideVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <img
                  src={currentImage.src}
                  alt={currentImage.alt}
                  className="max-w-full max-h-full object-contain"
                  loading="eager"
                  draggable={false}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          <CaptionOverlay caption={currentImage.caption} />

          <PaginationDots
            currentIndex={currentIndex}
            totalImages={images.length}
            onSelect={updateIndex}
          />

          {!isSingleImage && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
              <div className="glass-card px-4 py-2 rounded-full border border-white/20">
                <span className="text-white text-sm font-medium">
                  {currentIndex + 1} / {images.length}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </AnimatePresence>
  )
}
