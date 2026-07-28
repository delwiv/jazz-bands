import { MongoClient } from 'mongodb'
import pg from 'pg'

const {
  MONGODB_MANAGR_PASSWORD,
  MONGODB_HOST = 'mongo:27017',
  DATABASE_URL,
} = process.env

const MONGO_URI = `mongodb://managr:${MONGODB_MANAGR_PASSWORD}@${MONGODB_HOST}/managr`

const KNOWN_COLUMNS = [
  'adresse', 'cd', 'cible', 'cp', 'date_cd', 'departement',
  'envoi_mail', 'legacy_id', 'mail', 'mail2', 'mail3',
  'mois_contact', 'mois_envoi', 'nom', 'notes',
  'responsable', 'responsable2', 'responsable3',
  'tel_perso', 'tel_pro', 'tel3', 'ville', 'vu_le', 'site',
]

const FIELD_MAP = {
  _id: 'legacy_id',
  sendMailStatus: 'send_mail_status',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
}

async function main() {
  console.log('Connecting to MongoDB...')
  const mongo = new MongoClient(MONGO_URI)
  await mongo.connect()
  const db = mongo.db('managr')
  const total = await db.collection('contacts').countDocuments()
  console.log(`Found ${total} contacts in MongoDB`)

  console.log('Connecting to PostgreSQL...')
  const pool = new pg.Pool({ connectionString: DATABASE_URL })
  await pool.query('SELECT 1')

  const cursor = db.collection('contacts').find()
  let count = 0
  let batch = []

  while (await cursor.hasNext()) {
    const doc = await cursor.next()
    const row = {}
    const extra = {}

    for (const [key, value] of Object.entries(doc)) {
      if (key === '__v') continue
      const pgKey = FIELD_MAP[key] || key
      if (KNOWN_COLUMNS.includes(pgKey)) {
        row[pgKey] = value
      } else if (pgKey !== '_id') {
        extra[pgKey] = value
      }
    }

    if (Object.keys(extra).length > 0) row.data = extra

    batch.push(row)
    count++

    if (batch.length >= 500) {
      await insertBatch(pool, batch)
      console.log(`Migrated ${count}/${total}`)
      batch = []
    }
  }

  if (batch.length > 0) {
    await insertBatch(pool, batch)
  }

  console.log(`✅ Done: ${count} contacts migrated`)
  await mongo.close()
  await pool.end()
}

async function insertBatch(pool, rows) {
  if (rows.length === 0) return
  const cols = Object.keys(rows[0])
  const params = []
  const valueRows = []

  for (const row of rows) {
    const vals = cols.map(c => {
      if (c === 'send_mail_status' && row[c]) return JSON.stringify(row[c])
      if (c === 'data' && row[c]) return JSON.stringify(row[c])
      return row[c] ?? null
    })
    params.push(...vals)
    valueRows.push(vals.map((_, i) => `$${params.length - vals.length + i + 1}`))
  }

  const sql = `INSERT INTO contacts (${cols.join(', ')}) VALUES ${valueRows.map(v => `(${v.join(', ')})`).join(', ')} ON CONFLICT DO NOTHING`
  await pool.query(sql, params)
}

main().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
