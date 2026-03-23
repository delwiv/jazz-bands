import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useRouteError,
} from 'react-router'
import { AlertTriangle, Home } from 'lucide-react'
import type { Route } from './+types/root'
import { StickyPlayer } from './components/audio/StickyPlayer'
import { AudioProvider } from './contexts/AudioContext'
import './tailwind.css'
import { getBandBySlug } from './lib/queries'
import { sanityClient } from './lib/sanity.settings'

export async function loader({ request }: Route.LoaderArgs) {
  const bandSlug = process.env.BAND_SLUG

  if (!bandSlug && process.env.NODE_ENV === 'production') {
    throw new Error('BAND_SLUG environment variable is required in production')
  }

  const origin = new URL(request.url).origin

  console.log('[Root Loader] BAND_SLUG:', bandSlug)

  // Fetch band data for auto-queue functionality
  let recordings = []
  if (bandSlug) {
    try {
      console.log('[Root Loader] Fetching band with slug:', bandSlug)
      const band = await sanityClient.fetch(getBandBySlug, { slug: bandSlug })
      console.log('[Root Loader] Band fetched:', band?.name)
      if (band?.recordings) {
        recordings = band.recordings.filter((r: any) => r.audioUrl)
        console.log(
          '[Root Loader] Recordings with audioUrl:',
          recordings.length,
        )
      }
    } catch (error) {
      console.error('Failed to fetch band recordings:', error)
    }
  }

  return {
    bandSlug,
    origin,
    recordings,
  }
}

export function meta({ data }: Route.MetaArgs) {
  return [
    { title: data?.bandSlug ? `${data.bandSlug} - Jazz Band` : 'Jazz Bands' },
    { name: 'description', content: 'Jazz band website' },
  ]
}

export default function App() {
  const { bandSlug, recordings } = useLoaderData()

  console.log('[App] Received from loader:', {
    bandSlug,
    recordingsCount: recordings?.length || 0,
  })

  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body className="pb-4">
        <AudioProvider initialPlaylist={recordings || []}>
          <Outlet />
          <StickyPlayer />
        </AudioProvider>
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

  const getErrorMessage = (): string => {
    if (is404) {
      return "The page you're looking for doesn't exist."
    }
    if (error instanceof Error) {
      return error.message
    }
    if (typeof error === 'string') {
      return error
    }
    return 'Something went wrong. Please try again.'
  }

  return (
    <html lang="en">
      <head>
        <title>{is404 ? 'Page Not Found' : 'Error'} - Jazz Bands</title>
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
              {is404 ? 'Page Not Found' : 'Oops! Something went wrong'}
            </h1>

            <div className="bg-red-50 rounded-lg p-4 mb-6">
              <p className="text-red-700 text-sm leading-relaxed">
                {getErrorMessage()}
              </p>
            </div>

            <a
              href="/"
              className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:from-red-600 hover:to-orange-600 transition-all duration-200 transform hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-red-200"
            >
              <Home className="w-5 h-5" />
              {is404 ? 'Go Home' : 'Go Back Home'}
            </a>

            <p className="mt-6 text-sm text-gray-500">
              {is404
                ? 'Check the URL or return to the homepage.'
                : 'If the problem persists, please contact support.'}
            </p>
          </div>
        </div>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}
