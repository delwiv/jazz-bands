import { useImageGallery } from '~/contexts/ImageGalleryContext'
import type { GalleryImage, Recording } from '~/lib/types'
import { ImagePreview } from '../Gallery/ImagePreview'
import { StickyPlayer } from '../audio/StickyPlayer'

export interface SidebarProps {
  images: GalleryImage[]
  initialTrack?: Recording | null
  initialQueue?: Recording[]
}

export function Sidebar({ images, initialTrack, initialQueue }: SidebarProps) {
  const { open } = useImageGallery()

  return (
    <div className="w-full h-full flex flex-col justify-between">
      <ImagePreview images={images} onClick={open} />
      <StickyPlayer initialTrack={initialTrack} initialQueue={initialQueue} />
    </div>
  )
}
