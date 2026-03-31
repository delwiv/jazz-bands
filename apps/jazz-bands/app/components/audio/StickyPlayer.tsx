import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { FormattedMessage, useIntl } from 'react-intl'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable'
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
import { useCallback, useEffect, useRef, useState } from 'react'
import { useAudio } from '~/contexts/AudioContext'
import { useIsHydrated } from '~/hooks/useIsHydrated'
import { useReducedMotion } from '~/hooks/useReducedMotion'
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
      className={`focus-ring flex items-center justify-between rounded-lg p-3 cursor-pointer transition-colors ${isCurrent
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
       <div
         className="glass-card border-b border-gray-700/50"
         role="region"
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

       {/* Queue list - flex to fill remaining space */}
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
      </div>
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

 // Dragging state with RAF throttled global listener
  const [isDragging, setIsDragging] = useState<'seek' | 'volume' | null>(null)
  const [dragValue, setDragValue] = useState(0)
  const dragRafRef = useRef<number | null>(null)

  // Global mouse move listener for slider dragging (RAF throttled)
  useEffect(() => {
    if (!isDragging) return
    
    const handleMouseMove = (e: MouseEvent) => {
      if (dragRafRef.current) return // Skip if RAF already queued
      
      dragRafRef.current = requestAnimationFrame(() => {
        const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLInputElement | null
        if (!target || target.tagName !== 'INPUT') {
          dragRafRef.current = null
          return
        }
        
        const rect = target.getBoundingClientRect()
        const x = e.clientX - rect.left
        const width = rect.width
        const percent = Math.max(0, Math.min(1, x / width))
        
        if (isDragging === 'seek') {
          const newValue = percent * (duration || 0)
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
  }, [isDragging, duration, seek, setVolumeHandler])

  // Seek handlers
  const handleSeekMouseDown = () => {
    setIsDragging('seek')
  }

  const handleSeekMouseUp = () => {
    setIsDragging(null)
  }

  // Dummy onChange to prevent React warning (actual changes via global mousemove)
  const handleSeekChange = (_: React.ChangeEvent<HTMLInputElement>) => {}

  // Volume handlers
  const handleVolumeMouseDown = (e: React.MouseEvent) => {
    setIsDragging('volume')
    // Manually get initial value from the target element
    const target = e.currentTarget as HTMLInputElement
    const rect = target.getBoundingClientRect()
    const x = e.clientX - rect.left
    const width = rect.width
    const percent = Math.max(0, Math.min(1, x / width))
    setDragValue(percent)
    setVolumeHandler(percent)
  }

  const handleVolumeMouseUp = () => {
    setIsDragging(null)
  }

  // Dummy onChange to prevent React warning (actual changes via global mousemove)
  const handleVolumeChange = (_: React.ChangeEvent<HTMLInputElement>) => {}

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
     >
       <div className="w-full px-5 py-5 flex flex-col gap-4">
         {/* Track Info */}
         <div className="flex items-center gap-3">
           {/* Album art or icon */}
           <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0 rounded-lg shadow-lg">
             <Music className="w-8 h-8 text-white" />
           </div>

           {/* Track details */}
           <div className="flex-1 min-w-0">
             <h4 className="font-bold text-white text-lg truncate">
               {currentTrack.title}
             </h4>
             {currentTrack.composers &&
               currentTrack.composers.length > 0 && (
                 <p className="text-sm text-gray-400 truncate">
                   {currentTrack.composers.join('; ')}
                 </p>
               )}
           </div>
         </div>

      {/* Progress bar */}
          <div className="flex items-center gap-3">
<span className="text-xs text-gray-400 w-10 text-right shrink-0 font-medium">
              {formatTime(isDragging === 'seek' ? dragValue : currentTime)}
            </span>
<input
                  type="range"
                  min={0}
                  max={duration || 0}
                  value={isDragging === 'seek' ? dragValue : currentTime}
                  onChange={handleSeekChange}
                  onMouseDown={handleSeekMouseDown}
                  onMouseUp={handleSeekMouseUp}
                  onBlur={handleSeekMouseUp}
                  className="flex-1 h-1.5 bg-gray-600 appearance-none cursor-grab active:cursor-grabbing rounded-full accent-amber-500 hover:accent-amber-400 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500 [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-amber-500 [&::-moz-range-thumb]:border-none"
                  aria-label={intl.formatMessage({ id: 'audioPlayer.seek' })}
                  aria-valuenow={isDragging === 'seek' ? dragValue : currentTime}
                  aria-valuemin={0}
                  aria-valuemax={duration}
                />
<span className="text-xs text-gray-400 w-10 shrink-0 font-medium">
              {formatTime(duration)}
            </span>
          </div>

         {/* Playback controls */}
         <div className="flex items-center justify-center gap-6">
           <button
             onClick={prev}
             className="focus-ring p-3 hover:bg-white/10 hover:text-amber-400 transition-all rounded-full shrink-0"
             aria-label={intl.formatMessage({ id: 'audioPlayer.previousTrack' })}
           >
             <SkipBack className="w-6 h-6 text-gray-300" />
           </button>

           <button
             onClick={togglePlay}
             className="focus-ring w-16 h-16 bg-white hover:bg-amber-50 active:bg-gray-100 rounded-full transition-all shadow-lg flex items-center justify-center shrink-0"
             aria-label={intl.formatMessage({ id: isPlaying ? 'audioPlayer.pause' : 'audioPlayer.play' })}
           >
             {isPlaying ? (
               <Pause className="w-8 h-8 text-gray-900" />
             ) : (
               <Play className="w-8 h-8 text-gray-900 ml-1" />
             )}
           </button>

           <button
             onClick={next}
             className="focus-ring p-3 hover:bg-white/10 hover:text-amber-400 transition-all rounded-full shrink-0"
             aria-label={intl.formatMessage({ id: isOnLastTrack ? 'audioPlayer.loopToFirst' : 'audioPlayer.nextTrack' })}
           >
             {isOnLastTrack ? (
               <RotateCw className="w-6 h-6 text-amber-400" />
             ) : (
               <SkipForward className="w-6 h-6 text-gray-300" />
             )}
           </button>
         </div>

     {/* Volume control */}
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
                  value={isDragging === 'volume' ? dragValue : volume}
                  onChange={handleVolumeChange}
                  onMouseDown={handleVolumeMouseDown}
                  onMouseUp={handleVolumeMouseUp}
                  onBlur={handleVolumeMouseUp}
                  className="w-28 h-1 bg-gray-600 appearance-none cursor-grab active:cursor-grabbing rounded-full accent-amber-500 hover:accent-amber-400 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500 [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-amber-500 [&::-moz-range-thumb]:border-none"
                  aria-label={intl.formatMessage({ id: 'audioPlayer.volume' })}
                  aria-valuenow={isDragging === 'volume' ? dragValue : volume}
                  aria-valuemin={0}
                  aria-valuemax={1}
                />
          </div>
       </div>
     </div>
   )

  // Mobile layout (< 1024px): Fixed bottom, full-width
  const MobileLayout = () => (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col overflow-hidden lg:hidden">
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

  // Desktop layout (>= 1024px): 350px width, sticky within parent container
   const DesktopLayout = () => (
     <div className="hidden lg:block lg:sticky lg:top-0">
       {/* Player */}
       <ExpandedPlayer key="expanded" />

       {/* Queue panel always open below player */}
       <IntegrationQueue
         queue={queueInOrder}
         isCurrentTrack={(title: string) => title === currentTrack?.title}
         onClose={() => {}}
         onReorder={reorderQueue}
         playTrack={handlePlayTrack}
       />
     </div>
   )

  return (
    <>
      <MobileLayout />
      <DesktopLayout />
    </>
  )
}
