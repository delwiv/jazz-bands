import { motion } from 'framer-motion'
import { FormattedMessage } from 'react-intl'
import { type LoaderFunctionArgs, useLoaderData } from 'react-router'
import { ThumbnailGrid } from '~/components/Gallery/ThumbnailGrid'
import { BandStructuredData } from '~/components/StructuredData'
import { GlassCard } from '~/components/shared/GlassCard'
import { MainContainer } from '~/components/shared/MainContainer'
import { getGalleryUrl } from '~/lib/images'
import { useImageGallery } from '~/contexts/ImageGalleryContext'
import { useReducedMotion } from '~/hooks/useReducedMotion'
import {
  galleryItemVariants,
  staggerContainerVariants,
} from '~/lib/animationVariants'
import type { GalleryLoaderData } from '~/lib/routes.types'
import { buildBandMeta } from '~/utils/seo'
import { loadBand } from '~/lib/loaders'

export async function loader({ request }: LoaderFunctionArgs) {
  return loadBand(request)
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
  const { open } = useImageGallery()

  const galleryImages =
    band.images
      ?.filter((img: (typeof band.images)[number]) => img.asset)
      .map((img: (typeof band.images)[number], idx: number) => ({
        src: img.asset ? getGalleryUrl(img.asset) : '',
        alt: img.metadata?.caption || `${band.name} gallery image ${idx + 1}`,
      })) || []

  return (
    <>
      <BandStructuredData band={band as any} baseUrl={baseUrl} />
      <MainContainer
        variant="glass"
        title={
          <span>
            <FormattedMessage id="gallery.ourGallery" />
          </span>
        }
      >
        {band.images?.length ? (
          <ThumbnailGrid images={galleryImages} onClick={open} />
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
      </MainContainer>
    </>
  )
}
