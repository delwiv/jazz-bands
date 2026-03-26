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
    "backgroundImage": backgroundImage.asset->url,
    "contentImages": coalesce(contentImages, [])[] {
      _key,
      "url": asset->url
    },
    "members": bandMembers[] {
      _key,
      sortOrder,
      instrument,
      bio,
      "images": images[0].asset->url,
      "photo": coalesce(images[0].asset->url, musician->images[0].asset->url),
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
    "recordings": recordings[] {
      _key,
      _type,
      title,
      duration,
      album,
      releaseYear,
      description,
      downloadEnabled,
      "audioUrl": audio.asset->url
    },
    contact,
    "socialMedia": socialMedia,
    branding
  }
`

/** Fetch a single musician by slug with band-specific overrides */
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
      "slug": slug.current,
      _id
    },
    "bandOverrides": bandOverrides[] {
      _key,
      bio,
      instrument,
      "image": image.asset->url,
      "band": band-> {
        name,
        "slug": slug.current,
        _id
      }
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

/** Get band with tour dates for filtering */
export const getBandWithTourDates = `
  *[_type == "band" && slug.current == $bandSlug][0] {
    _id,
    name,
    "slug": slug.current,
    "tourDates": tourDates[] {
      _key,
      date,
      city,
      venue,
      region,
      details,
      ticketsUrl,
      soldOut,
      slug
    }
  }
`

/** Get all tour dates for SEO sitemap */
export const getAllTourDates = `
  *[_type == "band" && slug.current == $bandSlug][0] {
    name,
    "tourDates": tourDates[] {
      _key,
      date,
      city,
      venue,
      region,
      slug
    }
  }
`
