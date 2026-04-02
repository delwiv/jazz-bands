import { motion } from 'framer-motion'
import { useState } from 'react'
import { FormattedMessage } from 'react-intl'
import { type LoaderFunctionArgs, useLoaderData } from 'react-router'
import { BandStructuredData } from '~/components/StructuredData'
import { GlassCard } from '~/components/shared/GlassCard'
import { ImageModal } from '~/components/shared/ImageModal'
import { SectionWrapper } from '~/components/shared/SectionWrapper'
import { TwoColumnLayout } from '~/components/shared/TwoColumnLayout'
import { useReducedMotion } from '~/hooks/useReducedMotion'
import {
  galleryItemVariants,
  staggerContainerVariants,
} from '~/lib/animationVariants'
import { getBandBySlug } from '~/lib/queries'
import type { GalleryLoaderData } from '~/lib/routes.types'
import { sanityClient, urlForImage } from '~/lib/sanity.settings'
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

  // Transform band images to GalleryImage format for SSR
  const galleryImages =
    band.images
      ?.filter((img: (typeof band.images)[number]) => img.asset)
      .map((img: (typeof band.images)[number], idx: number) => ({
        src: img.asset
          ? urlForImage
              .image(img.asset)
              .width(3840)
              .height(3840)
              .fit('max')
              .url()
          : '',
        alt: img.metadata?.caption || `${band.name} gallery image ${idx + 1}`,
      })) || []

  return { band, baseUrl, galleryImages }
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
  const { band, baseUrl, galleryImages } = useLoaderData<GalleryLoaderData>()
  const reducedMotion = useReducedMotion()
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  const openModal = (index: number) => {
    setSelectedImageIndex(index)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
  }

  return (
    <>
      <BandStructuredData band={band as any} baseUrl={baseUrl} />
      <TwoColumnLayout
        band={band}
        images={galleryImages}
        initialTrack={band.recordings?.[0] || null}
        initialQueue={band.recordings || []}
      >
        <SectionWrapper
          title={
            <span>
              <FormattedMessage id="gallery.ourGallery" />
            </span>
          }
          className="py-8"
        >
          <div className="container-max">
            {band.images?.length ? (
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                variants={staggerContainerVariants}
                initial="hidden"
                animate="visible"
              >
                {band.images.map((image, index) => (
                  <GlassCard
                    key={image._key || index}
                    className="rounded-xl overflow-hidden"
                    hover={false}
                  >
                    <motion.button
                      onClick={() => openModal(index)}
                      className="w-full text-left focus-ring"
                      variants={galleryItemVariants}
                      whileHover={!reducedMotion ? { scale: 1.02 } : undefined}
                      transition={{ duration: 0.3 }}
                      aria-label={`View ${image.metadata?.caption || `${band.name} gallery image ${index + 1}`} in full size`}
                    >
                      <div className="relative w-full aspect-square overflow-hidden">
                        <motion.img
                          src={
                            image.asset
                              ? urlForImage
                                  .image(image.asset)
                                  .width(400)
                                  .height(400)
                                  .fit('crop')
                                  .url()
                              : ''
                          }
                          alt={
                            image.metadata?.caption ||
                            `${band.name} gallery image ${index + 1}`
                          }
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
                          whileHover={
                            !reducedMotion ? { opacity: 1 } : undefined
                          }
                          transition={{ duration: 0.3 }}
                        >
                          <motion.div
                            className="glass-card px-4 py-2 rounded-lg border border-white/20"
                            initial={
                              !reducedMotion
                                ? { scale: 0.8, opacity: 0 }
                                : undefined
                            }
                            whileHover={
                              !reducedMotion
                                ? { scale: 1, opacity: 1 }
                                : undefined
                            }
                            transition={{ delay: 0.1, duration: 0.2 }}
                          >
                            <span className="text-white text-sm font-medium">
                              <FormattedMessage id="gallery.viewFullSize" />
                            </span>
                          </motion.div>
                        </motion.div>
                      </div>
                    </motion.button>
                    {image.metadata?.caption && (
                      <motion.div
                        className="p-3"
                        initial={
                          !reducedMotion ? { opacity: 0, y: 10 } : undefined
                        }
                        animate={
                          !reducedMotion ? { opacity: 1, y: 0 } : undefined
                        }
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

        <ImageModal
          isOpen={modalOpen}
          onClose={closeModal}
          images={galleryImages}
          initialIndex={selectedImageIndex}
        />
      </TwoColumnLayout>
    </>
  )
}
