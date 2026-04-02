import {
  closestCenter,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  type SortableContextProps,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AnimatePresence } from 'framer-motion'
import {
  ListMusic,
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
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'
import { useAudio } from '~/contexts/AudioContext'
import { useIsHydrated } from '~/hooks/useIsHydrated'
import { useReducedMotion } from '~/hooks/useReducedMotion'
import type { Recording } from '~/lib/types'

interface StickyPlayerProps {
  initialTrack: Recording | null
  initialQueue: Recording[]
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

function SortableTrack({
  track,
  isCurrent = false,
  onClick,
}: SortableTrackProps) {
  const intl = useIntl()
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
      className={`focus-ring flex items-center justify-between rounded-lg p-3 cursor-pointer transition-colors ${
        isCurrent
          ? 'bg-amber-500/30 border border-amber-500/50 hover:bg-amber-500/40'
          : 'bg-gray-800/50 hover:bg-gray-700/50'
      }`}
      tabIndex={0}
      role="button"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          {...listeners}
          className="focus-ring w-5 h-5 flex items-center justify-center text-gray-300 cursor-grab shrink-0 rounded-lg"
          aria-label={intl.formatMessage({ id: 'audioPlayer.dragHandle' })}
          onClick={(e) => e.stopPropagation()}
          tabIndex={0}
          role="button"
        >
          <MoveHorizontal className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p
            className={`font-medium truncate ${isCurrent ? 'text-amber-200' : 'text-white'}`}
          >
            {track.title}
          </p>
          {track.composers && track.composers.length > 0 && (
            <p className="text-sm text-gray-400 truncate">
              {track.composers.join('; ')}
            </p>
          )}
        </div>
      </div>
      <span
        className={`text-sm ml-2 shrink-0 ${isCurrent ? 'text-amber-200' : 'text-gray-300'}`}
      >
        {track.duration ? formatTime(track.duration) : '--:--'}
      </span>
    </div>
  )
}

interface QueueProps {
  queue: Recording[]
  isCurrentTrack: (title: string) => boolean
  onClose: () => void
  onReorder: (oldIndex: number, newIndex: number) => void
  playTrack: (track: Recording) => void
  disabled: boolean
}

function Queue({
  queue,
  isCurrentTrack,
  onClose,
  onReorder,
  playTrack,
  disabled,
}: QueueProps) {
  const intl = useIntl()
  const reducedMotion = useReducedMotion()

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
      if (disabled) return
      const { active, over } = event

      if (over && active.id !== over.id) {
        const oldIndex = queue.findIndex((t) => t.title === active.id)
        const newIndex = queue.findIndex((t) => t.title === over.id)

        if (oldIndex !== -1 && newIndex !== -1) {
          onReorder(oldIndex, newIndex)
        }
      }
    },
    [queue, onReorder, disabled],
  )

  const containerPadding = 'p-4'
  const headerHeight = 50

  // Static version
  if (disabled) {
    return (
      <section
        className="glass-card border-b border-gray-700/50"
        aria-label={intl.formatMessage({ id: 'audioPlayer.playlistQueue' })}
      >
        <div className="max-w-7xl mx-auto">
          <div className="px-3 py-2 border-t border-gray-700">
            <div className="flex items-center gap-2">
              <ListMusic className="w-4 h-4 text-white" />
              <h3 className="text-sm font-semibold text-white">
                <FormattedMessage id="audioPlayer.queue" />
              </h3>
              <span className="text-xs text-gray-300">
                {intl.formatMessage(
                  { id: 'audioPlayer.trackCount' },
                  { count: queue.length },
                )}
              </span>
            </div>
          </div>

          <div className="px-3 py-2">
            <div className="space-y-1">
              {queue.length === 0 ? (
                <p className="text-center text-gray-300 py-4 text-sm">
                  <FormattedMessage id="audioPlayer.noTracksInQueue" />
                </p>
              ) : (
                queue.map((track, idx) => {
                  const isCurrent = isCurrentTrack(track.title)
                  return (
                    <div
                      key={track._key || idx}
                      className={`flex items-center justify-between rounded-lg p-3 cursor-default ${
                        isCurrent
                          ? 'bg-amber-500/30 border border-amber-500/50'
                          : 'bg-gray-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-5 h-5 flex items-center justify-center text-gray-300 shrink-0">
                          <ListMusic className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p
                            className={`font-medium truncate ${
                              isCurrent ? 'text-amber-200' : 'text-white'
                            }`}
                          >
                            {track.title}
                          </p>
                          {track.composers && track.composers.length > 0 && (
                            <p className="text-sm text-gray-400 truncate">
                              {track.composers.join('; ')}
                            </p>
                          )}
                        </div>
                      </div>
                      <span
                        className={`text-sm ml-2 shrink-0 ${
                          isCurrent ? 'text-amber-200' : 'text-gray-300'
                        }`}
                      >
                        {track.duration ? formatTime(track.duration) : '--:--'}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section
      className="glass-card border-b border-gray-700/50"
      aria-label={intl.formatMessage({ id: 'audioPlayer.playlistQueue' })}
    >
      <div className="max-w-7xl mx-auto">
        <div className="px-3 py-2 border-t border-gray-700">
          <div className="flex items-center gap-2">
            <ListMusic className="w-4 h-4 text-white" />
            <h3 className="text-sm font-semibold text-white">
              <FormattedMessage id="audioPlayer.queue" />
            </h3>
            <span className="text-xs text-gray-300">
              {intl.formatMessage(
                { id: 'audioPlayer.trackCount' },
                { count: queue.length },
              )}
            </span>
          </div>
        </div>

        <div className="overflow-y-auto scrollbar-hidden flex-1 min-h-0">
          {queue.length === 0 ? (
            <p className="text-center text-gray-300 py-4 text-sm">
              <FormattedMessage id="audioPlayer.noTracksInQueue" />
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
    </section>
  )
}

// Export for backward compatibility
export { Queue as IntegrationQueue }

// Shortcut for DndContext without dynamic import
const DndContext = (props: {
  sensors: ReturnType<typeof useSensors>
  collisionDetection: typeof closestCenter
  onDragEnd: (event: DragEndEvent) => void
  children: React.ReactNode
}) => {
  return <>{props.children}</>
}

interface ExpandedPlayerProps {
  currentTrack: Recording
  currentTime: number
  duration: number
  isPlaying: boolean
  volume: number
  currentSongIndex: number
  songCount: number
  onSeek?: (time: number) => void
  onSeekMouseDown?: () => void
  onSeekMouseUp?: () => void
  onVolumeChange?: (value: number) => void
  onVolumeMouseDown?: (e: React.MouseEvent) => void
  onVolumeMouseUp?: () => void
  onTogglePlay?: () => void
  onPrev?: () => void
  onNext?: () => void
  isDragging: 'seek' | 'volume' | null
  dragValue: number
  intl: ReturnType<typeof useIntl>
}

function ExpandedPlayer({
  currentTrack,
  currentTime,
  duration,
  isPlaying,
  volume,
  currentSongIndex,
  songCount,
  onSeek,
  onSeekMouseDown,
  onSeekMouseUp,
  onVolumeChange,
  onVolumeMouseDown,
  onVolumeMouseUp,
  onTogglePlay,
  onPrev,
  onNext,
  isDragging,
  dragValue,
  intl,
}: ExpandedPlayerProps) {
  const isOnLastTrack =
    currentSongIndex >= 0 && currentSongIndex === songCount - 1 && songCount > 1

  const ariaLabels = {
    audioPlayer: intl.formatMessage({ id: 'audioPlayer.title' }),
    seek: intl.formatMessage({ id: 'audioPlayer.seek' }),
    previousTrack: intl.formatMessage({ id: 'audioPlayer.previousTrack' }),
    playPause: intl.formatMessage({
      id: isPlaying ? 'audioPlayer.pause' : 'audioPlayer.play',
    }),
    nextTrack: intl.formatMessage({
      id: isOnLastTrack ? 'audioPlayer.loopToFirst' : 'audioPlayer.nextTrack',
    }),
    volume: intl.formatMessage({ id: 'audioPlayer.volume' }),
  }

  const isDisabled = !onTogglePlay

  const seekValue = isDragging === 'seek' ? dragValue : currentTime
  const volumeValue = isDragging === 'volume' ? dragValue : volume

  const seekCursor = isDisabled
    ? 'cursor-default'
    : 'cursor-grab active:cursor-grabbing'
  const volumeCursor = isDisabled
    ? 'cursor-default'
    : 'cursor-grab active:cursor-grabbing'
  const hoverAccent = isDisabled ? '' : 'hover:accent-amber-400'
  const buttonHover = isDisabled
    ? 'cursor-default'
    : 'hover:bg-white/10 hover:text-amber-400'
  const playButtonHover = isDisabled
    ? 'cursor-default'
    : 'hover:bg-amber-50 active:bg-gray-100'

  return (
    <section
      className="glass-card border-t border-gray-700/50 shadow-2xl"
      aria-label={ariaLabels.audioPlayer}
      aria-disabled={isDisabled ? 'true' : undefined}
    >
      <div className="w-full px-5 py-5 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0 rounded-lg shadow-lg">
            <Music className="w-8 h-8 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-white text-lg truncate">
              {currentTrack.title}
            </h4>
            {currentTrack.composers && currentTrack.composers.length > 0 && (
              <p className="text-sm text-gray-400 truncate">
                {currentTrack.composers.join('; ')}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 w-10 text-right shrink-0 font-medium">
            {formatTime(seekValue)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={seekValue}
            onChange={(e) => onSeek?.(Number(e.target.value))}
            onMouseDown={onSeekMouseDown}
            onMouseUp={onSeekMouseUp}
            onBlur={onSeekMouseUp}
            disabled={isDisabled}
            className={`flex-1 h-1.5 bg-gray-600 appearance-none ${seekCursor} rounded-full accent-amber-500 ${hoverAccent} [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500 [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-amber-500 [&::-moz-range-thumb]:border-none`}
            aria-label={ariaLabels.seek}
            aria-valuenow={seekValue}
            aria-valuemin={0}
            aria-valuemax={duration}
          />
          <span className="text-xs text-gray-400 w-10 shrink-0 font-medium">
            {formatTime(duration)}
          </span>
        </div>

        <div className="flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={onPrev}
            className={`focus-ring p-3 ${buttonHover} transition-all rounded-full shrink-0`}
            aria-label={ariaLabels.previousTrack}
            disabled={isDisabled}
          >
            <SkipBack className="w-6 h-6 text-gray-300" />
          </button>

          <button
            type="button"
            onClick={onTogglePlay}
            className={`focus-ring w-16 h-16 bg-white ${playButtonHover} rounded-full transition-all shadow-lg flex items-center justify-center shrink-0`}
            aria-label={ariaLabels.playPause}
            disabled={isDisabled}
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 text-gray-900" />
            ) : (
              <Play className="w-8 h-8 text-gray-900 ml-1" />
            )}
          </button>

          <button
            type="button"
            onClick={onNext}
            className={`focus-ring p-3 ${buttonHover} transition-all rounded-full shrink-0`}
            aria-label={ariaLabels.nextTrack}
            disabled={isDisabled}
          >
            <RotateCw
              className={`w-6 h-6 ${isOnLastTrack ? 'text-amber-400' : 'text-gray-300'}`}
            />
          </button>
        </div>

        <div className="flex items-center gap-3 justify-center">
          {volume === 0 ? (
            <VolumeX className="w-4 h-4 text-gray-400" />
          ) : volume < 0.5 ? (
            <Volume1 className="w-4 h-4 text-gray-400" />
          ) : (
            <Volume2 className="w-4 h-4 text-gray-400" />
          )}
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volumeValue}
            onChange={(e) => onVolumeChange?.(Number(e.target.value))}
            onMouseDown={onVolumeMouseDown}
            onMouseUp={onVolumeMouseUp}
            onBlur={onVolumeMouseUp}
            disabled={isDisabled}
            className={`w-28 h-1 bg-gray-600 appearance-none ${volumeCursor} rounded-full accent-amber-500 ${hoverAccent} [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500 [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-amber-500 [&::-moz-range-thumb]:border-none`}
            aria-label={ariaLabels.volume}
            aria-valuenow={volumeValue}
            aria-valuemin={0}
            aria-valuemax={1}
          />
        </div>
      </div>
    </section>
  )
}

export function StickyPlayer({
  initialTrack,
  initialQueue,
}: StickyPlayerProps) {
  const isHydrated = useIsHydrated()
  const reducedMotion = useReducedMotion()
  const intl = useIntl()
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

  const [isQueueOpen, setIsQueueOpen] = useState(false)
  const [isDragging, setIsDragging] = useState<'seek' | 'volume' | null>(null)
  const [dragValue, setDragValue] = useState(0)
  const dragRafRef = useRef<number | null>(null)

  const track = isHydrated ? currentTrack : initialTrack
  const mergedQueue = isHydrated ? queue : initialQueue
  const mergedPlaying = isHydrated ? isPlaying : false
  const mergedTime = isHydrated ? currentTime : 0
  const mergedDuration = isHydrated ? duration : 0
  const mergedVolume = isHydrated ? volume : 1

  const currentSongIndex = track
    ? mergedQueue.findIndex((t) => t.title === track.title)
    : -1
  const songCount = mergedQueue.length

  useEffect(() => {
    if (!isHydrated || !isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      if (dragRafRef.current) return

      dragRafRef.current = requestAnimationFrame(() => {
        const target = document.elementFromPoint(
          e.clientX,
          e.clientY,
        ) as HTMLInputElement | null
        if (!target || target.tagName !== 'INPUT') {
          dragRafRef.current = null
          return
        }

        const rect = target.getBoundingClientRect()
        const x = e.clientX - rect.left
        const width = rect.width
        const percent = Math.max(0, Math.min(1, x / width))

        if (isDragging === 'seek') {
          const newValue = percent * (mergedDuration || 0)
          setDragValue(newValue)
          seek(newValue)
        } else {
          setDragValue(percent)
          setVolumeHandler(percent)
        }
        dragRafRef.current = null
      })
    }

    const handleMouseUp = () => {
      setIsDragging(null)
      if (dragRafRef.current) {
        cancelAnimationFrame(dragRafRef.current)
        dragRafRef.current = null
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      if (dragRafRef.current) cancelAnimationFrame(dragRafRef.current)
    }
  }, [isHydrated, isDragging, mergedDuration, seek, setVolumeHandler])

  const handleSeekMouseDown = useCallback(() => {
    if (isHydrated) setIsDragging('seek')
  }, [isHydrated])

  const handleSeekMouseUp = useCallback(() => {
    setIsDragging(null)
  }, [])

  const handleVolumeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!isHydrated) return
      setIsDragging('volume')
      const target = e.currentTarget as HTMLInputElement
      const rect = target.getBoundingClientRect()
      const x = e.clientX - rect.left
      const width = rect.width
      const percent = Math.max(0, Math.min(1, x / width))
      setDragValue(percent)
      setVolumeHandler(percent)
    },
    [isHydrated, setVolumeHandler],
  )

  const handleVolumeMouseUp = useCallback(() => {
    setIsDragging(null)
  }, [])

  const handlePlayTrack = useCallback(
    (track: Recording) => {
      if (isHydrated) playTrack(track)
    },
    [isHydrated, playTrack],
  )

  const handleReorderQueue = useCallback(
    (oldIndex: number, newIndex: number) => {
      if (isHydrated) reorderQueue(oldIndex, newIndex)
    },
    [isHydrated, reorderQueue],
  )

  if (!track) {
    return null
  }

  // Mobile layout — queue can be toggled
  const MobileLayout = () => {
    const isDisabled = !isHydrated

    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden flex flex-col overflow-hidden">
        <AnimatePresence>
          {isQueueOpen && !isDisabled && (
            <Queue
              key="queue"
              queue={mergedQueue}
              isCurrentTrack={(title) => title === track.title}
              onClose={() => setIsQueueOpen(false)}
              onReorder={handleReorderQueue}
              playTrack={handlePlayTrack}
              disabled={isDisabled}
            />
          )}
        </AnimatePresence>

        <ExpandedPlayer
          currentTrack={track}
          currentTime={mergedTime}
          duration={mergedDuration}
          isPlaying={mergedPlaying}
          volume={mergedVolume}
          currentSongIndex={currentSongIndex}
          songCount={songCount}
          onSeek={isHydrated ? seek : undefined}
          onSeekMouseDown={handleSeekMouseDown}
          onSeekMouseUp={handleSeekMouseUp}
          onVolumeChange={isHydrated ? setVolumeHandler : undefined}
          onVolumeMouseDown={handleVolumeMouseDown}
          onVolumeMouseUp={handleVolumeMouseUp}
          onTogglePlay={isHydrated ? togglePlay : undefined}
          onPrev={isHydrated ? prev : undefined}
          onNext={isHydrated ? next : undefined}
          isDragging={isDragging}
          dragValue={dragValue}
          intl={intl}
        />
      </div>
    )
  }

  // Desktop layout
  const DesktopLayout = () => {
    return (
      <div className="hidden lg:block lg:sticky lg:top-0 lg:flex-col">
        <ExpandedPlayer
          currentTrack={track}
          currentTime={mergedTime}
          duration={mergedDuration}
          isPlaying={mergedPlaying}
          volume={mergedVolume}
          currentSongIndex={currentSongIndex}
          songCount={songCount}
          onSeek={isHydrated ? seek : undefined}
          onSeekMouseDown={handleSeekMouseDown}
          onSeekMouseUp={handleSeekMouseUp}
          onVolumeChange={isHydrated ? setVolumeHandler : undefined}
          onVolumeMouseDown={handleVolumeMouseDown}
          onVolumeMouseUp={handleVolumeMouseUp}
          onTogglePlay={isHydrated ? togglePlay : undefined}
          onPrev={isHydrated ? prev : undefined}
          onNext={isHydrated ? next : undefined}
          isDragging={isDragging}
          dragValue={dragValue}
          intl={intl}
        />

        <Queue
          queue={mergedQueue}
          isCurrentTrack={(title) => title === track.title}
          onClose={() => {}}
          onReorder={handleReorderQueue}
          playTrack={handlePlayTrack}
          disabled={!isHydrated}
        />
      </div>
    )
  }

  return (
    <>
      <MobileLayout />
      <DesktopLayout />
    </>
  )
}
