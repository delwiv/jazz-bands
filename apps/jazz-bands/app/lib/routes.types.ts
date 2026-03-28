/**
 * Route-specific TypeScript interfaces for loader data
 * Eliminates need for 'as any' casts in useLoaderData()
 */

import type { Band } from '~/lib/types'

/** Home page loader data */
export interface BandHomeLoaderData {
  band: Band
  baseUrl: string
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
    photo?: string
    galleryImages?: Array<{ image?: string }>
  }>
  baseUrl: string
}

/** Tour page loader data */
export interface TourLoaderData {
  band: Band
  baseUrl: string
}

/** Contact page loader data */
export interface ContactLoaderData {
  band: Band
  baseUrl: string
}

/** Musician detail page loader data */
export interface MusicianSlugLoaderData {
  musician: {
    _id: string
    name: string
    slug: string
    bio: Array<{ children?: Array<{ text?: string }> }>
    instrument: string
    photo?: string
    gallery: Array<{ url: string }>
    bands: Array<{
      name: string
      slug: string
      _id: string
    }>
    bandOverrides: Array<{
      _key: string
      bio?: Array<{ children?: Array<{ text?: string }> }>
      instrument?: string
      image?: string
      band: {
        name: string
        slug: string
        _id: string
      }
    }>
  } | null
  band?: Band
  baseUrl?: string
}

/** Tour date detail page loader data */
export interface TourSlugLoaderData {
  band: Band
  dateSlug: string
  baseUrl: string
}

/** Gallery page loader data */
export interface GalleryLoaderData {
  band: Band
  baseUrl: string
}
