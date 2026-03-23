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
import type { Recording } from '~/lib/types'

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
}

const STORAGE_KEYS = {
  playlist: 'jazz-bands-playlist',
  queue: 'jazz-bands-queue',
  currentTrack: 'jazz-bands-current-track',
  currentTrackTime: 'jazz-bands-current-time',
  isPlaying: 'jazz-bands-is-playing',
}

export function AudioProvider({
  children,
  initialPlaylist = [],
}: AudioProviderProps) {
  const [currentTrack, setCurrentTrack] = useState<Recording | null>(null)
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
    if (typeof window === 'undefined') return []
    const stored = localStorage.getItem(STORAGE_KEYS.queue)
    return stored ? JSON.parse(stored) : []
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
        localStorage.setItem(
          STORAGE_KEYS.currentTrack,
          JSON.stringify(currentTrack),
        )
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [currentTrack, currentTime]) // eslint-disable-line react-hooks/exhaustive-deps

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
    [volume],
  )

  const playTrack = useCallback(
    (track: Recording) => {
      if (!track.audioUrl) {
        console.warn('Track has no audio URL')
        return
      }

      const audioUrl = track.audioUrl

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
    } else {
      howlRef.current.play()
    }
    setIsPlaying((prev) => {
      const next = !prev
      localStorage.setItem(STORAGE_KEYS.isPlaying, next ? 'true' : 'false')
      return next
    })
  }, [isPlaying, currentTrack])

  const next = useCallback(() => {
    if (queue.length > 0) {
      // Queue mode: play from queue with circular behavior
      const [nextTrack, ...remainingQueue] = queue
      setQueue((prevQueue) => {
        const newQueue = remainingQueue.length > 0 ? remainingQueue : prevQueue
        localStorage.setItem(STORAGE_KEYS.queue, JSON.stringify(newQueue))
        return newQueue
      })
      playTrack(nextTrack)
      return
    }

    if (!currentTrack) return

    // Playlist mode: circular play through playlist
    const currentIndex = playlist.findIndex(
      (t) => t.title === currentTrack?.title,
    )
    const nextIndex = (currentIndex + 1) % playlist.length

    if (nextIndex !== currentIndex) {
      playTrack(playlist[nextIndex])
    }
  }, [queue, currentTrack, playlist, playTrack])

  const prev = useCallback(() => {
    if (!currentTrack) return

    const currentIndex = playlist.findIndex(
      (t) => t.title === currentTrack?.title,
    )
    const prevIndex =
      currentIndex === 0 ? playlist.length - 1 : currentIndex - 1

    playTrack(playlist[prevIndex])
  }, [currentTrack, playlist, playTrack])

  const seek = useCallback((time: number) => {
    howlRef.current?.seek(time)
    setCurrentTime(time)
  }, [])

  const setVolume = useCallback((value: number) => {
    const clampedValue = Math.max(0, Math.min(1, value))
    setVolumeState(clampedValue)
    howlRef.current?.volume(clampedValue)
  }, [])

  const addToQueue = useCallback((track: Recording) => {
    setQueue((prev) => {
      const updated = [...prev, track]
      localStorage.setItem(STORAGE_KEYS.queue, JSON.stringify(updated))
      return updated
    })
  }, [])

  const reorderQueue = useCallback((oldIndex: number, newIndex: number) => {
    setQueue((prev) => {
      const updated = [...prev]
      const [movedItem] = updated.splice(oldIndex, 1)
      updated.splice(newIndex, 0, movedItem)
      localStorage.setItem(STORAGE_KEYS.queue, JSON.stringify(updated))
      return updated
    })
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.playlist, JSON.stringify(playlist))
    }
  }, [playlist])

  // Initialize queue and autoplay on first load
  useEffect(() => {
    if (typeof window === 'undefined') return

    console.log('[AudioContext] Init effect: initialPlaylist count:', initialPlaylist.length)

    // Only auto-queue if no saved queue exists
    const savedQueue = localStorage.getItem(STORAGE_KEYS.queue)
    const hasSavedQueue = savedQueue && JSON.parse(savedQueue).length > 0

    if (!hasSavedQueue && initialPlaylist.length > 0) {
      const tracksWithAudio = initialPlaylist.filter((r: Recording) => r.audioUrl)
      console.log('[AudioContext] Auto-queuing', tracksWithAudio.length, 'tracks')

      if (tracksWithAudio.length > 0) {
        // Add all to queue
        tracksWithAudio.forEach((track: Recording) => {
          if (track.audioUrl) {
            setQueue((prev) => {
              const exists = prev.some((t) => t.title === track.title)
              if (!exists) {
                const updated = [...prev, track]
                localStorage.setItem(STORAGE_KEYS.queue, JSON.stringify(updated))
                return updated
              }
              return prev
            })
          }
        })

        // Auto-play first track
        const firstTrack = tracksWithAudio[0]
        if (firstTrack.audioUrl) {
          setTimeout(() => {
            console.log('[AudioContext] Auto-playing first track:', firstTrack.title)
            playTrack(firstTrack)
          }, 500)
        }
      }
    } else if (hasSavedQueue) {
      // Resume from saved queue
      const savedTrack = localStorage.getItem(STORAGE_KEYS.currentTrack)
      const savedPlaying = localStorage.getItem(STORAGE_KEYS.isPlaying)

      if (savedTrack && savedPlaying === 'true') {
        const track: Recording = JSON.parse(savedTrack)
        if (track.audioUrl) {
          setTimeout(() => {
            console.log('[AudioContext] Resuming saved track:', track.title)
            playTrack(track)
          }, 500)
        }
      }
    }
  }, [initialPlaylist, playTrack]) // Run ONCE on mount

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
