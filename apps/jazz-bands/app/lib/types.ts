/**
 * PortableText block structure
 */
export interface PortableTextBlock {
  _type: 'block'
  _key?: string
  style?: 'normal' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'blockquote'
  children: Array<{
    _type: 'span'
    text: string
    marks?: string[]
  }>
}

/**
 * Sanity image reference
 */
export interface SanityImage {
  _type: 'image'
  _key?: string
  asset?: {
    _type: 'reference'
    _ref: string
  }
  caption?: string
}

/**
 * Sanity file reference
 */
export interface SanityFile {
  _type: 'file'
  _key?: string
  asset?: {
    _type: 'reference'
    _ref: string
  }
}

/**
 * Recording object (embedded in band.document)
 */
export interface Recording {
  _key: string
  _type: 'recording'
  title: string
  audio: {
    _type: 'reference'
    _ref: string
  }
  audioUrl?: string
  duration?: number
  album?: string
  releaseYear?: number
  composers?: string[]
  trackNumber?: number
  description?: string
  downloadEnabled: boolean
}

/**
 * Musician document type
 * Represents a musician who can belong to multiple bands
 */
export interface Musician {
  _id: string
  _type: 'musician'
  name: string
  slug: {
    _type: 'slug'
    current: string
  }
  bio: PortableTextBlock[]
  instrument?: string
  images?: SanityImage[]
  bands?: Array<{
    _type: 'reference'
    _ref: string
  }>
  bandOverrides?: Array<{
    _key: string
    _type: 'musicianBandOverride'
    band: {
      _type: 'reference'
      _ref: string
    }
    bio?: PortableTextBlock[]
    images?: SanityImage[]
    instrument?: string
  }>
}

export interface TourDate {
  _key?: string
  date: string
  city: string
  venue: string
  region?: string
  details?: string
  ticketsUrl?: string
  soldOut?: boolean
  slug?: string // GENERATED slug (e.g., "2024-03-15-paris-le-baiser-sale")
}

/**
 * Band member object (embedded in band.bandMembers[])
 * Supports per-band customizations for musicians
 */
export interface BandMember {
  _key: string
  _type: 'bandMember'
  musician: {
    _type: 'reference'
    _ref: string
  }
  bio?: PortableTextBlock[]
  images?: SanityImage[]
  instrument?: string
  sortOrder?: number
}

/**
 * Band document type
 * Main entity containing all content for a single band
 */
export interface Band {
  _id: string
  _type: 'band'
  name: string
  slug: {
    _type: 'slug'
    current: string
  }
  description: PortableTextBlock[]
  logo?: string
  backgroundImage?: string
  contentImages?: Array<{
    _key?: string
    _type?: 'image'
    asset?: {
      _type: 'reference'
      _ref: string
    }
    metadata?: any
  }>
  images?: Array<{
    _key?: string
    _type?: 'image'
    asset?: {
      _type: 'reference'
      _ref: string
    }
    metadata?: {
      caption?: string
    }
  }>
  members?: Array<{
    _type: 'reference'
    _ref: string
  }>
  bandMembers?: BandMember[]
  tourDates: TourDate[]
  recordings: Recording[]
  contact?: {
    _type: 'contact'
    email?: string
    phone?: string
  }
  socialMedia?: Array<{
    _key?: string
    _type: 'object'
    platform: string
    url: string
  }>
  branding?: {
    _type: 'branding'
    primaryColor?: string
    secondaryColor?: string
  }
  seo?: {
    _type: 'seo'
    metaTitle?: string
    metaDescription?: string
    metaKeywords?: string[]
  }
  openGraph?: {
    _type: 'openGraph'
    title?: string
    description?: string
    image?: SanityImage
    type?: string
  }
  twitterCard?: {
    _type: 'twitterCard'
    card?: string
    title?: string
    description?: string
    image?: SanityImage
    creator?: string
  }
  structuredData?: {
    _type: 'structuredData'
    genre?: string[]
    formedYear?: number
  }
}

export interface ContentService {
  getBandBySlug(slug: string): Promise<Band | null>
  getMusiciansByBandId(bandId: string): Promise<Musician[]>
  getMusicianBySlug(slug: string): Promise<Musician | null>
  getAllBands(): Promise<Band[]>
}

/**
 * Photo gallery item
 */
export interface Photo {
  url: string
}
