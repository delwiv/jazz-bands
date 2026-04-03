import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  ExternalLink,
  MapPin,
  Ticket,
} from 'lucide-react'
import { type LoaderFunctionArgs, useLoaderData } from 'react-router'
import { MainContainer } from '~/components/shared/MainContainer'
import { getBandWithTourDates } from '~/lib/queries'
import { sanityClient } from '~/lib/sanity.settings'
import type { TourDate } from '~/lib/types'

function TourDateStructuredData({
  tourDate,
  band,
  bandSlug,
  origin,
}: {
  tourDate: TourDate
  band: string
  bandSlug: string
  origin: string
}) {
  const eventDate = tourDate.date.startsWith('T')
    ? tourDate.date
    : `${tourDate.date}T19:00:00`

  const data: Record<string, any> = {
    '@type': 'MusicEvent',
    name: `${band} @ ${tourDate.venue}`,
    startDate: eventDate,
    location: {
      '@type': 'Place',
      name: tourDate.venue,
      address: {
        '@type': 'PostalAddress',
        addressLocality: tourDate.city,
        addressRegion: tourDate.region,
      },
    },
    organizer: {
      '@type': 'MusicGroup',
      name: band,
      sameAs: `${origin}/${bandSlug}`,
    },
  }

  if (tourDate.details) {
    data.description = tourDate.details
  }

  data.offers = {
    '@type': 'Offer',
    url:
      tourDate.ticketsUrl || `${origin}/tour/${tourDate.slug || tourDate._key}`,
    availability: tourDate.soldOut
      ? 'https://schema.org/SoldOut'
      : 'https://schema.org/InStock',
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

export async function loader({ request, params }: LoaderFunctionArgs) {
  const bandSlug = process.env.BAND_SLUG
  const tourDateSlug = params.tourDateSlug

  if (!bandSlug || !tourDateSlug) {
    throw new Response('Bad request', { status: 400 })
  }

  const origin = new URL(request.url).origin

  const band = await sanityClient.fetch(getBandWithTourDates, { bandSlug })

  if (!band || !band.tourDates) {
    throw new Response('Band not found', { status: 404 })
  }

  const tourDate = band.tourDates.find(
    (date: TourDate) => date.slug === tourDateSlug,
  ) as TourDate | undefined

  if (!tourDate) {
    throw new Response('Tour date not found', { status: 404 })
  }

  return {
    tourDate,
    band: band.name,
    bandSlug: band.slug,
    origin,
  }
}

export function meta({ data }: { data: ReturnType<typeof loader> | null }) {
  if (!data) return []

  const { tourDate, band } = data
  const title = `${band} - ${tourDate.venue}, ${tourDate.city} - ${tourDate.date}`
  const description = `Catch ${band} live at ${tourDate.venue} in ${tourDate.city} on ${tourDate.date}${tourDate.region ? `, ${tourDate.region}` : ''}.`

  const eventDate = tourDate.date.startsWith('T')
    ? tourDate.date
    : `${tourDate.date}T19:00:00`

  return [
    { title },
    { name: 'description', content: description },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:type', content: 'event' },
    { property: 'og:site_name', content: 'Jazz Bands' },
    { name: 'article:published_time', content: eventDate },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
  ]
}

export default function TourDateDetail() {
  const { tourDate, band, bandSlug, origin } = useLoaderData<typeof loader>()

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date)
  }

  const formatMonthYear = (dateStr: string) => {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric',
    }).format(date)
  }

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tourDate.venue + ', ' + tourDate.city)}`

  return (
    <MainContainer maxWidth="narrow">
      <TourDateStructuredData
        tourDate={tourDate}
        band={band}
        bandSlug={bandSlug}
        origin={origin}
      />

      <div className="relative bg-gradient-to-br from-amber-600 to-orange-700 text-white mb-8">
        <div className="py-16">
          <button
            onClick={() => window.history.back()}
            className="focus-ring flex items-center gap-2 mb-8 text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="icon-md" />
            Back to tour dates
          </button>

          <div className="mb-4">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
              <Calendar className="icon-sm" />
              {formatMonthYear(tourDate.date)}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4">{band}</h1>

          <div className="flex items-center gap-2 text-xl mb-6">
            <MapPin className="w-6 h-6" />
            {tourDate.venue}, {tourDate.city}
            {tourDate.region ? `, ${tourDate.region}` : ''}
          </div>

          <p className="text-2xl font-medium">{formatDate(tourDate.date)}</p>

          {tourDate.soldOut && (
            <div className="mt-6 flex items-center gap-2 bg-red-600/80 px-4 py-2 rounded-lg">
              <AlertCircle className="icon-md" />
              <span className="font-medium">This show is sold out</span>
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              fill="#111827"
            />
          </svg>
        </div>
      </div>

      <div className="py-12">
        <div className="bg-gray-800 rounded-lg p-8 shadow-2xl">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">
                Event Details
              </h2>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="icon-md text-amber-500 mt-1" />
                  <div>
                    <p className="text-gray-300 text-sm">Date & Time</p>
                    <p className="text-white font-medium">
                      {formatDate(tourDate.date)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="icon-md text-amber-500 mt-1" />
                  <div>
                    <p className="text-gray-300 text-sm">Venue</p>
                    <p className="text-white font-medium">{tourDate.venue}</p>
                    <p className="text-gray-300">
                      {tourDate.city}
                      {tourDate.region ? `, ${tourDate.region}` : ''}
                    </p>
                  </div>
                </div>
              </div>

              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring mt-6 inline-flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-white"
              >
                <ExternalLink className="icon-sm" />
                View on Google Maps
              </a>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-4">
                Tickets & Info
              </h2>

              <div className="space-y-4">
                {tourDate.ticketsUrl && !tourDate.soldOut && (
                  <a
                    href={tourDate.ticketsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="focus-ring flex items-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors text-white font-medium"
                  >
                    <Ticket className="icon-md" />
                    Buy Tickets
                  </a>
                )}

                {tourDate.details && (
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <p className="text-gray-300 whitespace-pre-line">
                      {tourDate.details}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">
              Share this event
            </h3>

            <div className="flex flex-wrap gap-4">
              <ShareButton
                platform="facebook"
                label="Share on Facebook"
                url={`${origin}/tour/${tourDate.slug || tourDate._key}`}
                text={`Can't wait to see ${band} at ${tourDate.venue} on ${tourDate.date}!`}
              />
              <ShareButton
                platform="twitter"
                label="Share on Twitter"
                url={`${origin}/tour/${tourDate.slug || tourDate._key}`}
                text={`Can't wait to see ${band} at ${tourDate.venue} on ${tourDate.date}!`}
              />
              <ShareButton
                platform="linkedin"
                label="Share on LinkedIn"
                url={`${origin}/tour/${tourDate.slug || tourDate._key}`}
                text={`Excited for ${band} performing at ${tourDate.venue}`}
              />
            </div>
          </div>
        </div>
      </div>
    </MainContainer>
  )
}

function ShareButton({
  platform,
  label,
  url,
  text,
}: {
  platform: 'facebook' | 'twitter' | 'linkedin'
  label: string
  url: string
  text: string
}) {
  let shareUrl = ''

  switch (platform) {
    case 'facebook':
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
      break
    case 'twitter':
      shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
      break
    case 'linkedin':
      shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
      break
  }

  return (
    <a
      href={shareUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="focus-ring flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-white text-sm"
    >
      {label}
    </a>
  )
}
