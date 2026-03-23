import { motion } from 'framer-motion'
import { type LoaderFunctionArgs, useLoaderData } from 'react-router'
import { StickyPlayer } from '~/components/audio/StickyPlayer'
import {
  AlbumStructuredData,
  BandStructuredData,
  TrackStructuredData,
} from '~/components/StructuredData'
import { Layout } from '~/components/shared/Layout'
import { PageTransition } from '~/components/shared/PageTransition'
import { AudioProvider, useAudio } from '~/contexts/AudioContext'
import { useReducedMotion } from '~/hooks/useReducedMotion'
import { getAudioCdnUrl } from '~/lib/audio'
import { itemVariants, staggerContainerVariants } from '~/lib/animationVariants'
import { getBandBySlug } from '~/lib/queries'
import { sanityClient } from '~/lib/sanity.settings'
import type { Recording } from '~/lib/types'
import { buildBandMeta } from '~/utils/seo'

export async function loader({ request }: LoaderFunctionArgs) {
  const bandSlug = process.env.BAND_SLUG

  if (!bandSlug) {
    throw new Error('BAND_SLUG environment variable is required')
  }

  const band = await sanityClient.fetch(getBandBySlug, { slug: bandSlug })

  if (!band) {
    throw new Response('Band not found', { status: 404 })
  }

  // Extract baseUrl as serializable string (Request object not JSON-serializable)
  const url = new URL(request.url)
  const baseUrl = `${url.protocol}//${url.host}`

  return { band, baseUrl }
}

export function meta({
  loaderData,
}: {
  loaderData: Awaited<ReturnType<typeof loader>> | null
}) {
  if (!loaderData?.band) return []
  return buildBandMeta(loaderData.band, loaderData.baseUrl, 'music')
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${String(secs).padStart(2, '0')}`
}

function hasAudio(recording: Recording): boolean {
  return recording.audio?.asset?._ref != null
}

function getAudioUrl(recording: Recording): string | undefined {
  const audioRef = recording.audio?.asset?._ref
  if (!audioRef) return undefined
  return getAudioCdnUrl(audioRef)
}

function MusicContent() {
  const { band, baseUrl } = useLoaderData() as {
    band: any
    baseUrl: string
  }
  const { currentTrack, playTrack, addToQueue } = useAudio()
  const _reducedMotion = useReducedMotion()

  const recordings = (band.recordings || []) as Recording[]
  const primaryColor = band.branding?.primaryColor || '#2563eb'

  return (
    <>
      <BandStructuredData band={band} baseUrl={baseUrl} />
      {recordings.map((recording, idx) => (
        <AlbumStructuredData
          key={idx}
          album={recording}
          band={band}
          baseUrl={baseUrl}
        />
      ))}
      {recordings.map((recording, idx) => (
        <TrackStructuredData
          key={`track-${idx}`}
          track={{
            title: recording.title,
            duration: recording.duration
              ? `PT${recording.duration}S`
              : undefined,
            audioUrl: hasAudio(recording) ? getAudioUrl(recording) : undefined,
          }}
          album={recording.album ? { title: recording.album } : undefined}
          band={band}
          baseUrl={baseUrl}
        />
      ))}
      <Layout band={band}>
        <PageTransition>
          <div className="py-16 px-6 bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto">
              <motion.h1
                className="text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                Music
              </motion.h1>

              {recordings.length === 0 ? (
                <p className="text-center text-gray-600 dark:text-gray-400">
                  No recordings available yet.
                </p>
              ) : (
                <motion.div
                  className="space-y-4"
                  variants={staggerContainerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {recordings.map((recording, idx) => {
                    const isPlaying =
                      currentTrack?.title === recording.title &&
                      currentTrack?.album === recording.album
                    const audioRef = recording.audio?.asset?._ref
                    const hasAudio = audioRef != null
                    const audioUrl = hasAudio ? getAudioCdnUrl(audioRef) : null

                    return (
                      <motion.div
                        key={idx}
                        variants={itemVariants}
                        className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all ${
                          isPlaying ? 'ring-2' : 'hover:shadow-lg'
                        }`}
                        style={isPlaying ? { borderColor: primaryColor } : {}}
                        role="article"
                        aria-label={`${recording.title} by ${band.name}`}
                        whileHover={{
                          y: -4,
                          boxShadow: '0 12px 24px -8px rgba(0, 0, 0, 0.15)',
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {recording.title}
                          </h3>
                          {recording.album && (
                            <p className="text-gray-600 dark:text-gray-300">
                              {recording.album}
                            </p>
                          )}
                          {recording.releaseYear && (
                            <p className="text-gray-500 dark:text-gray-400">
                              Released: {recording.releaseYear}
                            </p>
                          )}
                          {recording.description && (
                            <p className="mt-2 text-gray-700 dark:text-gray-200">
                              {recording.description}
                            </p>
                          )}
                          {recording.duration && (
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                              {formatTime(recording.duration)}
                            </p>
                          )}
                        </div>

                        <div className="flex gap-4 w-full md:w-auto items-center flex-wrap">
                          {hasAudio && (
                            <motion.button
                              onClick={() => playTrack(recording)}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                                isPlaying
                                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                                  : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white'
                              }`}
                              aria-label={
                                isPlaying ? 'Now playing' : 'Play track'
                              }
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              {isPlaying ? (
                                <>
                                  <svg
                                    className="w-5 h-5"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path d="M6 4h4v16H6zm8 0h4v16h-4z" />
                                  </svg>
                                  Playing
                                </>
                              ) : (
                                <>
                                  <svg
                                    className="w-5 h-5"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path d="M8 5v14l11-7z" />
                                  </svg>
                                  Play
                                </>
                              )}
                            </motion.button>
                          )}

                          {hasAudio && (
                            <motion.button
                              onClick={() => addToQueue(recording)}
                              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors whitespace-nowrap"
                              aria-label={`Add ${recording.title} to queue`}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
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
                                  d="M12 4v16m8-8H4"
                                />
                              </svg>
                              Queue
                            </motion.button>
                          )}

                          {recording.downloadEnabled && audioUrl && (
                            <motion.a
                              href={audioUrl}
                              download={`${recording.title}.mp3`}
                              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors whitespace-nowrap"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
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
                                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                />
                              </svg>
                              Download
                            </motion.a>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </motion.div>
              )}
            </div>
          </div>
        </PageTransition>
        <StickyPlayer />
      </Layout>
    </>
  )
}

export default function MusicPage() {
  const { band } = useLoaderData() as LoaderData

  return (
    <AudioProvider initialPlaylist={band.recordings || []}>
      <MusicContent />
    </AudioProvider>
  )
}
