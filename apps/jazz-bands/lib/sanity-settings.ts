/**
 * Centralized Sanity settings for shared use
 * Read from SANITY_STUDIO_* environment variables.
 *
 * The workspace .env files are loaded automatically (repo root first,
 * then a local .env in the current directory) so the Sanity CLI and
 * Studio work without manual exports. Falls back to the project's
 * well-known values when nothing is set.
 */

import dotenv from 'dotenv'

dotenv.config({ path: '../../.env', quiet: true }) // repo root (apps/jazz-bands -> root)
dotenv.config({ quiet: true }) // local ./.env if present (overrides nothing already set)

const projectId =
  process.env.SANITY_STUDIO_PROJECT_ID ||
  process.env.SANITY_PROJECT_ID ||
  '94fpfdn8'

const dataset =
  process.env.SANITY_STUDIO_DATASET ||
  process.env.SANITY_DATASET ||
  'production'

export const SANITY_PROJECT_ID = projectId
export const SANITY_DATASET = dataset
export const SANITY_API_READ_TOKEN = process.env.SANITY_STUDIO_API_READ_TOKEN
export const SANITY_API_WRITE_TOKEN = process.env.SANITY_STUDIO_API_WRITE_TOKEN
export const SANITY_PURGE_DOMAIN = process.env.SANITY_STUDIO_PURGE_DOMAIN || ''
