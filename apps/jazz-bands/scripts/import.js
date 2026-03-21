#!/usr/bin/env node
/**
 * Sanity import script with automatic asset upload
 * Usage: npm run import <dataset> [--replace]
 * 
 * This script:
 * 1. Reads NDJSON import file
 * 2. Extracts asset documents (sanity.imageAsset, sanity.fileAsset)
 * 3. Uploads actual asset files to Sanity via API
 * 4. Replaces mock asset IDs with real Sanity asset IDs in all documents
 * 5. Imports corrected documents
 */

import { createClient } from '@sanity/client'
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createWriteStream } from 'fs'
import { pipeline } from 'stream/promises'
import { Readable } from 'stream'
import 'dotenv/config'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = join(__dirname, '..')
const OUTPUT_DIR = join(PROJECT_ROOT, 'migration', 'output')
const IMPORT_FILE = join(OUTPUT_DIR, 'sanity-import.json')

const dataset = process.argv[2]
const replace = process.argv.includes('--replace')

if (!dataset) {
  console.error('Error: Dataset name required')
  console.error('Usage: npm run import <dataset> [--replace]')
  console.error('Examples:')
  console.error('  npm run import staging')
  console.error('  npm run import production --replace')
  process.exit(1)
}

const token = process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_IMPORT_TOKEN

if (!token) {
  console.error('Error: SANITY_API_WRITE_TOKEN or SANITY_IMPORT_TOKEN not set')
  console.error('Please set one of these in your .env file')
  process.exit(1)
}

const projectId = process.env.SANITY_PROJECT_ID || '94fpfdn8'

if (!projectId) {
  console.error('Error: SANITY_PROJECT_ID not set in .env')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: '2025-01-10',
  useCdn: false,
})

console.log(`📍 Connecting to Sanity project ${projectId}, dataset ${dataset}...`)

async function main() {
  const ndjsonContent = readFileSync(IMPORT_FILE, 'utf-8')
  const lines = ndjsonContent.trim().split('\n')
  const documents = lines.map(line => JSON.parse(line))

  console.log(`📄 Read ${documents.length} documents from import file`)

  const assetDocs = documents.filter(doc => 
    doc._type === 'sanity.imageAsset' || doc._type === 'sanity.fileAsset'
  )
  
  const regularDocs = documents.filter(doc => 
    doc._type !== 'sanity.imageAsset' && doc._type !== 'sanity.fileAsset'
  )

  console.log(`📦 Found ${assetDocs.length} asset documents, ${regularDocs.length} regular documents`)

  if (assetDocs.length === 0) {
    console.log('⚠️  No asset documents found. Importing documents as-is...')
    return importDocuments(regularDocs, replace)
  }

  const assetIdMap = new Map()

  console.log(`🚀 Uploading ${assetDocs.length} assets to Sanity...`)

  for (let i = 0; i < assetDocs.length; i++) {
    const assetDoc = assetDocs[i]
    const mockId = assetDoc._id
    const assetPath = join(OUTPUT_DIR, assetDoc.path)
    
    console.log(`  [${i + 1}/${assetDocs.length}] Uploading ${mockId}...`)

    try {
      const { stat } = await import('fs/promises')
      const fileStat = await stat(assetPath)
      
      const realAssetId = await uploadAsset(client, assetPath, assetDoc)
      
      if (realAssetId) {
        assetIdMap.set(mockId, realAssetId)
        console.log(`     ✓ Uploaded as ${realAssetId}`)
      } else {
        console.log(`     ⚠️  Upload failed, skipping`)
      }
    } catch (error) {
      console.error(`     ✗ Error uploading ${mockId}: ${error.message}`)
    }
  }

  console.log(`✅ Uploaded ${assetIdMap.size} assets successfully`)

  const updatedDocs = regularDocs.map(doc => 
    replaceAssetReferences(doc, assetIdMap)
  )

  return importDocuments(updatedDocs, replace, assetIdMap.size)
}

async function uploadAsset(client, filePath, metadata) {
  const { createReadStream } = await import('fs')
  
  const ext = metadata.extension || 'jpeg'
  const mimeTypes = {
    'jpeg': 'image/jpeg',
    'jpg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
  }
  const mimeType = mimeTypes[ext] || 'application/octet-stream'

  const stream = createReadStream(filePath)
  
  const result = await client.assets.upload(
    metadata._type === 'sanity.imageAsset' ? 'image' : 'file',
    stream,
    {
      filename: metadata.originalFilename || metadata.path.split('/').pop(),
      contentType: mimeType,
    }
  )

  return result.assetId
}

function replaceAssetReferences(doc, assetIdMap) {
  if (doc === null || typeof doc !== 'object') {
    return doc
  }

  if (doc._type === 'reference' && doc._ref) {
    const realId = assetIdMap.get(doc._ref)
    if (realId) {
      return {
        ...doc,
        _ref: realId,
      }
    }
    return doc
  }

  if (doc._type === 'image' || doc._type === 'file') {
    if (doc.asset && doc.asset._type === 'reference' && doc.asset._ref) {
      const realId = assetIdMap.get(doc.asset._ref)
      if (realId) {
        return {
          ...doc,
          asset: {
            ...doc.asset,
            _ref: realId,
          },
        }
      }
    }
    return doc
  }

  if (Array.isArray(doc)) {
    return doc.map(item => replaceAssetReferences(item, assetIdMap))
  }

  const updatedDoc = {}
  for (const [key, value] of Object.entries(doc)) {
    updatedDoc[key] = replaceAssetReferences(value, assetIdMap)
  }

  return updatedDoc
}

async function importDocuments(documents, replace, numAssets = 0) {
  console.log(`📥 Importing ${documents.length} documents to Sanity...`)

  if (documents.length === 0) {
    console.log('✅ Import complete!')
    return
  }

  const tempFile = join(OUTPUT_DIR, `sanity-import-processed.json`)
  const ndjsonContent = documents.map(doc => JSON.stringify(doc)).join('\n')
  writeFileSync(tempFile, ndjsonContent)

  console.log(`📝 Saved processed import file: ${tempFile}`)
  console.log(`💡 Note: ${numAssets} assets were uploaded before import`)

  const { exec } = await import('child_process')
  const { promisify } = await import('util')
  const execAsync = promisify(exec)
  
  const replaceFlag = replace ? ' --replace' : ''
  const command = `npx sanity@latest dataset import "${tempFile}" --dataset ${dataset} --token ${token}${replaceFlag} --allow-failing-assets`

  try {
    console.log('\n🔄 Running Sanity import...')
    console.log(`   ${command.replace(token, '***').replace('npx sanity@latest ', 'sanity ') }\n`)
    await execAsync(command, { shell: '/usr/bin/bash', stdio: 'inherit' })
    console.log('\n✅ Import complete!')
    
    const { unlinkSync } = await import('fs')
    unlinkSync(tempFile)
    console.log(`🗑️  Cleaned up temporary import file`)
  } catch (error) {
    console.error('\n❌ Import failed:', error.message)
    console.log(`💾 Temporary import file preserved: ${tempFile}`)
    process.exit(1)
  }
}

// Run
main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
