import { Link } from 'react-router'

export default function Catchall() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-6 text-ivory">
      <div className="text-center">
        <p className="font-display text-8xl font-semibold text-brass">404</p>
        <h1 className="mt-4 font-display text-3xl font-semibold">
          Page introuvable
        </h1>
        <p className="mt-3 text-ivory/60">
          La page que vous cherchez n'existe pas ou a été déplacée.
        </p>
        <Link
          to="/"
          className="mt-8 inline-block rounded-full border border-ivory/40 px-8 py-3 text-sm font-semibold uppercase tracking-[0.2em] transition-colors hover:border-brass hover:text-brass"
        >
          Retour à l'accueil
        </Link>
      </div>
    </div>
  )
}
