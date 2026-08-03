// biome-ignore-all lint/security/noDangerouslySetInnerHtml: JSON-LD structured data requires raw script content
import { urlForImage } from '../lib/sanity.settings'
import type { BandEntry, PersonHub } from '../lib/types'

interface BandLink {
  name: string
  url: string
}

/**
 * Schema.org structured data for the hub:
 * Person (Frédéric Robert) + MusicGroup for each referenced band.
 */
export function PersonStructuredData({
  person,
  bandLinks,
  baseUrl,
}: {
  person: PersonHub
  bandLinks: BandLink[]
  baseUrl: string
}) {
  const photo = person.heroImage?.asset || person.musician?.photo?.asset
  const sameAs =
    person.socialMedia?.filter((s) => s.url).map((s) => s.url) || []

  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: person.name,
    jobTitle: 'Batteur de jazz',
    image: photo ? urlForImage.image(photo).width(1200).url() : undefined,
    url: baseUrl,
    sameAs,
    knowsAbout: (person.bands ?? [])
      .map((entry) => entry.band?.name)
      .filter(Boolean),
  }

  const bandsJsonLd = (person.bands ?? [])
    .map((entry: BandEntry) => ({
      '@context': 'https://schema.org',
      '@type': 'MusicGroup',
      name: entry.band?.name,
      url: entry.band?.slug
        ? bandLinks.find((b) => b.name === entry.band?.name)?.url
        : undefined,
    }))
    .filter((b) => b.url)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      {bandsJsonLd.map((band) => (
        <script
          key={band.name}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(band) }}
        />
      ))}
    </>
  )
}
