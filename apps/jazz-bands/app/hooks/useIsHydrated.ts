import { useEffect, useState } from 'react'

/**
 * Hook to detect if React has hydrated on the client.
 * Returns false during SSR/server rendering, true after client hydration.
 * Used to conditionally render static vs interactive content.
 */
export function useIsHydrated(): boolean {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  return isHydrated
}
