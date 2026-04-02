import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'
import { Link, type LoaderFunctionArgs, useLoaderData } from 'react-router'
import {
  BandStructuredData,
  EventStructuredData,
} from '~/components/StructuredData'
import { Badge } from '~/components/shared/Badge'
import { GlassCard } from '~/components/shared/GlassCard'
import { PrimaryButton } from '~/components/shared/PrimaryButton'
import { SectionWrapper } from '~/components/shared/SectionWrapper'
import { TwoColumnLayout } from '~/components/shared/TwoColumnLayout'
import { useReducedMotion } from '~/hooks/useReducedMotion'
import {
  cardHoverVariants,
  staggerContainerVariants,
} from '~/lib/animationVariants'
import { getBandBySlug } from '~/lib/queries'
import type { TourLoaderData } from '~/lib/routes.types'
import { sanityClient, urlForImage } from '~/lib/sanity.settings'
import type { TourDate } from '~/lib/types'
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
  return buildBandMeta(loaderData.band, loaderData.baseUrl, 'tour')
}

export default function TourPage() {
  const { band, baseUrl, galleryImages } = useLoaderData<TourLoaderData>()
  const [filterRegion, setFilterRegion] = useState<string>('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const reducedMotion = useReducedMotion()
  const intl = useIntl()

  const regions = Array.from(
    new Set(band.tourDates?.map((d: TourDate) => d.region).filter(Boolean)),
  )

  const filteredDates = filterRegion
    ? band.tourDates?.filter((d: TourDate) => d.region === filterRegion) || []
    : band.tourDates || []

  const upcomingDates = filteredDates
    // .filter((d: TourDate) => new Date(d.date) > new Date())
    .sort(
      (a: TourDate, b: TourDate) =>
        new Date(b.date).getTime() - new Date(a.date).getTime(), // Descending order (newest first)
    )

  // Date grouping logic
  const groupAgeDays = 7
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const next14Days = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)

  const getNextGroupDate = (startDate: Date): string => {
    const groupStart = new Date(
      startDate.getTime() + groupAgeDays * 24 * 60 * 60 * 1000,
    )
    return groupStart.toISOString().split('T')[0]
  }

  const getGrouping = (dateStr: string): string => {
    const date = new Date(dateStr)

    if (date <= next14Days) {
      return intl.formatMessage({ id: 'tour.next14Days' })
    }

    const groupStart = getNextGroupDate(today)
    const groups: string[] = [groupStart]
    let current = new Date(groupStart)

    while (current < date) {
      current = new Date(current.getTime() + groupAgeDays * 24 * 60 * 60 * 1000)
      groups.push(current.toISOString().split('T')[0])
    }
    return groups[groups.length - 1]
  }

  const groupedDates = upcomingDates.reduce(
    (acc: Record<string, TourDate[]>, date: TourDate) => {
      const group = getGrouping(date.date)
      if (!acc[group]) acc[group] = []
      acc[group].push(date)
      return acc
    },
    {},
  )

  const next14DaysKey = intl.formatMessage({ id: 'tour.next14Days' })
  const sortedGroups = Object.entries(groupedDates).sort((a, b) => {
    if (a[0] === next14DaysKey) return -1
    if (b[0] === next14DaysKey) return 1
    return a[0].localeCompare(b[0])
  })

  const formatDateBadge = (
    dateStr: string,
  ): 'soldOut' | 'upcoming' | 'past' => {
    if (!dateStr) return 'past'
    const date = new Date(dateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date >= today ? 'upcoming' : 'past'
  }

  return (
    <>
      <BandStructuredData band={band} baseUrl={baseUrl} />
      {upcomingDates.map((date: any, idx: number) => (
        <EventStructuredData
          key={idx}
          event={date}
          band={band}
          baseUrl={baseUrl}
        />
      ))}
      <TwoColumnLayout
        band={band}
        images={galleryImages}
        initialTrack={band.recordings?.[0] || null}
        initialQueue={band.recordings || []}
      >
        <SectionWrapper
          title={<FormattedMessage id="tour.tourDates" />}
          className="py-8"
        >
          <div className="container-max">
            {regions.length > 0 && (
              <div className="mb-8 text-center">
                <label className="mr-4 font-semibold text-gray-300">
                  <FormattedMessage id="tour.filterByRegion" />
                </label>
                <div className="inline-block relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="focus-ring bg-slate-900/90 backdrop-blur-xl border border-white/[0.1] text-white px-4 py-2 rounded-lg hover:bg-slate-800/90 transition"
                    aria-label={intl.formatMessage({
                      id: 'tour.filterByRegionAria',
                    })}
                    aria-expanded={isDropdownOpen}
                  >
                    {filterRegion || <FormattedMessage id="tour.allRegions" />}
                  </button>
                  {!reducedMotion && isDropdownOpen && (
                    <AnimatePresence>
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full mt-2 left-0 bg-slate-900/90 backdrop-blur-xl border border-white/[0.1] rounded-lg overflow-hidden z-50 min-w-[200px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            setFilterRegion('')
                            setIsDropdownOpen(false)
                          }}
                          className="focus-ring w-full text-left px-4 py-2 text-white hover:bg-white/[0.06] transition"
                        >
                          <FormattedMessage id="tour.allRegions" />
                        </button>
                        {regions.map((region) => (
                          <button
                            key={region}
                            onClick={() => {
                              setFilterRegion(region)
                              setIsDropdownOpen(false)
                            }}
                            className="focus-ring w-full text-left px-4 py-2 text-white hover:bg-white/[0.06] transition"
                          >
                            {region}
                          </button>
                        ))}
                      </motion.div>
                    </AnimatePresence>
                  )}
                  {reducedMotion && isDropdownOpen && (
                    <div
                      className="absolute top-full mt-2 left-0 bg-slate-900/90 backdrop-blur-xl border border-white/[0.1] rounded-lg overflow-hidden z-50 min-w-[200px]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => {
                          setFilterRegion('')
                          setIsDropdownOpen(false)
                        }}
                        className="focus-ring w-full text-left px-4 py-2 text-white hover:bg-white/[0.06] transition"
                      >
                        All Regions
                      </button>
                      {regions.map((region) => (
                        <button
                          key={region}
                          onClick={() => {
                            setFilterRegion(region)
                            setIsDropdownOpen(false)
                          }}
                          className="focus-ring w-full text-left px-4 py-2 text-white hover:bg-white/[0.06] transition"
                        >
                          {region}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {upcomingDates.length === 0 ? (
              <p className="text-center text-gray-300">
                <FormattedMessage id="tour.noUpcomingShows" />
              </p>
            ) : (
              <div className="space-y-8">
                {sortedGroups.map(([group, dates]: [string, TourDate[]]) => {
                  const renderTourCard = (date: TourDate) => (
                    <GlassCard
                      className="rounded-lg p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                      hover={false}
                    >
                      <div>
                        <p className="text-2xl font-bold text-amber-400">
                          {new Date(date.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                        <p className="text-xl font-semibold text-white mt-2">
                          {date.venue}
                        </p>
                        <p className="text-gray-300">
                          {date.city}, {date.region || ''}
                        </p>
                        {date.details && (
                          <p className="mt-2 text-gray-300">{date.details}</p>
                        )}
                      </div>

                      <div className="flex gap-4 flex-wrap justify-center md:justify-end">
                        <Badge
                          variant={
                            date.soldOut
                              ? 'warning'
                              : formatDateBadge(date.date) === 'upcoming'
                                ? 'success'
                                : 'default'
                          }
                        >
                          {date.soldOut ? (
                            <FormattedMessage id="tour.soldOut" />
                          ) : formatDateBadge(date.date) === 'upcoming' ? (
                            <FormattedMessage id="tour.upcoming" />
                          ) : (
                            <FormattedMessage id="tour.past" />
                          )}
                        </Badge>

                        {date.soldOut || !date.ticketsUrl ? null : (
                          <PrimaryButton
                            href={date.ticketsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="!py-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <FormattedMessage id="tour.getTickets" />
                          </PrimaryButton>
                        )}
                        {!date.ticketsUrl && !date.soldOut && (
                          <Badge variant="default" className="!px-6 !py-2">
                            <FormattedMessage id="tour.ticketsTBA" />
                          </Badge>
                        )}
                      </div>
                    </GlassCard>
                  )

                  const renderAnimatedTourCard = (date: TourDate) => (
                    <Link
                      key={date._key || date.slug}
                      to={`/tour/${date.slug || date._key}`}
                      className="block"
                    >
                      <GlassCard className="rounded-lg p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                          <p className="text-2xl font-bold text-amber-400">
                            {new Date(date.date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                          <p className="text-xl font-semibold text-white mt-2">
                            {date.venue}
                          </p>
                          <p className="text-gray-300">
                            {date.city}, {date.region || ''}
                          </p>
                          {date.details && (
                            <p className="mt-2 text-gray-300">{date.details}</p>
                          )}
                        </div>

                        <div className="flex gap-4 flex-wrap justify-center md:justify-end">
                          <Badge
                            variant={
                              date.soldOut
                                ? 'warning'
                                : formatDateBadge(date.date) === 'upcoming'
                                  ? 'success'
                                  : 'default'
                            }
                          >
                            {date.soldOut
                              ? intl.formatMessage({ id: 'tour.soldOut' })
                              : formatDateBadge(date.date) === 'upcoming'
                                ? intl.formatMessage({ id: 'tour.upcoming' })
                                : intl.formatMessage({ id: 'tour.past' })}
                          </Badge>

                          {date.soldOut || !date.ticketsUrl ? null : (
                            <PrimaryButton
                              href={date.ticketsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="!py-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Get Tickets
                            </PrimaryButton>
                          )}
                          {!date.ticketsUrl && !date.soldOut && (
                            <Badge variant="default" className="!px-6 !py-2">
                              Tickets TBA
                            </Badge>
                          )}
                        </div>
                      </GlassCard>
                    </Link>
                  )

                  return (
                    <div key={group}>
                      <h2 className="text-2xl font-bold text-amber-400 mb-4">
                        {group}
                      </h2>
                      {reducedMotion ? (
                        <div className="space-y-4">
                          {dates.map((date: TourDate, idx: number) => (
                            <Link
                              key={date._key || date.slug || idx}
                              to={`/tour/${date.slug || date._key}`}
                              className="block"
                            >
                              {renderTourCard(date)}
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <motion.div
                          className="space-y-4"
                          variants={staggerContainerVariants}
                          initial="hidden"
                          animate="visible"
                        >
                          {dates.map((date: TourDate) =>
                            renderAnimatedTourCard(date),
                          )}
                        </motion.div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </SectionWrapper>
      </TwoColumnLayout>
    </>
  )
}
