import { getPersonHub } from './queries'
import { sanityClient } from './sanity.settings'
import type { HubLoaderData } from './types'

/**
 * Resolve a band site URL:
 * 1. Per-band override from the CMS (url field)
 * 2. BAND_URL_PATTERN env with {slug} placeholder
 */
export function resolveBandUrl(bandSlug: string, override?: string): string {
  if (override?.trim()) return override.trim()
  const pattern =
    process.env.BAND_URL_PATTERN || 'https://{slug}.jazz.wildredbeard.tech'
  return pattern.replace('{slug}', bandSlug)
}

export async function loadHub(request: Request): Promise<HubLoaderData> {
  const person = await sanityClient.fetch(getPersonHub)
  if (!person) {
    throw new Response('Person not found', { status: 404 })
  }

  const baseUrl = new URL(request.url).origin

  return {
    person,
    baseUrl,
  }
}
