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
import { MainContainer } from '~/components/shared/MainContainer'
import { PrimaryButton } from '~/components/shared/PrimaryButton'
import { useReducedMotion } from '~/hooks/useReducedMotion'
import { staggerContainerVariants } from '~/lib/animationVariants'
import { getBandBySlug } from '~/lib/queries'
import type { TourLoaderData } from '~/lib/routes.types'
import { sanityClient } from '~/lib/sanity.settings'
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

  return { band, baseUrl }
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
  const { band, baseUrl } = useLoaderData<TourLoaderData>()
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

  // Separate upcoming and past dates with correct sorting
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const upcomingDates = filteredDates
    .filter((d: TourDate) => new Date(d.date) >= today)
    .sort(
      (a: TourDate, b: TourDate) =>
        new Date(a.date).getTime() - new Date(b.date).getTime(),
    ) // ascending - closest first

  const pastDates = filteredDates
    .filter((d: TourDate) => new Date(d.date) < today)
    .sort(
      (a: TourDate, b: TourDate) =>
        new Date(b.date).getTime() - new Date(a.date).getTime(),
    ) // descending - most recent first

  const groupAgeDays = 7
  const todayForGrouping = new Date(today)
  const next14Days = new Date(todayForGrouping.getTime() + 14 * 24 * 60 * 60 * 1000)

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

    const groupStart = getNextGroupDate(todayForGrouping)
    const groups: string[] = [groupStart]
    let current = new Date(groupStart)

    while (current < date) {
      current = new Date(current.getTime() + groupAgeDays * 24 * 60 * 60 * 1000)
      groups.push(current.toISOString().split('T')[0])
    }
    return groups[groups.length - 1]
  }

  // Group upcoming dates
  const groupedUpcomingDates = upcomingDates.reduce(
    (acc: Record<string, TourDate[]>, date: TourDate) => {
      const group = getGrouping(date.date)
      if (!acc[group]) acc[group] = []
      acc[group].push(date)
      return acc
    },
    {},
  )

  // Group past dates
  const groupedPastDates = pastDates.reduce(
    (acc: Record<string, TourDate[]>, date: TourDate) => {
      const group = getGrouping(date.date)
      if (!acc[group]) acc[group] = []
      acc[group].push(date)
      return acc
    },
    {},
  )

  const next14DaysKey = intl.formatMessage({ id: 'tour.next14Days' })

  // Shared sorting function for consistency
  const sortGroups = (entries: [string, TourDate[]][]): [string, TourDate[]][] =>
    entries.sort((a, b) => {
      if (a[0] === next14DaysKey) return -1
      if (b[0] === next14DaysKey) return 1
      return a[0].localeCompare(b[0])
    })

  const sortedUpcomingGroups = sortGroups(Object.entries(groupedUpcomingDates))
  const sortedPastGroups = sortGroups(Object.entries(groupedPastDates))

  const formatDateBadge = (
    dateStr: string,
  ): 'soldOut' | 'upcoming' | 'past' => {
    if (!dateStr) return 'past'
    const date = new Date(dateStr)
    const todayForBadge = new Date()
    todayForBadge.setHours(0, 0, 0, 0)
    return date >= todayForBadge ? 'upcoming' : 'past'
  }

   const formatDate = (dateStr: string): string => {
    const formatted = intl.formatDate(new Date(dateStr), {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
    // Capitalize first letter (handles French and other languages)
    return formatted.charAt(0).toUpperCase() + formatted.slice(1)
  }

  // Helper function to render grouped tour dates
  const renderGroups = (
    groups: [string, TourDate[]][],
    section: 'upcoming' | 'past',
  ): React.ReactNode[] => {
    const isUpcoming = section === 'upcoming'

    const renderTourCard = (date: TourDate) => (
      <GlassCard
        className="rounded-lg p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        hover={false}
      >
        <div>
          <p className="text-2xl font-bold text-amber-400">
            {formatDate(date.date)}
          </p>
          <p className="text-xl font-semibold text-white mt-2">
            {date.venue}
          </p>
          <p className="text-gray-300">{date.city}, {date.region || ''}</p>
          {date.details && <p className="mt-2 text-gray-300">{date.details}</p>}
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
      <Link key={date._key || date.slug} to={`/tour/${date.slug || date._key}`} className="block">
        <GlassCard className="rounded-lg p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <p className="text-2xl font-bold text-amber-400">
              {formatDate(date.date)}
            </p>
            <p className="text-xl font-semibold text-white mt-2">{date.venue}</p>
            <p className="text-gray-300">{date.city}, {date.region || ''}</p>
            {date.details && <p className="mt-2 text-gray-300">{date.details}</p>}
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
              <Badge variant="default" className="!px-6 !py-2">Tickets TBA</Badge>
            )}
          </div>
        </GlassCard>
      </Link>
    )

    const allDates = groups.flatMap(([, dates]) => dates) as TourDate[]
    return (
      <div className="flex flex-col gap-4">
        {allDates.map((date: TourDate, idx: number) =>
          reducedMotion ? (
            <Link
              key={date._key || date.slug || idx}
              to={`/tour/${date.slug || date._key}`}
              className="block"
            >
              {renderTourCard(date)}
            </Link>
          ) : (
            renderAnimatedTourCard(date)
          )
        )}
      </div>
    )
  }

  return (
    <>
      <BandStructuredData band={band} baseUrl={baseUrl} />
      {[...upcomingDates, ...pastDates].map((date: any, idx: number) => (
        <EventStructuredData
          key={idx}
          event={date}
          band={band}
          baseUrl={baseUrl}
        />
      ))}
      <MainContainer>
        <section>
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

          {upcomingDates.length === 0 && pastDates.length === 0 ? (
            <p className="text-center text-gray-300">
              <FormattedMessage id="tour.noUpcomingShows" />
            </p>
          ) : (
            <div className="space-y-8">
              {/* Upcoming Concerts Section */}
              {upcomingDates.length > 0 && (
                <div>
                  <h2 className="text-3xl font-bold text-amber-400 mb-6">
                    <FormattedMessage id="tour.upcomingConcerts" />
                  </h2>
                  {renderGroups(sortedUpcomingGroups, 'upcoming')}
                </div>
              )}

              {/* Past Concerts Section */}
              {pastDates.length > 0 && (
                <div className="pt-8 border-t border-white/[0.1]">
                  <h2 className="text-3xl font-bold text-gray-400 mb-6">
                    <FormattedMessage id="tour.pastConcerts" />
                  </h2>
                  {renderGroups(sortedPastGroups, 'past')}
                </div>
              )}
            </div>
          )}
        </section>
      </MainContainer>
    </>
  )
}
