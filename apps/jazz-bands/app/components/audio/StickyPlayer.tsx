import { closestCenter, DndContext, type DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { FormattedMessage, useIntl } from 'react-intl'
import { SortableContext, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AnimatePresence, motion } from 'framer-motion'
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
  X,
} from 'lucide-react'
import { useCallback, useState } from 'react'
import { useAudio } from '~/contexts/AudioContext'
import { useIsHydrated } from '~/hooks/useIsHydrated'
import type { Recording } from '~/lib/types'
import { StaticPlayer } from './StaticPlayer'

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
            className="focus-ring w-5 h-5 flex items-center justify-center text-gray-300 cursor-grab shrink-0"
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
              <p className="text-sm text-gray-400 truncate">{track.composers.join('; ')}</p>
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

interface IntegrationQueueProps {
   queue: Recording[]
    isCurrentTrack: (title: string) => boolean
    onClose: () => void
    onReorder: (oldIndex: number, newIndex: number) => void
    playTrack: (track: Recording) => void
 }

 function IntegrationQueue({
    queue,
    isCurrentTrack,
    onClose,
    onReorder,
    playTrack,
 }: IntegrationQueueProps) {
    const intl = useIntl()
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

  const containerPadding = 'p-4'
  const headerHeight = 50

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
     className="glass-card border-b border-gray-700/50"
        role="region"
        aria-label={intl.formatMessage({ id: 'audioPlayer.playlistQueue' })}
     >
       <div className="max-w-7xl mx-auto">
         <div
           className="flex items-center justify-between px-3 py-2 border-b border-gray-700"
           style={{ minHeight: `${headerHeight}px` }}
         >
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
           <button
                onClick={onClose}
                className="focus-ring p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
                aria-label={intl.formatMessage({ id: 'audioPlayer.closeQueue' })}
              >
            <X className="w-4 h-4 text-gray-300" />
          </button>
        </div>

        {/* Queue list - grows with content, scrolls when needed */}
        <div
          className={`overflow-y-auto scrollbar-hidden`}
          style={{ maxHeight: `calc(100vh - ${headerHeight + 120}px)` }}
        >
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
    </motion.div>
  )
}

export function StickyPlayer({
   initialTrack,
   initialQueue,
 }: StickyPlayerProps) {
    const isHydrated = useIsHydrated()
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

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    seek(Number(e.target.value))
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolumeHandler(Number(e.target.value))
  }

  // Play track from queue
  const handlePlayTrack = useCallback(
    (track: Recording) => {
      playTrack(track)
    },
    [playTrack],
  )

  // Queue retains Sanity CMS order (no re-sorting)
  const queueInOrder = queue
  // SSR mode: render static player before hydration
  if (!isHydrated) {
    return <StaticPlayer currentTrack={initialTrack} queue={initialQueue} />
  }

  // Client mode: need current track from AudioProvider
  if (!currentTrack) {
    return null
  }

  // Calculate current song position in queue
  const currentSongIndex = queue.findIndex(
    (track) => track.title === currentTrack.title,
  )
  const songCount = queue.length
  const isOnLastTrack =
    currentSongIndex >= 0 && currentSongIndex === songCount - 1 && songCount > 1

   const ExpandedPlayer = () => (
        <div
          className="glass-card border-t border-gray-700/50 shadow-2xl"
          role="region"
          aria-label={intl.formatMessage({ id: 'audioPlayer.title' })}
          style={{ height: '100px' }}
        >
      <div className="max-w-7xl mx-auto px-3 py-2 md:px-4 md:py-3 h-full">
        <div className="flex items-center gap-2 md:gap-4 overflow-x-hidden h-full">
          {/* Track Info */}
          <div className="flex flex-col min-w-0 md:w-auto h-full">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-12 md:h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center shrink-0">
                <Music className="w-4 h-4 md:w-6 md:h-6 text-white" />
              </div>
<div className="min-w-0">
                 <h4 className="font-semibold text-white truncate">
                   {currentTrack.title}
                 </h4>
{currentTrack.composers && currentTrack.composers.length > 0 && (
                   <p className="text-xs md:text-sm text-gray-400 truncate">
                     {currentTrack.composers.join('; ')}
                   </p>
                 )}
               </div>
            </div>

            {/* Seek Bar - inline on mobile */}
            <div className="flex items-center gap-1 md:gap-2 mt-1.5 w-full flex-1">
              <span className="text-[10px] md:text-xs text-gray-300 w-8 md:w-10 text-right shrink-0">
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min={0}
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-amber-500"
                aria-label={intl.formatMessage({ id: 'audioPlayer.seek' })}
                aria-valuenow={currentTime}
                aria-valuemin={0}
                aria-valuemax={duration}
              />
              <span className="text-[10px] md:text-xs text-gray-300 w-8 md:w-10 shrink-0">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-2 md:gap-4 mx-auto flex-1 shrink-0">
            <button
                onClick={prev}
                className="focus-ring p-1.5 md:p-2 hover:bg-gray-700 rounded-full transition-colors shrink-0"
                aria-label={intl.formatMessage({ id: 'audioPlayer.previousTrack' })}
              >
              <SkipBack className="w-4 h-4 md:w-5 md:h-5 text-gray-300" />
            </button>

<button
                onClick={togglePlay}
                className="focus-ring p-2 md:p-3 bg-white hover:bg-gray-100 rounded-full transition-colors shrink-0"
                aria-label={intl.formatMessage({ id: isPlaying ? 'audioPlayer.pause' : 'audioPlayer.play' })}
              >
              {isPlaying ? (
                <Pause className="w-5 h-5 md:w-6 md:h-6 text-gray-900" />
              ) : (
                <Play className="w-5 h-5 md:w-6 md:h-6 text-gray-900" />
              )}
            </button>

<button
                onClick={next}
                className="focus-ring p-1.5 md:p-2 hover:bg-gray-700 rounded-full transition-colors shrink-0"
                aria-label={intl.formatMessage({ id: isOnLastTrack ? 'audioPlayer.loopToFirst' : 'audioPlayer.nextTrack' })}
              >
              {isOnLastTrack ? (
                <RotateCw className="w-4 h-4 md:w-5 md:h-5 text-amber-400" />
              ) : (
                <SkipForward className="w-4 h-4 md:w-5 md:h-5 text-gray-300" />
              )}
            </button>
          </div>

          {/* Volume & Queue - volume hidden on mobile */}
          <div className="flex items-center gap-1 md:gap-2 md:w-auto justify-end flex-1 md:flex-initial">
            {/* Volume - hidden on mobile, visible on md+ */}
            <div className="hidden md:flex items-center gap-2">
              {volume === 0 ? (
                <VolumeX className="w-5 h-5 text-gray-300" />
              ) : volume < 0.5 ? (
                <Volume1 className="w-5 h-5 text-gray-300" />
              ) : (
                <Volume2 className="w-5 h-5 text-gray-300" />
              )}
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-amber-500"
                aria-label={intl.formatMessage({ id: 'audioPlayer.volume' })}
                aria-valuenow={volume}
                aria-valuemin={0}
                aria-valuemax={1}
              />
            </div>

            {/* Queue Button */}
<button
                onClick={() => setIsQueueOpen(!isQueueOpen)}
                className={`focus-ring p-1.5 md:p-2 rounded-lg transition-colors flex-shrink-0 ${
                  isQueueOpen
                    ? 'bg-amber-500 text-white'
                    : 'hover:bg-gray-700 text-gray-300'
                }`}
                aria-label={intl.formatMessage({ id: 'audioPlayer.toggleQueue' })}
                aria-expanded={isQueueOpen}
              >
              <ListMusic className="w-4 h-4 md:w-5 md:h-5" />
            </button>

         </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col overflow-hidden">
      <AnimatePresence>
        {isQueueOpen && (
          <IntegrationQueue
            key="queue"
            queue={queueInOrder}
            isCurrentTrack={(title: string) => title === currentTrack?.title}
            onClose={() => setIsQueueOpen(false)}
            onReorder={reorderQueue}
            playTrack={handlePlayTrack}
          />
        )}
      </AnimatePresence>

      <ExpandedPlayer key="expanded" />
    </div>
  )
}
