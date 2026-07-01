import { AlertTriangle, RotateCcw } from 'lucide-react'
import type { FunctionComponent } from 'react'

interface ErrorBoundaryProps {
  error: unknown
  resetErrorBoundaries?: () => void
}

export const ErrorBoundary: FunctionComponent<ErrorBoundaryProps> = ({
  error,
  resetErrorBoundaries,
}) => {
  const getErrorMessage = (): string => {
    if (error instanceof Error) {
      return error.message
    }
    if (typeof error === 'string') {
      return error
    }
    return 'Something went wrong. Please try again.'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-md w-full glass-card p-8 text-center">
        <div className="mx-auto w-20 h-20 bg-red-900/30 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
          <AlertTriangle className="w-10 h-10 text-red-400" />
        </div>

        <h1 className="text-3xl font-bold text-text-primary mb-4">
          Oops! Something went wrong
        </h1>

        <div className="bg-red-900/30 rounded-lg p-4 mb-6 border border-red-500/20">
          <p className="text-red-300 text-sm leading-relaxed">
            {getErrorMessage()}
          </p>
        </div>

        {resetErrorBoundaries && (
          <button
            onClick={resetErrorBoundaries}
            className="focus-ring inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-error-accent to-error-accent-secondary text-white font-semibold rounded-lg shadow-lg hover:shadow-xl hover:from-red-500 hover:to-orange-500 transition-all duration-200"
          >
            <RotateCcw className="w-5 h-5" />
            Retry
          </button>
        )}

        <p className="mt-6 text-sm text-text-muted">
          If the problem persists, please contact support.
        </p>
      </div>
    </div>
  )
}
