import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'
import { Link, type LoaderFunctionArgs, useLoaderData } from 'react-router'
import {
  BandStructuredData,
  EventStructuredData,
} from '~/components/StructuredData'
import { GlassCard } from '~/components/shared/GlassCard'
import { MainContainer } from '~/components/shared/MainContainer'
import { useReducedMotion } from '~/hooks/useReducedMotion'
import { staggerContainerVariants, dropdownVariants } from '~/lib/animationVariants'
import type { TourLoaderData } from '~/lib/routes.types'
import type { TourDate } from '~/lib/types'
import { buildBandMeta } from '~/utils/seo'
import { loadBand } from '~/lib/loaders'

export async function loader({ request }: LoaderFunctionArgs) {
  return loadBand(request)
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
  const next14Days = new Date(
    todayForGrouping.getTime() + 14 * 24 * 60 * 60 * 1000,
  )

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
  const sortGroups = (
    entries: [string, TourDate[]][],
  ): [string, TourDate[]][] =>
    entries.sort((a, b) => {
      if (a[0] === next14DaysKey) return -1
      if (b[0] === next14DaysKey) return 1
      return a[0].localeCompare(b[0])
    })

  const sortedUpcomingGroups = sortGroups(Object.entries(groupedUpcomingDates))
  const sortedPastGroups = sortGroups(Object.entries(groupedPastDates))

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

  function TourCardContent({ date }: { date: TourDate }) {
    const eventDate = new Date(date.date)
    const month = intl
      .formatDate(eventDate, { month: 'short' })
      .toUpperCase()
    const day = intl.formatDate(eventDate, { day: 'numeric' })

    const isSoldOut = date.soldOut
    const isPast = eventDate < new Date()

    return (
      <>
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="hidden sm:flex flex-col items-center min-w-[56px] bg-white/[0.04] rounded-lg border border-white/[0.08] overflow-hidden shrink-0 self-start">
            <span className="w-full text-center text-[11px] font-bold text-amber-400 bg-amber-500/10 py-1 px-2 uppercase tracking-wider leading-none">
              {month}
            </span>
            <span className="text-2xl font-bold text-white py-1 px-2 leading-tight">
              {day}
            </span>
          </div>

          <div className="min-w-0">
            <p className="text-lg md:text-xl font-bold text-amber-400">
              {formatDate(date.date)}
            </p>
            <p className="text-xl md:text-2xl font-bold text-white mt-1 leading-tight">
              {date.city}
              {date.region ? `, ${date.region}` : ''}
            </p>
            <p className="text-base md:text-lg font-semibold text-gray-300 mt-0.5">
              {date.venue}
            </p>
            {date.details && (
              <p className="mt-2 text-sm text-gray-400 line-clamp-1">
                {date.details}
              </p>
            )}
          </div>
        </div>

        {isSoldOut && (
          <div className="shrink-0">
            <span className="inline-block text-xs font-semibold text-red-400 bg-red-900/30 px-3 py-1 rounded-full border border-red-500/30">
              Complet
            </span>
          </div>
        )}
      </>
    )
  }

// Helper function to render grouped tour dates
  const renderGroups = (
    groups: [string, TourDate[]][],
    section: 'upcoming' | 'past',
  ): React.ReactNode[] => {
    const isUpcoming = section === 'upcoming'

    const renderTourCard = (date: TourDate) => (
      <GlassCard
        className="w-full rounded-lg p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        hover={false}
      >
        <TourCardContent date={date} />
      </GlassCard>
    )

    const renderAnimatedTourCard = (date: TourDate) => (
      <Link
        to={`/tour/${date.slug || date._key}`}
        className="block flex-1 my-4"
      >
        <GlassCard className="w-full rounded-lg p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <TourCardContent date={date} />
        </GlassCard>
      </Link>
    )

    const allDates = groups.flatMap(([, dates]) => dates) as TourDate[]
    const isUpcomingSection = section === 'upcoming'

    return (
      <div className="flex flex-col">
        {allDates.map((date: TourDate, idx: number) => {
          const card = reducedMotion ? (
            <Link
              key={date._key || date.slug}
              to={`/tour/${date.slug || date._key}`}
              className="block flex-1 my-4"
            >
              {renderTourCard(date)}
            </Link>
          ) : (
            renderAnimatedTourCard(date)
          )
          return (
            <div key={date._key || date.slug || idx} className="flex gap-4">
              <div className="flex flex-col items-center w-6 shrink-0">
                <div className="w-0.5 flex-1 bg-amber-500/20" />
                <div
                  className={`w-3 h-3 rounded-full ring-2 ring-gray-900 shrink-0 ${isUpcomingSection ? 'bg-amber-500' : 'bg-gray-600'}`}
                />
                <div className="w-0.5 flex-1 bg-amber-500/20" />
              </div>
              {card}
            </div>
          )
        })}
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
                      variants={dropdownVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
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
