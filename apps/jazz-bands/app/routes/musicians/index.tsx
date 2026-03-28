import { motion } from 'framer-motion'
import { type LoaderFunctionArgs, Link, useLoaderData } from 'react-router'
import { FormattedMessage } from 'react-intl'
import { BandStructuredData } from '~/components/StructuredData'
import { Layout } from '~/components/shared/Layout'
import { SectionWrapper } from '~/components/shared/SectionWrapper'
import { GlassCard } from '~/components/shared/GlassCard'
import { useReducedMotion } from '~/hooks/useReducedMotion'
import { staggerContainerVariants } from '~/lib/animationVariants'
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
  return buildBandMeta(loaderData.band, loaderData.baseUrl, 'musicians' )
}

export default function MusiciansPage() {
   const { band, musicians, baseUrl } = useLoaderData<MusiciansLoaderData>()
   const reducedMotion = useReducedMotion()

  return (
    <>
      <BandStructuredData band={band} baseUrl={baseUrl} />
      <Layout band={band}>
        <SectionWrapper title={<FormattedMessage id="musicians.ourMusicians" />} className="py-8">
          <div className="container-max">

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
                        className="w-full h-64 overflow-hidden"
                        whileHover={!reducedMotion ? { scale: 1.02 } : undefined}
                        transition={{ duration: 0.4 }}
                      >
                        <img
                          src={musician.photo}
                          alt={musician.name}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                        />
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

                    </div>
                  </GlassCard>
                ))}
</motion.div>
            </div>
          </SectionWrapper>
        </Layout>
      </>
    )
}
