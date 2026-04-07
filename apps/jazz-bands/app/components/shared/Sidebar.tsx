import { useImageGallery } from '~/contexts/ImageGalleryContext'
import type { GalleryImage, Recording } from '~/lib/types'
import { StickyPlayer } from '../audio/StickyPlayer'
import { ImagePreview } from '../Gallery/ImagePreview'

export interface SidebarProps {
  initialTrack: Recording | null
  initialQueue: Recording[]
  images: GalleryImage[]
}

export function Sidebar({ initialTrack, initialQueue, images }: SidebarProps) {
  const { open } = useImageGallery()

  return (
    <div className="w-full h-full flex flex-col justify-between">
      <ImagePreview images={images} onClick={open} />
      <StickyPlayer initialTrack={initialTrack} initialQueue={initialQueue} />
    </div>
  )
}
