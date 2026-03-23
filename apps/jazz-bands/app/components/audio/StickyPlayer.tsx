import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ListMusic,
  Maximize2,
  Minimize2,
  MoveHorizontal,
  Music,
  Pause,
  Play,
  RotateCw,
  SkipBack,
  SkipForward,
  Volume1,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useAudio } from '~/contexts/AudioContext'
import type { Recording } from '~/lib/types'

// Responsive hook to detect desktop
function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth >= 768
  })

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return isDesktop
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${String(secs).padStart(2, '0')}`
}

interface SortableTrackProps {
  track: Recording
  isCurrent?: boolean
  onClick?: (track: Recording) => void
}

function SortableTrack({ track, isCurrent = false, onClick }: SortableTrackProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: track.title })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      onClick={() => onClick?.(track)}
      className={`flex items-center justify-between rounded-lg p-3 cursor-pointer transition-colors ${
        isCurrent
          ? 'bg-amber-500/30 border border-amber-500/50 hover:bg-amber-500/40'
          : 'bg-gray-800/50 hover:bg-gray-700/50'
      }`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          {...listeners}
          className="w-5 h-5 flex items-center justify-center text-gray-500 cursor-grab shrink-0"
          aria-label="Drag handle"
          onClick={(e) => e.stopPropagation()}
        >
          <MoveHorizontal className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className={`font-medium truncate ${isCurrent ? 'text-amber-200' : 'text-white'}`}>
            {track.title}
          </p>
          {track.album && (
            <p className="text-sm text-gray-400 truncate">{track.album}</p>
          )}
        </div>
      </div>
      <span className={`text-sm ml-2 shrink-0 ${isCurrent ? 'text-amber-200' : 'text-gray-500'}`}>
        {track.duration ? formatTime(track.duration) : '--:--'}
      </span>
    </div>
  )
}

interface IntegrationQueueProps {
  queue: Recording[]
  isCompact: boolean
  isCurrentTrack: (title: string) => boolean
  onClose: () => void
  onReorder: (oldIndex: number, newIndex: number) => void
  playTrack: (track: Recording) => void
}

function IntegrationQueue({ queue, isCompact, isCurrentTrack, onClose, onReorder, playTrack }: IntegrationQueueProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event

      if (over && active.id !== over.id) {
        const oldIndex = queue.findIndex((t) => t.title === active.id)
        const newIndex = queue.findIndex((t) => t.title === over.id)

        if (oldIndex !== -1 && newIndex !== -1) {
          onReorder(oldIndex, newIndex)
        }
      }
    },
    [queue, onReorder],
  )

  const containerPadding = isCompact ? 'p-3' : 'p-4'
  const headerHeight = isCompact ? 40 : 50

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="bg-gradient-to-b from-gray-900 to-gray-800/95 border-b border-gray-700 backdrop-blur-sm"
      role="region"
      aria-label="Playlist queue"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700" style={{ minHeight: `${headerHeight}px` }}>
          <div className="flex items-center gap-2">
            <ListMusic className="w-4 h-4 text-white" />
            <h3 className="text-sm font-semibold text-white">Queue</h3>
            <span className="text-xs text-gray-400">
              {queue.length} {queue.length === 1 ? 'track' : 'tracks'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close queue"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Hidden scrollbar via class */}
        <div className={`overflow-y-auto scrollbar-hidden`} style={{ maxHeight: '200px' }}>
          {queue.length === 0 ? (
            <p className="text-center text-gray-500 py-4 text-sm">
              No tracks in queue
            </p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={queue.map((t) => t.title)}>
                <div className="space-y-1 px-3 py-2">
                  {queue.map((track) => (
                    <SortableTrack
                      key={track.title}
                      track={track}
                      isCurrent={isCurrentTrack(track.title)}
                      onClick={playTrack}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export function StickyPlayer() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    queue,
    playTrack,
    togglePlay,
    next,
    prev,
    seek,
    setVolume: setVolumeHandler,
    reorderQueue,
  } = useAudio()

  const isDesktop = useIsDesktop()
  const [isQueueOpen, setIsQueueOpen] = useState(false)
  const [isCompact, setIsCompact] = useState(() => {
    // Default to compact on mobile, expanded on desktop
    if (typeof window === 'undefined') return !isDesktop
    const stored = localStorage.getItem('jazz-bands-player-compact')
    return stored !== null ? stored === 'true' : !isDesktop
  })

  useEffect(() => {
    localStorage.setItem('jazz-bands-player-compact', isCompact.toString())
  }, [isCompact])

  const toggleCompact = () => setIsCompact(prev => !prev)

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    seek(Number(e.target.value))
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolumeHandler(Number(e.target.value))
  }

  // Click outside to close queue
  const handleBackdropClick = useCallback(() => {
    setIsQueueOpen(false)
  }, [])

  // Play track from queue
  const handlePlayTrack = useCallback(
    (track: Recording) => {
      playTrack(track)
    },
    [playTrack],
  )

  // Queue retains Sanity CMS order (no re-sorting)
  const queueInOrder = queue

  // Calculate current song position in queue
  const currentSongIndex = queue.findIndex(
    (track) => track.title === currentTrack?.title,
  )
  const songCount = queue.length
  const currentSongNumber = currentSongIndex >= 0 ? currentSongIndex + 1 : 1
  const isOnLastTrack = currentSongIndex >= 0 && currentSongIndex === songCount - 1 && songCount > 1

  if (!currentTrack) {
    return null
  }

  const CompactBar = () => (
    <motion.div
      className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-t border-gray-700 shadow-2xl"
      role="region"
      aria-label="Audio player"
    >
      {/* Main row with controls, title, expand */}
      <div className="flex items-center justify-between px-3 py-2 max-w-7xl mx-auto">
        {/* Left: prev/play/next buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={prev}
            className="p-1.5 hover:bg-gray-700 rounded transition-colors"
            aria-label="Previous track"
          >
            <SkipBack className="w-4 h-4 text-gray-300" />
          </button>
          <button
            onClick={togglePlay}
            className="p-1.5 bg-white hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 text-gray-900" />
            ) : (
              <Play className="w-4 h-4 text-gray-900" />
            )}
          </button>
          <button
            onClick={next}
            className="p-1.5 hover:bg-gray-700 rounded transition-colors"
            aria-label={isOnLastTrack ? 'Loop back to first track' : 'Next track'}
          >
            {isOnLastTrack ? (
              <RotateCw className="w-4 h-4 text-amber-400" />
            ) : (
              <SkipForward className="w-4 h-4 text-gray-300" />
            )}
          </button>
        </div>

        {/* Center: title with times below */}
        <div className="flex flex-col items-center min-w-0 flex-1 max-w-xs px-2">
          <p className="text-sm font-medium text-white truncate text-center">
            {currentTrack.title} ({currentSongNumber}/{songCount})
          </p>
          <div className="flex items-center gap-1 text-[10px] text-gray-400">
            <span>{formatTime(currentTime)}</span>
            <span>/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right: queue, expand buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsQueueOpen(!isQueueOpen)}
            className={`p-1.5 rounded transition-colors ${isQueueOpen
                ? 'bg-amber-500 text-white'
                : 'hover:bg-gray-700 text-gray-300'
              }`}
            aria-label="Toggle queue"
            aria-expanded={isQueueOpen}
          >
            <ListMusic className="w-4 h-4" />
          </button>
          <button
            onClick={toggleCompact}
            className="p-1.5 hover:bg-gray-700 rounded transition-colors"
            aria-label="Expand player"
          >
            <Maximize2 className="w-4 h-4 text-gray-300" />
          </button>
        </div>
      </div>

      {/* Progress bar at bottom, full width, no padding */}
      <input
        type="range"
        min={0}
        max={duration || 0}
        value={currentTime}
        onChange={handleSeek}
        className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-amber-500"
        aria-label="Seek"
      />
    </motion.div>
  )

  const ExpandedPlayer = () => (
    <div
      className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-t border-gray-700 shadow-2xl"
      role="region"
      aria-label="Audio player"
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex flex-col md:flex-row items-center gap-4">
          {/* Track Info */}
          <div className="flex-1 min-w-0 w-full">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center shrink-0">
                <Music className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h4 className="font-semibold text-white truncate">
                  {currentTrack.title}
                </h4>
                <p className="text-sm text-gray-400 truncate">
                  {currentTrack.album || 'Single'}
                </p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col items-center gap-2 flex-1 w-full">
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={prev}
                className="p-2 hover:bg-gray-700 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
                aria-label="Previous track"
              >
                <SkipBack className="w-5 h-5 text-gray-300" />
              </button>

              <button
                onClick={togglePlay}
                className="p-3 bg-white hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 text-gray-900" />
                ) : (
                  <Play className="w-6 h-6 text-gray-900" />
                )}
              </button>

              <button
                onClick={next}
                className="p-2 hover:bg-gray-700 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
                aria-label={isOnLastTrack ? 'Loop back to first track' : 'Next track'}
              >
                {isOnLastTrack ? (
                  <RotateCw className="w-5 h-5 text-amber-400" />
                ) : (
                  <SkipForward className="w-5 h-5 text-gray-300" />
                )}
              </button>
            </div>

            {/* Seek Bar */}
            <div className="flex items-center gap-2 w-full max-w-md">
              <span className="text-xs text-gray-400 w-10 text-right">
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min={0}
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-amber-500"
                aria-label="Seek"
                aria-valuenow={currentTime}
                aria-valuemin={0}
                aria-valuemax={duration}
              />
              <span className="text-xs text-gray-400 w-10">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Volume & Queue */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <div className="flex items-center gap-2">
              {volume === 0 ? (
                <VolumeX className="w-5 h-5 text-gray-400" />
              ) : volume < 0.5 ? (
                <Volume1 className="w-5 h-5 text-gray-400" />
              ) : (
                <Volume2 className="w-5 h-5 text-gray-400" />
              )}
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-amber-500"
                aria-label="Volume"
                aria-valuenow={volume}
                aria-valuemin={0}
                aria-valuemax={1}
              />
            </div>

            {/* Queue Button (first) */}
            <button
              onClick={() => setIsQueueOpen(!isQueueOpen)}
              className={`p-2 rounded-lg transition-colors ${isQueueOpen
                  ? 'bg-amber-500 text-white'
                  : 'hover:bg-gray-700 text-gray-300'
                }`}
              aria-label="Toggle queue"
              aria-expanded={isQueueOpen}
            >
              <ListMusic className="w-5 h-5" />
            </button>

            {/* Compact Toggle Button (second) */}
            <button
              onClick={toggleCompact}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Collapse player to compact mode"
            >
              <Minimize2 className="w-5 h-5 text-gray-300" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col">
      <AnimatePresence>
        {isQueueOpen && (
          <IntegrationQueue
            key="queue"
            queue={queueInOrder}
            isCompact={isCompact}
            isCurrentTrack={(title: string) => title === currentTrack?.title}
            onClose={() => setIsQueueOpen(false)}
            onReorder={reorderQueue}
            playTrack={handlePlayTrack}
          />
        )}
      </AnimatePresence>

      <div>
        {isCompact ? (
          <CompactBar key="compact" />
        ) : (
          <ExpandedPlayer key="expanded" />
        )}
      </div>
    </div>
  )
}
