#!/usr/bin/env node

import { createClient } from '@sanity/client'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const envPath = resolve(__dirname, '..', '.env')

try {
  const envContent = readFileSync(envPath, 'utf-8')
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.+)$/)
    if (match) {
      process.env[match[1]] = match[2].trim()
    }
  })
} catch (err) {}

const projectId = process.env.SANITY_STUDIO_PROJECT_ID
const dataset = process.argv[2]
const token = process.env.SANITY_API_WRITE_TOKEN

if (!projectId || !dataset || !token) {
  console.error('Usage: node scripts/delete-documents.js <dataset>')
  process.exit(1)
}

const client = createClient({ projectId, dataset, apiVersion: '2024-01-01', useCdn: false, token })

console.log('')
console.log('🗑️  SANITY DOCUMENT CLEANUP')
console.log('═══════════════════════════')
console.log('')
console.log(`Dataset: ${dataset}`)
console.log('')

async function clearAllDocuments() {
  let totalDeleted = 0

  console.log('📋 Clearing bandMembers in bands...')
  const bands = await client.fetch('*[_type == "band"]{_id}')
  if (bands.length > 0) {
    const patches = bands.map(b => client.patch(b._id).set({ bandMembers: [] }))
    await Promise.all(patches.map(p => p.commit()))
    console.log(`   → Cleared ${bands.length} bands`)
  }

  console.log('📋 Clearing bands and overrides in musicians...')
  const musicians = await client.fetch('*[_type == "musician"]{_id}')
  if (musicians.length > 0) {
    const patches = musicians.map(m => 
      client.patch(m._id)
        .set({ bands: [] })
        .set({ bandOverrides: undefined })
    )
    await Promise.all(patches.map(p => p.commit()))
    console.log(`   → Cleared ${musicians.length} musicians`)
  }

  console.log('')
  console.log('📋 Deleting musicians...')
  for (const musician of musicians) {
    await client.delete(musician._id)
    totalDeleted++
  }
  console.log(`   ✅ Deleted ${totalDeleted} musician(s)`)

  console.log('📋 Deleting bands...')
  totalDeleted = 0
  for (const band of bands) {
    await client.delete(band._id)
    totalDeleted++
  }
  console.log(`   ✅ Deleted ${totalDeleted} band(s)`)

  return musicians.length + bands.length
}

try {
  console.log('')
  const total = await clearAllDocuments()
  console.log('')
  console.log('═══════════════════════════')
  console.log(`✅ Cleanup complete! Deleted ${total} document(s)`)
  console.log('')
} catch (error) {
  console.error('❌ Error:', error.message)
  process.exit(1)
}
