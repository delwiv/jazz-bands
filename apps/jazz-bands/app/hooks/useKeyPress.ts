import { useEffect } from 'react'

interface UseKeyPressProps {
  keys: string[]
  onKeyPress: (key: string) => void
  enabled?: boolean
}

/**
 * Hook to listen for specific keyboard keys
 */
export function useKeyPress({
  keys,
  onKeyPress,
  enabled = true,
}: UseKeyPressProps) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (keys.includes(e.key)) {
        e.preventDefault()
        onKeyPress(e.key)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [keys, onKeyPress, enabled])
}
