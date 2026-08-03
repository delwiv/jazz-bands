import { Mail, Phone } from 'lucide-react'
import type { PersonHub, SocialLink } from '../../lib/types'
import { Reveal } from '../Reveal'

const PLATFORM_MONOGRAMS: Record<SocialLink['platform'], string> = {
  facebook: 'FB',
  instagram: 'IG',
  youtube: 'YT',
  spotify: 'SP',
  tiktok: 'TT',
  twitter: 'X',
  bandcamp: 'BC',
  soundcloud: 'SC',
}

export function Contact({ person }: { person: PersonHub }) {
  const socials = person.socialMedia?.filter((s) => s.url) || []
  const hasContact = Boolean(
    person.bookingEmail || person.phone || socials.length > 0,
  )

  if (!hasContact) return null

  return (
    <section
      id="contact"
      className="scroll-mt-24 bg-ink py-20 text-ivory md:py-28"
      aria-labelledby="contact-title"
    >
      <div className="container-hub">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <p className="eyebrow">Contact & réservation</p>
            <h2
              id="contact-title"
              className="mt-3 font-display text-4xl font-semibold md:text-6xl"
            >
              Un concert, un projet, une rencontre
            </h2>
            <p className="mt-6 text-ivory/70">
              Pour toute réservation, booking ou demande d'information, écrivez
              directement — réponse rapide garantie.
            </p>
          </Reveal>

          <Reveal delay={100}>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
              {person.bookingEmail && (
                <a
                  href={`mailto:${person.bookingEmail}`}
                  className="inline-flex items-center gap-3 rounded-full bg-brass px-8 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-ivory transition-colors hover:bg-brass-light"
                >
                  <Mail className="h-4 w-4" />
                  {person.bookingEmail}
                </a>
              )}
              {person.phone && (
                <a
                  href={`tel:${person.phone.replace(/\s/g, '')}`}
                  className="inline-flex items-center gap-3 rounded-full border border-ivory/40 px-8 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-ivory transition-colors hover:border-brass hover:text-brass"
                >
                  <Phone className="h-4 w-4" />
                  {person.phone}
                </a>
              )}
            </div>
          </Reveal>

          {socials.length > 0 && (
            <Reveal delay={200}>
              <div className="mt-12 flex items-center justify-center gap-6">
                {socials.map((social) => (
                  <a
                    key={social.platform}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.platform}
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-ivory/25 font-display text-sm font-semibold tracking-wider text-ivory/80 transition-all hover:border-brass hover:text-brass"
                  >
                    {PLATFORM_MONOGRAMS[social.platform] || 'FR'}
                  </a>
                ))}
              </div>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  )
}
