import { createContext, useCallback, useContext, useState } from 'react'
import type { GalleryImage } from '~/lib/types'
import { ImageViewer } from '~/components/Gallery/ImageViewer'

interface ImageGalleryContextValue {
  open: (index: number, images?: GalleryImage[]) => void
  close: () => void
  currentIndex: number
  isOpen: boolean
}

const ImageGalleryContext = createContext<ImageGalleryContextValue | null>(null)

export interface ImageGalleryProviderProps {
  children: React.ReactNode
  images: GalleryImage[]
}

export function ImageGalleryProvider({
  children,
  images: defaultImages,
}: ImageGalleryProviderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [activeImages, setActiveImages] = useState<GalleryImage[]>(defaultImages)

  const open = useCallback((index: number, images?: GalleryImage[]) => {
    // Allow caller to pass custom images array, otherwise use default
    if (images && images.length > 0) {
      setActiveImages(images)
    }
    setCurrentIndex(index)
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  const contextValue: ImageGalleryContextValue = {
    open,
    close,
    currentIndex,
    isOpen,
  }

  return (
    <ImageGalleryContext.Provider value={contextValue}>
      {children}
      <ImageViewer
        images={activeImages}
        isOpen={isOpen}
        onClose={close}
        initialIndex={currentIndex}
      />
    </ImageGalleryContext.Provider>
  )
}

export function useImageGallery(): ImageGalleryContextValue {
  const context = useContext(ImageGalleryContext)
  if (!context) {
    throw new Error('useImageGallery must be used within an ImageGalleryProvider')
  }
  return context
}
