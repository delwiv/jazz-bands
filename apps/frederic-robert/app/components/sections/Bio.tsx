import { getImageUrl } from '../../lib/images'
import type { PersonHub } from '../../lib/types'
import { PortableText } from '../PortableText'
import { Reveal } from '../Reveal'

export function Bio({ person }: { person: PersonHub }) {
  const musician = person.musician
  const photo = musician?.photo
  const photoUrl = getImageUrl(photo, 700)

  return (
    <section
      id="a-propos"
      className="scroll-mt-24 py-20 md:py-28"
      aria-labelledby="a-propos-title"
    >
      <div className="container-hub">
        <Reveal>
          <p className="eyebrow">À propos</p>
          <h2
            id="a-propos-title"
            className="mt-3 font-display text-4xl font-semibold text-ink md:text-6xl"
          >
            Une vie à la batterie
          </h2>
          <div className="hairline mt-8 max-w-2xl" />
        </Reveal>

        <div className="mt-14 grid gap-12 lg:grid-cols-[380px_1fr] lg:gap-16">
          <Reveal className="lg:sticky lg:top-28 lg:self-start">
            <div className="relative">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={`${musician?.name || person.name}, batteur de jazz`}
                  loading="lazy"
                  className="aspect-[4/5] w-full rounded-sm object-cover shadow-xl"
                />
              ) : (
                <div className="aspect-[4/5] w-full rounded-sm bg-ivory-deep" />
              )}
              <div className="absolute inset-0 rounded-sm ring-1 ring-brass/40 ring-offset-4 ring-offset-ivory" />
              <div className="absolute -bottom-6 -right-4 bg-ink px-6 py-4 text-ivory shadow-lg">
                <p className="font-display text-2xl font-semibold">
                  {musician?.name || person.name}
                </p>
                <p className="text-xs uppercase tracking-[0.25em] text-brass">
                  {musician?.instrument || 'Batterie'}
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="columns-1 gap-12 md:columns-2 [&>div>*:first-child]:mt-0">
              <PortableText value={musician?.bio} />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
