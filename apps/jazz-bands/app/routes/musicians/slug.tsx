import { PortableText } from '@portabletext/react'
import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { FormattedMessage } from 'react-intl'
import { type LoaderFunctionArgs, useLoaderData } from 'react-router'
import { Carousel } from '~/components/Carousel/Carousel'
import { MainContainer } from '~/components/shared/MainContainer'
import { getBandBySlug, getMusicianBySlug } from '~/lib/queries'
import { sanityClient, urlForImage } from '~/lib/sanity.settings'
import type { Photo } from '~/lib/types'

function MusicianStructuredData({
  musician,
  band,
  origin,
}: {
  musician: any
  band?: string
  origin: string
}) {
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
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({ '@context': 'https://schema.org', ...data }),
      }}
    />
  )
}

interface MusicianDetailResponse {
  _id: string
  name: string
  slug: string
  bio: any[]
  instrument: string
  photo: { _type: 'reference'; _ref: string } | null
  gallery: { asset: { _type: 'reference'; _ref: string }; metadata?: any }[]
  bands: { name: string; slug: string }[]
  bandOverrides?: Array<{
    _key: string
    bio?: any[]
    instrument?: string
    image?: { _type: 'reference'; _ref: string }
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
  const musician = (await sanityClient.fetch(
    getMusicianBySlug,
    { slug: artistSlug },
    // 'includeUnknownTypes',
  )) as MusicianDetailResponse | null

  if (!musician) {
    throw new Response('Musician not found', { status: 404 })
  }

  // Fetch current band for context
  const band = await sanityClient.fetch(getBandBySlug, { slug: bandSlug })

  // Apply band-specific overrides if this band has them
  const displayName = musician.name
  let bio = musician.bio
  let instrument = musician.instrument
  let photo: { _type: 'reference'; _ref: string } | null = musician.photo
  const gallery = musician.gallery

  const override = musician.bandOverrides?.find(
    (o: any) => o.band.slug === bandSlug,
  )

  if (override) {
    if (override.bio?.length > 0) bio = override.bio
    if (override.instrument) instrument = override.instrument
    if (override.image) photo = override.image
  }

  // Use first gallery image as photo if no main photo exists
  if (!photo && gallery && gallery.length > 0) {
    photo = gallery[0].asset
  }

  return {
    musician: {
      ...musician,
      photo,
      bio,
      instrument,
    },
    band, // Full band object for Layout
    origin,
  }
}

export function meta({ data }: { data: ReturnType<typeof loader> | null }) {
  if (!data) return []

  const musician = data.musician as MusicianDetailResponse
  const title = `${musician.name} - ${musician.instrument || 'Musician'}${data.band ? ` | ${data.band.name}` : ''}`
  const description =
    musician.bio?.[0]?.children?.[0]?.text ||
    `${musician.name}, ${musician.instrument || 'Musician'}`

  // Build photo URL for SEO
  const photoUrl =
    musician.photo && typeof musician.photo === 'object'
      ? urlForImage
          .image(musician.photo)
          .width(1200)
          .height(630)
          .fit('max')
          .url()
      : ''

  return [
    { title },
    { name: 'description', content: description },
    // Open Graph
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:type', content: 'profile' },
    { property: 'og:image', content: photoUrl },
    { property: 'og:site_name', content: data.band || 'Jazz Bands' },
    // Twitter Card
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: photoUrl },
  ]
}

export default function MusicianDetail() {
  console.log('Musician detail')
  const { musician, band, origin } = useLoaderData<typeof loader>()
  const bio = musician.bio

  // Photo gallery: main photo first (if distinct from gallery), then gallery images
  const gallery: Photo[] = []

  // Track which images have been added to avoid duplicates
  const addedImageIds = new Set<string>()

  // Add main photo if available and distinct from gallery
  if (
    musician.photo &&
    typeof musician.photo === 'object' &&
    musician.photo._ref
  ) {
    gallery.push({
      url: urlForImage
        .image(musician.photo)
        .width(3840)
        .height(3840)
        .fit('max')
        .url(),
    })
    addedImageIds.add(musician.photo._ref)
  }

  // Add gallery images (skip if already added as main photo)
  if (musician.gallery && Array.isArray(musician.gallery)) {
    gallery.push(
      ...musician.gallery
        .filter(
          (
            img,
          ): img is {
            asset: { _type: 'reference'; _ref: string }
            metadata?: any
          } =>
            img &&
            img.asset &&
            img.asset._ref &&
            !addedImageIds.has(img.asset._ref),
        )
        .map((img) => {
          if (img.asset._ref) {
            addedImageIds.add(img.asset._ref)
          }
          return {
            url: img.asset
              ? urlForImage
                  .image(img.asset)
                  .width(3840)
                  .height(3840)
                  .fit('max')
                  .url()
              : '',
          }
        }),
    )
  }

  // Build photo URLs
  const coverPhotoUrl =
    musician.photo && typeof musician.photo === 'object'
      ? urlForImage
          .image(musician.photo)
          .width(1920)
          .height(1080)
          .fit('max')
          .url()
      : ''
  const profilePhotoUrl =
    musician.photo && typeof musician.photo === 'object'
      ? urlForImage
          .image(musician.photo)
          .width(400)
          .height(400)
          .fit('crop')
          .url()
      : ''

  // Carousel state
  const [carouselOpen, setCarouselOpen] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  const openCarousel = (index: number) => {
    setSelectedImageIndex(index)
    setCarouselOpen(true)
  }

  const closeCarousel = () => {
    setCarouselOpen(false)
  }

  return (
    <MainContainer>
      <div className="w-full">
        <MusicianStructuredData
          musician={musician}
          band={band}
          origin={origin}
        />

        {/* Cover/Photo Section */}
        <div
          className="relative h-80 md:h-96 bg-gray-800 cursor-pointer"
          onClick={() => gallery.length > 0 && openCarousel(0)}
        >
          <img
            src={coverPhotoUrl}
            alt={musician.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
          <button
            onClick={(e) => {
              e.stopPropagation()
              window.history.back()
            }}
            className="focus-ring absolute top-4 left-4 flex items-center gap-2 px-4 py-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors text-white"
          >
            <ArrowLeft className="icon-md" />
            <FormattedMessage id="musicians.backToMusicians" />
          </button>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 py-8 -mt-24 relative z-10">
          <div className="bg-gray-900 rounded-lg p-6 shadow-2xl">
            <div className="flex items-start gap-6">
              <button
                onClick={() => gallery.length > 0 && openCarousel(0)}
                disabled={gallery.length === 0}
                className={
                  gallery.length > 0
                    ? 'cursor-pointer hover:opacity-80 transition-opacity'
                    : ''
                }
              >
                <img
                  src={profilePhotoUrl}
                  alt={musician.name}
                  className="w-32 h-32 rounded-lg object-cover shadow-lg border-2 border-amber-500"
                />
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-bold text-white mb-2">
                  {musician.name}
                </h1>
                {musician.instrument && (
                  <p className="text-amber-400 text-lg mb-4">
                    {musician.instrument}
                  </p>
                )}
                {band && (
                  <p className="text-gray-300 text-sm">
                    <FormattedMessage id="musicians.memberOf" />{' '}
                    <span className="text-white">{band.name}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Bio */}
            <div className="mt-8 p-6 bg-gray-800/50 rounded-lg">
              <h2 className="text-xl font-semibold text-white mb-4">
                <FormattedMessage id="musicians.biography" />
              </h2>
              <div className="prose prose-invert max-w-none text-gray-300">
                {bio && bio.length > 0 ? (
                  <PortableText
                    value={bio}
                    components={{
                      block: {
                        normal: ({ children }) => (
                          <p className="mb-4 leading-relaxed">{children}</p>
                        ),
                        h1: ({ children }) => (
                          <h3 className="text-2xl font-bold mb-4">
                            {children}
                          </h3>
                        ),
                        h2: ({ children }) => (
                          <h4 className="text-xl font-semibold mb-3">
                            {children}
                          </h4>
                        ),
                        h3: ({ children }) => (
                          <h5 className="text-lg font-medium mb-2">
                            {children}
                          </h5>
                        ),
                      },
                      marks: {
                        strong: ({ children }) => <strong>{children}</strong>,
                        em: ({ children }) => <em>{children}</em>,
                        link: ({ children, value }) => (
                          <a
                            href={value.href}
                            className="text-blue-400 hover:underline"
                          >
                            {children}
                          </a>
                        ),
                      },
                    }}
                  />
                ) : (
                  <p className="text-gray-300">
                    <FormattedMessage id="musicians.noBiographyAvailable" />
                  </p>
                )}
              </div>
            </div>

            {/* Gallery */}
            {gallery.length > 1 && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold text-white mb-4">
                  <FormattedMessage id="musicians.gallery" />
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {gallery.slice(1).map((photo, idx) => (
                    <button
                      key={idx}
                      onClick={() => openCarousel(idx + 1)}
                      className="relative aspect-square rounded-lg overflow-hidden bg-gray-800 focus-ring text-left"
                      aria-label={`View ${musician.name} photo ${idx + 2} in full size`}
                    >
                      <img
                        src={photo.url}
                        alt={`${musician.name} - Photo ${idx + 2}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform pointer-events-none"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Band memberships */}
            {musician.bands && musician.bands.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold text-white mb-4">
                  <FormattedMessage id="musicians.bandMemberships" />
                </h2>
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
      <Carousel
        key={selectedImageIndex}
        isOpen={carouselOpen}
        onClose={closeCarousel}
        images={gallery.map((img) => ({ url: img.url }))}
        initialIndex={selectedImageIndex}
      />
    </MainContainer>
  )
}
