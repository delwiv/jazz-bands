import { execSync } from 'child_process'
import { MongoClient } from 'mongodb'
import pg from 'pg'
import { join } from 'path'
import { readFileSync } from 'fs'
import readline from 'readline'

const PROJECT_ROOT = join(import.meta.dirname, '..', '..', '..')

function envValue(key) {
  if (process.env[key]) return process.env[key]
  try {
    const envFile = readFileSync(join(PROJECT_ROOT, '.env'), 'utf-8')
    const match = envFile.match(new RegExp(`^${key}=['"]?(.+?)['"]?$`, 'm'))
    return match ? match[1] : null
  } catch {
    return null
  }
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

function maskURL(url) {
  return url.replace(/:\/\/[^@]+@/, '://***:***@')
}

const MONGO_PW = envValue('MONGODB_MANAGR_PASSWORD') || envValue('MONGODB_ROOT_PASSWORD')
const PG_PW = envValue('POSTGRES_MANAGR_PASSWORD') || envValue('POSTGRES_PASSWORD')

if (!MONGO_PW) {
  console.error('❌ MONGODB_MANAGR_PASSWORD (ou MONGODB_ROOT_PASSWORD) introuvable dans .env')
  process.exit(1)
}

function resolveMongoURI() {
  const host = process.env.MONGODB_HOST
    || containerIP('mongo') || containerIP('mongo-legacy')
    || 'mongo'
  return `mongodb://managr:${MONGO_PW}@${host.includes(':') ? host : `${host}:27017`}/managr`
}

function resolvePgURL() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL
  if (!PG_PW) return null
  const host = containerIP('postgres-prod') || containerIP('postgres-dev') || containerIP('postgres') || 'postgres'
  return `postgres://managr:${PG_PW}@${host}:5432/managr`
}

const MONGO_URI = resolveMongoURI()
const DATABASE_URL = resolvePgURL()
if (!DATABASE_URL) {
  console.error('❌ POSTGRES_MANAGR_PASSWORD introuvable dans .env (ou définir DATABASE_URL)')
  process.exit(1)
}

function confirm() {
  return new Promise(resolve => {
    let settled = false
    const done = ok => {
      if (!settled) { settled = true; resolve(ok) }
    }
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    rl.question('Tape YES pour continuer : ', answer => done(answer.trim() === 'YES'))
    rl.on('close', () => done(false))
  })
}

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
  console.log(`MongoDB  source : ${maskURL(MONGO_URI)}`)
  console.log(`Postgres cible  : ${maskURL(DATABASE_URL)}`)
  console.log('ℹ️ INSERT only — ne vide pas la table. Doublons ignorés via legacy_id (index unique).\n')

  if (!process.argv.includes('--yes')) {
    const ok = await confirm()
    if (!ok) {
      console.error('❌ Abandon (réponse ≠ YES ou stdin fermé). Relance avec --yes pour sauter le prompt.')
      process.exit(1)
    }
  }

  console.log('Connecting to MongoDB...')
  const mongo = new MongoClient(MONGO_URI)
  await mongo.connect()
  const db = mongo.db('managr')
  const total = await db.collection('contacts').countDocuments()
  console.log(`Found ${total} contacts in MongoDB`)

  console.log('Connecting to PostgreSQL...')
  const pool = new pg.Pool({ connectionString: DATABASE_URL })
  await pool.query('SELECT 1')
  await pool.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_legacy_id ON contacts (legacy_id)')

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

  console.log(`✅ Done: ${count} contacts migrated (doublons éventuels ignorés via legacy_id)`)
  await mongo.close()
  await pool.end()
}

async function insertBatch(pool, rows) {
  if (rows.length === 0) return
  const cols = [...new Set(rows.flatMap(r => Object.keys(r)))]
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

  const sql = `INSERT INTO contacts (${cols.join(', ')}) VALUES ${valueRows.map(v => `(${v.join(', ')})`).join(', ')} ON CONFLICT (legacy_id) DO NOTHING`
  await pool.query(sql, params)
}

main().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
