/**
 * Straightforward GROQ queries for Sanity CMS
 * Import these strings and pass them to sanityClient.fetch()
 */

/** Fetch all bands (landing page) */
export const getAllBands = `
  *[_type == "band"] {
    _id,
    name,
    "slug": slug.current,
    "logo": logo.asset->url,
    "heroImage": heroImage.asset->url,
    "mainImages": coalesce(mainImages, [])[] {
      _key,
      "url": asset->url
    }
  }
`

/** Fetch a single band by slug */
export const getBandBySlug = `
  *[_type == "band" && slug.current == $slug][0] {
    _id,
    name,
    "slug": slug.current,
    description,
    "logo": logo.asset->url,
    "heroImage": heroImage.asset->url,
    "mainImages": coalesce(mainImages, [])[] {
      _key,
      "url": asset->url
    },
    "members": bandMembers[] {
      _key,
      sortOrder,
      instrument,
      bio,
      "images": images[0].asset->url,
      "musician": musician-> {
        _id,
        name,
        "slug": slug.current,
        bio,
        instrument,
        "photo": images[0].asset->url,
        "gallery": images[] {
          "url": asset->url
        }
      }
    },
    tourDates,
    recordings,
    contact,
    "socialMedia": socialMedia,
    branding
  }
`

/** Fetch a single musician by slug */
export const getMusicianBySlug = `
  *[_type == "musician" && slug.current == $slug][0] {
    _id,
    name,
    "slug": slug.current,
    bio,
    instrument,
    "photo": images[0].asset->url,
    "gallery": images[] { "url": asset->url },
    "bands": bands[]-> {
      name,
      "slug": slug.current
    }
  }
`

/** Fetch musicians by band ID (for musicians page) */
export const getMusiciansByBandId = `
  *[_type == "band" && _id == $bandId][0].bandMembers[] {
    _key,
    sortOrder,
    instrument,
    bio,
    "musicianId": musician._ref,
    "name": musician->name,
    "slug": musician->slug.current,
    "bio": coalesce(bio, musician->bio),
    "instrument": coalesce(instrument, musician->instrument),
    "photo": coalesce(images[0].asset->url, musician->images[0].asset->url),
    "galleryImages": coalesce(images, musician->images)[] { "image": asset->url }
  } | order(sortOrder asc)
`
