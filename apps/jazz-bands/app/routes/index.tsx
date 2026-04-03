import { PortableText } from '@portabletext/react'
import { FormattedMessage } from 'react-intl'
import {
  type LoaderFunctionArgs,
  useLoaderData,
  useNavigation,
} from 'react-router'
import { BandStructuredData } from '~/components/StructuredData'
import { Badge } from '~/components/shared/Badge'
import { MainContainer } from '~/components/shared/MainContainer'
import { PrimaryButton } from '~/components/shared/PrimaryButton'
import { SectionWrapper } from '~/components/shared/SectionWrapper'
import { Skeleton } from '~/components/shared/Skeleton'
import { useReducedMotion } from '~/hooks/useReducedMotion'
import { getBandBySlug } from '~/lib/queries'
import type { BandHomeLoaderData } from '~/lib/routes.types'
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

  return meta
}

export default function BandHome() {
  const { band, baseUrl } = useLoaderData<BandHomeLoaderData>()
  const navigation = useNavigation()
  const isLoading = navigation.state === 'loading'
  const reducedMotion = useReducedMotion()

  // Compute upcoming dates once for conditional rendering
  const currentDate = new Date()
  currentDate.setHours(0, 0, 0, 0)
  const upcomingDates =
    band.tourDates
      ?.filter((date) => {
        const eventDate = new Date(date.date)
        return eventDate >= currentDate
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 4) || []

  if (isLoading) {
    return (
      <>
        {/* Hero Section Skeleton */}
        <section className="relative h-96 flex items-center justify-center bg-slate-900">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950" />
          <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
            <Skeleton
              variant="text"
              className="h-10 w-64 mx-auto mb-4 bg-slate-800/50"
            />
            <Skeleton
              variant="text"
              className="mx-auto mb-2 bg-slate-800/50"
            />
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
      </>
    )
  }

  return (
    <>
      <BandStructuredData band={band} baseUrl={baseUrl} />
      <MainContainer>
        {/* Home Section - Side by side like legacy */}
        <section className="py-6">
          <div className="glass-card p-4 rounded-lg xl:p-6">
            <div className="grid xl:grid-cols-2 gap-8 md:gap-12 items-start">
              {/* Left: Main Image */}
              {(() => {
                const mainImage = band.contentImages?.[0]
                if (!mainImage?.asset) {
                  return null
                }
                return (
                  <img
                    src={urlForImage
                      .image(mainImage.asset)
                      .width(1200)
                      .fit('max')
                      .url()}
                    alt={band.name}
                    className="relative aspect-auto rounded-lg overflow-hidden object-contain"
                    loading="eager"
                  />
                )
              })()}

              {/* Right: Band Info */}
              <div className="space-y-6 text-white">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">
                  {band.name}
                </h1>
                <div className="h-px w-full bg-gradient-to-r from-white to-transparent mb-6" />

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
              </div>
            </div>
          </div>
        </section>

        {/* Musicians Section - glass-styled div */}
        <section className="glass-card rounded-lg p-2 lg:p-4 xl:p-6">
          <div className="flex flex-wrap justify-center gap-6 md:gap-8">
            {band.members?.map((musician) => {
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
                <a
                  key={musician._key}
                  href={`/musicians/${musician.musician?.slug}`}
                  className="flex-none"
                >
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
                </a>
              )
            })}
          </div>
        </section>

        {/* Tour Dates Section - only render if dates exist */}
        {upcomingDates.length > 0 && (
          <SectionWrapper title={<FormattedMessage id="home.upcomingShows" />}>
            {() => (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {upcomingDates.map((date) => {
                  const eventDate = new Date(date.date)
                  const isUpcoming = eventDate >= currentDate

                  return (
                    <div key={date._key}>
                      <div className="glass-card p-6">
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
                      </div>
                    </div>
                  )
                })}

                <div className="text-center mt-8">
                  <PrimaryButton href="/tour">
                    <FormattedMessage id="home.viewAllShows" />
                  </PrimaryButton>
                </div>
              </div>
            )}
          </SectionWrapper>
        )}
      </MainContainer>
    </>
  )
}
