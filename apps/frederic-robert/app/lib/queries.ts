/**
 * GROQ queries for the Frederic Robert hub.
 * Uses the shared Sanity project (same dataset as the band sites).
 */

/** Fetch the hub person document (hard-linked to musician_frederic-robert) */
export const getPersonHub = `
  *[_type == "person" && _id == "person_frederic-robert"][0] {
    _id,
    name,
    "slug": slug.current,
    tagline,
    heroImage,
    "musician": musician-> {
      _id,
      name,
      bio,
      instrument,
      "photo": images[0] { asset, hotspot, crop },
      "gallery": images[] { asset, hotspot, crop, metadata }
    },
    "gallery": coalesce(gallery, [])[] {
      _key,
      "image": image { asset, hotspot, crop },
      caption
    },
    socialMedia,
    bookingEmail,
    phone,
    "news": coalesce(news, [])[] {
      _key,
      date,
      title,
      body
    },
    "bands": coalesce(bands, [])[] {
      _key,
      description,
      url,
      "band": band-> {
        _id,
        name,
        "slug": slug.current,
        "logo": logo { asset, hotspot, crop },
        "shortDescription": pt::text(description),
        "tourDates": coalesce(tourDates, [])[] {
          _key,
          date,
          city,
          venue,
          region,
          soldOut,
          ticketsUrl
        }
      }
    },
    seo {
      metaTitle,
      metaDescription
    },
    openGraph {
      title,
      description,
      "image": image { asset, hotspot, crop }
    }
  }
`

/** Minimal projection for sitemap generation */
export const getPersonForSitemap = `
  *[_type == "person" && _id == "person_frederic-robert"][0] {
    name,
    "slug": slug.current
  }
`
