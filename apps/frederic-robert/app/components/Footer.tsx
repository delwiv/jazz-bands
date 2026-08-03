import { Link } from 'react-router'

export function Footer({ personName }: { personName: string }) {
  return (
    <footer className="bg-ink text-ivory/70">
      <div className="container-hub py-10">
        <div className="hairline mb-8" />
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-brass/70 font-display text-xs font-bold tracking-wider text-brass">
              FR
            </span>
            <div>
              <p className="font-display text-lg text-ivory">{personName}</p>
              <p className="text-xs tracking-[0.2em] uppercase text-brass">
                Batteur de jazz
              </p>
            </div>
          </div>

          <nav aria-label="Navigation pied de page">
            <ul className="flex flex-wrap justify-center gap-4 text-sm">
              <li>
                <Link to="/" className="hover:text-brass transition-colors">
                  Accueil
                </Link>
              </li>
              <li>
                <Link
                  to="/galerie"
                  className="hover:text-brass transition-colors"
                >
                  Galerie
                </Link>
              </li>
              <li>
                <Link
                  to="/#contact"
                  className="hover:text-brass transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </nav>

          <p className="text-xs text-ivory/50">
            © {new Date().getFullYear()} {personName} — Tous droits réservés
          </p>
        </div>
      </div>
    </footer>
  )
}
