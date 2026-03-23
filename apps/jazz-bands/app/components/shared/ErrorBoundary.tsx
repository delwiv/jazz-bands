import type { FunctionComponent } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center border border-red-100">
        <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Oops! Something went wrong
        </h1>

        <div className="bg-red-50 rounded-lg p-4 mb-6">
          <p className="text-red-700 text-sm leading-relaxed">
            {getErrorMessage()}
          </p>
        </div>

        {resetErrorBoundaries && (
          <button
            onClick={resetErrorBoundaries}
            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:from-red-600 hover:to-orange-600 transition-all duration-200 transform hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-red-200"
          >
            <RotateCcw className="w-5 h-5" />
            Retry
          </button>
        )}

        <p className="mt-6 text-sm text-gray-500">
          If the problem persists, please contact support.
        </p>
      </div>
    </div>
  )
}
