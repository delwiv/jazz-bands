/**
 * Centralized Sanity CMS Configuration
 *
 * All Sanity-related environment variables should use the SANITY_STUDIO_* prefix
 * for consistency across the application.
 *
 * Required environment variables:
 * - SANITY_STUDIO_PROJECT_ID: Sanity project ID
 * - SANITY_STUDIO_DATASET: Sanity dataset (default: 'production')
 * - SANITY_STUDIO_API_READ_TOKEN: Read token for client-side access (optional)
 * - SANITY_STUDIO_API_WRITE_TOKEN: Write token for server-side access (optional)
 */

import { type ClientConfig, createClient } from '@sanity/client'
import { type ImageMetadata } from 'sanity'
import createImageUrlBuilder from '@sanity/image-url'

// Environment variables (required: projectId, dataset)
const projectId = process.env.SANITY_STUDIO_PROJECT_ID
const dataset = process.env.SANITY_STUDIO_DATASET

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

const apiReadToken = process.env.SANITY_STUDIO_API_READ_TOKEN
const apiWriteToken = process.env.SANITY_STUDIO_API_WRITE_TOKEN

// Base configuration
export const baseConfig: ClientConfig = {
  projectId,
  dataset,
  apiVersion: '2025-01-10',
  useCdn: true,
  token: apiReadToken,
}

if (!projectId) {
  console.warn(
    '⚠️ SANITY_STUDIO_PROJECT_ID environment variable is not set',
  )
}

/**
 * Server-side Sanity client
 * Uses write token if available, otherwise falls back to read token
 * CDN disabled for real-time data
 */
export const sanityClient = createClient({
  ...baseConfig,
  useCdn: false,
  token: apiWriteToken || apiReadToken,
})

/**
 * Browser-side Sanity client
 * Read-only with CDN enabled
 */
export const sanityClientBrowser = createClient(baseConfig)

/**
 * Image URL builder for Sanity images
 */
export const urlForImage = createImageUrlBuilder({
  projectId,
  dataset,
})

export function imageurl(source: ImageMetadata) {
  return urlForImage(source).url()
}

/**
 * Build CDN URL for audio files
 * @param audioRef - Sanity audio asset reference ID
 * @returns CDN URL for the audio file with .mp3 extension
 */
export function getAudioCdnUrl(audioRef: string): string {
  return `https://cdn.sanity.io/${projectId}/${dataset}/${audioRef}.mp3`
}
