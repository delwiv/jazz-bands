import { urlForImage } from './sanity.settings'

export function getGalleryUrl(asset: any): string {
  return urlForImage.image(asset).width(3840).height(3840).fit('max').url()
}

export function getOgImageUrl(asset: any): string {
  return urlForImage.image(asset).width(1200).height(630).fit('max').url()
}

export function getThumbUrl(asset: any, w = 400, h = 400): string {
  return urlForImage.image(asset).width(w).height(h).fit('crop').url()
}

export function getCoverUrl(asset: any): string {
  return urlForImage.image(asset).width(2560).height(1440).fit('crop').crop('focalpoint').url()
}
