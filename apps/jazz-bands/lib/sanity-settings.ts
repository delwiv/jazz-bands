/**
 * Centralized Sanity settings for shared use
 * Read from SANITY_STUDIO_* environment variables
 * 
 * Required: SANITY_STUDIO_PROJECT_ID, SANITY_STUDIO_DATASET
 * Optional: SANITY_STUDIO_API_READ_TOKEN, SANITY_STUDIO_API_WRITE_TOKEN
 */

const projectId = process.env.SANITY_STUDIO_PROJECT_ID
if (!projectId) {
  throw new Error('Missing required environment variable: SANITY_STUDIO_PROJECT_ID')
}

const dataset = process.env.SANITY_STUDIO_DATASET
if (!dataset) {
  throw new Error('Missing required environment variable: SANITY_STUDIO_DATASET')
}

export const SANITY_PROJECT_ID = projectId
export const SANITY_DATASET = dataset
export const SANITY_API_READ_TOKEN = process.env.SANITY_STUDIO_API_READ_TOKEN
export const SANITY_API_WRITE_TOKEN = process.env.SANITY_STUDIO_API_WRITE_TOKEN
