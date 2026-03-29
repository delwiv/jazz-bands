import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence, useTransform, useMotionValue } from 'framer-motion'
import { FormattedMessage } from 'react-intl'
import { Modal } from '~/components/Modal/Modal'
import { useReducedMotion } from '~/hooks/useReducedMotion'
import { useSwipe } from '~/hooks/useSwipe'
import { useKeyPress } from '~/hooks/useKeyPress'
import { buttonVariants } from '~/lib/animationVariants'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

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

  // Swipe handlers for fallback touch detection (RIGHT forward, LEFT backward)
 const swipeHandlers = useSwipe({
    onSwipeLeft: prevImage,   // LEFT swipe → previous image
    onSwipeRight: nextImage,  // RIGHT swipe → next image
    threshold: 50,
  })

  if (!images.length) return null

 const currentImage = images[currentIndex]
 const isSingleImage = images.length === 1

 // Framer-motion drag state
 const dragX = useMotionValue(0)
 const opacity = useTransform(dragX, [-100, 0, 100], [0.5, 1, 0.5])
 const scale = useTransform(dragX, [-100, 0, 100], [0.95, 1, 0.95])

 // Slide variants for animation (no x translation to avoid conflict with drag)
 const slideVariants = {
   initial: { opacity: 0 },
   animate: { opacity: 1, transition: { duration: 0.3 } },
   exit: { opacity: 0, transition: { duration: 0.3 } },
 }

 // Drag end handler with flick detection and circular navigation
 const handleDragEnd = useCallback(
   (e: any, info: any) => {
     // Safely extract offset and velocity from info.point
     const offset = info?.point?.offset || { x: 0 }
     const velocity = info?.point?.velocity || { x: 0 }
     
     const SWIPE_THRESHOLD = 50  // Minimum distance (px)
     const VELOCITY_THRESHOLD = 200  // Minimum velocity (px/s)
     
     // Flick detection: fast swipe regardless of distance
     // Positive velocity = flick RIGHT (forward), Negative velocity = flick LEFT (backward)
     if (velocity.x > VELOCITY_THRESHOLD) {
       nextImage()  // Flick RIGHT → next image
     } else if (velocity.x < -VELOCITY_THRESHOLD) {
       prevImage()  // Flick LEFT → previous image
     } 
     // Distance-based navigation
     // Negative offset = dragged LEFT, Positive offset = dragged RIGHT
     else if (offset.x < -SWIPE_THRESHOLD) {
       prevImage()  // Dragged LEFT → previous image
     } else if (offset.x > SWIPE_THRESHOLD) {
       nextImage()  // Dragged RIGHT → next image
     }
     // Small drag: snap back to center
     else {
       dragX.set(0)
     }
   },
   [nextImage, prevImage, dragX],
 )

// Reset drag position when image changes
 useEffect(() => {
   dragX.set(0)
}, [currentIndex, dragX])

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div
        className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-lg pb-[100px]"
        {...(reducedMotion ? {} : swipeHandlers)}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 glass-card p-2 rounded-full border border-white/20 hover:bg-white/10 transition-colors focus-ring"
          aria-label="Close carousel"
        >
          <X className="w-6 h-6 text-white" />
        </button>

        {!isSingleImage && (
          <>
<button
               onClick={prevImage}
               className="absolute left-4 top-1/2 -translate-y-1/2 z-20 glass-card p-3 rounded-full border border-white/20 hover:bg-white/10 transition-colors focus-ring"
               aria-label="Previous image"
             >
         <motion.div
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </motion.div>
            </button>

<button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 glass-card p-3 rounded-full border border-white/20 hover:bg-white/10 transition-colors focus-ring"
                aria-label="Next image"
              >
<motion.div
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </motion.div>
            </button>
          </>
        )}

       <div
          className="w-full h-full flex items-center justify-center"
          // DISABLED: {...(reducedMotion ? {} : swipeHandlers)}
        >
        {/* Edge gradient indicators - DISABLED */}
          {/*
          DISABLED: {!isSingleImage && !reducedMotion && (
          <>
          <motion.div
            style={{ opacity: useTransform(dragX, [-150, -50, 0], [1, 1, 0]) }}
            className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-slate-900/70 to-transparent pointer-events-none z-10"
            />
          <motion.div
            style={{ opacity: useTransform(dragX, [0, 50, 150], [0, 1, 1]) }}
            className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-slate-900/70 to-transparent pointer-events-none z-10"
            />
          </>
          )}
          */}

          <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          className="w-full h-full flex items-center justify-center"
          variants={reducedMotion ? undefined : slideVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          // DISABLED: drag={!reducedMotion && !isSingleImage ? "x" : false}
          // DISABLED: dragElastic={0.3}  // Disabled swipe for now
          // DISABLED: dragMomentum={false}
          // DISABLED: onDragEnd={!reducedMotion && !isSingleImage ? handleDragEnd : undefined}
          style={{
            // DISABLED: x: dragX,
            // DISABLED: opacity,
            // DISABLED: scale,
          }}
        >
          <img
            src={currentImage.url}
            alt={currentImage.caption || `Image ${currentIndex + 1} of ${images.length}`}
            className="w-full h-full object-contain pointer-events-none"
            loading="eager"
            draggable={false}
          />
        </motion.div>
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
