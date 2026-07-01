import { useRouteError } from 'react-router'

export default function CatchAll() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-md w-full glass-card p-8 text-center">
        <h1 className="text-3xl font-bold text-text-primary mb-4">404</h1>
        <p className="text-text-secondary mb-6">Page not found</p>
        <a
          href="/"
          className="focus-ring inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-error-accent to-error-accent-secondary text-white font-semibold rounded-lg shadow-lg hover:shadow-xl hover:from-red-500 hover:to-orange-500 transition-all duration-200"
        >
          Go Home
        </a>
      </div>
    </div>
  )
}

export function ErrorBoundary() {
  const error = useRouteError()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-md w-full glass-card p-8 text-center">
        <h1 className="text-3xl font-bold text-text-primary mb-4">Oops!</h1>
        <p className="text-text-secondary mb-6">
          {error instanceof Error ? error.message : 'Something went wrong'}
        </p>
        <a
          href="/"
          className="focus-ring inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-error-accent to-error-accent-secondary text-white font-semibold rounded-lg shadow-lg hover:shadow-xl hover:from-red-500 hover:to-orange-500 transition-all duration-200"
        >
          Go Home
        </a>
      </div>
    </div>
  )
}
