/**
 * Script to add missing hero images to Sanity for bands
 * 
 * This script:
 * 1. Detects which bands are missing heroImage in Sanity
 * 2. Finds the appropriate legacy image (background or main picture)
 * 3. Uploads it via Sanity API and updates the band document
 */

import { readFileSync, existsSync, readdirSync, createReadStream } from 'fs'
import { join, basename } from 'path'
import { createClient } from '@sanity/client'
import { stat } from 'fs/promises'
import 'dotenv/config'

const BANDS = [
  'boheme', 'canto', 'jazzola', 
  'swing-family', 'trio-rsh', 'west-side-trio'
]

const LEGACY_BASE = '/home/leon/dev/jazz-bands/apps'

// Init Sanity client
const sanityClient = createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_STUDIO_DATASET || process.env.SANITY_DATASET || 'production',
  token: process.env.SANITY_API_WRITE_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

function detectHeroImage(bandSlug) {
  const bandBasePath = join(LEGACY_BASE, bandSlug)
  const bodyHtmlPath = join(bandBasePath, 'client', 'partials', 'body.html')
  const storageImgPath = join(bandBasePath, 'server', 'storage', 'img')
    
  let heroImage = null
  let heroImagePath = null
    
  // Priority 1: Check for background image files (bg.jpg, background.jpg)
  if (existsSync(storageImgPath)) {
    const storageFiles = readdirSync(storageImgPath)
    const bgFiles = storageFiles.filter(
      f => /^bg\.jpe?g$/i.test(f) || /^background\.jpe?g$/i.test(f)
    )
    if (bgFiles.length > 0) {
      heroImage = bgFiles.find(f => /^bg\.jpe?g$/i.test(f)) || bgFiles[0]
      heroImagePath = join(storageImgPath, heroImage)
      return { heroImage, heroImagePath }
    }
  }
    
  // Priority 2: Check for hardcoded "main picture" in templates
  if (existsSync(bodyHtmlPath)) {
    const bodyHtml = readFileSync(bodyHtmlPath, 'utf-8')
    const imgMatches = bodyHtml.match(
      /<img[^>]+(?:id=["']homePicture["']|class=["'][^"']*main-pic[^"']*["'])[^>]*>/g
    ) || []
      
    for (const match of imgMatches) {
      const srcMatch = match.match(/src=["']([^"']+)["']/)
      if (srcMatch) {
        const fileName = srcMatch[1].replace(/^\/assets\//, '')
        heroImagePath = join(storageImgPath, fileName)
        if (existsSync(heroImagePath)) {
          heroImage = fileName
          return { heroImage, heroImagePath }
        }
      }
    }
  }
  
  return { heroImage: null, heroImagePath: null }
}

async function uploadAndSetHeroImage(bandSlug, heroImagePath) {
  console.log(`\n  Processing ${bandSlug}...`)
  
  if (!existsSync(heroImagePath)) {
    console.log(`    ⚠️ Image not found: ${heroImagePath}`)
    return false
  }

  try {
    const fileStat = await stat(heroImagePath)
    console.log(`    Found: ${heroImagePath} (${(fileStat.size / 1024).toFixed(1)} KB)`)

    // Upload image file to Sanity using stream (required for proper metadata detection)
    const imageUrl = await sanityClient.assets.upload('image', createReadStream(heroImagePath), {
      filename: basename(heroImagePath)
    })

  console.log(`    ✓ Uploaded to Sanity: ${imageUrl._id}`)

    // Get band document ID
    const bandId = await sanityClient.fetch(
      `*[_type == "band" && slug.current == $slug][0]._id`,
      { slug: bandSlug }
    )

    if (!bandId) {
      console.log(`    ⚠️ Band document not found for ${bandSlug}`)
      return false
    }

    // Update band's heroImage
    await sanityClient.patch(bandId)
      .set({
        heroImage: {
          _type: 'image',
          asset: {
            _type: 'reference',
            _ref: imageUrl._id
          }
        }
      })
      .commit()

    console.log(`    ✓ Updated ${bandSlug} heroImage`)
    return true

  } catch (err) {
    console.log(`    ✗ Error: ${err.message}`)
    return false
  }
}

async function main() {
  console.log('\n🎷 Adding Missing Hero Images to Sanity\n')

  let successCount = 0
  let skipCount = 0

  for (const bandSlug of BANDS) {
    // Check if band already has heroImage
    const existingBand = await sanityClient.fetch(
      `*[_type == "band" && slug.current == $slug][0]._id`,
      { slug: bandSlug }
    )

    if (!existingBand) {
      console.log(`\n  ${bandSlug}: Band not found in Sanity`)
      skipCount++
      continue
    }
    
    // Check if already has heroImage
    const bandWithHero = await sanityClient.fetch(
      `*[_type == "band" && slug.current == $slug && defined(heroImage.asset)][0]._id`,
      { slug: bandSlug }
    )
    
    if (bandWithHero) {
      console.log(`\n  ${bandSlug}: Already has heroImage, skipping`)
      skipCount++
      continue
    }

    const { heroImagePath } = detectHeroImage(bandSlug)

    if (!heroImagePath) {
      console.log(`\n  ${bandSlug}: No hero image found in legacy files`)
      continue
    }

    const success = await uploadAndSetHeroImage(bandSlug, heroImagePath)
    if (success) {
      successCount++
    }
  }

  console.log(`\n\n✅ Done!`)
  console.log(`  - Successfully updated: ${successCount}`)
  console.log(`  - Skipped (already had hero): ${skipCount}`)
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
