/**
 * Centralized Sanity settings for shared use
 * Read from SANITY_STUDIO_* environment variables
 */

export const SANITY_PROJECT_ID = process.env.SANITY_STUDIO_PROJECT_ID || ''
export const SANITY_DATASET = process.env.SANITY_STUDIO_DATASET || 'production'
export const SANITY_API_READ_TOKEN = process.env.SANITY_STUDIO_API_READ_TOKEN
export const SANITY_API_WRITE_TOKEN = process.env.SANITY_STUDIO_API_WRITE_TOKEN
