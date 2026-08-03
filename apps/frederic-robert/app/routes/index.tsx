import { type LoaderFunctionArgs, useLoaderData } from 'react-router'
import { PersonStructuredData } from '~/components/StructuredData'
import type { BandCard } from '~/components/sections/Bands'
import { Bands } from '~/components/sections/Bands'
import { Bio } from '~/components/sections/Bio'
import { Contact } from '~/components/sections/Contact'
import { Gallery } from '~/components/sections/Gallery'
import { Hero } from '~/components/sections/Hero'
import { News } from '~/components/sections/News'
import { getImageUrl } from '~/lib/images'
import { loadHub, resolveBandUrl } from '~/lib/loaders'
import { buildHubMeta } from '~/lib/seo'

export async function loader({ request }: LoaderFunctionArgs) {
  const data = await loadHub(request)

  const bandCards: BandCard[] = []
  for (const entry of data.person.bands ?? []) {
    const band = entry.band
    if (!band?.slug) continue
    const logo = getImageUrl(band.logo, 200)
    bandCards.push({
      name: band.name,
      slug: band.slug,
      url: resolveBandUrl(band.slug, entry.url),
      logo: logo || undefined,
      description: entry.description || band.shortDescription || undefined,
    })
  }

  return { ...data, bandCards }
}

export function meta({
  loaderData,
}: {
  loaderData: Awaited<ReturnType<typeof loader>> | null
}) {
  if (!loaderData?.person) return []

  const { title, description, ogImage } = buildHubMeta(
    loaderData.person,
    'home',
  )

  return [
    { title },
    { name: 'description', content: description },
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: `${loaderData.baseUrl}/` },
    ...(ogImage ? [{ property: 'og:image', content: ogImage }] : []),
    {
      name: 'twitter:card',
      content: ogImage ? 'summary_large_image' : 'summary',
    },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
  ]
}

export default function Index() {
  const { person, baseUrl, bandCards } = useLoaderData<typeof loader>()

  const bandLinks = bandCards.map((b) => ({ name: b.name, url: b.url }))

  return (
    <>
      <PersonStructuredData
        person={person}
        bandLinks={bandLinks}
        baseUrl={baseUrl}
      />
      <Hero person={person} />
      <Bio person={person} />
      <Bands bandCards={bandCards} />
      <News person={person} bandCards={bandCards} />
      <Gallery person={person} />
      <Contact person={person} />
    </>
  )
}
