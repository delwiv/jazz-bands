import { type LoaderFunctionArgs, useLoaderData } from 'react-router'
import { motion } from 'framer-motion'
import { FormattedMessage } from 'react-intl'
import { BandStructuredData } from '~/components/StructuredData'
import { Layout } from '~/components/shared/Layout'
import { SectionWrapper } from '~/components/shared/SectionWrapper'
import { GlassCard } from '~/components/shared/GlassCard'
import { useReducedMotion } from '~/hooks/useReducedMotion'
import {
  staggerContainerVariants,
  galleryItemVariants,
} from '~/lib/animationVariants'
import { GalleryLoaderData } from '~/lib/routes.types'
import { getBandBySlug } from '~/lib/queries'
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

  // Extract baseUrl as JSON-serializable string
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
  return buildBandMeta(loaderData.band, loaderData.baseUrl, 'gallery')
}

export default function GalleryPage() {
  const { band, baseUrl } = useLoaderData<GalleryLoaderData>()
  const reducedMotion = useReducedMotion()
  
  // Get gallery images from band's contentImages
  const galleryImages = band.contentImages?.filter(
    (img) => img.url && img.url.length > 0
  ) || []

  return (
    <>
      <BandStructuredData band={band as any} baseUrl={baseUrl} />
      <Layout band={band}>
        <SectionWrapper
          title={
            <span>
              <FormattedMessage id="gallery.ourGallery" />
            </span>
          }
          className="py-8"
        >
          <div className="container-max">
            {galleryImages.length > 0 ? (
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                variants={staggerContainerVariants}
                initial="hidden"
                animate="visible"
              >
                {galleryImages.map((image, index) => (
                  <GlassCard
                    key={image._key || index}
                    className="rounded-xl overflow-hidden"
                  >
                    <motion.div
                      className="relative w-full aspect-square overflow-hidden"
                      variants={galleryItemVariants}
                      whileHover={!reducedMotion ? { scale: 1.02 } : undefined}
                      transition={{ duration: 0.3 }}
                    >
                      <motion.img
                        src={image.url}
                        alt={image.metadata?.caption || `${band.name} gallery image ${index + 1}`}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                        initial={!reducedMotion ? { opacity: 0 } : undefined}
                        animate={!reducedMotion ? { opacity: 1 } : undefined}
                        transition={{ duration: 0.4 }}
                      />
                      <motion.div
                        className="absolute inset-0 bg-slate-900/0 flex items-center justify-center"
                        initial={!reducedMotion ? { opacity: 0 } : undefined}
                        whileHover={!reducedMotion ? { opacity: 1 } : undefined}
                        transition={{ duration: 0.3 }}
                      >
                        <motion.div
                          className="glass-card px-4 py-2 rounded-lg border border-white/20"
                          initial={!reducedMotion ? { scale: 0.8, opacity: 0 } : undefined}
                          whileHover={!reducedMotion ? { scale: 1, opacity: 1 } : undefined}
                          transition={{ delay: 0.1, duration: 0.2 }}
                        >
                          <span className="text-white text-sm font-medium">
                            <FormattedMessage id="gallery.viewFullSize" />
                          </span>
                        </motion.div>
                      </motion.div>
                    </motion.div>
                    {image.metadata?.caption && (
                      <motion.div
                        className="p-3"
                        initial={!reducedMotion ? { opacity: 0, y: 10 } : undefined}
                        animate={!reducedMotion ? { opacity: 1, y: 0 } : undefined}
                        transition={{ delay: 0.2, duration: 0.3 }}
                      >
                        <p className="text-gray-300 text-sm text-center">
                          {image.metadata.caption}
                        </p>
                      </motion.div>
                    )}
                  </GlassCard>
                ))}
              </motion.div>
            ) : (
              <motion.div
                className="glass-card rounded-2xl p-12 text-center"
                initial={!reducedMotion ? { opacity: 0, y: 20 } : undefined}
                animate={!reducedMotion ? { opacity: 1, y: 0 } : undefined}
                transition={{ duration: 0.5 }}
              >
                <div className="text-gray-400 text-lg mb-4">
                  <FormattedMessage id="gallery.noImages" />
                </div>
                <p className="text-gray-500 text-sm">
                  <FormattedMessage id="gallery.comingSoon" />
                </p>
              </motion.div>
            )}
          </div>
        </SectionWrapper>
      </Layout>
    </>
  )
}
