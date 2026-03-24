import {
  ListMusic,
  Minimize2,
  Music,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
} from 'lucide-react'
import type { Recording } from '~/lib/types'

interface StaticPlayerProps {
  currentTrack: Recording | null
  queue: Recording[]
  isPlaying?: boolean
  currentTime?: number
  duration?: number
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${String(secs).padStart(2, '0')}`
}

export function StaticPlayer({
  currentTrack,
  queue,
  isPlaying = false,
  currentTime = 0,
  duration = 0,
}: StaticPlayerProps) {
  if (!currentTrack) {
    return null
  }

  const currentSongIndex = queue.findIndex(
    (track) => track.title === currentTrack.title,
  )
  const songCount = queue.length
  const isOnLastTrack =
    currentSongIndex >= 0 && currentSongIndex === songCount - 1 && songCount > 1

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col overflow-hidden">
      <div
        className="static-player bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-t border-gray-700 shadow-2xl"
        role="region"
        aria-label="Audio player"
        aria-disabled="true"
      >
        <div className="max-w-7xl mx-auto px-3 py-2 md:px-4 md:py-3">
          <div className="flex items-center gap-2 md:gap-4 overflow-x-hidden">
            {/* Track Info */}
            <div className="flex flex-col min-w-0 md:w-auto">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-8 h-8 md:w-12 md:h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center shrink-0">
                  <Music
                    className="w-4 h-4 md:w-6 md:h-6 text-white"
                    aria-hidden="true"
                  />
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-white truncate">
                    {currentTrack.title}
                  </h4>
                  <p className="text-xs md:text-sm text-gray-400 truncate">
                    {currentTrack.album || 'Single'}
                  </p>
                </div>
              </div>

              {/* Seek Bar - inline on mobile */}
              <div className="flex items-center gap-1 md:gap-2 mt-1.5 w-full">
                <span className="text-[10px] md:text-xs text-gray-400 w-8 md:w-10 text-right shrink-0">
                  {formatTime(currentTime)}
                </span>
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  value={currentTime}
                  className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-default accent-amber-500"
                  aria-label="Seek"
                  aria-valuenow={currentTime}
                  aria-valuemin={0}
                  aria-valuemax={duration}
                  disabled
                />
                <span className="text-[10px] md:text-xs text-gray-400 w-8 md:w-10 shrink-0">
                  {formatTime(duration)}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-2 md:gap-4 mx-auto flex-1 shrink-0">
              <button
                className="p-1.5 md:p-2 hover:bg-gray-700 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 shrink-0"
                aria-label="Previous track"
                aria-disabled="true"
              >
                <SkipBack
                  className="w-4 h-4 md:w-5 md:h-5 text-gray-300"
                  aria-hidden="true"
                />
              </button>

              <button
                className="p-2 md:p-3 bg-white rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 shrink-0"
                aria-label={isPlaying ? 'Paused' : 'Ready to play'}
                aria-disabled="true"
              >
                {isPlaying ? (
                  <Pause
                    className="w-5 h-5 md:w-6 md:h-6 text-gray-900"
                    aria-hidden="true"
                  />
                ) : (
                  <Play
                    className="w-5 h-5 md:w-6 md:h-6 text-gray-900"
                    aria-hidden="true"
                  />
                )}
              </button>

              <button
                className="p-1.5 md:p-2 hover:bg-gray-700 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 shrink-0"
                aria-label={
                  isOnLastTrack ? 'Loop back to first track' : 'Next track'
                }
                aria-disabled="true"
              >
                <SkipForward
                  className="w-4 h-4 md:w-5 md:h-5 text-gray-300"
                  aria-hidden="true"
                />
              </button>
            </div>

            {/* Volume & Queue - volume hidden on mobile */}
            <div className="flex items-center gap-1 md:gap-2 md:w-auto justify-end flex-1 md:flex-initial">
              {/* Volume - hidden on mobile, visible on md+ */}
              <div
                className="hidden md:flex items-center gap-2"
                aria-hidden="true"
              >
                <Volume2 className="w-5 h-5 text-gray-400" />
                <div className="w-20 h-1 bg-gray-600 rounded-lg" />
              </div>

              {/* Queue Button */}
              <button
                className="p-1.5 md:p-2 hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
                aria-label="Toggle queue"
                aria-disabled="true"
              >
                <ListMusic
                  className="w-4 h-4 md:w-5 md:h-5 text-gray-300"
                  aria-hidden="true"
                />
              </button>

              {/* Minimize Button */}
              <button
                className="p-1.5 md:p-2 hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
                aria-label="Open queue"
                aria-disabled="true"
              >
                <Minimize2
                  className="w-4 h-4 md:w-5 md:h-5 text-gray-300"
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
