import { CalendarDays, Ticket } from 'lucide-react'
import type { PersonHub, TourDateBrief } from '../../lib/types'
import { PortableText } from '../PortableText'
import { Reveal } from '../Reveal'
import type { BandCard } from './Bands'

interface AggregatedDate extends TourDateBrief {
  bandName?: string
  bandUrl?: string
}

function formatDateShortFr(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function News({
  person,
  bandCards,
}: {
  person: PersonHub
  bandCards: BandCard[]
}) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const bandUrlBySlug = new Map(bandCards.map((b) => [b.slug, b.url]))

  const upcomingDates: AggregatedDate[] = (person.bands ?? [])
    .flatMap((entry) =>
      (entry.band?.tourDates ?? []).map((d) => ({
        ...d,
        bandName: entry.band?.name,
        bandUrl: entry.band?.slug
          ? bandUrlBySlug.get(entry.band.slug)
          : undefined,
      })),
    )
    .filter((d) => new Date(d.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 8)

  const news =
    person.news
      ?.slice()
      .sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ) || []

  if (upcomingDates.length === 0 && news.length === 0) return null

  return (
    <section
      id="actualites"
      className="scroll-mt-24 py-20 md:py-28"
      aria-labelledby="actualites-title"
    >
      <div className="container-hub">
        <Reveal>
          <p className="eyebrow">Actualités</p>
          <h2
            id="actualites-title"
            className="mt-3 font-display text-4xl font-semibold text-ink md:text-6xl"
          >
            Sur scène & ailleurs
          </h2>
          <div className="hairline mt-8 max-w-2xl" />
        </Reveal>

        <div className="mt-14 grid gap-14 lg:grid-cols-2 lg:gap-20">
          {upcomingDates.length > 0 && (
            <Reveal>
              <h3 className="flex items-center gap-3 font-display text-2xl font-semibold text-ink">
                <CalendarDays className="h-5 w-5 text-brass" />
                Dates à venir
              </h3>
              <ul className="mt-8 space-y-6">
                {upcomingDates.map((d) => (
                  <li
                    key={`${d.bandName}-${d._key}`}
                    className="group flex items-baseline gap-5 border-b border-stone-line pb-5"
                  >
                    <div className="flex min-w-[64px] flex-col items-center rounded-sm border border-brass/50 bg-ivory-deep px-3 py-2 text-ink">
                      <span className="font-display text-2xl font-bold leading-none">
                        {new Date(d.date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                        })}
                      </span>
                      <span className="text-xs uppercase tracking-widest">
                        {new Date(d.date).toLocaleDateString('fr-FR', {
                          month: 'short',
                        })}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-ink">
                        {d.venue}
                        {d.soldOut && (
                          <span className="ml-2 rounded-full bg-wine px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-ivory">
                            Complet
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-ink/60">
                        {d.city}
                        {d.region ? `, ${d.region}` : ''}
                      </p>
                      <p className="text-xs uppercase tracking-[0.2em] text-brass">
                        {d.bandName}
                      </p>
                    </div>
                    {d.ticketsUrl && (
                      <a
                        href={d.ticketsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-wine hover:text-brass sm:inline-flex"
                        aria-label={`Billets pour ${d.venue}`}
                      >
                        <Ticket className="h-4 w-4" />
                        Billets
                      </a>
                    )}
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-xs italic text-ink/50">
                Dates des {person.bands?.length || ''} groupes du collectif.
              </p>
            </Reveal>
          )}

          {news.length > 0 && (
            <Reveal delay={100}>
              <h3 className="font-display text-2xl font-semibold text-ink">
                Annonces
              </h3>
              <ul className="mt-8 space-y-8">
                {news.map((item) => (
                  <li key={item._key} className="border-l-2 border-brass pl-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-brass">
                      {formatDateShortFr(item.date)}
                    </p>
                    <h4 className="mt-1 font-display text-2xl font-semibold text-ink">
                      {item.title}
                    </h4>
                    {item.body && (
                      <div className="mt-2 text-sm text-ink/75 [&_p]:mb-2">
                        <PortableText value={item.body} />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  )
}
