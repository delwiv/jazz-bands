import { ExternalLink } from 'lucide-react'
import { Reveal } from '../Reveal'

export interface BandCard {
  name: string
  slug: string
  url: string
  logo?: string
  description?: string
}

export function Bands({ bandCards }: { bandCards: BandCard[] }) {
  if (bandCards.length === 0) return null

  return (
    <section
      id="groupes"
      className="scroll-mt-24 bg-ink py-20 text-ivory md:py-28"
      aria-labelledby="groupes-title"
    >
      <div className="container-hub">
        <Reveal>
          <p className="eyebrow">Les groupes</p>
          <h2
            id="groupes-title"
            className="mt-3 font-display text-4xl font-semibold md:text-6xl"
          >
            Six formations, une signature
          </h2>
          <p className="mt-5 max-w-2xl text-ivory/70">
            Au fil des années, Frédéric a monté et rejoint plusieurs formations.
            Chacune a son univers — découvrez-les.
          </p>
          <div className="hairline mt-8 max-w-2xl" />
        </Reveal>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {bandCards.map((band, i) => (
            <Reveal key={band.slug} delay={i * 60}>
              <a
                href={band.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-full flex-col border border-ivory/15 bg-ivory/[0.03] p-8 transition-all duration-300 hover:border-brass/60 hover:bg-ivory/[0.06]"
              >
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-ivory/20 bg-ivory/5">
                  {band.logo ? (
                    <img
                      src={band.logo}
                      alt={`Logo ${band.name}`}
                      loading="lazy"
                      className="h-14 w-14 rounded-full object-cover"
                    />
                  ) : (
                    <span className="font-display text-2xl font-semibold text-brass">
                      {band.name.charAt(0)}
                    </span>
                  )}
                </div>

                <h3 className="font-display text-3xl font-semibold">
                  {band.name}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-ivory/65">
                  {band.description || 'Jazz'}
                </p>

                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-brass">
                  Découvrir
                  <ExternalLink className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
