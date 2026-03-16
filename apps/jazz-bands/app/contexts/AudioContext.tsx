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
import { getAudioCdnUrl } from '~/lib/sanity.settings'
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
  removeFromQueue: (trackId: string) => void
  reorderQueue: (oldIndex: number, newIndex: number) => void
  clearQueue: () => void
}

const AudioContext = createContext<AudioContextType | undefined>(undefined)

interface AudioProviderProps {
  children: ReactNode
  initialPlaylist?: Recording[]
}

const STORAGE_KEYS = {
  playlist: 'jazz-bands-playlist',
  queue: 'jazz-bands-queue',
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
      if (!track.audio?.asset?._ref) {
        console.warn('Track has no audio asset')
        return
      }

      const audioUrl = getAudioCdnUrl(track.audio.asset._ref)

      setCurrentTrack(track)
      setIsPlaying(true)
      setCurrentTime(0)

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
    setIsPlaying((prev) => !prev)
  }, [isPlaying, currentTrack])

  const next = useCallback(() => {
    if (queue.length > 0) {
      const [nextTrack, ...remainingQueue] = queue
      setQueue(remainingQueue)
      localStorage.setItem(STORAGE_KEYS.queue, JSON.stringify(remainingQueue))
      playTrack(nextTrack)
      return
    }

    if (!currentTrack) return

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

  const removeFromQueue = useCallback((trackId: string) => {
    setQueue((prev) => {
      const updated = prev.filter((t) => t._id !== trackId)
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

  const clearQueue = useCallback(() => {
    setQueue([])
    localStorage.removeItem(STORAGE_KEYS.queue)
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.playlist, JSON.stringify(playlist))
    }
  }, [playlist])

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
    removeFromQueue,
    reorderQueue,
    clearQueue,
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
