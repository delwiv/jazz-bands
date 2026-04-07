import { Howl } from 'howler'
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { trackUmamiEvent } from '~/lib/analytics/umami'
import type { Recording } from '~/lib/types'

const BAND_SLUG = import.meta.env.BAND_SLUG || 'unknown'

interface AudioContextType {
  currentTrack: Recording | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  playlist: Recording[]
  queue: Recording[]
  playTrack: (track: Recording) => void
  togglePlay: () => void
  next: () => void
  prev: () => void
  seek: (time: number) => void
  setVolume: (value: number) => void
  addToQueue: (track: Recording) => void
  reorderQueue: (oldIndex: number, newIndex: number) => void
}

const AudioContext = createContext<AudioContextType | undefined>(undefined)

interface AudioProviderProps {
  children: ReactNode
  initialPlaylist?: Recording[]
  initialPlayerState?: {
    currentTrack: Recording | null
    queue: Recording[]
    isPlaying: boolean
    currentTime: number
    duration: number
  }
}

const STORAGE_KEYS = {
  playlist: 'jazz-bands-playlist',
  queue: 'jazz-bands-queue',
  currentTrack: 'jazz-bands-current-track',
  currentTrackTime: 'jazz-bands-current-time',
  isPlaying: 'jazz-bands-is-playing',
}

function trackAudioEvent(
  event: string,
  properties: Record<string, string | number | boolean>,
): void {
  trackUmamiEvent(event, {
    channel: 'web-player',
    band: BAND_SLUG,
    ...properties,
  })
}

export function AudioProvider({
  children,
  initialPlaylist = [],
  initialPlayerState,
}: AudioProviderProps) {
  // Track if we've already played the first track on initial load
  const hasPlayedFirstTrack = useRef(false)

  const [currentTrack, setCurrentTrack] = useState<Recording | null>(() => {
    if (typeof window === 'undefined') return null

    // For initial load: use first track from initialPlaylist
    // This prevents the player from disappearing during hydration
    if (!hasPlayedFirstTrack.current) {
      if (initialPlaylist && initialPlaylist.length > 0) {
        const firstTrack = initialPlaylist.find((r: Recording) => r.audioUrl)
        return firstTrack || null
      }
      return null
    }

    const stored = localStorage.getItem(STORAGE_KEYS.currentTrack)
    if (!stored) return null

    try {
      const parsed = JSON.parse(stored)

      // Always prefer fresh data from Sanity (initialPlaylist) if available
      if (initialPlaylist && initialPlaylist.length > 0) {
        const matchingTrack = initialPlaylist.find(
          (t) => t.title === parsed?.title || t._key === parsed?._key,
        )
        if (matchingTrack) {
          return matchingTrack
        }
      }

      // Fallback to localStorage
      return parsed
    } catch (e) {
      console.warn(
        '[AudioContext] Failed to parse localStorage currentTrack:',
        e,
      )
      return null
    }
  })
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(1)
  const [playlist, setPlaylist] = useState<Recording[]>(() => {
    if (typeof window === 'undefined') return []
    const stored = localStorage.getItem(STORAGE_KEYS.playlist)
    return stored ? JSON.parse(stored) : []
  })
  const [queue, setQueue] = useState<Recording[]>(() => {
    // Always prefer initialPlayerState.queue (from Sanity with all latest fields)
    if (initialPlayerState?.queue && initialPlayerState.queue.length > 0) {
      return initialPlayerState.queue
    }
    // Fallback: restore from localStorage but with merged field updates
    if (typeof window === 'undefined') return []
    const storedQueue = localStorage.getItem(STORAGE_KEYS.queue)
    if (!storedQueue) return []
    try {
      const parsed = JSON.parse(storedQueue)
      // If we have initialPlaylist, use it to refresh all tracks with new fields
      if (initialPlaylist && initialPlaylist.length > 0) {
        return initialPlaylist.filter((r) => r.audioUrl)
      }
      return parsed
    } catch (e) {
      console.warn('[AudioContext] Failed to parse localStorage queue:', e)
      return []
    }
  })

  const howlRef = useRef<Howl | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Save playback time periodically
  useEffect(() => {
    if (currentTrack && typeof window !== 'undefined') {
      const interval = setInterval(() => {
        localStorage.setItem(
          STORAGE_KEYS.currentTrackTime,
          currentTime.toString(),
        )
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [currentTime, currentTrack])

  const initHowl = useCallback(
    (url: string) => {
      if (howlRef.current) {
        howlRef.current.unload()
      }

      howlRef.current = new Howl({
        src: [url],
        html5: true,
        format: ['mp3'],
        preload: true,
        onend: () => {
          // Track track_end event
          if (currentTrack) {
            trackAudioEvent('track_end', {
              trackTitle: currentTrack.title,
              trackKey: currentTrack._key,
            })
          }
          // Track ended, will be handled by next() call
        },
        onload: () => {
          setDuration(howlRef.current?.duration() || 0)
        },
        onplayerror: (id, error) => {
          console.error('Howler play error:', id, error)
          setIsPlaying(false)
        },
      })

      howlRef.current.volume(volume)
    },
    [volume, currentTrack],
  )

  const playTrack = useCallback(
    (track: Recording, skipPlayEvent = false) => {
      if (!track.audioUrl) {
        console.warn('Track has no audio URL')
        return
      }

      const audioUrl = track.audioUrl

      // Track play event (skip if already tracked by skip_next/skip_prev)
      if (!skipPlayEvent) {
        trackAudioEvent('play', {
          trackTitle: track.title,
          trackKey: track._key,
          album: track.album || null,
          releaseYear: track.releaseYear || null,
        })
      }

      setCurrentTrack(track)
      setIsPlaying(true)
      setCurrentTime(0)

      // Save to localStorage for persistence
      localStorage.setItem(STORAGE_KEYS.currentTrack, JSON.stringify(track))
      localStorage.setItem(STORAGE_KEYS.isPlaying, 'true')
      localStorage.setItem(STORAGE_KEYS.currentTrackTime, '0')

      initHowl(audioUrl)
      howlRef.current?.play()

      setPlaylist((prev) => {
        const exists = prev.some((t) => t.title === track.title)
        if (!exists) {
          const updated = [...prev, track]
          localStorage.setItem(STORAGE_KEYS.playlist, JSON.stringify(updated))
          return updated
        }
        return prev
      })
    },
    [initHowl],
  )

  const togglePlay = useCallback(() => {
    if (!howlRef.current || !currentTrack) return

    if (isPlaying) {
      howlRef.current.pause()
      // Track pause event
      trackAudioEvent('pause', { trackTitle: currentTrack.title })
    } else {
      howlRef.current.play()
      // Track resume event
      trackAudioEvent('resume', { trackTitle: currentTrack.title })
    }
    setIsPlaying((prev) => {
      const next = !prev
      localStorage.setItem(STORAGE_KEYS.isPlaying, next ? 'true' : 'false')
      return next
    })
  }, [isPlaying, currentTrack])

  const next = useCallback(() => {
    if (!currentTrack || queue.length === 0) {
      return
    }

    // Find current track index in queue
    const currentIndex = queue.findIndex((t) => t.title === currentTrack?.title)

    if (currentIndex === -1) {
      // Current track not in queue, play first
      playTrack(queue[0])
      return
    }

    // Calculate next index with circular behavior
    const nextIndex = (currentIndex + 1) % queue.length
    const nextTrack = queue[nextIndex]

    // Track skip_next event
    trackAudioEvent('skip_next', {
      currentTrack: currentTrack.title,
      nextTrack: nextTrack.title,
    })

    playTrack(nextTrack, true)
  }, [queue, currentTrack, playTrack])

  const prev = useCallback(() => {
    if (!currentTrack) return

    const currentIndex = playlist.findIndex(
      (t) => t.title === currentTrack?.title,
    )
    const prevIndex =
      currentIndex === 0 ? playlist.length - 1 : currentIndex - 1
    const prevTrack = playlist[prevIndex]

    // Track skip_prev event
    trackAudioEvent('skip_prev', {
      currentTrack: currentTrack.title,
      nextTrack: prevTrack.title,
    })

    playTrack(prevTrack, true)
  }, [currentTrack, playlist, playTrack])

  const seek = useCallback(
    (time: number) => {
      const fromTime = currentTime
      howlRef.current?.seek(time)
      setCurrentTime(time)

      // Track seek event
      if (currentTrack) {
        trackAudioEvent('seek', {
          trackTitle: currentTrack.title,
          fromTime,
          toTime: time,
          direction: time > fromTime ? 'forward' : 'backward',
        })
      }
    },
    [currentTrack, currentTime],
  )

  const setVolume = useCallback(
    (value: number) => {
      const clampedValue = Math.max(0, Math.min(1, value))
      // Only update if meaningfully different (avoid excessive calls)
      if (Math.abs(clampedValue - volume) < 0.02) return

      // Track volume_change event
      trackAudioEvent('volume_change', {
        fromVolume: volume,
        toVolume: clampedValue,
      })

      setVolumeState(clampedValue)
      howlRef.current?.volume(clampedValue)
    },
    [volume],
  )

  const addToQueue = useCallback((track: Recording) => {
    setQueue((prev) => {
      const updated = [...prev, track]
      // Track queue_add event
      trackAudioEvent('queue_add', {
        trackTitle: track.title,
        queueSize: updated.length,
      })
      // Queue order resets to Sanity order on page reload
      return updated
    })
  }, [])

  const reorderQueue = useCallback((oldIndex: number, newIndex: number) => {
    setQueue((prev) => {
      const updated = [...prev]
      const [movedItem] = updated.splice(oldIndex, 1)
      updated.splice(newIndex, 0, movedItem)
      // Track queue_reorder event
      trackAudioEvent('queue_reorder', {
        trackTitle: movedItem.title,
        oldIndex,
        newIndex,
      })
      // Queue order resets to Sanity order on page reload
      return updated
    })
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.playlist, JSON.stringify(playlist))
    }
  }, [playlist])

  // Initialize queue from Sanity CMS (single source of truth)
  useEffect(() => {
    if (typeof window === 'undefined') return

    if (initialPlaylist.length > 0) {
      const tracksWithAudio = initialPlaylist.filter(
        (r: Recording) => r.audioUrl,
      )

      // Always use Sanity order - never mix with localStorage
      setQueue(tracksWithAudio)

      // Auto-play first track on initial page load
      if (!hasPlayedFirstTrack.current && tracksWithAudio.length > 0) {
        hasPlayedFirstTrack.current = true
        setTimeout(() => {
          playTrack(tracksWithAudio[0])
        }, 500)
      }
    }
  }, [initialPlaylist, playTrack])

  useEffect(() => {
    if (isPlaying && howlRef.current) {
      intervalRef.current = setInterval(() => {
        const time = howlRef.current?.seek() || 0
        setCurrentTime(time)
      }, 1000)

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    }
  }, [isPlaying])

  useEffect(() => {
    return () => {
      if (howlRef.current) {
        howlRef.current.unload()
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  // Keyboard shortcuts: Space (play/pause), ArrowLeft (seek -5s), ArrowRight (seek +5s)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      const activeTag = document.activeElement?.tagName?.toLowerCase()
      if (activeTag === 'input' || activeTag === 'textarea') {
        return
      }

      switch (e.key) {
        case ' ':
          e.preventDefault()
          togglePlay()
          break
        case 'ArrowLeft':
          e.preventDefault()
          seek(Math.max(0, currentTime - 5))
          break
        case 'ArrowRight':
          e.preventDefault()
          seek(Math.min(duration, currentTime + 5))
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [togglePlay, seek, currentTime, duration])

  const value: AudioContextType = {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    playlist,
    queue,
    playTrack,
    togglePlay,
    next,
    prev,
    seek,
    setVolume,
    addToQueue,
    reorderQueue,
  }

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>
}

export function useAudio() {
  const context = useContext(AudioContext)
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider')
  }
  return context
}
