import type { LoaderFunctionArgs } from 'react-router'
import { getBandBySlug, getAllTourDates, getMusicianSlugsForSitemap } from '~/lib/queries'
import { sanityClient } from '~/lib/sanity.settings'

export async function loader({ request }: LoaderFunctionArgs) {
  const bandSlug = process.env.BAND_SLUG

  if (!bandSlug) {
    throw new Error('BAND_SLUG environment variable is required')
  }

  const band = await sanityClient.fetch(getBandBySlug, { slug: bandSlug })

  if (!band) {
    throw new Response('Band not found', { status: 404 })
  }

  const tourData = await sanityClient.fetch(getAllTourDates, { bandSlug })
  const musicianSlugs = await sanityClient.fetch(getMusicianSlugsForSitemap, {
    bandSlug,
  })

  const url = new URL(request.url)
  const hostname = url.hostname
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
  const base = `${protocol}://${hostname}`
  const today = new Date().toISOString().split('T')[0]

  const staticUrls = [
    { loc: '/', changefreq: 'weekly', priority: '1.0' },
    { loc: '/gallery', changefreq: 'weekly', priority: '0.8' },
    { loc: '/musicians', changefreq: 'weekly', priority: '0.8' },
    { loc: '/tour', changefreq: 'daily', priority: '0.9' },
    { loc: '/contact', changefreq: 'monthly', priority: '0.6' },
    { loc: '/about', changefreq: 'monthly', priority: '0.5' },
  ]

  const musicianUrls =
    musicianSlugs
      ?.filter((m: { slug: string | null }) => m.slug)
      .map(
        (m: { slug: string }) => `
  <url>
    <loc>${base}/musicians/${m.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`,
      )
      .join('') || ''

  const tourUrls =
    tourData?.tourDates
      ?.filter((d: { slug: string | null }) => d.slug)
      .map(
        (d: { slug: string; date: string }) => `
  <url>
    <loc>${base}/tour/${d.slug}</loc>
    <lastmod>${d.date?.split('T')[0] || today}</lastmod>
    <changefreq>never</changefreq>
    <priority>0.6</priority>
  </url>`,
      )
      .join('') || ''

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls
  .map(
    (u) => `  <url>
    <loc>${base}${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join('\n')}
${musicianUrls}${tourUrls}</urlset>`

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  })
}

export default function Sitemap() {
  return null
}
