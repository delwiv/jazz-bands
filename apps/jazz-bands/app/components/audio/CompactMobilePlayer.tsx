import {
  ListMusic,
  Pause,
  Play,
  RotateCw,
  SkipBack,
  SkipForward,
} from 'lucide-react'
import type { useIntl } from 'react-intl'
import type { Recording } from '~/lib/types'

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${String(secs).padStart(2, '0')}`
}

interface CompactMobilePlayerProps {
  currentTrack: Recording
  currentTime: number
  duration: number
  isPlaying: boolean
  currentSongIndex: number
  songCount: number
  isQueueOpen: boolean
  onSeek?: (time: number) => void
  onSeekMouseDown?: () => void
  onSeekMouseUp?: () => void
  onTogglePlay?: () => void
  onPrev?: () => void
  onNext?: () => void
  onToggleQueue?: () => void
  isDragging: 'seek' | 'volume' | null
  dragValue: number
  intl: ReturnType<typeof useIntl>
}

export function CompactMobilePlayer({
  currentTrack,
  currentTime,
  duration,
  isPlaying,
  currentSongIndex,
  songCount,
  isQueueOpen,
  onSeek,
  onSeekMouseDown,
  onSeekMouseUp,
  onTogglePlay,
  onPrev,
  onNext,
  onToggleQueue,
  isDragging,
  dragValue,
  intl,
}: CompactMobilePlayerProps) {
  const isOnLastTrack =
    currentSongIndex >= 0 && currentSongIndex === songCount - 1 && songCount > 1

  const isDisabled = !onTogglePlay

  const seekValue = isDragging === 'seek' ? dragValue : currentTime
  const seekCursor = isDisabled
    ? 'cursor-default'
    : 'cursor-grab active:cursor-grabbing'
  const buttonHover = isDisabled
    ? 'cursor-default'
    : 'hover:bg-white/10 hover:text-amber-400'

  return (
    <section
      className="glass-card border-t border-gray-700/50 shadow-2xl"
      aria-label={intl.formatMessage({ id: 'audioPlayer.title' })}
      aria-disabled={isDisabled ? 'true' : undefined}
    >
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-white text-sm truncate">
            {currentTrack.title}
          </h4>
          {currentTrack.composers && currentTrack.composers.length > 0 && (
            <p className="text-xs text-gray-400 truncate">
              {currentTrack.composers.join('; ')}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onPrev}
            className={`focus-ring p-2 ${buttonHover} transition-all rounded-lg shrink-0`}
            aria-label={intl.formatMessage({
              id: 'audioPlayer.previousTrack',
            })}
            disabled={isDisabled}
          >
            <SkipBack className="w-5 h-5 text-gray-300" />
          </button>

          <button
            type="button"
            onClick={onTogglePlay}
            className={`focus-ring p-2 ${buttonHover} transition-all rounded-full shrink-0`}
            aria-label={intl.formatMessage({
              id: isPlaying ? 'audioPlayer.pause' : 'audioPlayer.play',
            })}
            disabled={isDisabled}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 text-gray-300" />
            ) : (
              <Play className="w-6 h-6 text-gray-300" />
            )}
          </button>

          <button
            type="button"
            onClick={onNext}
            className={`focus-ring p-2 ${buttonHover} transition-all rounded-lg shrink-0`}
            aria-label={intl.formatMessage({
              id: isOnLastTrack
                ? 'audioPlayer.loopToFirst'
                : 'audioPlayer.nextTrack',
            })}
            disabled={isDisabled}
          >
            {isOnLastTrack ? (
              <RotateCw className="w-5 h-5 text-amber-400" />
            ) : (
              <SkipForward className="w-5 h-5 text-gray-300" />
            )}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 px-5 pb-4">
        <span className="text-xs text-gray-400 w-8 text-right shrink-0 font-medium">
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
          className={`flex-1 h-1 bg-gray-600 appearance-none ${seekCursor} rounded-full accent-amber-500`}
          aria-label={intl.formatMessage({ id: 'audioPlayer.seek' })}
          aria-valuenow={seekValue}
          aria-valuemin={0}
          aria-valuemax={duration}
        />

        <button
          type="button"
          onClick={onToggleQueue}
          className={`focus-ring p-2 ${buttonHover} transition-all rounded-lg shrink-0`}
          aria-label={intl.formatMessage({ id: 'audioPlayer.toggleQueue' })}
          disabled={isDisabled}
        >
          <ListMusic
            className={`w-5 h-5 ${
              isQueueOpen ? 'text-amber-400' : 'text-gray-300'
            }`}
          />
        </button>
      </div>
    </section>
  )
}
