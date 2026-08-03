import { urlForImage } from './sanity.settings'
import type { PersonHub } from './types'

export interface HubMeta {
  title: string
  description: string
  ogImage?: string
}

const DEFAULT_TITLE = 'Frédéric Robert — Batteur de Jazz'
const DEFAULT_DESCRIPTION =
  'Frédéric Robert, batteur de jazz et manager de groupes : Boheme, Canto, Jazzola, Swing Family, Trio RSH, West Side Trio.'

/**
 * Build the page meta tags for the hub.
 * Falls back to sensible defaults when the CMS fields are empty.
 */
export function buildHubMeta(
  person: PersonHub,
  page: 'home' | 'galerie',
): HubMeta {
  const seo = person.seo
  const og = person.openGraph

  const title =
    page === 'home'
      ? seo?.metaTitle?.trim() || DEFAULT_TITLE
      : `Galerie — ${person.name || 'Frédéric Robert'}`

  const description =
    page === 'home'
      ? seo?.metaDescription?.trim() || DEFAULT_DESCRIPTION
      : `Galerie photos de ${person.name || 'Frédéric Robert'}, batteur de jazz.`

  const ogImageSource =
    og?.image?.asset || person.heroImage?.asset || person.musician?.photo?.asset
  const ogImage = ogImageSource
    ? urlForImage.image(ogImageSource).width(1200).format('jpg').url()
    : undefined

  return { title, description, ogImage }
}
