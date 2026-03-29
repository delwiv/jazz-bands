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
import { sanityClient, urlForImage } from '~/lib/sanity.settings'
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

  // Debug logging removed

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
        {/* Home Section - Side by side like legacy */}
        <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden w-full py-12 px-6">
          <div className="max-w-7xl w-full mx-auto">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
              {/* Left: Main Image */}
              {(() => {
                const mainImage = band.contentImages?.[0]
                if (!mainImage?.asset) {
                  return null
                }
                return (
                  <motion.div
                    className="relative aspect-auto md:h-[500px] lg:h-[600px] rounded-lg overflow-hidden shadow-2xl"
                    initial={
                      !reducedMotion ? { opacity: 0, x: -50 } : undefined
                    }
                    animate={!reducedMotion ? { opacity: 1, x: 0 } : undefined}
                    transition={
                      !reducedMotion
                        ? { duration: 0.6, ease: 'easeOut' }
                        : undefined
                    }
                  >
                    <img
                      src={urlForImage
                        .image(mainImage.asset)
                        .width(1200)
                        .fit('max')
                        .url()}
                      alt={band.name}
                      className="w-full h-full object-contain"
                      loading="eager"
                    />
                  </motion.div>
                )
              })()}

              {/* Right: Band Info */}
              <motion.div
                className="space-y-6 text-white"
                initial={!reducedMotion ? { opacity: 0, x: 50 } : undefined}
                animate={!reducedMotion ? { opacity: 1, x: 0 } : undefined}
                transition={
                  !reducedMotion
                    ? { duration: 0.6, ease: 'easeOut', delay: 0.2 }
                    : undefined
                }
              >
                {/* Band Name with Divider */}
                <div>
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
                    {band.name}
                  </h1>
                  <div className="h-px w-full bg-gradient-to-r from-white to-transparent mb-6" />
                </div>

                {/* Description */}
                {band.description && band.description.length > 0 && (
                  <div className="prose prose-invert max-w-none text-lg text-gray-200 leading-relaxed">
                    <PortableText
                      value={band.description}
                      components={{
                        block: {
                          normal: ({ children }) => (
                            <p className="mb-4">{children}</p>
                          ),
                        },
                        marks: {
                          strong: ({ children }) => <strong>{children}</strong>,
                          em: ({ children }) => <em>{children}</em>,
                        },
                      }}
                    />
                  </div>
                )}

                {/* Musicians List */}
                {band.members && band.members.length > 0 && (
                  <ul className="space-y-2 text-lg text-gray-200">
                    {band.members.map((member: any, idx: number) => (
                      <li
                        key={member._key || idx}
                        className="flex items-center gap-2"
                      >
                        <span className="text-gray-400">•</span>
                        <span>
                          {member.musician?.name || member.name} :{' '}
                          {member.instrument}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            </div>
          </div>
        </section>

        <div className="sr-only">
          <p>Hero section with band name: {band.name}</p>
        </div>

        {/* Musicians Section - Horizontal Scroll */}
        <SectionWrapper>
          <motion.div
            className="flex flex-wrap justify-center gap-6 md:gap-8 max-w-7xl mx-auto"
            variants={staggerContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
          >
            {band.members?.map((musician) => {
              // Build photo URL from asset reference
              const photoUrl =
                musician.photo &&
                  typeof musician.photo === 'object' &&
                  musician.photo._ref
                  ? urlForImage
                    .image(musician.photo)
                    .width(400)
                    .height(400)
                    .fit('crop')
                    .url()
                  : ''

              return (
                <motion.a
                  key={musician._key}
                  href={`/musicians/${musician.musician?.slug}`}
                  variants={itemVariants}
                  className="flex-none"
                >
                  <GlassCard className="w-64 p-6 text-center hover:shadow-xl transition-shadow">
                    {photoUrl && (
                      <img
                        src={photoUrl}
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
              )
            })}
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
