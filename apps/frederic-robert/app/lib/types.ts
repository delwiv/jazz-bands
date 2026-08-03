export interface PTBlock {
  _key: string
  _type: 'block'
  style?: string
  children?: {
    _key: string
    _type: 'span'
    marks?: string[]
    text: string
  }[]
  markDefs?: {
    _key: string
    _type: string
    href?: string
  }[]
}

export interface SanityImage {
  asset?: {
    _ref?: string
    url?: string
  }
  hotspot?: { x: number; y: number; height: number; width: number }
  crop?: { top: number; bottom: number; left: number; right: number }
  metadata?: { caption?: string }
}

export interface GalleryImage {
  _key: string
  image: SanityImage
  caption?: string
}

export interface SocialLink {
  platform:
    | 'facebook'
    | 'instagram'
    | 'youtube'
    | 'spotify'
    | 'tiktok'
    | 'twitter'
    | 'bandcamp'
    | 'soundcloud'
  url: string
}

export interface NewsItem {
  _key: string
  date: string
  title: string
  body?: PTBlock[]
}

export interface TourDateBrief {
  _key: string
  date: string
  city: string
  venue: string
  region?: string
  soldOut: boolean
  ticketsUrl?: string
}

export interface HubBand {
  _id: string
  name: string
  slug: string
  logo?: SanityImage
  shortDescription?: string
  tourDates?: TourDateBrief[]
}

export interface BandEntry {
  _key: string
  description?: string
  url?: string
  band?: HubBand
}

export interface MusicianHub {
  _id: string
  name: string
  bio?: PTBlock[]
  instrument?: string
  photo?: SanityImage
  gallery?: SanityImage[]
}

export interface PersonSeo {
  metaTitle?: string
  metaDescription?: string
}

export interface PersonOpenGraph {
  title?: string
  description?: string
  image?: SanityImage
}

export interface PersonHub {
  _id: string
  name: string
  slug: string
  tagline?: string
  heroImage?: SanityImage
  musician?: MusicianHub
  gallery?: GalleryImage[]
  socialMedia?: SocialLink[]
  bookingEmail?: string
  phone?: string
  news?: NewsItem[]
  bands?: BandEntry[]
  seo?: PersonSeo
  openGraph?: PersonOpenGraph
}

export interface HubLoaderData {
  person: PersonHub
  baseUrl: string
}
