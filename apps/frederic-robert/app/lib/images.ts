import { urlForImage } from './sanity.settings'
import type { SanityImage } from './types'

/** Build an optimized Sanity CDN URL from an image reference */
export function getImageUrl(
  image: SanityImage | undefined,
  width = 800,
): string {
  if (!image?.asset) return ''
  return urlForImage.image(image.asset).width(width).auto('format').url()
}
