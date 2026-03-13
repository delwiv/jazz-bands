import type { ImageMetadata } from '@sanity/image-url'
import createImageUrlBuilder from '@sanity/image-url'

const urlForImage = createImageUrlBuilder({
  projectId: process.env.SANITY_PROJECT_ID!,
  dataset: process.env.SANITY_DATASET || 'production',
})

export function imageurl(source: ImageMetadata) {
  return urlForImage(source)
}

export { urlForImage }
