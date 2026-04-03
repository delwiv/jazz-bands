import { motion } from 'framer-motion'
import { FormattedMessage } from 'react-intl'
import { Link, type LoaderFunctionArgs, useLoaderData } from 'react-router'
import { BandStructuredData } from '~/components/StructuredData'
import { GlassCard } from '~/components/shared/GlassCard'
import { SectionWrapper } from '~/components/shared/SectionWrapper'
import { useReducedMotion } from '~/hooks/useReducedMotion'
import { staggerContainerVariants } from '~/lib/animationVariants'
import { getBandBySlug, getMusiciansByBandId } from '~/lib/queries'
import type { MusiciansLoaderData } from '~/lib/routes.types'
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

  const musicians = await sanityClient.fetch(getMusiciansByBandId, {
    bandId: band._id,
  })

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
  const reducedMotion = useReducedMotion()

  return (
    <>
      <BandStructuredData band={band} baseUrl={baseUrl} />
      <SectionWrapper title={<FormattedMessage id="musicians.ourMusicians" />}>
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={staggerContainerVariants}
          initial="hidden"
          animate="visible"
        >
          {musicians.map((musician) => (
            <Link
              key={musician._id}
              to={`/musicians/${musician.slug}`}
              className="block cursor-pointer"
              style={{ textDecoration: 'none' }}
            >
              <GlassCard className="rounded-xl overflow-hidden">
                {musician.photo && (
                  <motion.div
                    className="w-full h-64 overflow-hidden"
                    whileHover={!reducedMotion ? { scale: 1.02 } : undefined}
                    transition={{ duration: 0.4 }}
                  >
                    <img
                      src={urlForImage
                        .image(musician.photo)
                        .width(800)
                        .height(800)
                        .fit('crop')
                        .url()}
                      alt={musician.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                )}

                <div className="p-6">
                  <h2 className="text-2xl font-bold mb-2 text-white">
                    {musician.name}
                  </h2>
                  {musician.instrument && (
                    <p className="text-gray-300 font-semibold">
                      {musician.instrument}
                    </p>
                  )}
                </div>
              </GlassCard>
            </Link>
          ))}
        </motion.div>
      </SectionWrapper>
    </>
  )
}
