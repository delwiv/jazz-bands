import pg from 'pg'

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
})

const KNOWN_COLUMNS = [
  'adresse', 'cd', 'cible', 'cp', 'date_cd', 'departement',
  'departement_label', 'envoi_mail', 'legacy_id', 'mail', 'mail2', 'mail3',
  'mois_contact', 'mois_envoi', 'nom', 'notes',
  'responsable', 'responsable2', 'responsable3',
  'tel_perso', 'tel_pro', 'tel3', 'ville', 'vu_le', 'site',
  'send_mail_status',
]

const FIELD_MAP = {
  sendMailStatus: 'send_mail_status',
}

function splitFields(data) {
  const row = {}
  const extra = {}
  for (const [key, value] of Object.entries(data)) {
    if (key === 'checked') continue
    const col = FIELD_MAP[key] || key
    if (KNOWN_COLUMNS.includes(col)) {
      row[col] = value
    } else {
      extra[col] = value
    }
  }
  if (Object.keys(extra).length > 0) row.data = extra
  return row
}

function buildSetClause(row) {
  const entries = Object.entries(row)
  if (entries.length === 0) return { clause: '', values: [] }
  const clauses = ['updated_at = now()']
  const values = []
  for (const [key, value] of entries) {
    clauses.push(`${key} = $${values.length + 1}`)
    values.push(value !== undefined ? value : null)
  }
  return { clause: clauses.join(', '), values }
}

function toCamelCase(row) {
  if (!row) return null
  const result = {}
  for (const [key, value] of Object.entries(row)) {
    if (key === 'id') { result.id = value; continue }
    if (key === 'data') {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        for (const [k, v] of Object.entries(value)) result[k] = v
      }
      continue
    }
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
    result[camelKey] = value
  }
  return result
}

const query = (text, params) => pool.query(text, params)

export default {
  find: async (filter, fields) => {
    const select = fields || '*'
    let sql = `SELECT ${select} FROM contacts`
    const values = []
    const whereClauses = buildWhere(filter, values)
    if (whereClauses.length > 0) sql += ' WHERE ' + whereClauses.join(' AND ')
    sql += ' ORDER BY departement ASC, ville ASC, nom ASC'
    const result = await query(sql, values)
    return result.rows.map(toCamelCase)
  },

  countDocuments: async (filter) => {
    let sql = 'SELECT COUNT(*) FROM contacts'
    const values = []
    const whereClauses = buildWhere(filter, values)
    if (whereClauses.length > 0) sql += ' WHERE ' + whereClauses.join(' AND ')
    const result = await query(sql, values)
    return parseInt(result.rows[0].count, 10)
  },

  findOne: async (filter) => {
    const values = []
    const whereClauses = buildWhere(filter, values)
    if (whereClauses.length === 0) return null
    const sql = `SELECT * FROM contacts WHERE ${whereClauses.join(' AND ')} ORDER BY id ASC LIMIT 1`
    const result = await query(sql, values)
    return toCamelCase(result.rows[0] || null)
  },

  create: async (data) => {
    const row = splitFields(data)
    const cols = Object.keys(row).join(', ')
    const values = Object.values(row)
    const params = values.map((_, i) => `$${i + 1}`).join(', ')
    const sql = `INSERT INTO contacts (${cols}) VALUES (${params}) RETURNING *`
    const result = await query(sql, values)
    return toCamelCase(result.rows[0])
  },

  updateById: async (id, data) => {
    const { checked, ...body } = data
    const row = splitFields(body)
    const { clause, values } = buildSetClause(row)
    values.push(id)
    const sql = `UPDATE contacts SET ${clause} WHERE id = $${values.length} RETURNING *`
    const result = await query(sql, values)
    return toCamelCase(result.rows[0] || null)
  },

  deleteById: async (id) => {
    await query('DELETE FROM contacts WHERE id = $1', [id])
  },

  updateOneByEmail: async (email, update) => {
    const row = splitFields(update)
    if (row.send_mail_status) row.send_mail_status = JSON.stringify(row.send_mail_status)
    const { clause, values } = buildSetClause(row)
    values.push(email)
    const sql = `UPDATE contacts SET ${clause} WHERE (mail = $${values.length} OR mail2 = $${values.length} OR mail3 = $${values.length})`
    await query(sql, values)
  },

  findOneByEmail: async (email) => {
    const result = await query(
      'SELECT * FROM contacts WHERE mail = $1 OR mail2 = $1 OR mail3 = $1 ORDER BY id ASC LIMIT 1',
      [email]
    )
    return result.rows[0] || null
  },
}

function buildWhere(filter, values) {
  const clauses = []
  if (filter.id) {
    values.push(filter.id)
    clauses.push(`id = $${values.length}`)
  }
  if (filter.mois_contact) {
    values.push(filter.mois_contact)
    clauses.push(`mois_contact = $${values.length}`)
  }
  if (filter.ville_like) {
    values.push(`%${filter.ville_like}%`)
    clauses.push(`ville ILIKE $${values.length}`)
  }
  if (filter.email_errors_after) {
    values.push(filter.email_errors_after)
    clauses.push(`send_mail_status->>'status' ~ 'error:'`)
    clauses.push(`(send_mail_status->>'date')::timestamptz > $${values.length}`)
  }
  if (filter.search) {
    const term = `%${filter.search}%`
    const orClauses = [
      'nom', 'mail', 'mail2', 'mail3', 'responsable',
      'ville', 'notes', 'cible', 'tel_perso', 'tel_pro', 'tel3',
    ].map(f => {
      values.push(term)
      return `${f} ILIKE $${values.length}`
    })
    clauses.push(`(${orClauses.join(' OR ')})`)
  }
  return clauses
}
