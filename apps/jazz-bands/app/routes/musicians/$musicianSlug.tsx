import {
  type LoaderFunctionArgs,
  useLoaderData,
} from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { getMusicianBySlug, getBandBySlug } from '~/lib/queries'
import { sanityClient } from '~/lib/sanity.settings'
import type { Musician, Photo } from '~/lib/types'

function MusicianStructuredData({ musician, band, origin }: { musician: any; band?: string; origin: string }) {
  const data: Record<string, any> = {
    '@type': 'MusicPerson',
    name: musician.name,
    ...(musician.instrument && { jobTitle: musician.instrument }),
    image: origin + musician.photo,
    ...(musician.bio?.[0]?.children?.[0]?.text && {
      description: musician.bio[0].children[0].text,
    }),
    ...(band && {
      knownFor: { '@type': 'MusicGroup', name: band },
    }),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', ...data }) }}
    />
  )
}

interface MusicianDetailResponse {
  _id: string
  name: string
  slug: string
  bio: any[]
  instrument: string
  photo: string
  gallery: { url: string }[]
  bands: { name: string; slug: string }[]
  bandOverrides?: Array<{
    _key: string
    bio?: any[]
    instrument?: string
    image?: string
    band: { name: string; slug: string }
  }>
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const bandSlug = process.env.BAND_SLUG
  const artistSlug = params.musicianSlug

  if (!bandSlug || !artistSlug) {
    throw new Response('Bad request', { status: 400 })
  }

  const origin = new URL(request.url).origin

  // Fetch musician detail
  const musician = await sanityClient.fetch(
    getMusicianBySlug,
    { slug: artistSlug },
    'includeUnknownTypes'
  ) as MusicianDetailResponse | null

  if (!musician) {
    throw new Response('Musician not found', { status: 404 })
  }

  // Fetch current band for context
  const band = await sanityClient.fetch(
    getBandBySlug,
    { slug: bandSlug }
  )

  // Apply band-specific overrides if this band has them
  let displayName = musician.name
  let bio = musician.bio
  let instrument = musician.instrument
  let photo = musician.photo
  let gallery = musician.gallery

  const override = musician.bandOverrides?.find(
    (o: any) => o.band.slug === bandSlug
  )

  if (override) {
    if (override.bio?.length > 0) bio = override.bio
    if (override.instrument) instrument = override.instrument
    if (override.image) photo = override.image
  }

  return {
    musician: {
      ...musician,
      photo,
      bio,
      instrument,
    },
    band: band?.name,
    origin,
  }
}

export function meta({ data }: { data: ReturnType<typeof loader> | null }) {
  if (!data) return []

  const musician = data.musician as MusicianDetailResponse
  const title = `${musician.name} - ${musician.instrument || 'Musician'}${data.band ? ` | ${data.band}` : ''}`
  const description = musician.bio?.[0]?.children?.[0]?.text || `${musician.name}, ${musician.instrument || 'Musician'}`

  return [
    { title },
    { name: 'description', content: description },
    // Open Graph
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:type', content: 'profile' },
    { property: 'og:image', content: data.origin + musician.photo },
    { property: 'og:site_name', content: data.band || 'Jazz Bands' },
    // Twitter Card
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: data.origin + musician.photo },
  ]
}

export default function MusicianDetail() {
  const { musician, band, origin } = useLoaderData<typeof loader>()

  // Photo gallery (include main photo + gallery images)
  const gallery: Photo[] = [
    { url: musician.photo },
    ...musician.gallery,
  ]

  return (
    <div className="min-h-screen bg-gray-900">
      <MusicianStructuredData musician={musician} band={band} origin={origin} />

      {/* Cover/Photo Section */}
      <div className="relative h-80 md:h-96 bg-gray-800">
        <img
          src={musician.photo}
          alt={musician.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
        <button
          onClick={() => window.history.back()}
          className="absolute top-4 left-4 flex items-center gap-2 px-4 py-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors text-white"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to musicians
        </button>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 -mt-24 relative z-10">
        <div className="bg-gray-900 rounded-lg p-6 shadow-2xl">
          <div className="flex items-start gap-6">
            <img
              src={musician.photo}
              alt={musician.name}
              className="w-32 h-32 rounded-lg object-cover shadow-lg border-2 border-amber-500"
            />
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-white mb-2">
                {musician.name}
              </h1>
              {musician.instrument && (
                <p className="text-amber-400 text-lg mb-4">{musician.instrument}</p>
              )}
              {band && (
                <p className="text-gray-400 text-sm">
                  Member of <span className="text-white">{band}</span>
                </p>
              )}
            </div>
          </div>

          {/* Bio */}
          <div className="mt-8 p-6 bg-gray-800/50 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-4">Biography</h2>
            <div className="prose prose-invert max-w-none">
              {bio && bio.length > 0 ? (
                <p className="text-gray-300">{bio[0]?.children?.map((child: any) => child.text).join('') || ''}</p>
              ) : (
                <p className="text-gray-400">No biography available.</p>
              )}
            </div>
          </div>

          {/* Gallery */}
          {gallery.length > 1 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-white mb-4">Gallery</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {gallery.slice(1).map((photo, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-gray-800">
                    <img
                      src={photo.url}
                      alt={`${musician.name} - Photo ${idx + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Band memberships */}
          {musician.bands && musician.bands.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-white mb-4">Band Memberships</h2>
              <div className="flex flex-wrap gap-2">
                {musician.bands.map((bandItem) => (
                  <span
                    key={bandItem.slug}
                    className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-sm"
                  >
                    {bandItem.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

