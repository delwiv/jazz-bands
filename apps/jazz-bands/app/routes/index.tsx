import { motion, useScroll, useTransform } from 'framer-motion'
import {
  type LoaderFunctionArgs,
  useLoaderData,
  useNavigation,
} from 'react-router'
import { FormattedMessage } from 'react-intl'
import { PortableText } from '@portabletext/react'
import { BandStructuredData } from '~/components/StructuredData'
import { Layout } from '~/components/shared/Layout'
import { Skeleton } from '~/components/shared/Skeleton'
import { Badge } from '~/components/shared/Badge'
import { GlassCard } from '~/components/shared/GlassCard'
import { PrimaryButton } from '~/components/shared/PrimaryButton'
import { SectionWrapper } from '~/components/shared/SectionWrapper'
import { useReducedMotion } from '~/hooks/useReducedMotion'
import {
  itemVariants,
  staggerContainerVariants,
  cardHoverVariants,
} from '~/lib/animationVariants'
import { BandHomeLoaderData } from '~/lib/routes.types'
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
  const { band, baseUrl } = useLoaderData<BandHomeLoaderData>()
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
        <section className="relative h-96 flex items-center justify-center bg-slate-900">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950" />
          <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
            <Skeleton
              variant="text"
              className="h-10 w-64 mx-auto mb-4 bg-slate-800/50"
            />
            <Skeleton variant="text" className="mx-auto mb-2 bg-slate-800/50" />
            <Skeleton
              variant="text"
              className="mx-auto w-3/4 bg-slate-800/50"
            />
          </div>
        </section>

        {/* Musicians Section Skeleton */}
        <section className="py-16 px-6 bg-slate-950">
          <div className="container-max">
            <Skeleton
              variant="text"
              className="h-8 w-48 mx-auto mb-12 bg-slate-800/50"
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[0, 1, 2].map((i) => (
                <div key={i} className="text-center">
                  <Skeleton
                    variant="circle"
                    className="mx-auto mb-4 bg-slate-800/50"
                  />
                  <Skeleton
                    variant="text"
                    className="h-5 w-32 mx-auto mb-2 bg-slate-800/50"
                  />
                  <Skeleton
                    variant="text"
                    className="h-4 w-24 mx-auto bg-slate-800/50"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tour Dates Section Skeleton */}
        <section className="py-16 px-6 bg-slate-950">
          <div className="container-max">
            <Skeleton
              variant="text"
              className="h-8 w-56 mx-auto mb-12 bg-slate-800/50"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="rounded-xl p-6 backdrop-blur-xl border border-white/[0.1] bg-white/[0.06]"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-3">
                      <Skeleton
                        variant="text"
                        className="h-6 w-48 bg-slate-800/50"
                      />
                      <Skeleton
                        variant="text"
                        className="h-5 w-40 bg-slate-800/50"
                      />
                      <Skeleton
                        variant="text"
                        className="h-4 w-32 bg-slate-800/50"
                      />
                    </div>
                  </div>
                  <Skeleton
                    variant="text"
                    className="h-9 w-28 mt-4 bg-slate-800/50"
                  />
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
         {/* Hero Section */}
        <section
          className="relative flex items-center justify-center overflow-hidden w-full"
          aria-labelledby="hero-title"
          style={{ contain: 'layout', aspectRatio: '16/9' }}
        >
          <div
            className="relative z-10 text-center text-white px-3"
            style={{ opacity: reducedMotion ? 1 : heroOpacity }}
          >
            <h1
              id="hero-title"
              className="text-4xl md:text-5xl lg:text-6xl font-bold"
            >
              {band.name}
            </h1>
          </div>
        </section>

            {/* Description Section */}
        {band.description && band.description.length > 0 && (
          <section className="max-w-7xl mx-auto px-3 py-8 md:py-16 text-center">
            <div className="prose prose-invert mx-auto max-w-3xl bg-slate-950/60 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-white/5">
              <PortableText
                value={band.description}
                components={{
                  block: {
                    normal: ({ children }) => (
                      <p className="text-lg md:text-xl leading-relaxed mb-4 text-gray-200">
                        {children}
                      </p>
                    ),
                    h1: ({ children }) => (
                      <h2 className="text-3xl font-bold mb-4 text-white">
                        {children}
                      </h2>
                    ),
                    h2: ({ children }) => (
                      <h3 className="text-2xl font-semibold mb-3 text-white">
                        {children}
                      </h3>
                    ),
                    h3: ({ children }) => (
                      <h4 className="text-xl font-medium mb-2 text-gray-100">
                        {children}
                      </h4>
                    ),
                  },
                  marks: {
                    strong: ({ children }) => <strong>{children}</strong>,
                    em: ({ children }) => <em>{children}</em>,
                    link: ({ children, value }) => (
                      <a
                        href={value.href}
                        className="text-blue-400 hover:underline"
                      >
                        {children}
                      </a>
                    ),
                  },
                }}
              />
            </div>
          </section>
        )}

{/* Main Content Images Gallery (remy.png, main.png, etc.) */}
  {band.contentImages && band.contentImages.length > 0 && (
    <section className="max-w-7xl mx-auto px-3 py-8 md:py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {band.contentImages.map((img, idx) => (
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
                    className="w-full aspect-square object-cover"
                  />
                </motion.div>
              ))}
            </div>
          </section>
        )}

        <div className="sr-only">
          <p>Hero section with band name: {band.name}</p>
        </div>

      {/* Musicians Section - Horizontal Scroll */}
         <SectionWrapper title={<FormattedMessage id="home.ourMusicians" />}>
          <motion.div
            className="flex flex-wrap justify-center gap-6 md:gap-8 max-w-7xl mx-auto"
            variants={staggerContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
          >
            {band.members?.map((musician) => (
              <motion.a
                key={musician._key}
                href={`/musicians/${musician.musician?.slug}`}
                variants={itemVariants}
                className="flex-none"
              >
                <GlassCard className="w-64 p-6 text-center hover:shadow-xl transition-shadow">
                  {musician.photo && (
                    <img
                      src={musician.photo}
                      alt={musician.musician?.name}
                      loading="lazy"
                      decoding="async"
                      className="w-40 h-40 mx-auto rounded-full object-cover mb-4 shadow-lg ring-2 ring-white/[0.1]"
                    />
                  )}
                  <h3 className="text-xl font-bold text-white mb-2">
                    {musician.musician?.name}
                  </h3>
                  {musician.instrument && (
                    <Badge variant="default">{musician.instrument}</Badge>
                  )}
                </GlassCard>
              </motion.a>
            ))}
          </motion.div>

         <div className="text-center mt-8">
             <PrimaryButton href="/musicians">
               <FormattedMessage id="home.viewAllMusicians" />
             </PrimaryButton>
           </div>
        </SectionWrapper>

        {/* Tour Dates Section with Scroll Animations */}
         <SectionWrapper title={<FormattedMessage id="home.upcomingShows" />}>
          {() => {
            const currentDate = new Date()
            currentDate.setHours(0, 0, 0, 0)

            const upcomingDates =
              band.tourDates
                ?.filter((date) => {
                  const eventDate = new Date(date.date)
                  return eventDate >= currentDate
                })
                .sort(
                  (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime(),
                )
                .slice(0, 4) || []

            if (upcomingDates.length === 0) return null

            return (
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
                variants={staggerContainerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                {upcomingDates.map((date, idx) => {
                  const eventDate = new Date(date.date)
                  const isUpcoming = eventDate >= currentDate

                  return (
                    <motion.div key={idx} variants={itemVariants}>
                      <GlassCard className="p-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-2xl font-bold text-white">
                              {new Date(date.date).toLocaleDateString('en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </p>
                            <p className="text-xl font-semibold text-gray-200">
                              {date.venue}
                            </p>
                            <p className="text-gray-300">
                              {date.city}
                              {date.region && `, ${date.region}`}
                            </p>
                          </div>
                         <div className="flex flex-col gap-2">
                             {date.soldOut && (
                               <span className="bg-red-900/50 text-red-200 px-3 py-1 rounded-full text-sm backdrop-blur-sm border border-red-500/[0.3]">
                                 <FormattedMessage id="home.soldOut" />
                               </span>
                             )}
                             {isUpcoming && (
                               <span className="bg-green-900/50 text-green-200 px-3 py-1 rounded-full text-sm backdrop-blur-sm border border-green-500/[0.3]">
                                 <FormattedMessage id="home.upcoming" />
                               </span>
                             )}
                           </div>
                        </div>
                       {date.ticketsUrl && (
                           <PrimaryButton
                             href={date.ticketsUrl}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="mt-4"
                           >
                             <FormattedMessage id="home.getTickets" />
                           </PrimaryButton>
                         )}
                      </GlassCard>
                    </motion.div>
                  )
                })}

               {upcomingDates?.length && (
                   <div className="text-center mt-8">
                     <PrimaryButton href="/tour">
                       <FormattedMessage id="home.viewAllShows" />
                     </PrimaryButton>
                   </div>
                 )}
              </motion.div>
            )
          }}
        </SectionWrapper>
      </Layout>
    </>
  )
}
