import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { useReducedMotion } from '~/hooks/useReducedMotion'
import type { Image } from './ImageModal'
import { ImageModal } from './ImageModal'

export interface SlideshowPreviewProps {
  images: Image[]
  onClose?: () => void
}

export function SlideshowPreview({ images, onClose }: SlideshowPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [modalState, setModalState] = useState<{
    isOpen: boolean
    currentIndex: number
  }>({
    isOpen: false,
    currentIndex: 0,
  })
  const [isHovered, setIsHovered] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const reducedMotion = useReducedMotion()

  // Calculate progress percentage for progress bar
  const [progress, setProgress] = useState(0)

  // Auto-advance slideshow every 5 seconds
  useEffect(() => {
    if (reducedMotion || modalState.isOpen || isHovered) return

    // Reset progress to 0
    setProgress(0)

    // Set interval to update progress bar every 100ms for smooth animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => prev + 2) // 2% every 100ms = 100% in 5s
    }, 100)

    // Auto-advance after 5 seconds
    timerRef.current = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, 5000)

    return () => {
      clearInterval(progressInterval)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [currentIndex, images.length, reducedMotion, modalState.isOpen, isHovered])

  const handleImageClick = useCallback((index: number) => {
    setModalState({ isOpen: true, currentIndex: index })
  }, [])

  const handleCloseModal = useCallback(() => {
    setModalState({ isOpen: false, currentIndex: 0 })
    onClose?.()
  }, [onClose])

 const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }, [images.length])

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }, [images.length])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev()
      if (e.key === 'ArrowRight') handleNext()
    },
    [handlePrev, handleNext],
  )

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
  }, [])

  if (!images.length) return null

  const currentImage = images[currentIndex]

  return (
    <>
      <div
        className="w-full overflow-hidden"
        role="region"
        aria-label="Image slideshow"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        <div
          className="aspect-square relative overflow-hidden bg-slate-800/50 group"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <motion.img
            key={currentIndex}
            src={currentImage.src}
            alt={currentImage.alt}
            className="w-full h-full object-cover"
            style={{
              objectPosition: 'center',
              display: 'block',
              margin: 0,
            }}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{
              duration: 0.6,
              ease: [0.32, 0.72, 0, 1]
            }}
            onClick={() => handleImageClick(currentIndex)}
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />

          {/* Prev/Next buttons overlay */}
          <button
            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
            className={`absolute left-2 top-1/2 -translate-y-1/2 focus-ring p-2 hover:bg-white/20 rounded-full transition-colors ${images.length <= 1 ? 'opacity-0 pointer-events-none' : ''}`}
            aria-label="Previous image"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
            className={`absolute right-2 top-1/2 -translate-y-1/2 focus-ring p-2 hover:bg-white/20 rounded-full transition-colors ${images.length <= 1 ? 'opacity-0 pointer-events-none' : ''}`}
            aria-label="Next image"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>

          {/* Image counter */}
          <div className="absolute bottom-2 left-0 right-0 text-center">
            <span className="text-xs text-white/80 bg-black/40 px-2 py-1 rounded">
              {currentIndex + 1}/{images.length}
            </span>
          </div>

        {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/10">
            <div
              className="h-full bg-white/80 transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>

        </div>

        {/* Glassy transition overlay */}
        <motion.div
          key={`transition-${currentIndex}`}
          className="absolute inset-0 bg-white/5 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.3, 0] }}
          transition={{ 
            duration: 0.6,
            ease: "easeInOut"
          }}
          style={{
            zIndex: 10,
          }}
        />
      </div>

      <ImageModal
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        images={images}
        initialIndex={modalState.currentIndex}
      />
    </>
  )
}
