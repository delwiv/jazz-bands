import { getBandBySlug } from './queries'
import { sanityClient } from './sanity.settings'

export interface BandLoaderResult {
  band: any
  baseUrl: string
  bandSlug: string
}

export async function loadBand(
  request: Request,
): Promise<BandLoaderResult> {
  const bandSlug = process.env.BAND_SLUG
  if (!bandSlug) throw new Error('BAND_SLUG environment variable is required')

  const band = await sanityClient.fetch(getBandBySlug, { slug: bandSlug })
  if (!band) {
    throw new Response(`Band "${bandSlug}" not found`, { status: 404 })
  }

  const url = new URL(request.url)
  const baseUrl = `${url.protocol}//${url.host}`

  return { band, baseUrl, bandSlug }
}
