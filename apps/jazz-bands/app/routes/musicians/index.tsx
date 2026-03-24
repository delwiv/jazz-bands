import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { type LoaderFunctionArgs, Link, useLoaderData } from 'react-router'
import { BandStructuredData } from '~/components/StructuredData'
import { Layout } from '~/components/shared/Layout'
import { useReducedMotion } from '~/hooks/useReducedMotion'
import { itemVariants, staggerContainerVariants } from '~/lib/animationVariants'
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
  const { band, musicians, baseUrl } = useLoaderData() as any
  const [expandedMusician, setExpandedMusician] = useState<string | null>(null)
  const _reducedMotion = useReducedMotion()

  return (
    <>
      <BandStructuredData band={band} baseUrl={baseUrl} />
      <Layout band={band}>
        <div className="py-16 px-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <motion.h1
              className="text-4xl font-bold text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Our Musicians
            </motion.h1>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              variants={staggerContainerVariants}
              initial="hidden"
              animate="visible"
            >
              {musicians.map((musician) => (
                <motion.div
                  key={musician._id}
                  variants={itemVariants}
                  className="bg-white rounded-lg shadow-lg overflow-hidden"
                  whileHover={{
                    y: -8,
                    boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.2)',
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {musician.photo && (
                    <motion.img
                      src={musician.photo}
                      alt={musician.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-64 object-cover"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.4 }}
                    />
                  )}

                  <div className="p-6">
                    <h2 className="text-2xl font-bold mb-2">
                      <Link
                        to={`/musicians/${musician.slug}`}
                        className="hover:text-amber-600 transition-colors"
                      >
                        {musician.name}
                      </Link>
                    </h2>
                    {musician.instrument && (
                      <p className="text-blue-600 font-semibold mb-4">
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
                      className="text-blue-600 hover:underline"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {expandedMusician === musician._id
                        ? 'Show Less'
                        : 'Read Bio'}
                    </motion.button>

                    <AnimatePresence>
                      {expandedMusician === musician._id && musician.bio && (
                        <motion.div
                          className="mt-4 prose max-w-none"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          {musician.bio.map((block, idx) => (
                            <p key={idx}>{block.children?.[0]?.text}</p>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {musician.galleryImages &&
                      musician.galleryImages.length > 0 &&
                      musician.galleryImages.some((img) => img.image).length >
                        0 && (
                        <motion.div
                          className="mt-4 grid grid-cols-3 gap-2"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          {musician.galleryImages
                            .slice(0, 3)
                            .filter((img) => img.image)
                            .map((img, idx) => (
                              <motion.img
                                key={idx}
                                src={img.image}
                                alt={
                                  img.caption ||
                                  `${musician.name} photo ${idx + 1}`
                                }
                                loading="lazy"
                                decoding="async"
                                className="w-full h-20 object-cover rounded"
                                whileHover={{ scale: 1.1, rotate: 2 }}
                                transition={{ duration: 0.2 }}
                              />
                            ))}
                        </motion.div>
                      )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </Layout>
    </>
  )
}
