// biome-ignore-all lint/a11y/useKeyWithClickEvents: backdrop/stopPropagation are pointer conveniences; Escape and arrows are handled via window listener
import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { type LoaderFunctionArgs, useLoaderData } from 'react-router'
import { Reveal } from '~/components/Reveal'
import { buildGallery } from '~/lib/gallery'
import { loadHub } from '~/lib/loaders'

export async function loader({ request }: LoaderFunctionArgs) {
  return loadHub(request)
}

export function meta({
  loaderData,
}: {
  loaderData: Awaited<ReturnType<typeof loader>> | null
}) {
  if (!loaderData?.person) return []
  const name = loaderData.person.name || 'Frédéric Robert'
  return [
    { title: `Galerie — ${name}` },
    {
      name: 'description',
      content: `Galerie photos de ${name}, batteur de jazz à Nantes.`,
    },
  ]
}

export default function Galerie() {
  const { person } = useLoaderData<typeof loader>()
  const items = buildGallery(person)
  const [selected, setSelected] = useState<number | null>(null)

  useEffect(() => {
    if (selected === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null)
      if (e.key === 'ArrowRight')
        setSelected((s) => (s === null ? s : (s + 1) % items.length))
      if (e.key === 'ArrowLeft')
        setSelected((s) =>
          s === null ? s : (s - 1 + items.length) % items.length,
        )
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [selected, items.length])

  return (
    <div className="bg-ivory pb-24">
      <header className="bg-ink pb-16 pt-32 text-ivory md:pb-20 md:pt-40">
        <div className="container-hub">
          <p className="eyebrow">Galerie</p>
          <h1 className="mt-3 font-display text-5xl font-semibold md:text-7xl">
            Instants de musique
          </h1>
          <p className="mt-4 max-w-xl text-ivory/70">
            Concerts, studios et coulisses — un regard sur le parcours d'un
            batteur.
          </p>
        </div>
      </header>

      {items.length === 0 ? (
        <p className="container-hub mt-16 text-ink/60">
          La galerie sera bientôt disponible.
        </p>
      ) : (
        <div className="container-hub columns-2 gap-4 pt-12 md:columns-3 md:gap-6">
          {items.map((item, i) => (
            <Reveal key={item.id} className="mb-4 break-inside-avoid md:mb-6">
              <button
                type="button"
                onClick={() => setSelected(i)}
                className="group relative block w-full cursor-zoom-in overflow-hidden rounded-sm shadow-sm"
                aria-label={`Agrandir la photo ${i + 1} : ${item.caption || item.alt}`}
              >
                <img
                  src={item.src}
                  alt={item.alt}
                  loading="lazy"
                  className="w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
                {item.caption && (
                  <span className="absolute inset-x-0 bottom-0 bg-ink/70 px-4 py-2 text-left text-xs text-ivory opacity-0 transition-opacity group-hover:opacity-100">
                    {item.caption}
                  </span>
                )}
              </button>
            </Reveal>
          ))}
        </div>
      )}

      {selected !== null && items[selected] && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/95 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Photo agrandie"
          onClick={() => setSelected(null)}
        >
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-ivory/30 text-ivory hover:border-brass hover:text-brass"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
          <figure
            className="max-h-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={items[selected].src}
              alt={items[selected].alt}
              className="max-h-[80vh] w-auto rounded-sm object-contain shadow-2xl"
            />
            {items[selected].caption && (
              <figcaption className="mt-4 text-center font-display text-lg italic text-ivory/80">
                {items[selected].caption}
              </figcaption>
            )}
          </figure>
        </div>
      )}
    </div>
  )
}
