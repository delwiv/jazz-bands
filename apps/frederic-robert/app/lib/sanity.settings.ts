/**
 * Centralized Sanity CMS Configuration (shared project with jazz-bands)
 *
 * Required environment variables:
 * - SANITY_PROJECT_ID (or VITE_SANITY_PROJECT_ID / SANITY_STUDIO_PROJECT_ID)
 * - SANITY_DATASET (or VITE_SANITY_DATASET / SANITY_STUDIO_DATASET)
 *
 * Optional:
 * - SANITY_PROXY_URL: Proxy prefix for CDN bypass + caching
 *   When set, @sanity/client routes all API calls through this URL.
 *   Example: http://localhost:5174/sanity
 * - SANITY_API_READ_TOKEN: Read token
 */

import { type ClientConfig, createClient } from '@sanity/client'
import createImageUrlBuilder from '@sanity/image-url'

/**
 * Get environment variables safely (works in both Node and browser)
 */
function getEnv() {
  if (typeof process !== 'undefined' && process.env) {
    return process.env
  }
  if (typeof document !== 'undefined') {
    const projectId =
      document
        .querySelector('meta[name="sanity-project-id"]')
        ?.getAttribute('content') || ''
    const dataset =
      document
        .querySelector('meta[name="sanity-dataset"]')
        ?.getAttribute('content') || ''
    if (projectId) {
      return {
        SANITY_PROJECT_ID: projectId,
        SANITY_DATASET: dataset,
      } as Record<string, string>
    }
  }
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env
  }
  return {}
}

const env = getEnv()

const projectId =
  env.VITE_SANITY_PROJECT_ID ||
  env.SANITY_STUDIO_PROJECT_ID ||
  env.SANITY_PROJECT_ID
const dataset =
  env.VITE_SANITY_DATASET || env.SANITY_STUDIO_DATASET || env.SANITY_DATASET
const apiReadToken =
  env.VITE_SANITY_API_READ_TOKEN ||
  env.SANITY_STUDIO_API_READ_TOKEN ||
  env.SANITY_API_READ_TOKEN

if (!projectId) {
  throw new Error('Missing required environment variable: SANITY_PROJECT_ID')
}
if (!dataset) {
  throw new Error('Missing required environment variable: SANITY_DATASET')
}

const baseConfig: ClientConfig = {
  projectId,
  dataset,
  apiVersion: '2025-01-10',
  useCdn: true,
  token: apiReadToken,
}

// --- Proxy support ---
// When SANITY_PROXY_URL is set, redirect API calls through a local proxy (Express)
// to cache responses and reduce direct Sanity API quota usage.
const SANITY_PROXY = env.VITE_SANITY_PROXY_URL || env.SANITY_PROXY_URL || ''

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
 * Image URL builder for Sanity images
 * Always hits cdn.sanity.io directly (not affected by proxy config)
 */
export const urlForImage = createImageUrlBuilder({
  projectId,
  dataset,
})
