/**
 * Centralized Sanity CMS Configuration
 *
 * Required environment variables:
 * - SANITY_STUDIO_PROJECT_ID: Sanity project ID
 * - SANITY_STUDIO_DATASET: Sanity dataset
 *
 * Optional:
 * - VITE_SANITY_PROXY_URL / SANITY_PROXY_URL: Proxy prefix for CDN bypass + caching
 *   When set, @sanity/client routes all API calls through this URL.
 *   Example: http://localhost:5173/sanity
 * - SANITY_STUDIO_API_READ_TOKEN: Read token (not needed for public datasets)
 */

import { type ClientConfig, createClient } from '@sanity/client'
import createImageUrlBuilder from '@sanity/image-url'
import type { ImageMetadata } from 'sanity'

/**
 * Get environment variables safely (works in both Node and browser)
 */
function getEnv() {
  if (typeof process !== 'undefined' && process.env) {
    return process.env
  }
  if (typeof document !== 'undefined') {
    const projectId =
      document.querySelector('meta[name="sanity-project-id"]')?.getAttribute('content') || ''
    const dataset =
      document.querySelector('meta[name="sanity-dataset"]')?.getAttribute('content') || ''
    if (projectId) {
      return { SANITY_PROJECT_ID: projectId, SANITY_DATASET: dataset } as Record<string, string>
    }
  }
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env
  }
  return {}
}

const env = getEnv()

const projectId =
  env.VITE_SANITY_STUDIO_PROJECT_ID ||
  env.VITE_SANITY_PROJECT_ID ||
  env.SANITY_STUDIO_PROJECT_ID ||
  env.SANITY_PROJECT_ID
const dataset =
  env.VITE_SANITY_STUDIO_DATASET ||
  env.VITE_SANITY_DATASET ||
  env.SANITY_STUDIO_DATASET ||
  env.SANITY_DATASET
const apiReadToken =
  env.VITE_SANITY_STUDIO_API_READ_TOKEN ||
  env.VITE_SANITY_API_READ_TOKEN ||
  env.SANITY_STUDIO_API_READ_TOKEN ||
  env.SANITY_API_READ_TOKEN

if (!projectId) {
  throw new Error(
    'Missing required environment variable: SANITY_STUDIO_PROJECT_ID',
  )
}
if (!dataset) {
  throw new Error(
    'Missing required environment variable: SANITY_STUDIO_DATASET',
  )
}

const baseConfig: ClientConfig = {
  projectId,
  dataset,
  apiVersion: '2025-01-10',
  useCdn: true,
  token: apiReadToken,
}

// --- Proxy support ---
// When SANITY_PROXY_URL is set, redirect API calls through a local proxy (Varnish, Express, etc.)
// to cache responses and reduce direct Sanity API quota usage.
// Uses useProjectHostname: false so the hostname resolves to just {apiHost}/v{apiVersion}/...
const SANITY_PROXY =
  env.VITE_SANITY_PROXY_URL || env.SANITY_PROXY_URL || ''

const proxyConfig = SANITY_PROXY
  ? { useProjectHostname: false, apiHost: SANITY_PROXY }
  : {}

/**
 * Server-side Sanity client
 */
export const sanityClient =
  typeof window === 'undefined'
    ? createClient({
      ...baseConfig,
      ...proxyConfig,
      useCdn: false,
    })
    : (undefined as never)

/**
 * Browser-side Sanity client
 */
export const sanityClientBrowser = createClient({
  ...baseConfig,
  ...proxyConfig,
})

/**
 * Image URL builder for Sanity images
 * Always hits cdn.sanity.io directly (not affected by proxy config)
 */
export const urlForImage = createImageUrlBuilder({
  projectId: projectId,
  dataset: dataset,
})

export function imageurl(source: ImageMetadata) {
  return urlForImage.image(source)
}
