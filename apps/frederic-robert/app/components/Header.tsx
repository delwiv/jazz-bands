import { clsx } from 'clsx'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'

const NAV_LINKS = [
  { href: '/#a-propos', label: 'À propos' },
  { href: '/#groupes', label: 'Les groupes' },
  { href: '/#actualites', label: 'Actualités' },
  { href: '/galerie', label: 'Galerie' },
  { href: '/#contact', label: 'Contact' },
]

export function Header({ personName }: { personName: string }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={clsx(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-ivory/90 backdrop-blur-md shadow-[0_1px_0_0_var(--color-stone-line)]'
          : 'bg-transparent',
      )}
    >
      <div className="container-hub flex h-16 items-center justify-between md:h-20">
        <Link
          to="/"
          className={clsx(
            'flex items-center gap-3 font-display text-xl font-semibold tracking-wide transition-colors',
            scrolled ? 'text-ink' : 'text-ivory',
          )}
          aria-label={`${personName} — Accueil`}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-brass/70 font-display text-sm font-bold tracking-wider text-brass">
            FR
          </span>
          <span className="hidden sm:inline">{personName}</span>
        </Link>

        <nav aria-label="Navigation principale">
          <ul className="flex items-center gap-1 md:gap-2">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  to={link.href}
                  className={clsx(
                    'rounded-full px-3 py-2 text-sm font-medium tracking-wide transition-colors md:px-4',
                    scrolled
                      ? 'text-ink/80 hover:text-wine hover:bg-ink/5'
                      : 'text-ivory/85 hover:text-white hover:bg-white/10',
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  )
}
