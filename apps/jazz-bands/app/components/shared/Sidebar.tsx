import type { Recording } from '~/lib/types'
import type { Image } from './ImageModal'
import { SlideshowPreview } from './SlideshowPreview'
import { StickyPlayer } from '../audio/StickyPlayer'

export interface SidebarProps {
  initialTrack: Recording | null
  initialQueue: Recording[]
  images: Image[]
}

export function Sidebar({ initialTrack, initialQueue, images }: SidebarProps) {
  return (
    <div className="w-full h-full flex flex-col justify-start">
      {/* Player sticky at top */}
      <div className="overflow-y-auto scrollbar-hidden">
        <SlideshowPreview images={images} />
      </div>
      <div className="bg-slate-900/95 backdrop-blur-sm">
        <StickyPlayer initialTrack={initialTrack} initialQueue={initialQueue} />
      </div>

      {/* Slideshow scrolls below */}
    </div>
  )
}
