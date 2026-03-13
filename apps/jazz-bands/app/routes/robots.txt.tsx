import type { LoaderFunctionArgs } from 'react-router'

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
  const hostname = url.hostname

  const robots = `User-agent: *
Allow: /

# Crawl-delay for polite crawling
Crawl-delay: 10

# Sitemap location
Sitemap: ${protocol}://${hostname}/sitemap.xml
`

  return new Response(robots, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400, s-maxage=604800',
    },
  })
}

export default function Robots() {
  return null
}
