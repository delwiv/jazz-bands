/**
 * GROQ query helpers for musician override resolution
 *
 * These functions return GROQ query strings for use with Sanity client.
 * They handle musician data with optional band-specific overrides.
 */

/**
 * Result type for musician queries with overrides
 */
export interface MusicianWithOverride {
  _id: string
  _type: 'musician'
  name: string
  slug?: { current: string }
  bio?: string
  mainImageUrl?: string
  images?: any[]
  instrument?: string
  // Override fields (if band-specific override exists)
  hasOverride?: boolean
  overrideBio?: string
  overrideImages?: any[]
}

/**
 * Result type for band member queries
 */
export interface BandMemberWithOverride {
  _id: string
  _type: 'bandMemberOverride'
  sortOrder?: number
  musician: MusicianWithOverride
  // Override fields
  hasOverride?: boolean
  overrideBio?: string
  overrideImages?: any[]
  instrument?: string
}

/**
 * Result type for musician's bands
 */
export interface MusicianBand {
  _id: string
  _type: 'band'
  name: string
  slug?: { current: string }
  mainImageUrl?: string
  images?: any[]
  hasOverride?: boolean
  overrideBio?: string
  overrideImages?: any[]
}

/**
 * Returns a GROQ query to fetch a musician with optional band-specific overrides
 *
 * @param musicianId - The musician's Sanity document ID
 * @param bandSlug - Optional band slug to fetch band-specific overrides
 * @returns GROQ query string
 *
 * @example
 * ```ts
 * const query = getMusicianWithOverride('musician_123')
 * const musician = await sanityClient.fetch(query, { musicianId: 'musician_123' })
 *
 * // With band-specific override
 * const queryWithOverride = getMusicianWithOverride('musician_123', 'the-rolling-stones')
 * const musician = await sanityClient.fetch(queryWithOverride, {
 *   musicianId: 'musician_123',
 *   bandSlug: 'the-rolling-stones'
 * })
 * ```
 */
export function getMusicianWithOverride(
  _musicianId: string,
  bandSlug?: string,
): string {
  if (bandSlug) {
    return `*[_type == "musician" && _id == $musicianId][0]{
      _id,
      _type,
      name,
      slug,
      instrument,
      "mainImageUrl": images[0].asset->url,
      images,
      bio,
      "hasOverride": any(bandOverrides[]->band->_id == *[_type == "band" && slug.current == $bandSlug][0]._id),
      "overrideBio": coalesce(
        filter(bandOverrides[], 
          _type == "bandMemberOverride" && 
          @->band->slug.current == $bandSlug
        )[0].bio,
        null
      ),
      "overrideImages": coalesce(
        filter(bandOverrides[], 
          _type == "bandMemberOverride" && 
          @->band->slug.current == $bandSlug
        )[0].images,
        null
      )
    }`
  }

  return `*[_type == "musician" && _id == $musicianId][0]{
    _id,
    _type,
    name,
    slug,
    instrument,
    "mainImageUrl": images[0].asset->url,
    images,
    bio,
    "hasOverride": false
  }`
}

/**
 * Returns a GROQ query to fetch all band members with their overrides applied
 *
 * @param bandSlug - The band's slug to fetch members for
 * @returns GROQ query string
 *
 * @example
 * ```ts
 * const query = getBandMembersWithOverrides('the-beatles')
 * const members = await sanityClient.fetch<BandMemberWithOverride[]>(query, {
 *   bandSlug: 'the-beatles'
 * })
 * ```
 */
export function getBandMembersWithOverrides(_bandSlug: string): string {
  return `*[_type == "band" && slug.current == $bandSlug][0].bandMembers{
    _id,
    _type,
    sortOrder,
    instrument,
    bio,
    images,
    musician->{
      _id,
      _type,
      name,
      slug,
      instrument,
      "mainImageUrl": images[0].asset->url,
      images,
      bio
    }
  } | order(sortOrder asc, musician.name asc)`
}

/**
 * Returns a GROQ query to fetch all bands a musician belongs to
 *
 * @param musicianId - The musician's Sanity document ID
 * @returns GROQ query string
 *
 * @example
 * ```ts
 * const query = getMusicianBands('musician_123')
 * const bands = await sanityClient.fetch<MusicianBand[]>(query, {
 *   musicianId: 'musician_123'
 * })
 * ```
 */
export function getMusicianBands(_musicianId: string): string {
  return `*[_type == "band" && any(bandMembers[].musician->_id == $musicianId)]{
    _id,
    _type,
    name,
    slug,
    "mainImageUrl": images[0].asset->url,
    images,
    "hasOverride": any(bandMembers[musician->_id == $musicianId].images != null || bandMembers[musician->_id == $musicianId].bio != null),
    "overrideBio": coalesce(
      bandMembers[musician->_id == $musicianId].bio[0],
      null
    ),
    "overrideImages": coalesce(
      bandMembers[musician->_id == $musicianId].images[0],
      null
    )
  }`
}
