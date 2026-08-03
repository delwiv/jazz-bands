/**
 * Create the initial `person_frederic-robert` document in Sanity.
 *
 * Usage:
 *   export SANITY_API_WRITE_TOKEN=sk-...
 *   node scripts/create-person.mjs            # uses SANITY_DATASET (default: staging)
 *   SANITY_DATASET=production node scripts/create-person.mjs
 *
 * Idempotent: creates the document only if it does not exist yet.
 */
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import dotenv from 'dotenv'
import { createClient } from '@sanity/client'

const scriptDir = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(scriptDir, '../.env') })
dotenv.config({ path: resolve(scriptDir, '../../../.env') })

const projectId = process.env.SANITY_PROJECT_ID || '94fpfdn8'
const dataset = process.env.SANITY_DATASET || 'staging'
const token = process.env.SANITY_API_WRITE_TOKEN

if (!token) {
  console.error('Missing SANITY_API_WRITE_TOKEN environment variable')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2025-01-10',
  token,
  useCdn: false,
})

const PERSON_ID = 'person_frederic-robert'
const MUSICIAN_ID = 'musician_frederic-robert'
const BAND_IDS = [
  'band_boheme',
  'band_canto',
  'band_jazzola',
  'band_swing-family',
  'band_trio-rsh',
  'band_west-side-trio',
]

const existing = await client.fetch(`*[_id == $id][0] { _id }`, { id: PERSON_ID })
if (existing) {
  console.log(`[person] Document ${PERSON_ID} already exists in ${dataset} — nothing to do.`)
  process.exit(0)
}

const musician = await client.fetch(`*[_id == $id][0] { _id }`, { id: MUSICIAN_ID })
if (!musician) {
  console.error(`[person] Musician ${MUSICIAN_ID} not found in ${dataset}. Import the band data first.`)
  process.exit(1)
}

const doc = {
  _id: PERSON_ID,
  _type: 'person',
  name: 'Frédéric Robert',
  slug: { _type: 'slug', current: 'frederic-robert' },
  tagline: 'Batteur de jazz — une vie entre swing, brésil et musette.',
  musician: { _type: 'reference', _ref: MUSICIAN_ID },
  bookingEmail: '',
  bands: BAND_IDS.map((bandId) => ({
    _key: `band_${bandId.replace('band_', '')}`,
    _type: 'hubBandLink',
    band: { _type: 'reference', _ref: bandId },
  })),
  seo: {
    metaTitle: 'Frédéric Robert — Batteur de Jazz',
    metaDescription:
      'Frédéric Robert, batteur de jazz et manager de groupes : Boheme, Canto, Jazzola, Swing Family, Trio RSH, West Side Trio.',
  },
  openGraph: {
    title: 'Frédéric Robert — Batteur de Jazz',
    description:
      'Batteur de jazz et manager de six formations : Boheme, Canto, Jazzola, Swing Family, Trio RSH, West Side Trio.',
  },
}

await client.create(doc)
console.log(`[person] Created ${PERSON_ID} in ${dataset}`)
