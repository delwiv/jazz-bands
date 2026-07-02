import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  MapPin,
} from 'lucide-react'
import { FormattedMessage, useIntl } from 'react-intl'
import { type LoaderFunctionArgs, useLoaderData } from 'react-router'
import { GlassCard } from '~/components/shared/GlassCard'
import { MainContainer } from '~/components/shared/MainContainer'
import { getBandWithTourDates } from '~/lib/queries'
import { sanityClient, urlForImage } from '~/lib/sanity.settings'
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
      sameAs: `${origin}/`,
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

  const heroImage = band.contentImages?.[0] || null

  return {
    tourDate,
    band: band.name,
    bandLogo: band.logo,
    bandSlug: band.slug,
    origin,
    heroImage,
  }
}

export function meta({ data }: { data: ReturnType<typeof loader> | null }) {
  if (!data) return []

  const { tourDate, band, bandLogo, origin } = data
  const title = `${band} — ${tourDate.venue}, ${tourDate.city} — ${tourDate.date}`
  const description = `Catch ${band} live at ${tourDate.venue} in ${tourDate.city} on ${tourDate.date}${tourDate.region ? `, ${tourDate.region}` : ''}.`

  const eventDate = tourDate.date.startsWith('T')
    ? tourDate.date
    : `${tourDate.date}T19:00:00`

  let ogImageUrl = `${origin}/og-default.jpg`
  try {
    if (bandLogo?.asset?._ref) {
      ogImageUrl = urlForImage.image(bandLogo).width(1200).height(630).fit('max').url()
    }
  } catch {}

  return [
    { title },
    { name: 'description', content: description },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:type', content: 'event' },
    { property: 'og:image', content: ogImageUrl },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:site_name', content: band },
    { name: 'article:published_time', content: eventDate },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: ogImageUrl },
  ]
}

export default function TourDateDetail() {
  const { tourDate, band, bandLogo, bandSlug, origin, heroImage } =
    useLoaderData<typeof loader>()
  const intl = useIntl()

  const formatDate = (dateStr: string) => {
    return intl.formatDate(new Date(dateStr), {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const heroUrl =
    heroImage?.asset?._ref
      ? urlForImage.image(heroImage).width(1600).height(600).fit('crop').url()
      : null

  const googleMapsQuery = encodeURIComponent(
    `${tourDate.venue}, ${tourDate.city}${tourDate.region ? `, ${tourDate.region}` : ''}`,
  )

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const eventDate = new Date(tourDate.date)
  const isUpcoming = eventDate >= today

  const dayDiff = isUpcoming
    ? Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <MainContainer maxWidth="narrow">
      <TourDateStructuredData
        tourDate={tourDate}
        band={band}
        bandSlug={bandSlug}
        origin={origin}
      />

      {heroUrl && (
        <div className="relative -mx-4 -mt-4 mb-6 overflow-hidden rounded-t-lg md:-mx-6 md:-mt-6 lg:-mx-8 lg:-mt-8">
          <div
            className="h-48 sm:h-56 md:h-64 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroUrl})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent" />
        </div>
      )}

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

            {dayDiff !== null && dayDiff <= 90 && (
              <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/40 rounded-lg">
                <Calendar className="icon-md text-amber-400 shrink-0" />
                <span className="text-amber-300 font-medium">
                  {dayDiff === 0
                    ? 'Today!'
                    : dayDiff === 1
                      ? 'Tomorrow!'
                      : `${dayDiff} days away`}
                </span>
              </div>
            )}

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <MapPin className="icon-md text-amber-500 mt-1 shrink-0" />
                <div>
                  <p className="text-3xl md:text-4xl font-bold text-white leading-tight">
                    {tourDate.city}
                  </p>
                  <p className="text-2xl font-semibold text-gray-300 mt-2">
                    {tourDate.venue}
                  </p>
                  {tourDate.region && (
                    <p className="text-lg text-gray-400 mt-1">
                      {tourDate.region}
                    </p>
                  )}
                </div>
              </div>

              {tourDate.details && (
                <div className="glass-card p-5 rounded-lg bg-white/[0.03]">
                  <p className="text-gray-300 whitespace-pre-line leading-relaxed">
                    {tourDate.details}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-card rounded-lg overflow-hidden bg-white/[0.03]">
              <div className="aspect-[16/9] w-full">
                <iframe
                  src={`https://maps.google.com/maps?q=${googleMapsQuery}&output=embed&z=14`}
                  title={`${tourDate.venue} — ${tourDate.city}`}
                  className="w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>
              <div className="p-3 border-t border-white/[0.08]">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${googleMapsQuery}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="focus-ring inline-flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 transition-colors"
                >
                  <ExternalLink className="icon-sm" />
                  <FormattedMessage id="tour.viewOnMap" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainContainer>
  )
}
