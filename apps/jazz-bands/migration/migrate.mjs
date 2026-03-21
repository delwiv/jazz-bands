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
import id3 from 'id3'
const { ID3 } = id3
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
  byBand: {},
  byTier: {
    background: { count: 0, size: 0 },
    standard: { count: 0, size: 0 },
    thumbnail: { count: 0, size: 0 },
    audio: { count: 0, size: 0 },
  },
}

// Global asset collection
global.allAssets = []

// Global asset document generator
let assetCounter = 0

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
        console.log(
          `  ⚠️  Image: ${file} (${formatBytes(fileStat.size)}) - will optimize to ~${formatBytes(estimateOutputSize(fileStat.size, 'sanity-source'))} for Sanity (DRY_RUN)`,
        )
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
      }
    } catch (error) {
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
      const musicianId = `musician_${musician._id?.toString()}`
      globalMusicians.set(musicianId, {
        musician,
        sourceBands: [sourceBand],
      })
      uniqueCount++
      continue
    }

    // Found duplicates
    duplicateGroups++

    // Get storage base for the first band (used for image resolution checks)
    const firstBand = candidates[0].sourceBand
    const storageBase = getStoragePath(firstBand, '')

    // Merge candidates
    const merged = await mergeMusicianData(
      candidates.map((c) => c.musician),
      storageBase,
    )

    const musicianId = `musician_${merged.musician._id?.toString()}`
    const sourceBands = candidates.map((c) => c.sourceBand)

    globalMusicians.set(musicianId, {
      musician: merged.musician,
      sourceBands,
      sources: candidates,
    })
    mergedCount++

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
    _id: `musician_${mongoMusician._id?.toString()}`,
    name: mongoMusician.name,
    slug: {
      _type: 'slug',
      current: generateMusicianSlug(mongoMusician.name) || 'unnamed',
    },
    bio: mongoMusician.description
      ? [
        {
          _type: 'block',
          children: [{ _type: 'span', text: mongoMusician.description }],
          style: 'normal',
        },
      ]
      : [],
    instrument: mongoMusician.instrument,
    images: [],
    bands,
    bandOverrides: bandOverrides.length > 0 ? bandOverrides : undefined,
  }

  // Process images - upload all pictures to Sanity
  if (mongoMusician.pictures && mongoMusician.pictures.length > 0) {
    const storageBase = getStoragePath(bandSlug, '')
    const storageDirs = ['Musicians', 'img', 'photos', '']

    for (const picture of mongoMusician.pictures) {
      const fileName = extractFileNameFromMongoPath(picture)
      if (!fileName) continue

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
            'sanity-source', // Use Sanity-specific preset
            false,
          )

          if (optimized.success && optimized.optimizedFiles.length > 0) {
            // Copy optimized image to local assets directory for sanity import
            for (const file of optimized.optimizedFiles) {
              const assetRef = await copyAssetToLocal(
   file.path,
   bandSlug,
   'image',
   global.allAssets,
   { assetType: 'musicianPhoto', title: file.musicianName }
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
    
    // Fallback: Check for hardcoded images in legacy templates
    const bandBasePath = `/home/leon/dev/jazz-bands/apps/${bandSlug}`
    const bodyHtmlPath = `${bandBasePath}/client/partials/body.html`
    let legacyHardcodedImages = []
    if (existsSync(bodyHtmlPath)) {
      const { readFileSync } = await import('fs')
      const bodyHtml = readFileSync(bodyHtmlPath, 'utf-8')
      // Find img tags with id="homePicture"
      const imgMatches = bodyHtml.match(/<img[^>]+id=["']homePicture["'][^>]*>/g) || []
      for (const match of imgMatches) {
        const srcMatch = match.match(/src=["']([^"']+)["']/)
        if (srcMatch) {
          const srcPath = srcMatch[1]
          // Remove /assets/ prefix if present, the asset is in server/storage
          const filename = srcPath.replace(/^\/assets\//, '')
          legacyHardcodedImages.push(filename)
          console.log(`    📸 Found legacy hardcoded image: ${filename}`)
        }
      }
    }
    
    if (legacyHardcodedImages.length > 0) {
      console.log(`    📸 Using ${legacyHardcodedImages.length} legacy hardcoded images as mainImages`)
    }
    
    // Use legacy hardcoded images if homePictures is empty
    const allHomePictures = homePictures.length > 0 ? homePictures : legacyHardcodedImages
    const tourDates = []
    const dateJazzDocs = await db.collection('DateJazz').find().toArray()

    let tourDateIndex = 0
    for (const dateJazz of dateJazzDocs) {
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
            console.log(
              `  ⚠️  Audio: ${audioFile} (${formatBytes(fileStat.size)}) (DRY_RUN)`,
            )
          } else {
            // Extract ID3 metadata
            let duration, album, releaseYear
            try {
              const tag = ID3.readFile(audioPath)
              if (tag) {
                duration = tag.duration
                  ? Math.round(tag.duration / 1000)
                  : undefined // Convert ms to seconds
                album = tag.album || undefined
                releaseYear = tag.year ? parseInt(tag.year, 10) : undefined
              }
            } catch (id3Error) {
              console.warn(
                `  ⚠️  Could not read ID3 tags for ${audioFile}:`,
                id3Error.message,
              )
            }

// Extract clean song title from filename
              // Format: "01 - Title (Composer.ext" or "1 - Song Name (Author; .mp3"
              const cleanTitle = cleanAudioTitle(audioFile)
              const recordingTitle = cleanTitle || audioFile
              const recording = {
                _key: `recording_${Date.now()}`,
                _type: 'recording',
                title: recordingTitle,
                downloadEnabled: true,
                duration,
                album,
                releaseYear,
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
           console.log(`    ⚠️  Main Image: ${picturePath} (DRY_RUN)`)
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

    const bandName = bandSlug
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase())

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
      // Fallback to placeholder if no description in MongoDB
      heroImage: undefined,
      mainImages: mainImages.length > 0 ? mainImages : undefined,
      socialMedia: [],
      // Auto-generate SEO from band name
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
      bandMembers,
      contact: {
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
        `  ✓ Band: ${bandSlug} (${tourDates.length} tour dates, ${recordings.length} recordings)`,
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
// "1 - Song (Author; " -> "Song"
function cleanAudioTitle(filename) {
  let title = filename
  
  // Remove extension
  title = title.replace(/\.[^/.]+$/, '')
  
  // Remove order prefix (01 - , 1 - , etc.)
  title = title.replace(/^[\d]+-+\s*/, '')
  
  // Remove composer info starting with (
  title = title.replace(/\s*\([^)]*$/, '')
  
  // Trim whitespace
  title = title.trim()
  
  return title || null
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
