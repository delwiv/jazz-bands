import { AlertTriangle, Home } from 'lucide-react'
import { FormattedMessage } from 'react-intl'
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useRouteError,
} from 'react-router'
import type { Route } from './+types/root'
import { StickyPlayer } from './components/audio/StickyPlayer'
import { TwoColumnLayout } from './components/shared/TwoColumnLayout'
import { AudioProvider } from './contexts/AudioContext'
import { I18nProvider } from './i18n/I18nProvider'
import './tailwind.css'
import { getBandBySlug } from './lib/queries'
import { sanityClient, urlForImage } from './lib/sanity.settings'

export async function loader({ request }: Route.LoaderArgs) {
  const bandSlug = process.env.BAND_SLUG

  if (!bandSlug && process.env.NODE_ENV === 'production') {
    throw new Error('BAND_SLUG environment variable is required in production')
  }

  const origin = new URL(request.url).origin

  let band = null
  let recordings = []
  let galleryImages: { src: string; alt: string }[] = []
  let umamiWebsiteId = ''

  if (bandSlug) {
    try {
      band = await sanityClient.fetch(getBandBySlug, { slug: bandSlug })
      if (band?.recordings) {
        recordings = band.recordings.filter((r: any) => r.audioUrl)
      }
      galleryImages =
        band.images
          ?.filter((img: (typeof band.images)[number]) => img.asset)
          .map((img: (typeof band.images)[number], idx: number) => ({
            src: img.asset
              ? urlForImage
                .image(img.asset)
                .width(3840)
                .height(3840)
                .fit('max')
                .url()
              : '',
            alt:
              img.metadata?.caption || `${band.name} gallery image ${idx + 1}`,
          })) || []
      umamiWebsiteId = process.env[`UMAMI_WEBSITE_ID_${bandSlug.toUpperCase()}`] || ''
    } catch (error) {
      console.error('Failed to fetch band data:', error)
    }
  }

  const initialTrack = recordings.length > 0 ? recordings[0] : null

  return {
    bandSlug,
    origin,
    band,
    recordings,
    initialTrack,
    galleryImages,
    umamiWebsiteId,
  }
}

export function meta({ data }: Route.MetaArgs) {
  return [
    { title: data?.bandSlug ? `${data.bandSlug} - Jazz Band` : 'Jazz Bands' },
    { name: 'description', content: 'Jazz band website' },
    {
      tagName: 'link',
      rel: 'apple-touch-icon',
      sizes: '180x180',
      href: '/apple-touch-icon.png',
    },
    {
      tagName: 'link',
      rel: 'icon',
      type: 'image/png',
      sizes: '32x32',
      href: '/favicon-32x32.png',
    },
    {
      tagName: 'link',
      rel: 'icon',
      type: 'image/png',
      sizes: '16x16',
      href: '/favicon-16x16.png',
    },
    {
      tagName: 'link',
      rel: 'manifest',
      href: '/site.webmanifest',
    },
  ]
}

export default function App() {
  const { bandSlug, band, recordings, initialTrack, galleryImages, umamiWebsiteId } =
    useLoaderData<Route>()

  return (
    <html lang="fr">
      <head>
        <Meta />
        <Links />
        {umamiWebsiteId && (
          <>
            <script
              src="https://analytics.jazzbands.com/script.js"
              data-website-id={umamiWebsiteId}
              data-dom-auto={false}
              defer
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.addEventListener('load', function() {
                    var dnt = navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack;
                    if (dnt !== '1' && dnt !== 'yes') {
                      try { window.umami.trackPageView(); } catch(e) {}
                    }
                  });
                `,
              }}
            />
          </>
        )}
      </head>
      <body>
        <I18nProvider>
          <AudioProvider initialPlaylist={recordings || []}>
            {band ? (
              <TwoColumnLayout
                band={band}
                images={galleryImages}
                initialTrack={initialTrack}
                initialQueue={recordings}
              >
                <Outlet />
              </TwoColumnLayout>
            ) : (
              <Outlet />
            )}
            {/* Mobile player: hidden on desktop to avoid SSR flash */}
            <div className="lg:hidden">
              <StickyPlayer
                initialTrack={initialTrack}
                initialQueue={recordings || []}
              />
            </div>
          </AudioProvider>
        </I18nProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export function ErrorPage() {
  const error = useRouteError()

  const is404 =
    error &&
    typeof error === 'object' &&
    'status' in error &&
    error.status === 404

  return (
    <html lang="fr">
      <head>
        <title>
          {is404 ? (
            <FormattedMessage id="errorPage.pageNotFound" />
          ) : (
            <FormattedMessage id="errorPage.error" />
          )}{' '}
          - <FormattedMessage id="errorPage.siteName" />
        </title>
        <Meta />
        <Links />
      </head>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 p-6">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center border border-red-100">
            <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>

            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              {is404 ? (
                <FormattedMessage id="errorPage.pageNotFound" />
              ) : (
                <FormattedMessage id="errorPage.oopsError" />
              )}
            </h1>

            <div className="bg-red-50 rounded-lg p-4 mb-6">
              <p className="text-red-700 text-sm leading-relaxed">
                {is404 ? (
                  <FormattedMessage id="errorPage.pageDoesNotExist" />
                ) : error instanceof Error ? (
                  error.message
                ) : typeof error === 'string' ? (
                  error
                ) : (
                  <FormattedMessage id="errorPage.somethingWentWrong" />
                )}
              </p>
            </div>

            <a
              href="/"
              className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:from-red-600 hover:to-orange-600 transition-all duration-200 transform hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-red-200"
            >
              <Home className="w-5 h-5" />
              <FormattedMessage id="errorPage.goHome" />
            </a>

            <p className="mt-6 text-sm text-gray-500">
              {is404 ? (
                <FormattedMessage id="errorPage.checkUrlOrReturn" />
              ) : (
                <FormattedMessage id="errorPage.contactSupport" />
              )}
            </p>
          </div>
        </div>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}
