import { useState } from 'react'

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void
  onTouchMove: (e: React.TouchEvent) => void
  onTouchEnd: (e: React.TouchEvent) => void
}

interface UseSwipeProps {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  threshold?: number
}

/**
 * Hook to detect horizontal swipe gestures for touch navigation
 * Ignores vertical swipes to prevent interference with scrolling
 */
export function useSwipe({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
}: UseSwipeProps): SwipeHandlers {
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  const minSwipeDistance = threshold

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe && onSwipeLeft) {
      onSwipeLeft()
    } else if (isRightSwipe && onSwipeRight) {
      onSwipeRight()
    }

    setTouchStart(null)
    setTouchEnd(null)
  }

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  }
}
