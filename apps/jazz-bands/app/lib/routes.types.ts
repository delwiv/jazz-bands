/**
 * Route-specific TypeScript interfaces for loader data
 * Eliminates need for 'as any' casts in useLoaderData()
 */

import type { Band, GalleryImage } from '~/lib/types'

/** Home page loader data */
export interface BandHomeLoaderData {
  band: Band
  baseUrl: string
  galleryImages: GalleryImage[]
}

/** Musicians page loader data */
export interface MusiciansLoaderData {
  band: Band
  musicians: Array<{
    _key: string
    sortOrder?: number
    instrument?: string
    bio?: Array<{ children?: Array<{ text?: string }> }>
    musicianId?: string
    name: string
    slug: string
    photo?: {
      _type: 'reference'
      _ref: string
    }
    galleryImages?: Array<{ image?: { _type: 'reference'; _ref: string } }>
  }>
  baseUrl: string
  galleryImages: GalleryImage[]
}

/** Tour page loader data */
export interface TourLoaderData {
  band: Band
  baseUrl: string
  galleryImages: GalleryImage[]
}

/** Contact page loader data */
export interface ContactLoaderData {
  band: Band
  baseUrl: string
  galleryImages: GalleryImage[]
}

/** Music detail page loader data */
export interface MusicLoaderData {
  band: Band
  baseUrl: string
  galleryImages: GalleryImage[]
}

/** Musician detail page loader data */
export interface MusicianSlugLoaderData {
  musician: {
    _id: string
    name: string
    slug: string
    bio: Array<{ children?: Array<{ text?: string }> }>
    instrument: string
    photo?: {
      _type: 'reference'
      _ref: string
    }
    gallery: Array<{
      asset: {
        _type: 'reference'
        _ref: string
      }
      metadata?: any
    }>
    bands: Array<{
      name: string
      slug: string
      _id: string
    }>
    bandOverrides: Array<{
      _key: string
      bio?: Array<{ children?: Array<{ text?: string }> }>
      instrument?: string
      image?: {
        _type: 'reference'
        _ref: string
      }
      band: {
        name: string
        slug: string
        _id: string
      }
    }>
  } | null
  band?: Band
  baseUrl?: string
  galleryImages?: GalleryImage[]
}

/** Tour date detail page loader data */
export interface TourSlugLoaderData {
  band: Band
  dateSlug: string
  baseUrl: string
  galleryImages: GalleryImage[]
}

/** Gallery page loader data */
export interface GalleryLoaderData {
  band: Band
  baseUrl: string
  galleryImages: GalleryImage[]
}
