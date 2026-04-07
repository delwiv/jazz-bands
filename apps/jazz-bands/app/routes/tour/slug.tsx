import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  ExternalLink,
  MapPin,
  Ticket,
} from 'lucide-react'
import { FormattedMessage, useIntl } from 'react-intl'
import { type LoaderFunctionArgs, useLoaderData } from 'react-router'
import { GlassCard } from '~/components/shared/GlassCard'
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
  const intl = useIntl()

  const formatDate = (dateStr: string) => {
    return intl.formatDate(new Date(dateStr), {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
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

      <div className="glass-card rounded-lg p-4 lg:p-8">
        <button
          onClick={() => window.history.back()}
          className="focus-ring flex items-center gap-2 mb-6 text-gray-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="icon-md" />
          <FormattedMessage id="tour.backToDates" />
        </button>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h1 className="text-4xl font-bold text-amber-400 mb-2">{band}</h1>
            <p className="text-2xl font-medium text-white mb-6">
              {formatDate(tourDate.date)}
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="icon-md text-amber-500 mt-1 shrink-0" />
                <div>
                  <p className="text-gray-400 text-sm mb-1">
                    <FormattedMessage id="tour.venue" />
                  </p>
                  <p className="text-white font-medium">{tourDate.venue}</p>
                  <p className="text-gray-300">
                    {tourDate.city}
                    {tourDate.region ? `, ${tourDate.region}` : ''}
                  </p>
                </div>
              </div>

              {tourDate.soldOut && (
                <div className="flex items-center gap-2 bg-red-600/30 border border-red-500/50 px-4 py-3 rounded-lg">
                  <AlertCircle className="icon-md shrink-0" />
                  <span className="text-red-200 font-medium">
                    <FormattedMessage id="tour.soldOut" />
                  </span>
                </div>
              )}

              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors"
              >
                <ExternalLink className="icon-sm" />
                <FormattedMessage id="tour.viewOnMap" />
              </a>
            </div>
          </div>

          <div>
            <div className="glass-card p-6 rounded-lg bg-white/[0.03]">
              <h2 className="text-xl font-semibold text-white mb-4">
                <FormattedMessage id="tour.ticketsAndInfo" />
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
                    <FormattedMessage id="tour.getTickets" />
                  </a>
                )}

                {!tourDate.ticketsUrl && !tourDate.soldOut && (
                  <span className="inline-flex items-center px-3 py-1 bg-gray-700/50 rounded-full text-sm text-gray-300">
                    <FormattedMessage id="tour.ticketsTBA" />
                  </span>
                )}

                {tourDate.details && (
                  <div className="mt-6 pt-6 border-t border-white/[0.1]">
                    <p className="text-gray-300 whitespace-pre-line">
                      {tourDate.details}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainContainer>
  )
}
