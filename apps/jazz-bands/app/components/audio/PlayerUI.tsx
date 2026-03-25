import {
  ListMusic,
  Maximize2,
  Music,
  Pause,
  Play,
  RotateCw,
  SkipBack,
  SkipForward,
} from 'lucide-react'
import { type ReactNode } from 'react'
import type { Recording } from '~/lib/types'

interface PlayerUIProps {
  currentTrack: Recording | null
  queue: Recording[]
  isPlaying: boolean
  currentTime: number
  duration: number
  isCompact: boolean
  isOnLastTrack: boolean
  isQueueOpen?: boolean
  onSeek?: (time: number) => void
  onTogglePlay?: () => void
  onNext?: () => void
  onPrev?: () => void
  onToggleQueue?: () => void
  onToggleCompact?: () => void
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${String(secs).padStart(2, '0')}`
}

function CompactBar({
  currentTrack,
  queue,
  isPlaying,
  currentTime,
  duration,
  isOnLastTrack,
  isQueueOpen = false,
  onSeek,
  onTogglePlay,
  onNext,
  onPrev,
  onToggleQueue,
  onToggleCompact,
}: PlayerUIProps) {
  if (!currentTrack) return null

  const currentSongIndex = queue.findIndex(
    (track) => track.title === currentTrack.title,
  )
  const songCount = queue.length
  const currentSongNumber = currentSongIndex >= 0 ? currentSongIndex + 1 : 1

  return (
    <div
      className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-t border-gray-700 shadow-2xl"
      role="region"
      aria-label="Audio player"
    >
      <div className="flex items-center justify-between px-3 py-2 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
<button
                onClick={onPrev}
                className="focus-ring p-1.5 hover:bg-gray-700 rounded transition-colors"
                aria-label="Previous track"
                disabled={!onPrev}
              >
            <SkipBack className="w-4 h-4 text-gray-300" />
          </button>
<button
                onClick={onTogglePlay}
                className="focus-ring p-1.5 bg-white hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center"
                aria-label={isPlaying ? 'Pause' : 'Play'}
                disabled={!onTogglePlay}
              >
            {isPlaying ? (
              <Pause className="w-4 h-4 text-gray-900" />
            ) : (
              <Play className="w-4 h-4 text-gray-900" />
            )}
          </button>
<button
                onClick={onNext}
                className="focus-ring p-1.5 hover:bg-gray-700 rounded transition-colors"
                aria-label={
                  isOnLastTrack ? 'Loop back to first track' : 'Next track'
                }
                disabled={!onNext}
              >
            {isOnLastTrack ? (
              <RotateCw className="w-4 h-4 text-amber-400" />
            ) : (
              <SkipForward className="w-4 h-4 text-gray-300" />
            )}
          </button>
        </div>

        <div className="flex flex-col items-center min-w-0 flex-1 max-w-xs px-2">
          <p className="text-sm font-medium text-white truncate text-center">
            {currentTrack.title} ({currentSongNumber}/{songCount})
          </p>
          <div className="flex items-center gap-1 text-[10px] text-gray-300">
            <span>{formatTime(currentTime)}</span>
            <span>/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
<button
                onClick={onToggleQueue}
                className={`focus-ring p-1.5 rounded transition-colors ${
                  isQueueOpen
                    ? 'bg-amber-500 text-white'
                    : 'hover:bg-gray-700 text-gray-300'
                }`}
                aria-label="Toggle queue"
                aria-expanded={isQueueOpen}
                disabled={!onToggleQueue}
              >
            <ListMusic className="w-4 h-4" />
          </button>
<button
                onClick={onToggleCompact}
                className="focus-ring p-1.5 hover:bg-gray-700 rounded transition-colors"
                aria-label="Expand player"
                disabled={!onToggleCompact}
              >
            <Maximize2 className="w-4 h-4 text-gray-300" />
          </button>
        </div>
      </div>

      <input
        type="range"
        min={0}
        max={duration || 0}
        value={currentTime}
        onChange={(e) => onSeek?.(Number(e.target.value))}
        className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-amber-500"
        aria-label="Seek"
        disabled={!onSeek}
      />
    </div>
  )
}

export function PlayerUI({
  currentTrack,
  queue,
  isPlaying,
  currentTime,
  duration,
  isCompact,
  isOnLastTrack,
  isQueueOpen = false,
  onSeek,
  onTogglePlay,
  onNext,
  onPrev,
  onToggleQueue,
  onToggleCompact,
}: PlayerUIProps) {
  return (
    <CompactBar
      currentTrack={currentTrack}
      queue={queue}
      isPlaying={isPlaying}
      currentTime={currentTime}
      duration={duration}
      isCompact={isCompact}
      isOnLastTrack={isOnLastTrack}
      isQueueOpen={isQueueOpen}
      onSeek={onSeek}
      onTogglePlay={onTogglePlay}
      onNext={onNext}
      onPrev={onPrev}
      onToggleQueue={onToggleQueue}
      onToggleCompact={onToggleCompact}
    />
  )
}
