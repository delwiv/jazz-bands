#!/usr/bin/env node

/**
 * MongoDB → Sanity Migration Script
 *
 * Migrates data from MongoDB to Sanity with image optimization.
 *
 * Usage:
 *   npm run extract                      # Execute extraction
 *   DRY_RUN=true npm run extract         # Preview only
 *   npm run import staging               # Import to staging
 *   npm run import production            # Import to production
 */

import 'dotenv/config'
import { MongoClient } from 'mongodb'
import { writeFileSync, mkdirSync, existsSync, copyFileSync, rmSync } from 'fs'
import { join, basename } from 'path'
import { stat } from 'fs/promises'
import { parseFile } from 'music-metadata'
import {
  classifyImage,
  optimizeImage,
  formatBytes,
  isImageFile,
  isAudioFile,
  estimateOutputSize,
} from './optimize.js'
import {
  estimateOptimizationSavings,
} from './asset-scanner.js'
import {
  normalizeMusicianName,
  mergeMusicianData,
  createBandOverride,
  generateMusicianSlug,
  htmlToSanityBlock,
} from './deduplication.js'

// Configuration
const MONGODB_URI =
  process.env.MONGODB_URI ||
  `mongodb://root:${process.env.MONGODB_ROOT_PASSWORD || ''}@${process.env.MONGODB_HOST || 'localhost'}:27017`

const OUTPUT_DIR = './migration/output'

const DRY_RUN = process.env.DRY_RUN === 'true'

const BAND_MAPPING = {
  boheme: 'boheme',
  mpquartet: 'canto',
  jazzola: 'jazzola',
  'swing-family': 'swing-family',
  'trio-rsh': 'trio-rsh',
  'west-side-trio': 'west-side-trio',
}

const GLOBAL_STATS = {
  totalDocuments: 0,
  totalAssets: 0,
  originalSize: 0,
  estimatedSize: 0,
  skippedDateCount: 0,
  byBand: {},
  byTier: {
    background: { count: 0, size: 0 },
    standard: { count: 0, size: 0 },
    thumbnail: { count: 0, size: 0 },
    audio: { count: 0, size: 0 },
  },
}

// Contact consolidation accumulator
const CONTACT_CONSOLIDATION = {
  emails: [],
  phones: [],
  socialMedia: [],
}

// Global asset collection
global.allAssets = []

// Global asset document generator
let assetCounter = 0

// Import fs sync functions for scanning
import { readdirSync } from 'fs'

// =====================================================
// Musician Image Matching Functions
// =====================================================

/**
 * Maps filename keywords to musician full names
 * Used to identify musician portraits from filesystem scans
 */
const MUSICIAN_NAME_MAPPING = {
  'fred': 'Fréderic Robert',
  'frederic': 'Fréderic Robert',
  'robert': 'Fréderic Robert',
  'guillaume': 'Guillaume Souriau',
  'souriau': 'Guillaume Souriau',
  'daniel': 'Daniel Givone',
  'givone': 'Daniel Givone',
  'gwen': 'Gwen Cahue',
  'cahue': 'Gwen Cahue',
  'emeric': 'Emeric Chevalier',
  'chevalier': 'Emeric Chevalier',
  'jacques': 'Jacques Julienne',
  'julienne': 'Jacques Julienne',
  'antoine': 'Antoine Hervier',
  'hervier': 'Antoine Hervier',
  'remy': 'Rémy Hervo',
  'hervo': 'Rémy Hervo',
  'remi': 'Rémy Hervo',
  'elora': 'Elora Antolin',
  'antolin': 'Elora Antolin',
  'jaypee': 'Jean-Patrick Cosset',
  'jean-patrick': 'Jean-Patrick Cosset',
  'jeanpatrick': 'Jean-Patrick Cosset',
  'cosset': 'Jean-Patrick Cosset',
  'jp': 'Jean-Patrick Cosset',
}

/**
 * Identifies musician name from filename
 * Strips extension, numeric prefixes, and matches keywords
 * @param {string} filename - e.g., "13 Daniel .jpeg", "fred-visage.png"
 * @returns {string|null} Musician full name or null
 */
function identifyMusicianFromFilename(filename) {
  // Remove extension
  let name = filename.replace(/\.[^/.]+$/, '')
  
  // Remove numeric prefixes and common patterns
  name = name.replace(/^\d+\s*[-_]?/, '') // "13 Daniel" -> "Daniel"
  name = name.replace(/[-_]\d+$/, '')    // "fred-13" -> "fred"
  name = name.trim().toLowerCase()
  
  // Remove common image keywords that aren't names
  name = name.replace(/\b(visage|portrait|photo)\b/g, ' ')
  name = name.trim()
  
  // Split into words and find best match
  const words = name.split(/[\s_-]+/)
  
  // Try full match first
  if (MUSICIAN_NAME_MAPPING[name]) {
    return MUSICIAN_NAME_MAPPING[name]
  }
  
  // Try individual words
  for (const word of words) {
    if (MUSICIAN_NAME_MAPPING[word] && word.length > 2) {
      return MUSICIAN_NAME_MAPPING[word]
    }
  }
  
  return null
}

/**
 * Get all keywords that match a musician name
 * Includes full names, first names, last names, and nicknames
 */
function getMusicianKeywords(musicianName) {
  const keywords = new Set()
  
  // Add name parts
  musicianName.toLowerCase().split(' ').forEach(part => {
    if (part.length > 2) {
      keywords.add(part)
      // Remove common French accents for matching
      keywords.add(part.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
    }
  })
  
  // Check if this musician is in the mapping
  for (const [key, value] of Object.entries(MUSICIAN_NAME_MAPPING)) {
    if (value === musicianName) {
      keywords.add(key)
    }
  }
  
  // Add common nickname variations for known musicians
  const nicknameMap = {
    'Fréderic Robert': ['fred', 'frederic', 'robert'],
    'Rémy Hervo': ['remi', 'remy', 'hervo', 'herve'],
    'Jacques Julienne': ['jacques', 'julienne'],
    'Guillaume Souriau': ['guillaume', 'souriau'],
    'Jean-Patrick Cosset': ['jacob', 'jp', 'jaypee'],
  }
  
  const extras = nicknameMap[musicianName]
  if (extras) {
    extras.forEach(k => keywords.add(k))
  }
  
  return keywords
}

/**
 * Filters musician images - only attach files clearly belonging to the musician
 * @param {string} musicianName - Full musician name (e.g., "Daniel Givone")
 * @param {string[]} pictureFiles - Array of filenames from MongoDB pictures array
 * @returns {string[]} Filtered array of filenames to attach
 */
function filterMusicianImages(musicianName, pictureFiles) {
  if (!pictureFiles || pictureFiles.length === 0) return []
  
  const keywords = getMusicianKeywords(musicianName)
  
  return pictureFiles.filter(filename => {
    const lowerName = filename.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    
    // Priority 1: Filename contains musician's name or nickname
    const hasMusicianName = Array.from(keywords).some(keyword => 
      keyword.length > 2 && lowerName.includes(keyword)
    )
    
    // Priority 2: Filename contains portrait keywords (visage, portrait, photo)
    const hasPortraitKeyword = 
      lowerName.includes('visage') || 
      lowerName.includes('portrait') ||
      lowerName.includes('photo')
    
    // Skip instrument-only photos (batterie, guitare, etc.) unless they also have musician name
    const isInstrumentOnly = [
      'batterie', 'guitare', 'contrebasse', 'accordéon', 
      'piano', 'orgue', 'saxophone', 'trompette', 'trombone'
    ].some(inst => lowerName.includes(inst))
    
    if (isInstrumentOnly && !hasMusicianName) {
      return false
    }
    
    // Keep if has musician name OR portrait keyword
    return hasMusicianName || hasPortraitKeyword
  })
}

/**
 * Scans ALL band storage directories for images belonging to a specific musician
 * Used to populate portfolios for musicians with missing images (Daniel, Gwen, Emeric, Guillaume)
 * @param {string} musicianName - Full musician name
 * @param {Set} referencedFiles - Files already referenced in MongoDB
 * @returns {Map} Map of filename → filePath for musician images found
 */
function scanOrphanedImagesForMusician(musicianName, referencedFiles = new Set()) {
  const musicianImages = new Map()
  const nameParts = musicianName.toLowerCase().split(' ')
  
  // Scan ALL band storage directories
  for (const bandSlug of Object.values(BAND_MAPPING)) {
    const storageBase = getStoragePath(bandSlug, '')
    const storageDirs = ['Musicians', 'photos', 'img']
    
    for (const dirName of storageDirs) {
      const dirPath = join(storageBase, dirName)
      if (!existsSync(dirPath)) continue
      
      const files = readdirSync(dirPath)
      
      for (const file of files) {
        if (!isImageFile(file)) continue
        
        // Skip if already referenced in MongoDB
        if (referencedFiles.has(file)) continue
        
        const lowerName = file.toLowerCase()
        
        // Match musician name in filename
        const hasMusicianName = nameParts.some(part => 
          part.length > 2 && lowerName.includes(part)
        )
        
        if (hasMusicianName) {
          const filePath = join(dirPath, file)
          musicianImages.set(file, filePath)
        }
      }
    }
  }
  
return musicianImages
}

/**
 * Scans storage directories for band images (group shots, posters, event photos, backgrounds)
 * @param {string} bandSlug - Band identifier
 * @param {Set} referencedFiles - Files already referenced in MongoDB
 * @returns {Array} Array of {type, filePath, filename} for band images
 */
function scanBandImages(bandSlug, referencedFiles = new Set()) {
  const bandImages = []
  const storageBase = getStoragePath(bandSlug, '')
  const storageDirs = ['Musicians', 'photos', 'img']
  const bandNameLower = bandSlug.toLowerCase()
  
  for (const dirName of storageDirs) {
    const dirPath = join(storageBase, dirName)
    if (!existsSync(dirPath)) continue
    
    const files = readdirSync(dirPath)
    
    for (const file of files) {
      if (!isImageFile(file)) continue
      
      // Skip if already referenced
      if (referencedFiles.has(file)) continue
      
      const lowerName = file.toLowerCase()
      let imageType = 'generic'
      
      // Classify image type
      if (lowerName.includes('main') || lowerName === 'main.png' || lowerName === 'main.jpg') {
        imageType = 'hero'
      } else if (lowerName.includes('affiche') || lowerName.includes('poster') || lowerName.includes('flyer')) {
        imageType = 'poster'
      } else if (lowerName.includes('bg') || lowerName.includes('background') || lowerName.includes('fond')) {
        imageType = 'background'
      } else if (
        // Group shots (band name in filename or "groupe")
        lowerName.includes(bandNameLower) || 
        lowerName.includes('groupe') || 
        lowerName.includes('trio') ||
        lowerName.includes('quartet') ||
        lowerName.includes('quartet')
      ) {
        imageType = 'group'
      } else if (
        // Event/concert photos (high sequence numbers or "concert")
        /^\d{4,}/.test(file.replace(/\.[^/.]+$/, '')) ||
        lowerName.includes('concert')
      ) {
        imageType = 'event'
      }
      
      const filePath = join(dirPath, file)
      bandImages.push({
        type: imageType,
        filePath,
        filename: file
      })
    }
  }
  
  return bandImages
}

// Helper to construct storage path for legacy apps
function getStoragePath(bandSlug, relativePath) {
  const storageBase = `/home/leon/dev/jazz-bands/apps/${bandSlug}/server/storage`
  return join(storageBase, relativePath)
}

// Scan all storage directories for images and audio
async function scanAllStorageAssets(
  bandSlug,
  stats,
  referencedFiles = new Set(),
) {
  const storageBase = getStoragePath(bandSlug, '')
  const storageDirs = ['Musicians', 'img', 'photos', 'audiofiles']

  for (const dirName of storageDirs) {
    const dirPath = join(storageBase, dirName)
    if (!existsSync(dirPath)) continue

    const { readdir } = await import('fs/promises')
    const files = await readdir(dirPath)

    for (const file of files) {
      const filePath = join(dirPath, file)
      if (!isImageFile(file) && !isAudioFile(file)) continue

      if (isAudioFile(file)) {
        continue // Audio handled separately in migrateBand
      }

      // Skip if already referenced in MongoDB (avoid double-counting)
      if (referencedFiles.has(file)) {
        continue
      }

      const category = classifyImage(file, filePath)
      const fileStat = await stat(filePath)

      stats.assets[category].count++
      stats.assets[category].size += fileStat.size
      GLOBAL_STATS.byTier[category].count++
      GLOBAL_STATS.byTier[category].size += fileStat.size

      if (DRY_RUN) {
        // console.log(
        //   `  ⚠️  Image: ${file} (${formatBytes(fileStat.size)}) - will optimize to ~${formatBytes(estimateOutputSize(fileStat.size, 'sanity-source'))} for Sanity (DRY_RUN)`,
        // )
      }
    }
  }
}

// Helper to extract filename from MongoDB API path or use as-is
// =====================================================
// Deduplication Helper Functions
// =====================================================

/**
 * Collects all musicians from all databases with source tracking
 * @returns {Array} Array of { musician, sourceBand, sourceId }
 */
async function collectAllMusicians(client) {
  const allMusicians = []

  for (const [dbName, bandSlug] of Object.entries(BAND_MAPPING)) {
    const db = client.db(dbName)

    try {
      const cursor = db.collection('Musician').find()

      for await (const musician of cursor) {
        allMusicians.push({
          musician,
          sourceBand: bandSlug,
          sourceId: musician._id?.toString() || `unknown_${Date.now()}`,
        })
        if (DRY_RUN) {
          console.log(
            `    ✓ Found musician: ${musician.name} (${musician.instrument || 'N/A'}) from ${bandSlug}`,
          )
        }
      }

      if (DRY_RUN) {
        console.log(`  ✔️  Extracted ${allMusicians.filter((m) => m.sourceBand === bandSlug).length} musicians from ${dbName} (${bandSlug})`)
      }
    } catch (error) {
      console.log(
        `  ❌  ERROR in ${dbName} (${bandSlug}): ${error.message}`,
      )
      if (DRY_RUN) {
        console.log(`  ⚠️  No musicians collection found in ${dbName}`)
      }
    }
  }

  return allMusicians
}

/**
 * Deduplicates and merges musicians across all bands
 * @param {Array} allMusicians - Array of { musician, sourceBand, sourceId }
 * @returns {Object} { globalMusicians: Map, overrides: Map, stats: Object }
 */
async function deduplicateAndMergeMusicians(allMusicians) {
  // Group musicians by normalized name + instrument
  const groups = new Map()

  for (const { musician, sourceBand } of allMusicians) {
    const normalized = normalizeMusicianName(musician.name)
    if (!normalized) continue

    const instrument = musician.instrument?.toLowerCase().trim() || 'unknown'
    const key = `${normalized}|${instrument}`

    if (!groups.has(key)) {
      groups.set(key, [])
    }

    groups.get(key).push({
      musician,
      sourceBand,
      sourceId: musician._id?.toString() || `unknown_${Date.now()}`,
    })
  }

  const globalMusicians = new Map() // key -> merged musician object
  const overrides = new Map() // bandSlug -> [{ musicianId, override }]
  let duplicateGroups = 0
  let mergedCount = 0
  let uniqueCount = 0
  let overrideCount = 0

  for (const [key, candidates] of groups.entries()) {
    if (candidates.length === 1) {
      // No duplicates - use as-is
      const { musician, sourceBand } = candidates[0]
      // Generate musician ID from normalized name instead of MongoDB ID
      // This avoids ID collisions when databases are cloned
      const normalized = normalizeMusicianName(musician.name)
      const musicianId = normalized ? `musician_${normalized}` : `musician_unknown_${Date.now()}`
      
      globalMusicians.set(musicianId, {
        musician,
        sourceBands: [sourceBand],
      })
      uniqueCount++
      if (DRY_RUN) {
        console.log(
          `   [UNIQUE] ${musician.name} (${musician.instrument}) from ${sourceBand} (ID: ${musicianId})`,
        )
      }
      continue
    }

    // Found duplicates
    duplicateGroups++
    if (DRY_RUN) {
      console.log(
        `   [DUPLICATE GROUP ${duplicateGroups}] Key: ${key}`,
      )
      candidates.forEach((c, i) => {
        console.log(
          `     ${i + 1}. ${c.musician.name} (${c.musician.instrument}) from ${c.sourceBand} (ID: ${c.sourceId})`,
        )
      })
    }

    // Get storage base for the first band (used for image resolution checks)
    const firstBand = candidates[0].sourceBand
    const storageBase = getStoragePath(firstBand, '')

    // Merge candidates
    const merged = await mergeMusicianData(
      candidates.map((c) => c.musician),
      storageBase,
    )

    // Use the normalized name from the key as the musician ID (not MongoDB ID)
// key format is "normalized-name|instrument"
const [normalizedName] = key.split('|')
    const musicianId = `musician_${normalizedName}`
    const sourceBands = candidates.map((c) => c.sourceBand)

    globalMusicians.set(musicianId, {
      musician: merged.musician,
      sourceBands,
      sources: candidates,
    })
    mergedCount++

    if (DRY_RUN) {
      console.log(
        `     → Merged into: ${musicianId} (${sourceBands.join(', ')})`,
      )
    }

    // Create overrides for each band where data differs
    for (const candidate of candidates) {
      const override = createBandOverride(
        merged.musician,
        candidate.musician,
        candidate.sourceBand,
      )

      if (override) {
        overrideCount++

        if (!overrides.has(candidate.sourceBand)) {
          overrides.set(candidate.sourceBand, [])
        }
        overrides.get(candidate.sourceBand).push({
          musicianId,
          override,
        })
      }
    }
  }

  const stats = {
    totalMusicians: allMusicians.length,
    duplicateGroups,
    mergedCount,
    uniqueCount,
    globalMusicianCount: mergedCount + uniqueCount,
    overrideCount,
    bandsWithOverrides: overrides.size,
  }

  return { globalMusicians, overrides, stats }
}

/**
 * List of musicians known to need orphaned image scanning
 * These musicians have limited or no images in MongoDB
 */
const MUSICIANS_NEEDING_ORPHANED_SCANS = [
  'Daniel Givone',
  'Gwen Cahue', 
  'Emeric Chevalier',
  'Guillaume Souriau'
]

/**
 * Creates a Sanity musician document from MongoDB data
 * @param {Object} mongoMusician - MongoDB musician document
 * @param {Array} sourceBands - Array of band slugs this musician belongs to
 * @param {string} bandSlug - Current band being processed (for asset paths)
 * @param {Array} musicianOverrides - Optional band-specific overrides
 * @returns {Promise<Object>} Sanity musician document
 */
async function createSanityMusicianFromMongo(
  mongoMusician,
  sourceBands,
  bandSlug,
  musicianOverrides = [],
) {
  const bands = sourceBands.map((bandSlug) => ({
    _type: 'reference',
    _ref: `band_${bandSlug}`,
  }))

  // Build bandOverrides array (bidirectional reference)
  const bandOverrides = musicianOverrides
    .map((override) => ({
      _key: `override_${override.bandSlug}`,
      _type: 'musicianBandOverride',
      band: {
        _type: 'reference',
        _ref: `band_${override.bandSlug}`,
      },
      bio: override.override.bio || undefined,
      images: override.override.images || undefined,
      instrument: override.override.instrument || undefined,
    }))
    .filter((o) => o.bio || o.images || o.instrument)

 const sanityMusician = {
      _type: 'musician',
      _id: `musician_${generateMusicianSlug(mongoMusician.name)}`,
      name: mongoMusician.name,
      slug: {
        _type: 'slug',
        current: generateMusicianSlug(mongoMusician.name) || 'unnamed',
      },
      bio: htmlToSanityBlock(mongoMusician.description || ''),
     instrument: mongoMusician.instrument,
    images: [],
    bands,
    bandOverrides: bandOverrides.length > 0 ? bandOverrides : undefined,
  }

 // Process images - ONLY attach musician portraits (not band photos)
  if (mongoMusician.pictures && mongoMusician.pictures.length > 0) {
    const storageBase = getStoragePath(bandSlug, '')
    const storageDirs = ['Musicians', 'img', 'photos', '']
    
    // Extract filenames from MongoDB pictures array
    const pictureFileNames = mongoMusician.pictures.map(p => 
      extractFileNameFromMongoPath(p)
    ).filter(Boolean)
    
    // Filter to only include musician-specific images
    const filteredFileNames = filterMusicianImages(mongoMusician.name, pictureFileNames)
    
    for (const fileName of filteredFileNames) {
      // Search in storage directories for the file
      let actualPath = null
      for (const subDir of storageDirs) {
        const candidatePath = join(storageBase, subDir, fileName)
        if (existsSync(candidatePath)) {
          actualPath = candidatePath
          break
        }
      }
      
      if (actualPath && existsSync(actualPath)) {
        if (!DRY_RUN) {
          // Optimize for Sanity: single high-quality source image
          const optimized = await optimizeImage(
            actualPath,
            join(OUTPUT_DIR, 'assets', bandSlug, 'musicians'),
            'sanity-source',
            false,
          )
          
          if (optimized.success && optimized.optimizedFiles.length > 0) {
            for (const file of optimized.optimizedFiles) {
              const assetRef = await copyAssetToLocal(
                file.path,
                bandSlug,
                'image',
                global.allAssets,
                { assetType: 'musicianPhoto', title: mongoMusician.name }
              )
              sanityMusician.images.push({
                _type: 'image',
                asset: assetRef,
              })
            }
          }
        }
      }
    }
  }
  
  // Scan for orphaned images for musicians with missing photos
  // (Daniel, Gwen, Emeric, Guillaume)
  if (MUSICIANS_NEEDING_ORPHANED_SCANS.includes(mongoMusician.name)) {
    const { readdirSync } = import('fs/promises')
    const referencedFiles = new Set(
      (mongoMusician.pictures || []).map(p => 
        extractFileNameFromMongoPath(p)
      ).filter(Boolean)
    )
    
    const orphanedImages = scanOrphanedImagesForMusician(
      mongoMusician.name,
      referencedFiles
    )
    
    if (orphanedImages.size > 0) {
      console.log(`   → Found ${orphanedImages.size} orphaned image(s) for ${mongoMusician.name}`)
      
      // Add only ONE orphaned image (for initial 1-image requirement)
      if (sanityMusician.images.length === 0 && orphanedImages.size > 0) {
        const [orphanedFilename, orphanedPath] = Array.from(orphanedImages.entries())[0]
        
        if (!DRY_RUN) {
          const optimized = await optimizeImage(
            orphanedPath,
            join(OUTPUT_DIR, 'assets', bandSlug, 'musicians'),
            'sanity-source',
            false,
          )
          
          if (optimized.success && optimized.optimizedFiles.length > 0) {
            for (const file of optimized.optimizedFiles) {
              const assetRef = await copyAssetToLocal(
                file.path,
                bandSlug,
                'image',
                global.allAssets,
                { assetType: 'musicianPhoto', title: mongoMusician.name }
              )
              sanityMusician.images.push({
                _type: 'image',
                asset: assetRef,
              })
            }
          }
        }
      }
    }
  }
  
  return sanityMusician
}

function extractFileNameFromMongoPath(pictureData) {
  if (typeof pictureData === 'string') {
    // API path like "/api/Containers/Musicians/download/IMG_0783.JPG"
    const parts = pictureData.split('/')
    return parts.pop() || parts[parts.length - 1]
  } else if (pictureData && typeof pictureData.dlPath === 'string') {
    // Object with dlPath field (Loopback API path)
    const parts = pictureData.dlPath.split('/')
    return parts.pop() || parts[parts.length - 1]
  } else if (pictureData && typeof pictureData.path === 'string') {
    // Object with path field
    const parts = pictureData.path.split('/')
    return parts.pop() || parts[parts.length - 1]
  }
  return null
}

// Clean output directories before migration
function cleanOutputDirs() {
  if (DRY_RUN) {
    console.log('🧹 Skipping cleanup (DRY_RUN mode)')
    return
  }

  console.log('🧹 Cleaning output directories...')

  // Remove output directory
  if (existsSync(OUTPUT_DIR)) {
    rmSync(OUTPUT_DIR, { recursive: true, force: true })
    console.log(`   ✅ Cleaned ${OUTPUT_DIR}`)
  }

  // Recreate output directory
  mkdirSync(OUTPUT_DIR, { recursive: true })
  console.log('   ✅ Created fresh output directories')
  console.log('')
}

async function migrate() {
  console.log('')
  console.log('🔍 MONGODB → SANITY MIGRATION' + (DRY_RUN ? ' (DRY RUN)' : ''))
  console.log('═══════════════════════════════════════')
  console.log('')

  // Clean previous migration output
  cleanOutputDirs()

  const client = new MongoClient(MONGODB_URI)

  try {
    await client.connect({ serverSelectionTimeoutMS: 5000 })
    console.log('✅ Connected to MongoDB')

    const allDocuments = []
    let dedupeStats = null
    global.allAssets = [] // Reset global asset collection

    // =====================================================
    // PHASE 1: Collect all musicians from all bands
    // =====================================================
    console.log('\n📥 PHASE 1: Collecting all musicians...')
    const allMusicians = await collectAllMusicians(client)
    console.log(
      `   Found ${allMusicians.length} musician entries across ${Object.keys(BAND_MAPPING).length} bands`,
    )

    // =====================================================
    // PHASE 2: Deduplicate and merge musicians
    // =====================================================
    console.log('\n🔄 PHASE 2: Deduplicating and merging musicians...')
    const { globalMusicians, overrides, stats } =
      await deduplicateAndMergeMusicians(allMusicians)

    if (DRY_RUN) {
      for (const [dbName, bandSlug] of Object.entries(BAND_MAPPING)) {
        const bandMusicians = Array.from(globalMusicians.entries()).filter(
          ([_, data]) => data.sourceBands.includes(bandSlug),
        )
        console.log(
          `     ${bandSlug} (${dbName}): ${bandMusicians.length} musicians`,
        )
        bandMusicians.forEach(([id, { musician }]) => {
          console.log(`       - ${musician.name} (${musician.instrument})`)
        })
      }
    }
    dedupeStats = stats

    if (DRY_RUN) {
      console.log('')
      console.log('📊 DEDUPLICATION STATS:')
      console.log(
        `   Found ${stats.duplicateGroups} duplicate musician(s) across ${Object.keys(BAND_MAPPING).length} bands`,
      )
      console.log(
        `   Will merge to ${stats.globalMusicianCount} global musician(s)`,
      )
      console.log(
        `   Will create ${stats.overrideCount} band-specific override(s)`,
      )
      console.log('')
    }

    // =====================================================
    // PHASE 3: Create global musician documents
    // =====================================================
    console.log('\n👥 PHASE 3: Creating global musician documents...')
    const musicianDocs = []

    for (const [
      musicianId,
      { musician, sourceBands },
    ] of globalMusicians.entries()) {
      // Use first source band for asset paths
      const firstBand = sourceBands[0]

      // Get overrides for this musician
      const musicianOverrides = []
      for (const [bandSlug, bandOverrides] of overrides.entries()) {
        const overrideEntry = bandOverrides.find(
          (o) => o.musicianId === musicianId,
        )
        if (overrideEntry) {
          musicianOverrides.push({
            bandSlug,
            override: overrideEntry.override,
          })
        }
      }

      const sanityMusician = await createSanityMusicianFromMongo(
        musician,
        sourceBands,
        firstBand,
        musicianOverrides,
      )
      musicianDocs.push(sanityMusician)

      if (!DRY_RUN) {
        console.log(`   ✓ ${musician.name} (${sourceBands.join(', ')})`)
      }
    }

    allDocuments.push(...musicianDocs)
    console.log(`   Created ${musicianDocs.length} global musician documents`)

    // =====================================================
    // PHASE 4: Create band documents with bandMembers
    // =====================================================
    console.log('\n🎸 PHASE 4: Creating band documents...')

    for (const [dbName, bandSlug] of Object.entries(BAND_MAPPING)) {
      console.log(`\n📊 DATABASE: ${bandSlug} (MongoDB: ${dbName})`)

      const db = client.db(dbName)
      const bandStats = {
        musicians: 0,
        tourDates: 0,
        recordings: 0,
        assets: {
          background: { count: 0, size: 0 },
          standard: { count: 0, size: 0 },
          thumbnail: { count: 0, size: 0 },
          audio: { count: 0, size: 0 },
        },
      }

      // Get musicians for this band (from globalMusicians)
      const bandMusicianIds = new Set()
      for (const [
        musicianId,
        { sourceBands, sources },
      ] of globalMusicians.entries()) {
        if (sourceBands.includes(bandSlug)) {
          bandMusicianIds.add(musicianId)
        }
      }
      bandStats.musicians = bandMusicianIds.size

      // Get overrides for this band
      const bandOverrides = overrides.get(bandSlug) || []

      // Build bandMembers array
      const bandMembers = []

      // Add all musicians that belong to this band
      for (const [
        musicianId,
        { musician, sourceBands },
      ] of globalMusicians.entries()) {
        if (!sourceBands.includes(bandSlug)) continue

        if (DRY_RUN) {
          console.log(
            `    → Adding ${musician.name} to ${bandSlug}`,
          )
        }

        // Check if there's an override for this musician
        const overrideEntry = bandOverrides.find(
          (o) => o.musicianId === musicianId,
        )

        if (overrideEntry) {
          // Use override
          const bandMemberOverride = {
            _type: 'bandMember',
            musician: {
              _type: 'reference',
              _ref: musicianId,
            },
          }

          // Add override fields if they exist
          if (overrideEntry.override.bio) {
            bandMemberOverride.bio = overrideEntry.override.bio
          }
          if (overrideEntry.override.images) {
            bandMemberOverride.images = overrideEntry.override.images
          }
          if (overrideEntry.override.instrument) {
            bandMemberOverride.instrument = overrideEntry.override.instrument
          }

          bandMembers.push(bandMemberOverride)
        } else {
          // No override - just reference the musician
          bandMembers.push({
            _type: 'bandMember',
            musician: {
              _type: 'reference',
              _ref: musicianId,
            },
          })
        }
      }

      // Scan all storage assets
      const { referencedImageFiles } = await migrateMusicians(
        db,
        bandSlug,
        bandStats,
      )
      if (DRY_RUN) {
        await scanAllStorageAssets(bandSlug, bandStats, referencedImageFiles)
      }

      const band = await migrateBand(
        db,
        bandSlug,
        bandStats,
        bandMembers,
      )
      if (band) {
        allDocuments.push(band)
        bandStats.tourDates = band.tourDates?.length || 0
        bandStats.recordings = band.recordings?.length || 0

        if (!DRY_RUN) {
          console.log(
            `   ✓ Band: ${bandSlug} (${band.tourDates.length} tour dates, ${band.recordings.length} recordings, ${bandMembers.length} members)`,
          )
        }
      }

      GLOBAL_STATS.byBand[bandSlug] = bandStats
       printBandStats(bandSlug, bandStats)
     }

     // =====================================================
     // PHASE 5: Create shared contact document
     // =====================================================
     console.log('\n📧 PHASE 5: Creating shared contact document...')
     
     // Consolidate contact data
     // Email: first non-null from any band
     const sharedEmail = CONTACT_CONSOLIDATION.emails.length > 0 
       ? CONTACT_CONSOLIDATION.emails[0].email 
       : ''
     
     // Phone: first non-null from any band
     const sharedPhone = CONTACT_CONSOLIDATION.phones.length > 0 
       ? CONTACT_CONSOLIDATION.phones[0].phone 
       : ''
     
     // Social media: merge all, dedupe by platform
     const platformSet = new Set()
     const uniqueSocialMedia = CONTACT_CONSOLIDATION.socialMedia.filter(sm => {
       const platform = sm.platform || sm._type || 'unknown'
       if (platformSet.has(platform)) {
         return false // Duplicate, skip
       }
       platformSet.add(platform)
       // Remove sourceBand tracking field before final document
       delete sm.sourceBand
       return true
     })
     
     const contactDoc = {
       _id: 'contact_shared',
       _type: 'contact',
       email: sharedEmail || undefined,
       phone: sharedPhone || undefined,
       socialMedia: uniqueSocialMedia.length > 0 ? uniqueSocialMedia : undefined,
     }
     
     allDocuments.push(contactDoc)
     
     if (DRY_RUN) {
       console.log(`   ✓ Will create shared contact document (ID: contact_shared)`)
       if (contactDoc.email) console.log(`     - Email: ${contactDoc.email}`)
       if (contactDoc.phone) console.log(`     - Phone: ${contactDoc.phone}`)
       if (contactDoc.socialMedia) console.log(`     - SocialMedia: ${contactDoc.socialMedia.length} platform(s)`)
     } else {
       console.log(`   ✓ Created shared contact document (ID: contact_shared)`)
       if (contactDoc.email) console.log(`     - Email: ${contactDoc.email}`)
       if (contactDoc.phone) console.log(`     - Phone: ${contactDoc.phone}`)
       if (contactDoc.socialMedia) console.log(`     - SocialMedia: ${contactDoc.socialMedia.length} platform(s)`)
     }
     
     GLOBAL_STATS.contactConsolidated = {
       emailSources: CONTACT_CONSOLIDATION.emails.length,
       phoneSources: CONTACT_CONSOLIDATION.phones.length,
       socialMediaSources: CONTACT_CONSOLIDATION.socialMedia.length,
       uniqueSocialMedia: uniqueSocialMedia.length,
     }

    GLOBAL_STATS.totalDocuments = allDocuments.length

    if (DRY_RUN) {
      printGlobalStats()
      console.log('\n✅ DRY RUN COMPLETE - No changes made')
      console.log('Run without DRY_RUN=true to execute migration')
    } else {
       // Add asset documents for upload
      allDocuments.push(...global.allAssets)

      // Write NDJSON format (one JSON document per line) as required by Sanity import
      const ndjsonContent = allDocuments.map(doc => JSON.stringify(doc)).join('\n')
      writeFileSync(join(OUTPUT_DIR, 'sanity-import.json'), ndjsonContent)

      console.log('\n✅ Migration complete!')
      console.log(`📁 Output: ${OUTPUT_DIR}/sanity-import.json`)
      console.log(`📝 Total documents: ${allDocuments.length}`)
      console.log(`\nNext step: Import into Sanity`)
      console.log(`   npm run import staging     # Import to staging dataset`)
      console.log(`   npm run import production  # Import to production dataset`)
    }
  } finally {
    await client.close()
  }
}

/**
 * Migrates musicians from MongoDB - now returns raw data for deduplication
 * @deprecated Use collectAllMusicians() + deduplicateAndMergeMusicians() instead
 */
async function migrateMusicians(db, bandSlug, stats) {
  const musicians = []
  const referencedImageFiles = new Set()

  try {
    const cursor = db.collection('Musician').find()

    for await (const musician of cursor) {
      // Just collect raw data - deduplication handles document creation
      musicians.push({
        _id: musician._id,
        name: musician.name,
        instrument: musician.instrument,
        description: musician.description,
        pictures: musician.pictures,
      })

      // Track referenced image files
      if (musician.pictures && musician.pictures.length > 0) {
        const storageBase = getStoragePath(bandSlug, '')
        const storageDirs = ['Musicians', 'img', 'photos', '']

        for (const picture of musician.pictures) {
          const fileName = extractFileNameFromMongoPath(picture)
          if (!fileName) continue

          // Search in storage directories for the file
          for (const subDir of storageDirs) {
            const candidatePath = join(storageBase, subDir, fileName)
            if (existsSync(candidatePath)) {
              referencedImageFiles.add(fileName)
              break
            }
          }
        }
      }
    }
  } catch (error) {
    if (!DRY_RUN) {
      console.log(`  ⚠️  No musicians collection found`)
    }
  }

  return { musicians, referencedImageFiles }
}

/**
 * Migrates band data from MongoDB
* @param {Object} db - MongoDB database
  * @param {string} bandSlug - Band slug
  * @param {Object} stats - Stats object
  * @param {Array} bandMembers - Array of bandMemberOverride objects for this band
  * @returns {Object|null} Sanity band document
  */
async function migrateBand(
  db,
  bandSlug,
  stats,
  bandMembers = [],
) {
  try {

    // Query Home collection for band description and main images
    const homeDoc = await db.collection('Home').findOne()
    const descriptionHTML = homeDoc?.homeMessage || ''
    const descriptionBlocks = htmlToSanityBlock(descriptionHTML)
    const homePictures = homeDoc?.homePictures || []
    
    const { readFileSync, readdirSync } = await import('fs')
    
    // Fallback: Check for hero images in legacy files
    const bandBasePath = `/home/leon/dev/jazz-bands/apps/${bandSlug}`
    const bodyHtmlPath = `${bandBasePath}/client/partials/body.html`
    const storageImgPath = `${bandBasePath}/server/storage/img`
    
    let legacyBackgroundImage = null
    let legacyMainPictures = []
    let backgroundImageSourcePath = null
    
    // Priority 1: Check for background image files (bg.jpg, background.jpg ONLY)
    // Check both /server/storage/img and /client/img directories
    const imgPathsToCheck = [
      storageImgPath,
      `${bandBasePath}/client/img`
    ]
    
    for (const imgPath of imgPathsToCheck) {
      if (existsSync(imgPath)) {
        const storageFiles = readdirSync(imgPath)
        const bgFiles = storageFiles.filter(
          f => /^bg\.jpe?g$/i.test(f) || /^background\.jpe?g$/i.test(f)
        )
        if (bgFiles.length > 0 && !legacyBackgroundImage) {
          legacyBackgroundImage = bgFiles.find(f => /^bg\.jpe?g$/i.test(f)) || bgFiles[0]
          backgroundImageSourcePath = imgPath
          console.log(`    📸 Background image: ${legacyBackgroundImage} (from ${imgPath})`)
        }
      }
    }
    
    // Priority 2: Check for hardcoded pictures in templates (main images for content)
    if (existsSync(bodyHtmlPath)) {
      const bodyHtml = readFileSync(bodyHtmlPath, 'utf-8')
      // Match id="homePicture" OR class="main-pic"
      const imgMatches = bodyHtml.match(
        /<img[^>]+(?:id=["']homePicture["']|class=["'][^"']*main-pic[^"']*["'])[^>]*>/g
      ) || []
      
      for (const match of imgMatches) {
        const srcMatch = match.match(/src=["']([^"']+)["']/)
        if (srcMatch) {
          const fileName = srcMatch[1].replace(/^\/assets\//, '')
          // These are CONTENT images, NOT background images
          // Add them to legacyMainPictures regardless of backgroundImage presence
          if (!legacyMainPictures.includes(fileName)) {
            legacyMainPictures.push(fileName)
            console.log(`    📸 Main picture (content): ${fileName}`)
          }
        }
      }
    }
    
    // Log what we found
    if (legacyBackgroundImage) {
      console.log(`    ✓ Background image will be: ${legacyBackgroundImage}`)
    } else {
      console.log(`    ℹ️ No background image found (bg.jpg or background.jpg)` )
    }
    if (legacyMainPictures.length > 0) {
      console.log(`    ✓ Content images: ${legacyMainPictures.join(', ')}`)
    }
    
    // Use legacy main pictures if MongoDB homePictures is empty
    const allHomePictures = homePictures.length > 0 ? homePictures : legacyMainPictures
    const tourDates = []
    const dateJazzDocs = await db.collection('DateJazz').find().toArray()

    // Helper function to generate slug from date, city, venue
    const generateTourDateSlug = (date, city, venue) => {
      const dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD
      const slugify = (text) =>
        text
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g,'') // Remove accents
          .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with dash
          .replace(/^-+|-+$/g, '') // Trim dashes
      const citySlug = slugify(city)
      const venueSlug = slugify(venue)
      return `${dateStr}-${citySlug}-${venueSlug}`
    }

    let tourDateIndex = 0
    for (const dateJazz of dateJazzDocs) {
      const date = new Date(dateJazz.datetime)
      // Skip dates before 1990 (filters epoch dates like 1970-01-01)
      if (date.getFullYear() < 1990) {
        console.warn(`Skipped invalid date: ${dateJazz.datetime} (${date.getFullYear()})`)
        GLOBAL_STATS.skippedDateCount++
        continue
      }
      const tourDateSlug = generateTourDateSlug(
        date,
        dateJazz.city || '',
        dateJazz.place || ''
      )

      tourDates.push({
        _key: `tourdate_${Date.now()}_${tourDateIndex++}`,
        _type: 'tourDate',
        date: dateJazz.datetime,
        city: dateJazz.city,
        venue: dateJazz.place,
        region: dateJazz.department,
        details: dateJazz.informations,
        ticketsUrl: dateJazz.ticketsUrl || undefined,
        soldOut: dateJazz.soldOut ?? false,
        slug: tourDateSlug,
      })
    }

    const recordings = []
    // Scan audiofiles directory for MP3 files
    const audioDir = getStoragePath(bandSlug, 'audiofiles')

    if (existsSync(audioDir)) {
      const { readdir } = await import('fs/promises')
      const audioFiles = await readdir(audioDir)

      for (const audioFile of audioFiles) {
        if (!isAudioFile(audioFile)) continue

        const audioPath = join(audioDir, audioFile)
        if (existsSync(audioPath)) {
          const fileStat = await stat(audioPath)
          stats.assets.audio.count++
          stats.assets.audio.size += fileStat.size
          GLOBAL_STATS.byTier.audio.count++
          GLOBAL_STATS.byTier.audio.size += fileStat.size

if (DRY_RUN) {
              // console.log(
              //   `  ⚠️  Audio: ${audioFile} (${formatBytes(fileStat.size)}) (DRY_RUN)`,
              // )
            } else {
              // Extract metadata using music-metadata
              let duration, album, releaseYear, composer, trackNumber
              try {
                const metadata = await parseFile(audioPath)
                if (metadata) {
                  duration = metadata.format?.duration
                  album = metadata.common?.album
                  releaseYear = metadata.common?.year
                  composer = metadata.common?.composer
                  trackNumber = metadata.common?.track?.no
                }
              } catch (metaError) {
                console.warn(
                  `  ⚠️  Could not read metadata for ${audioFile}:`,
                  metaError.message,
                )
              }
              
              // Fallback: extract trackNumber from filename if not in ID3
              // Pattern: "01-nova-dream.mp3" → trackNumber = 1
              if (!trackNumber) {
                const trackMatch = audioFile.match(/^(\d{1,3})[\s-]*/)
                if (trackMatch) {
                  trackNumber = parseInt(trackMatch[1], 10)
                }
              }

// Extract clean song title and composer from filename
               // Format: "01 - Title (Composer.ext" or "1 - Song Name (Author; .mp3"
               const { title: cleanTitle, composer: composerFromFilename } = cleanAudioTitle(audioFile)
               const recordingTitle = cleanTitle || audioFile.replace(/\.[^/.]+$/, '')
               
               // Use ID3 composer first, fallback to filename
               if (!composer && composerFromFilename) {
                 composer = composerFromFilename
               }
               
               const recording = {
                 _key: `recording_${Date.now()}`,
                 _type: 'recording',
                 title: recordingTitle,
                 downloadEnabled: true,
                 duration,
                 album,
                 releaseYear,
                 composer,
                 trackNumber,
                audio: {
                  _type: 'file',
                  asset: await copyAssetToLocal(
                    audioPath,
                    bandSlug,
                    'audio',
                    global.allAssets,
                    { assetType: 'recording', title: recordingTitle }
                  ),
                },
              }
              recordings.push(recording)
          }
        }
      }
    }

    // Migrate homePictures (main content images)
    // Use legacy hardcoded images if MongoDB homePictures is empty
    const mainImages = []
    let contentImgCounter = 0
    for (const picturePath of allHomePictures) {
      if (!picturePath) continue
      
      // Try to find the image file in storage directories
      let fullImagePath = null
      const storageDirs = ['photos', 'img', 'Medias', 'Musicians']
      
      for (const dir of storageDirs) {
        const checkPath = getStoragePath(bandSlug, join(dir, picturePath))
        if (existsSync(checkPath)) {
          fullImagePath = checkPath
          break
        }
      }
      
      // Also try as-is if it's a full path
      if (!fullImagePath && existsSync(picturePath)) {
        fullImagePath = picturePath
      }
      
      if (fullImagePath) {
         stats.assets.standard.count++
         GLOBAL_STATS.byTier.standard.count++
         
if (DRY_RUN) {
            // console.log(`    ⚠️  Main Image: ${picturePath} (DRY_RUN)`)
          } else {
           try {
             const fileStat = await stat(fullImagePath)
             stats.assets.standard.size += fileStat.size
             GLOBAL_STATS.byTier.standard.size += fileStat.size
             
// Copy file to output directory for CLI import (don't create asset doc - CLI handles it)
              const destDir = join(OUTPUT_DIR, 'assets', bandSlug, 'images')
              mkdirSync(destDir, { recursive: true })
              const ext = basename(fullImagePath).split('.').pop()
              const nameWithoutExt = basename(fullImagePath).replace(/\.[^/.]+$/, '')
              const fileName = `${bandSlug}-main-${nameWithoutExt}.${ext}`
              const outputImagePath = join(destDir, fileName)
              copyFileSync(fullImagePath, outputImagePath)
             
             // Use _sanityAsset syntax for CLI import to auto-upload the asset
             // Convert to absolute path with forward slashes for Sanity CLI
             const absoluteImagePath = outputImagePath.startsWith('/') 
               ? outputImagePath 
               : join(process.cwd(), outputImagePath).replace(/\\/g, '/')
             mainImages.push({
               _key: `contentimg_${contentImgCounter++}`,
               _type: 'image',
               _sanityAsset: `image@file://${absoluteImagePath}`
             })
             
             console.log(`    ✓ Main Image: ${picturePath} → ${outputImagePath}`)
           } catch (err) {
             console.warn(`    ⚠️  Could not process ${picturePath}: ${err.message}`)
           }
         }
       } else {
         console.warn(`    ⚠️  Image file not found: ${picturePath}`)
       }
    }

   // Process backgroundImage (bg.jpg) as a proper Sanity image reference
    let backgroundImageRef = undefined
    
    if (legacyBackgroundImage) {
      // Try to find the background image file
      const backgroundImagePath = join(backgroundImageSourcePath || storageImgPath, legacyBackgroundImage)
      if (!existsSync(backgroundImagePath)) {
        console.log(`    ⚠️ Background image file not found: ${backgroundImagePath}`)
        backgroundImageRef = null
      } else {
        // Convert to relative path from migration output
        const relativePath = join(
          'assets',
          bandSlug,
          'images',
          `${bandSlug}-background-${legacyBackgroundImage}`
        )
        console.log(`    ✓ Background image: ${relativePath}`)
        backgroundImageRef = {
          _type: 'image',
          asset: {
            _sanityAsset: `image@file://${join(OUTPUT_DIR, relativePath)}`
          }
        }
        copyFileSync(
          backgroundImagePath,
          join(OUTPUT_DIR, relativePath)
        )
      }
    } else {
      console.log(`    ℹ️ No background image to process`)
    }

    const bandName = bandSlug
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase())

    // Extract contact data from MongoDB if exists
    let bandContactData = null
    try {
      const contactDoc = await db.collection('Contact').findOne()
      if (contactDoc) {
        bandContactData = {
          email: contactDoc.email || '',
          phone: contactDoc.phone || '',
          socialMedia: contactDoc.socialMedia || [],
        }
        
        // Consolidate for shared contact document
        if (bandContactData.email) {
          CONTACT_CONSOLIDATION.emails.push({ bandSlug, email: bandContactData.email })
        }
        if (bandContactData.phone) {
          CONTACT_CONSOLIDATION.phones.push({ bandSlug, phone: bandContactData.phone })
        }
        if (bandContactData.socialMedia && Array.isArray(bandContactData.socialMedia)) {
          CONTACT_CONSOLIDATION.socialMedia.push(...bandContactData.socialMedia.map(sm => ({ ...sm, sourceBand: bandSlug })))
        }
      }
    } catch (contactError) {
      // No Contact collection exists for this band - continue without contact data
      if (DRY_RUN) {
        console.log(`    ℹ️ No contact data found for ${bandSlug}`)
      }
    }

    const sanityBand = {
      _type: 'band',
      _id: `band_${bandSlug}`,
      name: bandName,
      slug: {
        _type: 'slug',
        current: bandSlug,
      },
      description:
        descriptionBlocks.length > 0
          ? descriptionBlocks
          : [
              {
                _type: 'block',
                children: [
                  {
                    _type: 'span',
                    text: `${bandName} - Description to be updated in Sanity CMS`,
                  },
                ],
                style: 'normal',
              },
          ],
      logo: undefined,
      backgroundImage: backgroundImageRef,
      contentImages: mainImages.length > 0 ? mainImages : undefined,
      socialMedia: [],
      seo: {
        metaTitle: `${bandName} - Jazz Band`,
        metaDescription: `${bandName} is a jazz band. Visit us for tour dates, music, and more.`,
        metaKeywords: ['jazz', bandSlug],
      },
      // Auto-generate Open Graph
      openGraph: {
        title: `${bandName}`,
        description: `${bandName} is a jazz band. Visit us for tour dates, music, and more.`,
        type: 'music.band',
      },
      // Auto-generate Twitter Card
      twitterCard: {
        card: 'summary_large_image',
        title: `${bandName}`,
        description: `${bandName} is a jazz band. Visit us for tour dates, music, and more.`,
      },
      tourDates,
      recordings,
      
      // Simplified bandMembers - remove override data (bio, images)
      // Keep only musician reference and optional instrument
      bandMembers: bandMembers.map(member => ({
        _type: 'bandMember',
        musician: member.musician,
        instrument: member.instrument || undefined,
        // Remove bio and images overrides for initial import
      })),
      
      contact: bandContactData
        ? {
            email: bandContactData.email || '',
            phone: bandContactData.phone || '',
          }
        : {
            email: '',
            phone: '',
          },
      branding: {
        _type: 'branding',
        primaryColor: '#1e3a8a',
        secondaryColor: '#dc2626',
      },
    }

    if (!DRY_RUN) {
      console.log(
        `  ✓ Band: ${bandSlug} (${tourDates.length} tour dates, ${recordings.length} recordings, ${bandMembers.length} members)`,
      )
    }

    return sanityBand
  } catch (error) {
    if (!DRY_RUN) {
      console.log(`  ⚠️  Error migrating band: ${error.message}`)
    }
    return null
  }
}

// Copy assets to local directory for sanity import
async function copyAssetToLocal(filePath, bandSlug, type = 'image', allAssets, options = {}) {
  const { assetType = 'generic', title = null } = options
  const dirType = type === 'image' ? 'images' : 'audio'
  
  // Create destination directory
  const destDir = join(OUTPUT_DIR, 'assets', bandSlug, dirType)
  mkdirSync(destDir, { recursive: true })

  const originalFileName = filePath.split('/').pop()
  const ext = originalFileName.split('.').pop()
  
  // Generate descriptive filename based on context
  const fileName = generateAssetFilename(bandSlug, assetType, title, originalFileName, ext)
  const destPath = join(destDir, fileName)

  copyFileSync(filePath, destPath)

  // Create asset document and return reference
  const displayName = generateAssetDisplayName(bandSlug, assetType, title, originalFileName)
  const relativePath = join('assets', bandSlug, dirType, fileName).replace(/\\/g, '/')
  const assetId = createAssetDocument(type, relativePath, displayName, allAssets)

  return {
    _type: 'reference',
    _ref: assetId,
  }
}

// Clean audio title from messy old format
// "01 - Title (Composer.ext" -> "Title"
// "1 - Song (Author; " -> { title: "Song", composer: "Author" }
function cleanAudioTitle(filename) {
  let title = filename
  let composer = null
  
  // Remove extension
  title = title.replace(/\.[^/.]+$/, '')
  
  // Extract composer from filename: "01 - Title (Composer" -> composer = "Composer"
  // Pattern: text between ( and end of string (before .ext)
  const composerMatch = title.match(/\s*\((.+)$/)
  if (composerMatch && composerMatch[1]) {
    // Clean up composer: remove trailing semicolon, trim whitespace
    composer = composerMatch[1].replace(/;$/, '').trim()
    // Remove composer part from title
    title = title.replace(/\s*\(.+$/, '')
  }
  
  // Remove order prefix (01 - , 1 - , 04 -, etc.) with optional spaces around dash
  title = title.replace(/^[\d]+[\s]*-[\s]*/, '')
  
  // Trim whitespace
  title = title.trim()
  
  return { title: title || null, composer }
}

// Generate descriptive filename for assets
function generateAssetFilename(bandSlug, assetType, title, originalFileName, ext) {
  // Remove existing extension
  const nameWithoutExt = originalFileName.replace(/\.[^/.]+$/, '')
  
  switch (assetType) {
    case 'mainImage':
      return `${bandSlug}-main-${nameWithoutExt}.${ext}`
    case 'recording':
      // Use clean title without track order
      return title 
        ? `${bandSlug}-${title}.${ext}` 
        : `${bandSlug}-${nameWithoutExt}.${ext}`
    case 'musicianPhoto':
      return title 
        ? `${bandSlug}-musician-${title.replace(/\s+/g, '-').toLowerCase()}.${ext}` 
        : `${bandSlug}-musician-${nameWithoutExt}.${ext}`
    case 'background':
      return `${bandSlug}-bg-${nameWithoutExt}.${ext}`
    default:
      return `${bandSlug}-${nameWithoutExt}.${ext}`
  }
}

// Generate human-readable display name for Sanity Studio
function generateAssetDisplayName(bandSlug, assetType, title, originalFileName) {
  switch (assetType) {
    case 'mainImage':
      return 'Main Image'
    case 'musicianPhoto':
      return title ? title : 'Musician'
    case 'recording':
      return title ? title : originalFileName
    case 'background':
      return 'Background'
    default:
      return originalFileName
  }
}

// Create asset document with proper ID
function createAssetDocument(fileType, relativePath, displayName, allAssets) {
  const assetId = `${fileType}-asset-${String(++assetCounter).padStart(6, '0')}`
  const assetDoc = {
    _id: assetId,
    _type: fileType === 'image' ? 'sanity.imageAsset' : 'sanity.fileAsset',
    originalFilename: displayName || relativePath.split('/').pop(),
    extension: relativePath.split('.').pop(),
    mimeType: fileType === 'image' ? 'image/jpeg' : 'audio/mp3',
    path: relativePath,  // Path for import script to upload
  }
  allAssets.push(assetDoc)
  return assetId
}

function printBandStats(bandSlug, stats) {
  const totalAssets =
    stats.assets.background.count +
    stats.assets.standard.count +
    stats.assets.thumbnail.count +
    stats.assets.audio.count

  const totalSize =
    stats.assets.background.size +
    stats.assets.standard.size +
    stats.assets.thumbnail.size +
    stats.assets.audio.size

  const savings = estimateOptimizationSavings({
    byCategory: stats.assets,
    totalSize,
  })

  console.log(`  🎵 Musicians: ${stats.musicians} documents`)
  console.log(`  📅 Tour Dates: ${stats.tourDates} documents`)
  console.log(`  🎵 Recordings: ${stats.recordings} documents`)
  console.log('')
  console.log('  📁 ASSETS DISCOVERED:')
  console.log(
    `    Backgrounds:   ${stats.assets.background.count} files (${formatBytes(stats.assets.background.size)})`,
  )
  console.log(
    `    Standard:      ${stats.assets.standard.count} files (${formatBytes(stats.assets.standard.size)})`,
  )
  console.log(
    `    Thumbnails:    ${stats.assets.thumbnail.count} files (${formatBytes(stats.assets.thumbnail.size)})`,
  )
  console.log(
    `    Audio:         ${stats.assets.audio.count} files (${formatBytes(stats.assets.audio.size)})`,
  )
  console.log('')
  console.log(
    `  💾 Total: ${stats.musicians + stats.tourDates + stats.recordings} documents, ${totalAssets} assets (${formatBytes(totalSize)})`,
  )
  console.log('')
}

function printGlobalStats() {
  console.log('═══════════════════════════════════════')
  console.log(`📊 TOTAL ACROSS ALL ${Object.keys(BAND_MAPPING).length} BANDS:`)
  console.log(`  Documents: ${GLOBAL_STATS.totalDocuments}`)

  const totalImages =
    GLOBAL_STATS.byTier.background.count +
    GLOBAL_STATS.byTier.standard.count +
    GLOBAL_STATS.byTier.thumbnail.count
  const totalSize =
    GLOBAL_STATS.byTier.background.size +
    GLOBAL_STATS.byTier.standard.size +
    GLOBAL_STATS.byTier.thumbnail.size +
    GLOBAL_STATS.byTier.audio.size

  const savings = estimateOptimizationSavings({
    byCategory: GLOBAL_STATS.byTier,
    totalSize,
  })

  console.log(
    `  Assets: ${totalImages} images + ${GLOBAL_STATS.byTier.audio.count} audio files`,
  )
  console.log(
    `  Size: ${formatBytes(totalSize)} → ~${formatBytes(savings.estimated)} estimated (${savings.reductionPercent}% reduction)`,
  )
  if (GLOBAL_STATS.skippedDateCount > 0) {
    console.log(`  ⚠️  Skipped invalid dates: ${GLOBAL_STATS.skippedDateCount}`)
  }
  console.log('')
  console.log('  Breakdown by tier:')
  console.log(
    `    Backgrounds:   ${GLOBAL_STATS.byTier.background.count} files`,
  )
  console.log(`    Standard:      ${GLOBAL_STATS.byTier.standard.count} files`)
  console.log(`    Thumbnails:    ${GLOBAL_STATS.byTier.thumbnail.count} files`)
  console.log(`    Audio:         ${GLOBAL_STATS.byTier.audio.count} files`)
  console.log('')
}

// Run migration
migrate().catch((error) => {
  console.error('Migration failed:', error)
  process.exit(1)
})
