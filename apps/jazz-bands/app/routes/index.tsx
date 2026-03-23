import { motion, useScroll, useTransform } from 'framer-motion'
import {
  type LoaderFunctionArgs,
  Link as RouterLink,
  useLoaderData,
  useNavigation,
} from 'react-router'
import { BandStructuredData } from '~/components/StructuredData'
import { Layout } from '~/components/shared/Layout'
import { Skeleton } from '~/components/shared/Skeleton'
import { useReducedMotion } from '~/hooks/useReducedMotion'
import { itemVariants, staggerContainerVariants } from '~/lib/animationVariants'
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
    throw new Response(`Band "${bandSlug}" not found`, { status: 404 })
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

  const meta = buildBandMeta(loaderData.band, loaderData.baseUrl, 'home')

  // Preload hero image for LCP optimization
  if (loaderData.band.heroImage) {
    meta.push({
      rel: 'preload',
      as: 'image',
      href: loaderData.band.heroImage,
      imageSrcSet: loaderData.band.heroImage,
    })
  }

  return meta
}

export default function BandHome() {
  const { band, baseUrl } = useLoaderData() as {
    band: any
    baseUrl: string
  }
  const navigation = useNavigation()
  const isLoading = navigation.state === 'loading'
  const reducedMotion = useReducedMotion()

  // Hero parallax scroll effect
  const { scrollY } = useScroll()
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0])
  const heroScale = useTransform(scrollY, [0, 300], [1, 0.95])
  const bgY = useTransform(scrollY, [0, 300], ['0%', '30%'])

  if (isLoading) {
    return (
      <Layout band={band}>
        {/* Hero Section Skeleton */}
        <section className="relative h-96 flex items-center justify-center bg-gray-200 dark:bg-gray-700">
          <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
            <Skeleton variant="text" className="h-10 w-64 mx-auto mb-4" />
            <Skeleton variant="text" className="mx-auto mb-2" />
            <Skeleton variant="text" className="mx-auto w-3/4" />
          </div>
        </section>

        {/* Musicians Section Skeleton */}
        <section className="py-16 px-6 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-7xl mx-auto">
            <Skeleton variant="text" className="h-8 w-48 mx-auto mb-12" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[0, 1, 2].map((i) => (
                <div key={i} className="text-center">
                  <Skeleton variant="circle" className="mx-auto mb-4" />
                  <Skeleton variant="text" className="h-5 w-32 mx-auto mb-2" />
                  <Skeleton variant="text" className="h-4 w-24 mx-auto" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tour Dates Section Skeleton */}
        <section className="py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <Skeleton variant="text" className="h-8 w-56 mx-auto mb-12" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[0, 1].map((i) => (
                <div key={i} className="border rounded-lg p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-3">
                      <Skeleton variant="text" className="h-6 w-48" />
                      <Skeleton variant="text" className="h-5 w-40" />
                      <Skeleton variant="text" className="h-4 w-32" />
                    </div>
                  </div>
                  <Skeleton variant="text" className="h-9 w-28 mt-4" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </Layout>
    )
  }

  return (
    <>
      <BandStructuredData band={band} baseUrl={baseUrl} />
      <Layout band={band}>
        {/* Hero Section with Parallax */}
        <section
          className="relative flex items-center justify-center overflow-hidden w-full"
          aria-labelledby="hero-title"
          style={{ contain: 'layout', aspectRatio: '16/9' }}
        >
          {band.heroImage ? (
            <motion.div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${band.heroImage})`,
                backgroundPositionY: reducedMotion ? '0%' : bgY,
              }}
              animate={!reducedMotion ? { scale: heroScale } : {}}
              transition={{ type: 'tween', ease: 'linear' }}
            >
              <div className="absolute inset-0 bg-black/50" />
            </motion.div>
          ) : (
            <div
              className="absolute inset-0 bg-gray-200 dark:bg-gray-700"
              aria-hidden="true"
            />
          )}
          <motion.div
            className="relative z-10 text-center text-white px-6"
            style={{ opacity: reducedMotion ? 1 : heroOpacity }}
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <h1 id="hero-title" className="text-5xl font-bold mb-4">
              {band.name}
            </h1>
            <div className="text-xl max-w-2xl mx-auto space-y-4 mb-8">
              {band.description?.map((block, idx) => (
                <p key={block._key || idx}>{block.children?.[0]?.text}</p>
              ))}
            </div>

            {/* Main Content Images Gallery */}
            {band.mainImages && band.mainImages.length > 0 && (
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {band.mainImages.map((img, idx) => (
                  <motion.div
                    key={img._key || idx}
                    className="rounded-lg overflow-hidden shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                  >
                    <img
                      src={img.url}
                      alt={`${band.name} main image ${idx + 1}`}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-64 object-cover"
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        </section>

        <div className="sr-only">
          <p>Hero section with band name: {band.name}</p>
        </div>

        {/* Musicians Section with Stagger Animation */}
        <section
          className="py-16 px-6 bg-gray-50"
          aria-labelledby="musicians-title"
        >
          <div className="max-w-7xl mx-auto">
            <motion.h2
              id="musicians-title"
              className="text-3xl font-bold text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              Our Musicians
            </motion.h2>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
              variants={staggerContainerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
            >
              {band.members?.slice(0, 3).map((musician) => (
                <motion.div
                  key={musician._id}
                  variants={itemVariants}
                  className="text-center group"
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.3 }}
                >
                  {musician.photo && (
                    <img
                      src={musician.photo}
                      alt={musician.name}
                      loading="lazy"
                      decoding="async"
                      className="w-48 h-48 mx-auto rounded-full object-cover mb-4 shadow-lg group-hover:shadow-xl transition-shadow"
                    />
                  )}
                  <h3 className="text-xl font-bold">{musician.name}</h3>
                  {musician.instrument && (
                    <p className="text-gray-600">{musician.instrument}</p>
                  )}
                </motion.div>
              ))}
            </motion.div>

            <div className="text-center mt-8">
              <motion.div
                className="inline-block"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <RouterLink
                  to="/musicians"
                  className="text-blue-600 hover:underline"
                >
                  View All Musicians →
                </RouterLink>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Tour Dates Section with Scroll Animations */}
        <section className="py-16 px-6" aria-labelledby="tour-dates-title">
          <div className="max-w-7xl mx-auto">
            <motion.h2
              id="tour-dates-title"
              className="text-3xl font-bold text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              Upcoming Shows
            </motion.h2>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
              variants={staggerContainerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {band.tourDates?.slice(0, 4).map((date, idx) => (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  className="border rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow"
                  whileHover={{ y: -4 }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-2xl font-bold">
                        {new Date(date.date).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="text-xl font-semibold">{date.venue}</p>
                      <p className="text-gray-600">
                        {date.city}
                        {date.region && `, ${date.region}`}
                      </p>
                    </div>
                    {date.soldOut && (
                      <span className="bg-red-700 text-white px-3 py-1 rounded-full">
                        Sold Out
                      </span>
                    )}
                  </div>
                  {date.ticketsUrl && (
                    <motion.a
                      href={date.ticketsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Get Tickets
                    </motion.a>
                  )}
                </motion.div>
              ))}
            </motion.div>

            {band.tourDates?.length && (
              <div className="text-center mt-8">
                <motion.div
                  className="inline-block"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <RouterLink
                    to="/tour"
                    className="text-blue-600 hover:underline"
                  >
                    View All Shows →
                  </RouterLink>
                </motion.div>
              </div>
            )}
          </div>
        </section>
      </Layout>
    </>
  )
}
