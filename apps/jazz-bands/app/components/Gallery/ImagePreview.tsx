import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useIsHydrated } from '~/hooks/useIsHydrated'
import { useReducedMotion } from '~/hooks/useReducedMotion'
import type { GalleryImage } from '~/lib/types'
import { NavigationArrows } from './NavigationArrows'
import { ProgressBar } from './ProgressBar'

export interface ImagePreviewProps {
  images: GalleryImage[]
  onClick?: (index: number) => void
  autoAdvance?: boolean
  autoAdvanceInterval?: number
  className?: string
}

export function ImagePreview({
  images,
  onClick,
  autoAdvance = true,
  autoAdvanceInterval = 5000,
  className = '',
}: ImagePreviewProps) {
  const isHydrated = useIsHydrated()
  const reducedMotion = useReducedMotion()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [progress, setProgress] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const handleImageClick = useCallback(
    (index: number) => {
      if (!isHydrated || !onClick) return
      onClick(index)
    },
    [isHydrated, onClick],
  )

  const handlePrev = useCallback(() => {
    if (!isHydrated) return
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }, [isHydrated, images.length])

  const handleNext = useCallback(() => {
    if (!isHydrated) return
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }, [isHydrated, images.length])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev()
      if (e.key === 'ArrowRight') handleNext()
    },
    [handlePrev, handleNext],
  )

  // Auto-advance slideshow
  useEffect(() => {
    if (!isHydrated || !autoAdvance || reducedMotion || isHovered) return

    setProgress(0)

    const progressInterval = setInterval(() => {
      setProgress((prev) => prev + 2)
    }, 100)

    timerRef.current = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, autoAdvanceInterval)

    return () => {
      clearInterval(progressInterval)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [
    images.length,
    isHydrated,
    autoAdvance,
    reducedMotion,
    isHovered,
    autoAdvanceInterval,
  ])

  const handleMouseEnter = useCallback(() => {
    if (!isHydrated) return
    setIsHovered(true)
  }, [isHydrated])

  const handleMouseLeave = useCallback(() => {
    if (!isHydrated) return
    setIsHovered(false)
  }, [isHydrated])

  if (!images.length) return null

  const currentImage = images[currentIndex]
  const isDisabled = !isHydrated || !onClick

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div
        className="aspect-square relative overflow-hidden bg-slate-800/50 group focus-ring"
        role={isDisabled ? undefined : 'button'}
        tabIndex={isDisabled ? undefined : 0}
        onKeyDown={handleKeyDown}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: isDisabled ? 'default' : 'pointer' }}
      >
        {isHydrated ? (
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
              ease: [0.32, 0.72, 0, 1],
            }}
            onClick={() => handleImageClick(currentIndex)}
          />
        ) : (
          <img
            key={0}
            src={currentImage.src}
            alt={currentImage.alt}
            className="w-full h-full object-cover"
            style={{
              objectFit: 'cover',
              objectPosition: 'center',
              height: '100%',
              width: '100%',
              margin: 0,
            }}
          />
        )}

        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors pointer-events-none" />

        <NavigationArrows
          onPrevious={handlePrev}
          onNext={handleNext}
          showPrevious={images.length > 1}
          showNext={images.length > 1}
          buttonClassName={isDisabled ? 'cursor-default pointer-events-none' : ''}
        />

        <div className="absolute bottom-2 left-0 right-0 text-center">
          <span className="text-xs text-white/80 bg-black/40 px-2 py-1 rounded">
            {currentIndex + 1}/{images.length}
          </span>
        </div>

        <ProgressBar
          progress={progress}
          visible={isHydrated && autoAdvance && !reducedMotion && !isHovered}
        />

        {isHydrated && (
          <motion.div
            key={`transition-${currentIndex}`}
            className="absolute inset-0 bg-white/5 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{
              duration: 0.6,
              ease: 'easeInOut',
            }}
            style={{
              zIndex: 10,
            }}
          />
        )}
      </div>
    </div>
  )
}
