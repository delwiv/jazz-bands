import { getImageUrl } from '../../lib/images'
import type { PersonHub } from '../../lib/types'
import { Reveal } from '../Reveal'

export function Hero({ person }: { person: PersonHub }) {
  const heroImage = person.heroImage?.asset || person.musician?.photo?.asset
  const heroUrl = getImageUrl({ asset: heroImage } as never, 1920)

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink text-ivory">
      {heroUrl && (
        <img
          src={heroUrl}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover object-top opacity-40"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/50 to-ink" />

      <div className="container-hub relative z-10 pb-20 pt-32 text-center">
        <Reveal>
          <img
            src="/logo-512.png"
            alt={`Logo ${person.name}`}
            width={512}
            height={512}
            loading="eager"
            className="mx-auto h-24 w-auto drop-shadow-lg md:h-28"
          />
        </Reveal>
        <Reveal delay={100}>
          <p className="eyebrow mt-8 mb-6">Batteur de jazz — Nantes</p>
        </Reveal>
        <Reveal delay={100}>
          <h1 className="font-display text-6xl font-semibold leading-none tracking-tight sm:text-8xl md:text-9xl">
            {person.name}
          </h1>
        </Reveal>
        {person.tagline && (
          <Reveal delay={200}>
            <p className="mx-auto mt-8 max-w-2xl font-display text-xl italic text-ivory/85 md:text-2xl">
              {person.tagline}
            </p>
          </Reveal>
        )}
        <Reveal delay={300}>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#groupes"
              className="rounded-full bg-brass px-8 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-ivory transition-colors hover:bg-brass-light"
            >
              Découvrir les groupes
            </a>
            <a
              href="#contact"
              className="rounded-full border border-ivory/40 px-8 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-ivory transition-colors hover:border-brass hover:text-brass"
            >
              Contact
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
