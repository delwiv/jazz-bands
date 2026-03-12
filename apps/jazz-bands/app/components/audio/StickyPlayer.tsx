import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  type SortableContextProps,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useAudio } from "~/contexts/AudioContext";
import type { Recording } from "~/lib/types";

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

interface SortableTrackProps {
  track: Recording;
}

function SortableTrack({ track }: SortableTrackProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: track.title });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="flex items-center justify-between bg-gray-800/50 rounded-lg p-3 cursor-grab active:cursor-grabbing hover:bg-gray-700/50 transition-colors"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          {...listeners}
          className="w-5 h-5 flex items-center justify-center text-gray-500 cursor-grab"
          aria-label="Drag handle"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8h16M4 16h16"
            />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="font-medium text-white truncate">{track.title}</p>
          {track.album && (
            <p className="text-sm text-gray-400 truncate">{track.album}</p>
          )}
        </div>
      </div>
      <span className="text-sm text-gray-500 ml-2 shrink-0">
        {track.duration ? formatTime(track.duration) : "--:--"}
      </span>
    </div>
  );
}

interface QueuePanelProps {
  queue: Recording[];
  isOpen: boolean;
  onClose: () => void;
  onRemove: (trackTitle: string) => void;
  onReorder: (oldIndex: number, newIndex: number) => void;
}

function QueuePanel({
  queue,
  isOpen,
  onClose,
  onRemove,
  onReorder,
}: QueuePanelProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = queue.findIndex((t) => t.title === active.id);
        const newIndex = queue.findIndex((t) => t.title === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          onReorder(oldIndex, newIndex);
        }
      }
    },
    [queue, onReorder]
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 200 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 200 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed bottom-80 left-0 right-0 mx-4 bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden z-4999"
          role="region"
          aria-label="Playback queue"
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">Queue</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">
                {queue.length} {queue.length === 1 ? "track" : "tracks"}
              </span>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Close queue"
              >
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-4 max-h-96 overflow-y-auto">
            {queue.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No tracks in queue. Add tracks to play them next.
              </p>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={queue.map((t) => t.title)}>
                  <div className="space-y-2">
                    {queue.map((track) => (
                      <div key={track.title} className="relative">
                        <SortableTrack track={track} />
                        <button
                          onClick={() => onRemove(track.title)}
                          className="absolute -right-2 -top-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors shadow-lg"
                          aria-label={`Remove ${track.title} from queue`}
                        >
                          <svg
                            className="w-4 h-4 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function StickyPlayer() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    queue,
    togglePlay,
    next,
    prev,
    seek,
    setVolume: setVolumeHandler,
    removeFromQueue,
    reorderQueue,
    clearQueue,
  } = useAudio();

  const [isQueueOpen, setIsQueueOpen] = useState(false);

  const handleSeek = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      seek(Number(e.target.value));
    },
    [seek]
  );

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setVolumeHandler(Number(e.target.value));
    },
    [setVolumeHandler]
  );

  if (!currentTrack) {
    return null;
  }

  return (
    <>
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-t border-gray-700 shadow-2xl z-50"
        role="region"
        aria-label="Audio player"
      >
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex-1 min-w-0 w-full">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center shrink-0">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                    />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-white truncate">
                    {currentTrack.title}
                  </h4>
                  <p className="text-sm text-gray-400 truncate">
                    {currentTrack.album || "Single"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2 flex-1 w-full">
               <div className="flex items-center gap-4">
                 <motion.button
                   onClick={prev}
                   className="p-2 hover:bg-gray-700 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
                   aria-label="Previous track"
                   whileHover={{ scale: 1.1 }}
                   whileTap={{ scale: 0.9 }}
                 >
                   <svg
                     className="w-5 h-5 text-gray-300"
                     fill="currentColor"
                     viewBox="0 0 24 24"
                   >
                     <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                   </svg>
                 </motion.button>

                 <motion.button
                   onClick={togglePlay}
                   className="p-3 bg-white hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
                   aria-label={isPlaying ? "Pause" : "Play"}
                   whileHover={{ scale: 1.1 }}
                   whileTap={{ scale: 0.9 }}
                 >
                   {isPlaying ? (
                     <svg
                       className="w-6 h-6 text-gray-900"
                       fill="currentColor"
                       viewBox="0 0 24 24"
                     >
                       <path d="M6 4h4v16H6zm8 0h4v16h-4z" />
                     </svg>
                   ) : (
                     <svg
                       className="w-6 h-6 text-gray-900 ml-1"
                       fill="currentColor"
                       viewBox="0 0 24 24"
                     >
                       <path d="M8 5v14l11-7z" />
                     </svg>
                   )}
                 </motion.button>

                 <motion.button
                   onClick={next}
                   className="p-2 hover:bg-gray-700 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
                   aria-label="Next track"
                   whileHover={{ scale: 1.1 }}
                   whileTap={{ scale: 0.9 }}
                 >
                   <svg
                     className="w-5 h-5 text-gray-300"
                     fill="currentColor"
                     viewBox="0 0 24 24"
                   >
                     <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                   </svg>
                 </motion.button>
               </div>

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

            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                  />
                </svg>
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

              <button
                onClick={() => setIsQueueOpen(!isQueueOpen)}
                className={`p-2 rounded-lg transition-colors ${
                  isQueueOpen
                    ? "bg-amber-500 text-white"
                    : "hover:bg-gray-700 text-gray-300"
                }`}
                aria-label="Toggle queue"
                aria-expanded={isQueueOpen}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 10h16M4 14h16M4 18h16"
                  />
                </svg>
              </button>

              {queue.length > 0 && (
                <button
                  onClick={clearQueue}
                  className="p-2 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-colors"
                  aria-label="Clear queue"
                  title="Clear queue"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <QueuePanel
        queue={queue}
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
        onRemove={removeFromQueue}
        onReorder={reorderQueue}
      />
    </>
  );
}
