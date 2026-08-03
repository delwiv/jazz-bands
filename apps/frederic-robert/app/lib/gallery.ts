import { getImageUrl } from './images'
import type { PersonHub } from './types'

export interface GalleryItem {
  id: string
  src: string
  alt: string
  caption?: string
}

/** Combined gallery: person gallery first, then musician images */
export function buildGallery(person: PersonHub): GalleryItem[] {
  const items: GalleryItem[] = []

  ;(person.gallery ?? []).forEach((img, i) => {
    const src = getImageUrl(img.image, 900)
    if (src) {
      items.push({
        id: `person-${i}`,
        src,
        alt: img.caption || `${person.name} — photo`,
        caption: img.caption,
      })
    }
  })

  ;(person.musician?.gallery ?? []).forEach((img, i) => {
    const src = getImageUrl(img, 900)
    if (src) {
      items.push({
        id: `musician-${i}`,
        src,
        alt: `${person.name} — photo`,
        caption: img.metadata?.caption,
      })
    }
  })

  return items
}
