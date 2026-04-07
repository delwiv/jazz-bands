import { motion } from 'framer-motion'
import { FormattedMessage } from 'react-intl'
import { type LoaderFunctionArgs, useLoaderData } from 'react-router'
import { ThumbnailGrid } from '~/components/Gallery/ThumbnailGrid'
import { BandStructuredData } from '~/components/StructuredData'
import { GlassCard } from '~/components/shared/GlassCard'
import { MainContainer } from '~/components/shared/MainContainer'
import { useImageGallery } from '~/contexts/ImageGalleryContext'
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
  const { open } = useImageGallery()

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
