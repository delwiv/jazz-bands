import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FormattedMessage } from 'react-intl'
import { Modal } from '~/components/Modal/Modal'
import { useReducedMotion } from '~/hooks/useReducedMotion'
import { useSwipe } from '~/hooks/useSwipe'
import { useKeyPress } from '~/hooks/useKeyPress'
import { buttonVariants } from '~/lib/animationVariants'

interface CarouselImage {
  url: string
  caption?: string
  source?: 'gallery' | 'musician'
}

interface CarouselProps {
  isOpen: boolean
  onClose: () => void
  images: CarouselImage[]
  initialIndex: number
}

export function Carousel({
  isOpen,
  onClose,
  images,
  initialIndex,
}: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const reducedMotion = useReducedMotion()

  const updateIndex = useCallback(
    (index: number) => {
      setCurrentIndex(
        (index + images.length) % images.length,
      )
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

  if (!images.length) return null

  const currentImage = images[currentIndex]
  const isSingleImage = images.length === 1

  const slideVariants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.4, ease: 'easeInOut' } },
    exit: { opacity: 0, x: -50, transition: { duration: 0.4, ease: 'easeInOut' } },
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div
        className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-lg pb-[100px]"
        {...(reducedMotion ? {} : swipeHandlers)}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 glass-card p-2 rounded-full border border-white/20 hover:bg-white/10 transition-colors focus-ring"
          aria-label={<FormattedMessage id="carousel.close" />}
        >
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {!isSingleImage && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 glass-card p-3 rounded-full border border-white/20 hover:bg-white/10 transition-colors focus-ring"
              aria-label={<FormattedMessage id="carousel.previous" />}
            >
              <motion.div
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </motion.div>
            </button>

            <button
               onClick={nextImage}
               className="absolute right-4 top-1/2 -translate-y-1/2 z-20 glass-card p-3 rounded-full border border-white/20 hover:bg-white/10 transition-colors focus-ring"
               aria-label={<FormattedMessage id="carousel.next" />}
             >
              <motion.div
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </motion.div>
            </button>
          </>
        )}

        <div className="w-full h-full flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.img
               key={currentIndex}
               src={currentImage.url}
               alt={currentImage.caption || `Image ${currentIndex + 1} of ${images.length}`}
               className="w-full h-full object-contain"
               variants={reducedMotion ? undefined : slideVariants}
               initial="initial"
               animate="animate"
               exit="exit"
               loading="eager"
             />
          </AnimatePresence>
        </div>

        {currentImage.caption && (
          <motion.div
            className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-900/90 to-transparent"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <p className="text-white text-center text-lg">
              {currentImage.caption}
            </p>
          </motion.div>
        )}

        {!isSingleImage && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
            <div className="glass-card px-4 py-2 rounded-full border border-white/20">
              <span className="text-white text-sm font-medium">
                {currentIndex + 1} / {images.length}
              </span>
            </div>
          </div>
        )}

        {!isSingleImage && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all focus-ring ${
                  index === currentIndex
                    ? 'bg-white w-4'
                    : 'bg-white/40 hover:bg-white/60'
                }`}
                aria-label={`Go to image ${index + 1}`}
                aria-current={index === currentIndex ? 'true' : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
