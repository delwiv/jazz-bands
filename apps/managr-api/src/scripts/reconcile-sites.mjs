import { MongoClient } from 'mongodb'
import pg from 'pg'

const MONGO_PW = process.env.MONGODB_MANAGR_PASSWORD
const MONGO_HOST = process.env.MONGODB_HOST || 'mongo'
const MONGO_URI = process.env.MONGODB_URI || `mongodb://managr:${MONGO_PW}@${MONGO_HOST}/managr`
const DATABASE_URL = process.env.DATABASE_URL

const APPLY = process.argv.includes('--apply')
const DRY_RUN = process.argv.includes('--dry-run') || !APPLY
const BATCH_SIZE = 500

const normalizeId = id =>
  typeof id === 'string' ? id.replace(/^"(.*)"$/, '$1').trim() : String(id ?? '')

async function main() {
  if (!MONGO_PW && !process.env.MONGODB_URI) {
    console.error('❌ MONGODB_MANAGR_PASSWORD not found in env')
    process.exit(1)
  }
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in env')
    process.exit(1)
  }

  console.log(`Mode: ${APPLY ? 'APPLY (writes)' : 'DRY-RUN (no writes)'}`)
  console.log(`Mongo:  ${MONGO_URI.replace(/:[^:@/]+@/, ':***@')}`)
  console.log(`Postgres: ${DATABASE_URL.replace(/:[^:@/]+@/, ':***@')}\n`)

  const mongo = new MongoClient(MONGO_URI)
  await mongo.connect()
  const db = mongo.db('managr')
  const cursor = db
    .collection('contacts')
    .find({ site: { $exists: true, $nin: [null, ''] } }, { projection: { _id: 1, site: 1 } })

  const mongoSites = new Map()
  for await (const doc of cursor) {
    if (typeof doc.site === 'string' && doc.site.trim()) {
      mongoSites.set(String(doc._id), doc.site.trim())
    }
  }
  await mongo.close()
  console.log(`Mongo: ${mongoSites.size} contacts with a non-empty site`)

  const pool = new pg.Pool({ connectionString: DATABASE_URL })

  if (APPLY) {
    const norm = await pool.query(`UPDATE contacts SET legacy_id = btrim(legacy_id, '"') WHERE legacy_id LIKE '"%"'`)
    if (norm.rowCount > 0) console.log(`Normalized ${norm.rowCount} quoted legacy_id values`)
  }

  const { rows } = await pool.query(
    'SELECT legacy_id FROM contacts WHERE site IS NULL AND legacy_id IS NOT NULL'
  )
  const nullLegacyIds = new Set(rows.map(r => normalizeId(r.legacy_id)))
  const quotedCount = rows.filter(r => /^".*"$/.test(r.legacy_id ?? '')).length
  if (quotedCount > 0) console.log(`Postgres: ${quotedCount} legacy_id values quoted (will be normalized)`)
  console.log(`Postgres: ${nullLegacyIds.size} rows with site IS NULL (lost in migration)`)

  const toRestore = [...mongoSites.entries()].filter(([id]) => nullLegacyIds.has(id))
  const skipped = mongoSites.size - toRestore.length
  console.log(`To restore: ${toRestore.length} (${skipped} already present in PG or unmatched)`)

  if (DRY_RUN) {
    for (const [id, site] of toRestore.slice(0, 10)) {
      console.log(`  would restore ${id}: ${site}`)
    }
    if (toRestore.length > 10) console.log('  …')
    console.log(`\nDry-run: ${toRestore.length} fixes needed. Re-run with --apply to restore them.`)
    await pool.end()
    return
  }

  let restored = 0
  for (let i = 0; i < toRestore.length; i += BATCH_SIZE) {
    const batch = toRestore.slice(i, i + BATCH_SIZE)
    for (const [id, site] of batch) {
      await pool.query('UPDATE contacts SET site = $1 WHERE legacy_id = $2', [site, id])
    }
    restored += batch.length
    console.log(`Restored ${restored}/${toRestore.length}`)
  }

  console.log(`✅ Done: ${restored} sites restored`)
  await pool.end()
}

main().catch(err => {
  console.error('Reconciliation failed:', err)
  process.exit(1)
})
