import type { GalleryImage, Recording } from '~/lib/types'
import { ImagePreview } from '../Gallery/ImagePreview'
import { StickyPlayer } from '../audio/StickyPlayer'
import { useImageGallery } from '~/contexts/ImageGalleryContext'

export interface SidebarProps {
  initialTrack: Recording | null
  initialQueue: Recording[]
  images: GalleryImage[]
}

export function Sidebar({ initialTrack, initialQueue, images }: SidebarProps) {
  const { open } = useImageGallery()

  return (
     <div className="w-full h-full flex flex-col justify-between">
       {/* Player sticky at top */}
       <div className="overflow-y-auto scrollbar-hidden">
         <div className="px-4 py-6">
           <h3 className="text-white text-lg font-semibold mb-4">Photos</h3>
           <ImagePreview images={images} onClick={open} />
         </div>
       </div>
       <StickyPlayer initialTrack={initialTrack} initialQueue={initialQueue} />
    </div>
   )
 }
