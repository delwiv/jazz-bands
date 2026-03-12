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
  imageUrl?: string
  instruments?: string[]
  birthDate?: string
  deathDate?: string
  // Override fields (if band-specific override exists)
  hasOverride?: boolean
  overrideBio?: string
  overrideImageUrl?: string
}

/**
 * Result type for band member queries
 */
export interface BandMemberWithOverride {
  _id: string
  _type: 'bandMember'
  sortOrder?: number
  joinDate?: string
  leaveDate?: string
  role?: string
  musician: MusicianWithOverride
  // Override fields
  hasOverride?: boolean
  overrideBio?: string
  overrideRole?: string
  overrideImageUrl?: string
}

/**
 * Result type for musician's bands
 */
export interface MusicianBand {
  _id: string
  _type: 'band'
  name: string
  slug?: { current: string }
  imageUrl?: string
  activeYears?: string
  hasOverride?: boolean
  overrideBio?: string
  overrideRole?: string
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
export function getMusicianWithOverride(musicianId: string, bandSlug?: string): string {
  if (bandSlug) {
    return `*[_type == "musician" && _id == $musicianId][0]{
      _id,
      _type,
      name,
      slug,
      instruments,
      birthDate,
      deathDate,
      imageUrl,
      bio,
      "hasOverride": any(bandOverrides[]->band->_id == *[_type == "band" && slug.current == $bandSlug][0]._id),
      "overrideBio": coalesce(
        filter(bandOverrides[], 
          _type == "bandMemberOverride" && 
          @->band->slug.current == $bandSlug
        )[0].bio,
        null
      ),
      "overrideImageUrl": coalesce(
        filter(bandOverrides[], 
          _type == "bandMemberOverride" && 
          @->band->slug.current == $bandSlug
        )[0].imageUrl,
        null
      )
    }`
  }

  return `*[_type == "musician" && _id == $musicianId][0]{
    _id,
    _type,
    name,
    slug,
    instruments,
    birthDate,
    deathDate,
    imageUrl,
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
export function getBandMembersWithOverrides(bandSlug: string): string {
  return `*[_type == "band" && slug.current == $bandSlug][0].members[0]{
    _id,
    _type,
    sortOrder,
    joinDate,
    leaveDate,
    role,
    musician->{
      _id,
      _type,
      name,
      slug,
      instruments,
      birthDate,
      deathDate,
      imageUrl,
      bio,
      "hasOverride": any(bandOverrides[]->band->slug.current == $bandSlug),
      "overrideBio": coalesce(
        filter(bandOverrides[], 
          _type == "bandMemberOverride" && 
          @->band->slug.current == $bandSlug
        )[0].bio,
        null
      ),
      "overrideImageUrl": coalesce(
        filter(bandOverrides[], 
          _type == "bandMemberOverride" && 
          @->band->slug.current == $bandSlug
        )[0].imageUrl,
        null
      )
    },
    "hasOverride": coalesce(overrides.bio, overrides.imageUrl, overrides.role) != null,
    "overrideBio": coalesce(overrides.bio, null),
    "overrideRole": coalesce(overrides.role, null),
    "overrideImageUrl": coalesce(overrides.imageUrl, null)
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
export function getMusicianBands(musicianId: string): string {
  return `*[_type == "band" && any(members[].musician->_id == $musicianId)]{
    _id,
    _type,
    name,
    slug,
    imageUrl,
    activeYears,
    "hasOverride": any(members[musician->_id == $musicianId].overrides[] != null),
    "overrideBio": coalesce(
      members[musician->_id == $musicianId].overrides.bio[0],
      null
    ),
    "overrideRole": coalesce(
      members[musician->_id == $musicianId].overrides.role[0],
      null
    )
  } | order(activeYears asc)`
}
