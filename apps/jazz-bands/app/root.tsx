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
import { AudioProvider } from './contexts/AudioContext'
import { StickyPlayer } from './components/audio/StickyPlayer'
import './tailwind.css'

export async function loader({ request }: Route.LoaderArgs) {
  const bandSlug = process.env.BAND_SLUG

  if (!bandSlug && process.env.NODE_ENV === 'production') {
    throw new Error('BAND_SLUG environment variable is required in production')
  }

  return {
    bandSlug,
    origin: new URL(request.url).origin,
  }
}

export function meta({ data }: Route.MetaArgs) {
  return [
    { title: data?.bandSlug ? `${data.bandSlug} - Jazz Band` : 'Jazz Bands' },
    { name: 'description', content: 'Jazz band website' },
  ]
}

export default function App() {
  const { bandSlug } = useLoaderData()

  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <AudioProvider>
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
              <svg
                className="w-10 h-10 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
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
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
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
