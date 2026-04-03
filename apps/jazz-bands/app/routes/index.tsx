import { PortableText } from '@portabletext/react'
import clsx from 'clsx'
import { FormattedMessage } from 'react-intl'
import { type LoaderFunctionArgs, useLoaderData } from 'react-router'
import { BandStructuredData } from '~/components/StructuredData'
import { Badge } from '~/components/shared/Badge'
import { MainContainer } from '~/components/shared/MainContainer'
import { PrimaryButton } from '~/components/shared/PrimaryButton'
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

  const mainImage = band.contentImages?.[0]
  return (
    <>
      <BandStructuredData band={band} baseUrl={baseUrl} />
      <MainContainer>
        {/* Home Section - Side by side like legacy */}
        <section className="">
          <div className="glass-card p-4 rounded-lg xl:p-6">
            <div
              className={clsx(
                mainImage && 'xl:grid-cols-2',
                'grid gap-8 md:gap-12 items-center justify-center',
              )}
            >
              {/* Left: Main Image */}
              {(() => {
                if (!mainImage?.asset) {
                  return null
                }
                return (
                  <img
                    src={urlForImage.image(mainImage.asset).width(800).url()}
                    alt={band.name}
                    className="relative aspect-auto rounded-lg overflow-hidden object-contain m-auto"
                    loading="eager"
                  />
                )
              })()}

              {/* Right: Band Info */}
              <div className="space-y-6 text-white">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">
                  {band.name}
                </h1>
                <div className="h-px w-full bg-linear-to-r from-white to-transparent mb-6" />

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
                  className="flex flex-col items-center"
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
          <section className="glass-card rounded-lg p-2 lg:p-4 xl:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {upcomingDates.map((date) => {
                const eventDate = new Date(date.date)
                const isUpcoming = eventDate >= currentDate

                return (
                  <div key={date._key}>
                    <div className="p-6">
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
          </section>
        )}
      </MainContainer>
    </>
  )
}
