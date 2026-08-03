import type { LoaderFunctionArgs } from 'react-router'
import { getPersonForSitemap } from '~/lib/queries'
import { sanityClient } from '~/lib/sanity.settings'

export async function loader({ request }: LoaderFunctionArgs) {
  const baseUrl = new URL(request.url).origin

  const person = await sanityClient.fetch(getPersonForSitemap)

  const urls = [
    { loc: `${baseUrl}/`, priority: '1.0' },
    { loc: `${baseUrl}/galerie`, priority: '0.7' },
  ]
  if (person?.slug) {
    urls.push({ loc: `${baseUrl}/${person.slug}`, priority: '0.5' })
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>monthly</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
