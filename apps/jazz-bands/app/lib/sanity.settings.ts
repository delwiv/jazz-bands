/**
 * Centralized Sanity CMS Configuration
 *
 * All Sanity-related environment variables should use the SANITY_STUDIO_* prefix
 * for consistency across the application.
 *
 * Required environment variables:
 * - SANITY_STUDIO_PROJECT_ID: Sanity project ID
 * - SANITY_STUDIO_DATASET: Sanity dataset
 * - SANITY_STUDIO_API_READ_TOKEN: Read token for API access (REQUIRED)
 *
 * Note: Write token is NOT used in this frontend application (read-only).
 */

import { type ClientConfig, createClient } from '@sanity/client'
import createImageUrlBuilder from '@sanity/image-url'
import type { ImageMetadata } from 'sanity'

/**
 * Get environment variables safely (works in both Node and browser)
 */
function getEnv() {
  // Server-side: use process.env
  // Client-side: use import.meta.env (Vite)
  if (typeof process !== 'undefined' && process.env) {
    return process.env
  }
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env
  }
  return {}
}

const env = getEnv()

// Environment variables (all required)
// Vite requires VITE_ prefix for client-side access
// Check client vars first (import.meta.env), then server vars (process.env)
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

// Validate required environment variables (both server and client)
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
if (!apiReadToken) {
  throw new Error(
    'Missing required environment variable: SANITY_API_READ_TOKEN',
  )
}

// Base configuration
const baseConfig: ClientConfig = {
  projectId,
  dataset,
  apiVersion: '2025-01-10',
  useCdn: true,
  token: apiReadToken,
}

/**
 * Server-side Sanity client
 * Uses read token only (write token not needed for frontend app)
 * CDN disabled for real-time data
 *
 * ⚠️ Server-side only - will throw in browser
 */
export const sanityClient =
  typeof window === 'undefined'
    ? createClient({
      ...baseConfig,
      useCdn: false,
    })
    : (undefined as never) // Type guard for client-side

/**
 * Browser-side Sanity client
 * Read-only with CDN enabled
 */
export const sanityClientBrowser = createClient(baseConfig)

/**
 * Image URL builder for Sanity images
 * Client-side safe - only uses projectId
 */
export const urlForImage = createImageUrlBuilder({
  projectId: projectId,
  dataset: dataset,
})

export function imageurl(source: ImageMetadata) {
  return urlForImage.image(source)
}

/**
 * Build CDN URL for audio files
 * @param audioRef - Sanity audio asset reference ID
 * @returns CDN URL for the audio file with .mp3 extension
 */
export function getAudioCdnUrl(audioRef: string): string {
  return `https://cdn.sanity.io/${projectId || ''}/${dataset || ''}/${audioRef}.mp3`
}
