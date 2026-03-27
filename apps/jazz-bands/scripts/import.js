import { createClient } from '@sanity/client'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import 'dotenv/config'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = join(__dirname, '..')
const OUTPUT_DIR = join(PROJECT_ROOT, 'migration', 'output')
const IMPORT_FILE = join(OUTPUT_DIR, 'sanity-import.json')

const dataset = process.argv[2]
const projectId = process.env.SANITY_STUDIO_PROJECT_ID
const token = process.env.SANITY_API_WRITE_TOKEN

if (!dataset || !projectId || !token) {
  console.error('Missing args/env vars')
  process.exit(1)
}

const client = createClient({ projectId, dataset, token, apiVersion: '2025-01-10', useCdn: false })
console.log('Dataset:', dataset, '\n')

function ensureKeys(doc) {
  if (!doc || typeof doc !== 'object') return doc
  if (Array.isArray(doc)) {
    return doc.map((item, index) => {
      const itemWithKey = ensureKeys(item)
      if (!itemWithKey._key && itemWithKey._type) {
        itemWithKey._key = 'key_' + index
      }
      return itemWithKey
    })
  }
  const result = { ...doc }
  for (const [key, value] of Object.entries(result)) {
    result[key] = ensureKeys(value)
  }
  return result
}

function replaceRefs(doc, assetIdMap) {
  if (doc === null || typeof doc !== 'object') return doc
  
  // Handle root-level _sanityAsset (direct file reference)
  if (doc._sanityAsset) {
    const match = doc._sanityAsset.match(/image@file:\/\/(.*$)/)
    if (match && assetIdMap.has(match[1])) {
      return {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: assetIdMap.get(match[1])
        }
      }
    }
  }
  
  if (doc._type === 'reference' && doc._ref && assetIdMap.has(doc._ref)) {
    return { ...doc, _ref: assetIdMap.get(doc._ref) }
  }
  if ((doc._type === 'image' || doc._type === 'file') && doc.asset?._ref && assetIdMap.has(doc.asset._ref)) {
    return { ...doc, asset: { ...doc.asset, _ref: assetIdMap.get(doc.asset._ref) } }
  }
  // Handle asset._sanityAsset
  if ((doc._type === 'image' || doc._type === 'file') && doc.asset?._sanityAsset) {
    const match = doc.asset._sanityAsset.match(/image@file:\/\/(.*$)/)
    if (match && assetIdMap.has(match[1])) {
      return { ...doc, asset: { _type: 'reference', _ref: assetIdMap.get(match[1]) } }
    }
  }
  if (Array.isArray(doc)) {
    return doc.map(item => replaceRefs(item, assetIdMap))
  }
  const updatedDoc = {}
  for (const [key, value] of Object.entries(doc)) {
    updatedDoc[key] = replaceRefs(value, assetIdMap)
  }
  return updatedDoc
}

async function main() {
  const content = readFileSync(IMPORT_FILE, 'utf-8')
  const docs = content.trim().split('\n').map(line => JSON.parse(line))
  
  const fixedDocs = docs.map(ensureKeys)
  const assetDocs = fixedDocs.filter(d => d._type?.includes('Asset'))
  const regularDocs = fixedDocs.filter(d => !assetDocs.includes(d))
  
  const assetIdMap = new Map()
  
  // Upload predefined assets
  if (assetDocs.length > 0) {
    console.log('Uploading', assetDocs.length, 'assets...')
    for (const doc of assetDocs) {
      try {
        const { createReadStream } = await import('fs')
        const assetPath = join(OUTPUT_DIR, doc.path)
        const ext = doc.extension || 'jpeg'
        const mimeTypes = { jpeg: 'image/jpeg', jpg: 'image/jpeg', png: 'image/png', mp3: 'audio/mpeg' }
        const stream = createReadStream(assetPath)
        const result = await client.assets.upload(
          doc._type === 'sanity.imageAsset' ? 'image' : 'file',
          stream,
          { filename: doc.path.split('/').pop(), contentType: mimeTypes[ext] }
        )
        assetIdMap.set(doc._id, result._id)
      } catch (error) {
        console.error('Upload error:', doc._id)
      }
    }
    console.log('Uploaded', assetIdMap.size, 'assets')
  }
  
  // Handle _sanityAsset paths (direct file references)
  console.log('Processing _sanityAsset references...')
  const sanityAssetFiles = new Set()
  for (const doc of regularDocs) {
    // Check backgroundImage field
    if (doc.backgroundImage?.asset?._sanityAsset) {
      const match = doc.backgroundImage.asset._sanityAsset.match(/image@file:\/\/(.*$)/)
      if (match) sanityAssetFiles.add(match[1])
    } else if (doc.backgroundImage?._sanityAsset) {
      const match = doc.backgroundImage._sanityAsset.match(/image@file:\/\/(.*$)/)
      if (match) sanityAssetFiles.add(match[1])
    }
    
    // Check contentImages array
    if (Array.isArray(doc.contentImages)) {
      for (const img of doc.contentImages) {
        if (img._sanityAsset) {
          const match = img._sanityAsset.match(/image@file:\/\/(.*$)/)
          if (match) sanityAssetFiles.add(match[1])
        }
      }
    }
  }
  
  if (sanityAssetFiles.size > 0) {
    console.log('Uploading', sanityAssetFiles.size, '_sanityAsset file(s)...')
    for (const [idx, filePath] of Array.from(sanityAssetFiles).entries()) {
      try {
        const { createReadStream } = await import('fs')
        const ext = filePath.split('.').pop() || 'jpeg'
        const mimeTypes = { jpeg: 'image/jpeg', jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }
        const stream = createReadStream(filePath)
        const result = await client.assets.upload('image', stream, {
          filename: filePath.split('/').pop(),
          contentType: mimeTypes[ext] || 'image/jpeg'
        })
        assetIdMap.set(filePath, result._id)
        console.log('  [' + (idx+1) + '/' + sanityAssetFiles.size + '] Uploaded ' + result._id)
      } catch (error) {
        console.error('  Upload error for ' + filePath + ':', error.message)
      }
    }
  }
  
  console.log('')
  
  const updatedDocs = regularDocs.map(doc => replaceRefs(doc, assetIdMap))
  const bands = updatedDocs.filter(d => d._type === 'band')
  const musicians = updatedDocs.filter(d => d._type === 'musician')
  
  console.log('Phases:')
  console.log('  1. Create bands (without bandMembers)')
  console.log('  2. Create musicians (without bands ref)')
  console.log('  3. Patch bands with bandMembers')
  console.log('  4. Patch musicians with bands ref', '\n')
  
  for (const band of bands) {
    const { bandMembers, ...bandWithoutMembers } = band
    await client.createOrReplace(bandWithoutMembers).catch((err) => {
      console.error(`❌ Failed to create/replace ${band.slug.current}:`, err.message)
    })
  }
  console.log('✓ Phase 1: Created/Replaced', bands.length, 'bands')
  
  for (const musician of musicians) {
    const { bands: _, bandOverrides, ...musicianClean } = musician
    await client.createOrReplace(musicianClean).catch((err) => {
      console.error(`❌ Failed to create/replace ${musician.slug.current}:`, err.message)
    })
  }
  console.log('✓ Phase 2: Created/Replaced', musicians.length, 'musicians')
  
  for (const band of bands) {
    if (band.bandMembers && band.bandMembers.length > 0) {
      await client.patch(band._id).set({ bandMembers: band.bandMembers }).commit()
    }
  }
  console.log('✓ Phase 3: Patched bandMembers')
  
  for (const musician of musicians) {
    if (musician.bands && musician.bands.length > 0) {
      await client.patch(musician._id).set({ bands: musician.bands }).commit()
    }
  }
  console.log('✓ Phase 4: Patched bands references')
  
  console.log('\n' + '═══════════════════════════════════')
  console.log('✅ Import complete!')
  console.log('   -', bands.length, 'bands')
  console.log('   -', musicians.length, 'musicians')
  if (assetIdMap.size > 0) {
    console.log('   -', assetIdMap.size, 'assets')
  }
}

main().catch(error => { console.error('Fatal:', error.message); process.exit(1) })
