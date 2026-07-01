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
import { TwoColumnLayout } from './components/shared/TwoColumnLayout'
import { AudioProvider } from './contexts/AudioContext'
import { I18nProvider } from './i18n/I18nProvider'
import './tailwind.css'
import { getBandBySlug } from './lib/queries'
import { sanityClient } from './lib/sanity.settings'
import { getGalleryUrl } from './lib/images'

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
            src: img.asset ? getGalleryUrl(img.asset) : '',
            alt:
              img.metadata?.caption || `${band.name} gallery image ${idx + 1}`,
          })) || []
      umamiWebsiteId = process.env.UMAMI_WEBSITE_ID
    } catch (error) {
      console.error('Failed to fetch band data:', error)
    }
  }

  const initialTrack = recordings.length > 0 ? recordings[0] : null

  const brandPrimary =
    typeof band?.branding?.primaryColor === 'string'
      ? band.branding.primaryColor
      : (band?.branding?.primaryColor as any)?.hex || '#1e3a8a'
  const brandSecondary =
    typeof band?.branding?.secondaryColor === 'string'
      ? band.branding.secondaryColor
      : (band?.branding?.secondaryColor as any)?.hex || '#dc2626'

  return {
    bandSlug,
    origin,
    band,
    recordings,
    initialTrack,
    galleryImages,
    umamiWebsiteId,
    primaryColor: brandPrimary,
    secondaryColor: brandSecondary,
  }
}

export function meta({ data }: Route.MetaArgs) {
  return [
    { charset: 'utf-8' },
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
  const {
    bandSlug,
    band,
    recordings,
    initialTrack,
    galleryImages,
    umamiWebsiteId,
    primaryColor,
    secondaryColor,
  } = useLoaderData<Route>()

  return (
    <html
      lang="fr"
      style={{
        '--color-primary': primaryColor,
        '--color-secondary': secondaryColor,
      } as React.CSSProperties}
    >
      <head>
        <Meta />
        <Links />
        {umamiWebsiteId && (
          <>
            <script
              src="https://analytics.jazz.wildredbeard.tech/script.js"
              data-website-id={umamiWebsiteId}
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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
          <div className="max-w-md w-full glass-card p-8 text-center">
            <div className="mx-auto w-20 h-20 bg-red-900/30 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
              <AlertTriangle className="w-10 h-10 text-red-400" />
            </div>

            <h1 className="text-3xl font-bold text-text-primary mb-4">
              {is404 ? (
                <FormattedMessage id="errorPage.pageNotFound" />
              ) : (
                <FormattedMessage id="errorPage.oopsError" />
              )}
            </h1>

            <div className="bg-red-900/30 rounded-lg p-4 mb-6 border border-red-500/20">
              <p className="text-red-300 text-sm leading-relaxed">
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
              className="focus-ring inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-error-accent to-error-accent-secondary text-white font-semibold rounded-lg shadow-lg hover:shadow-xl hover:from-red-500 hover:to-orange-500 transition-all duration-200"
            >
              <Home className="w-5 h-5" />
              <FormattedMessage id="errorPage.goHome" />
            </a>

            <p className="mt-6 text-sm text-text-muted">
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
