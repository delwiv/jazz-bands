import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { type LoaderFunctionArgs, Link, useLoaderData } from 'react-router'
import { BandStructuredData } from '~/components/StructuredData'
import { Layout } from '~/components/shared/Layout'
import { GlassCard } from '~/components/shared/GlassCard'
import { useReducedMotion } from '~/hooks/useReducedMotion'
import { itemVariants, staggerContainerVariants } from '~/lib/animationVariants'
import { MusiciansLoaderData } from '~/lib/routes.types'
import { getBandBySlug, getMusiciansByBandId } from '~/lib/queries'
import { sanityClient } from '~/lib/sanity.settings'
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

  const musicians = await sanityClient.fetch(getMusiciansByBandId, {
    bandId: band._id,
  })

  // Extract baseUrl as serializable string (Request object not JSON-serializable)
  const url = new URL(request.url)
  const baseUrl = `${url.protocol}//${url.host}`

  return { band, musicians, baseUrl }
}

export function meta({
  loaderData,
}: {
  loaderData: Awaited<ReturnType<typeof loader>> | null
}) {
  if (!loaderData?.band) return []
  return buildBandMeta(loaderData.band, loaderData.baseUrl, 'musicians')
}

export default function MusiciansPage() {
  const { band, musicians, baseUrl } = useLoaderData<MusiciansLoaderData>()
  const [expandedMusician, setExpandedMusician] = useState<string | null>(null)
  const reducedMotion = useReducedMotion()

  return (
    <>
      <BandStructuredData band={band} baseUrl={baseUrl} />
      <Layout band={band}>
        <div className="py-16 px-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <div className="container-max">
            <h1 className="text-4xl font-bold text-center mb-12 text-white">
              Our Musicians
            </h1>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              variants={staggerContainerVariants}
              initial="hidden"
              animate="visible"
            >
              {musicians.map((musician) => (
                <GlassCard
                  key={musician._id}
                  className="rounded-xl overflow-hidden"
                >
                  {musician.photo && (
                    <motion.div
                      className="relative w-full h-64 overflow-hidden"
                      whileHover={!reducedMotion ? { scale: 1.02 } : undefined}
                      transition={{ duration: 0.4 }}
                    >
                      <motion.img
                        src={musician.photo}
                        alt={musician.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                      <motion.div
                        className="absolute inset-0 bg-slate-900/70 flex items-center justify-center"
                        initial={!reducedMotion ? { opacity: 0 } : undefined}
                        whileHover={!reducedMotion ? { opacity: 1 } : undefined}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="bg-white/[0.1] backdrop-blur-md border border-white/[0.2] px-4 py-2 rounded-lg">
                          <span className="text-white text-sm font-medium">View Profile</span>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}

                  <div className="p-6">
                    <h2 className="text-2xl font-bold mb-2 text-white">
                      <Link
                        to={`/musicians/${musician.slug}`}
                        className="focus-ring hover:text-amber-400 transition-colors"
                      >
                        {musician.name}
                      </Link>
                    </h2>
                    {musician.instrument && (
                      <p className="text-gray-300 font-semibold mb-4">
                        {musician.instrument}
                      </p>
                    )}

                    <motion.button
                      onClick={() =>
                        setExpandedMusician(
                          expandedMusician === musician._id
                            ? null
                            : musician._id,
                        )
                      }
                      className="focus-ring text-amber-400 hover:text-amber-300 hover:underline transition-colors"
                      whileHover={!reducedMotion ? { scale: 1.05 } : undefined}
                      whileTap={!reducedMotion ? { scale: 0.95 } : undefined}
                    >
                      {expandedMusician === musician._id
                        ? 'Show Less'
                        : 'Read Bio'}
                    </motion.button>

                    {!reducedMotion && (
                      <AnimatePresence>
                        {expandedMusician === musician._id && musician.bio && (
                          <motion.div
                            className="mt-4 prose max-w-none bg-white/[0.04] backdrop-blur-sm border border-white/[0.05] rounded-lg p-4"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <p className="text-gray-300">
                              {musician.bio.map((block) => block.children?.[0]?.text).join(' ')}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}
                    {reducedMotion && expandedMusician === musician._id && musician.bio && (
                      <div className="mt-4 prose max-w-none bg-white/[0.04] backdrop-blur-sm border border-white/[0.05] rounded-lg p-4">
                        <p className="text-gray-300">
                          {musician.bio.map((block) => block.children?.[0]?.text).join(' ')}
                        </p>
                      </div>
                    )}

                    {musician.galleryImages &&
                      musician.galleryImages.length > 0 &&
                      musician.galleryImages.some((img) => img.image).length >
                      0 && (
                        <motion.div
                          className="mt-4 grid grid-cols-3 gap-2"
                          initial={!reducedMotion ? { opacity: 0 } : undefined}
                          animate={!reducedMotion ? { opacity: 1 } : undefined}
                          transition={{ delay: 0.2 }}
                        >
                          {musician.galleryImages
                            .slice(0, 3)
                            .filter((img) => img.image)
                            .map((img, idx) => (
                              <motion.div
                                key={idx}
                                className="relative w-full h-20 rounded-lg overflow-hidden"
                                whileHover={!reducedMotion ? { scale: 1.05, zIndex: 1 } : undefined}
                                transition={{ duration: 0.2 }}
                              >
                                <img
                                  src={img.image}
                                  alt={img.caption || `${musician.name} photo ${idx + 1}`}
                                  loading="lazy"
                                  decoding="async"
                                  className="w-full h-full object-cover"
                                />
                                <motion.div
                                  className="absolute inset-0 bg-slate-900/70 flex items-center justify-center"
                                  initial={!reducedMotion ? { opacity: 0 } : undefined}
                                  whileHover={!reducedMotion ? { opacity: 1 } : undefined}
                                  transition={{ duration: 0.2 }}
                                >
                                  <div className="bg-white/[0.1] backdrop-blur-md border border-white/[0.2] px-2 py-1 rounded">
                                    <span className="text-white text-xs">+</span>
                                  </div>
                                </motion.div>
                              </motion.div>
                            ))}
                        </motion.div>
                      )}
                  </div>
                 </GlassCard>
               ))}
             </motion.div>
          </div>
        </div>
      </Layout>
    </>
  )
}
