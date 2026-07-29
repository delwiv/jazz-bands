import { execSync } from 'child_process'
import { MongoClient } from 'mongodb'
import pg from 'pg'
import { join } from 'path'
import { readFileSync } from 'fs'

const PROJECT_ROOT = join(import.meta.dirname, '..', '..', '..')

function envValue(key) {
  const envFile = readFileSync(join(PROJECT_ROOT, '.env'), 'utf-8')
  const match = envFile.match(new RegExp(`^${key}=['"]?(.+?)['"]?$`, 'm'))
  return match ? match[1] : null
}

function exec(cmd) {
  const shell = process.env.SHELL || '/usr/bin/bash'
  try {
    return execSync(cmd, { encoding: 'utf-8', timeout: 5000, shell }).trim()
  } catch {
    return null
  }
}

function containerIP(name) {
  return exec(`docker inspect ${name} -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'`)
}

const MONGO_PW = envValue('MONGODB_MANAGR_PASSWORD') || envValue('MONGODB_ROOT_PASSWORD')
const PG_PW = envValue('POSTGRES_MANAGR_PASSWORD') || envValue('POSTGRES_PASSWORD')

const MONGO_IP = containerIP('mongo') || containerIP('mongo-legacy')
const PG_IP = containerIP('postgres-prod') || containerIP('postgres-dev') || containerIP('postgres')

if (!MONGO_IP) { console.error('❌ MongoDB container not found (tried: mongo)'); process.exit(1) }
if (!PG_IP)   { console.error('❌ PostgreSQL container not found (tried: postgres-prod, postgres-dev, postgres)'); process.exit(1) }
if (!MONGO_PW) { console.error('❌ MONGODB_MANAGR_PASSWORD not found in .env'); process.exit(1) }
if (!PG_PW)   { console.error('❌ POSTGRES_MANAGR_PASSWORD not found in .env'); process.exit(1) }

const MONGO_URI = `mongodb://managr:${MONGO_PW}@${MONGO_IP}:27017/managr`
const DATABASE_URL = `postgres://managr:${PG_PW}@${PG_IP}:5432/managr`

const KNOWN_COLUMNS = [
  'adresse', 'cd', 'cible', 'cp', 'date_cd', 'departement',
  'envoi_mail', 'legacy_id', 'mail', 'mail2', 'mail3',
  'mois_contact', 'mois_envoi', 'nom', 'notes',
  'responsable', 'responsable2', 'responsable3',
  'tel_perso', 'tel_pro', 'tel3', 'ville', 'vu_le', 'site',
  'send_mail_status', 'created_at', 'updated_at',
]

const FIELD_MAP = {
  _id: 'legacy_id',
  sendMailStatus: 'send_mail_status',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
}

function splitDoc(doc) {
  const row = {}
  const extra = {}
  for (const [key, value] of Object.entries(doc)) {
    if (key === '__v') continue
    const col = FIELD_MAP[key] || key
    if (KNOWN_COLUMNS.includes(col)) {
      row[col] = value
    } else {
      extra[col] = value
    }
  }
  if (Object.keys(extra).length > 0) row.data = extra
  if (!row.send_mail_status) row.send_mail_status = {}
  if (!row.data) row.data = {}
  return row
}

async function main() {
  console.log(`MongoDB:  ${MONGO_URI}`)
  console.log(`Postgres: ${DATABASE_URL}\n`)

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
    const row = splitDoc(doc)
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
      if ((c === 'send_mail_status' || c === 'data') && row[c]) return JSON.stringify(row[c])
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
