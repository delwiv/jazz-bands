import { Link } from 'react-router'
import { buildGallery } from '../../lib/gallery'
import type { PersonHub } from '../../lib/types'
import { Reveal } from '../Reveal'

export function Gallery({ person }: { person: PersonHub }) {
  const items = buildGallery(person)
  if (items.length === 0) return null

  return (
    <section
      id="galerie"
      className="scroll-mt-24 bg-ivory-deep py-20 md:py-28"
      aria-labelledby="galerie-title"
    >
      <div className="container-hub">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow">Galerie</p>
              <h2
                id="galerie-title"
                className="mt-3 font-display text-4xl font-semibold text-ink md:text-6xl"
              >
                Instants de musique
              </h2>
            </div>
            <Link
              to="/galerie"
              className="inline-flex items-center gap-2 rounded-full border border-ink/30 px-6 py-2.5 text-sm font-semibold uppercase tracking-[0.2em] text-ink transition-colors hover:border-brass hover:text-brass"
            >
              Toute la galerie
            </Link>
          </div>
          <div className="hairline mt-8 max-w-2xl" />
        </Reveal>

        <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {items.slice(0, 4).map((item, i) => (
            <Reveal
              key={item.id}
              delay={i * 60}
              className={i % 5 === 0 ? 'col-span-2 row-span-2' : ''}
            >
              <Link to="/galerie" className="group block h-full">
                <img
                  src={item.src}
                  alt={item.alt}
                  loading="lazy"
                  className="h-full w-full rounded-sm object-cover shadow-sm transition-transform duration-500 group-hover:scale-[1.02]"
                />
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
