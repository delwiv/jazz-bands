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

  // Fetch full band data for layout
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
      // Transform band images to gallery format
      galleryImages = band.images || []
      // Get Umami website ID from env
      umamiWebsiteId = process.env[`UMAMI_WEBSITE_ID_${bandSlug.toUpperCase()}`] || ''
    } catch (err) {
      console.error(`Failed to fetch band data for ${bandSlug}:`, err)
    }
  }

  return {
    bandSlug,
    band,
    recordings,
    galleryImages,
    origin,
    umamiWebsiteId,
  }
}

export function meta({ data }: Route.MetaArgs) {
  const { band, umamiWebsiteId } = data || {}
  
  if (!band) {
    return [
      { title: 'Jazz Bands' },
      { name: 'description', content: 'Discover the finest jazz bands in France' },
    ]
  }

  return [
    { title: `${band.name} - Jazz Band` },
    { name: 'description', content: band.seo?.metaDescription || band.description?.slice(0, 160).map(b => b.children[0]?.text || '').join('') || '' },
    { property: 'og:title', content: band.name },
    { property: 'og:description', content: band.seo?.metaDescription || band.description?.slice(0, 160).map(b => b.children[0]?.text || '').join('') || '' },
    { property: 'og:type', content: 'music.musician' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: band.name },
    { name: 'twitter:description', content: band.seo?.metaDescription || band.description?.slice(0, 160).map(b => b.children[0]?.text || '').join('') || '' },
    band.seo?.canonicalUrl && { href: band.seo.canonicalUrl, rel: 'canonical' },
    // Umami analytics meta tag
    umamiWebsiteId && { name: 'umami-website-id', content: umamiWebsiteId },
  ].filter(Boolean)
}

export function Component() {
  const { bandSlug, band, recordings, galleryImages, origin, umamiWebsiteId } = useLoaderData() as Route.LoaderData

  return (
    <I18nProvider>
      <AudioProvider bandSlug={bandSlug} bandData={{ name: band?.name || '', recordings }} origin={origin}>
        <TwoColumnLayout band={band}>
          <Outlet context={{ band, galleryImages }} />
        </TwoColumnLayout>
        <StickyPlayer />
      </AudioProvider>
    </I18nProvider>
  )
}

export function ErrorBoundary() {
  const error = useRouteError() as any

  if (typeof error?.message === 'string' && error.message.includes('Not found')) {
    return (
      <html lang="fr">
        <body className="bg-amber-50 text-amber-900">
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="text-center max-w-md">
              <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-amber-600" />
              <h1 className="text-3xl font-bold mb-4">Page Not Found</h1>
              <p className="mb-6 text-amber-700">
                The page you're looking for doesn't exist or has been moved.
              </p>
              <a
                href="/"
                className="inline-flex items-center px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </a>
            </div>
          </div>
        </body>
      </html>
    )
  }

  return (
    <html lang="fr">
      <body className="bg-red-50 text-red-900">
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-600" />
            <h1 className="text-3xl font-bold mb-4">Oops! Something went wrong</h1>
            <p className="mb-6 text-red-700">
              We apologize for the inconvenience. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}

export default function App() {
  const { bandSlug, band, origin, umamiWebsiteId } = useLoaderData() as Route.LoaderData

  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <link rel="icon" href={band?.logo?.asset?._ref ? urlForImage(band.logo).size(32, 32).url() : '/favicon.ico'} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        
        {/* Umami Analytics Script (server-side injected) */}
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
                  // Wait for Umami to load, then auto-track respecting doNotTrack
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
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}
