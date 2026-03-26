/**
 * Helper script to migrate missing hero images from legacy apps to Sanity
 * 
 * This script:
 * 1. Detects hero images in legacy body.html templates (both id="homePicture" and class="main-pic")
 * 2. Detects background images (bg.jpg, background.jpg) in storage/img
 * 3. Uploads them to Sanity CMS as heroImage for bands that are missing them
 */

import { readFileSync, existsSync, readdirSync, statSync, copyFileSync } from 'fs'
import { join, basename } from 'path'
import { createClient } from '@sanity/client'
import { mkdirSync } from 'fs'

const BANDS = [
  'boheme',
  'canto',
  'jazzola',
  'swing-family',
  'trio-rsh',
  'west-side-trio'
]

const LEGBACY_BASE = '/home/leon/dev/jazz-bands/apps'
const OUTPUT_DIR = join(process.cwd(), 'migration', 'output', 'assets')

// Init Sanity client
const sanityClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET || 'production',
  token: process.env.SANITY_API_WRITE_TOKEN,
  apiVersion: '2024-01-01',
})

function detectHeroImage(bandSlug) {
  const bandBasePath = join(LEGBACY_BASE, bandSlug)
  const bodyHtmlPath = join(bandBasePath, 'client', 'partials', 'body.html')
  const storageImgPath = join(bandBasePath, 'server', 'storage', 'img')

  let heroImage = null
  let mainImages = []

  // Priority 1: Check for background image files (bg.jpg, background.jpg)
  if (existsSync(storageImgPath)) {
    const storageFiles = readdirSync(storageImgPath)
    const bgFiles = storageFiles.filter(
      (f) =>
        /^bg\.jpe?g$/i.test(f) || /^background\.jpe?g$/i.test(f)
    )
    if (bgFiles.length > 0) {
      heroImage = bgFiles.find((f) => /^bg\.jpe?g$/i.test(f)) || bgFiles[0]
      console.log(`  📸 Background image: ${heroImage}`)
      return { heroImage, mainImages }
    }
  }

  // Priority 2: Check for hardcoded "main picture" in templates
  if (existsSync(bodyHtmlPath)) {
    const bodyHtml = readFileSync(bodyHtmlPath, 'utf-8')
    // Find img tags with id="homePicture" or class="main-pic"
    const imgMatches =
      bodyHtml.match(
        /<img[^>]+(?:id=["']homePicture["']|class=["'][^"']*main-pic[^"']*["'])[^>]*>/g
      ) || []

    for (const match of imgMatches) {
      const srcMatch = match.match(/src=["']([^"']+)["']/)
      if (srcMatch) {
        const fileName = srcMatch[1].replace(/^\/assets\//, '')
        if (!heroImage) {
          heroImage = fileName
          console.log(`  📸 Main picture (as hero): ${heroImage}`)
        } else {
          mainImages.push(fileName)
          console.log(`  📸 Main picture (as extra): ${fileName}`)
        }
      }
    }
  }

  return { heroImage, mainImages }
}

async function uploadImageToSanity(bandSlug, imagePath, fieldName = 'heroImage') {
  if (!existsSync(imagePath)) {
    console.log(`  ⚠️  Image not found: ${imagePath}`)
    return null
  }

  const destDir = join(OUTPUT_DIR, bandSlug, 'images')
  mkdirSync(destDir, { recursive: true })

  const ext = basename(imagePath).split('.').pop()
  const nameWithoutExt = basename(imagePath).replace(/\.[^/.]+$/, '')
  const fileName = `${bandSlug}-${fieldName}-${nameWithoutExt}.${ext}`
  const outputImagePath = join(destDir, fileName)

  copyFileSync(imagePath, outputImagePath)
  console.log(`  ✓ Copied: ${imagePath} → ${outputImagePath}`)

  // For now, just return the output path - actual upload requires Sanity file upload API
  // which needs special handling. For CLI import, use _sanityAsset syntax
  const absoluteImagePath = outputImagePath.startsWith('/')
    ? outputImagePath
    : join(process.cwd(), outputImagePath).replace(/\\/g, '/')

  return {
    _type: fieldName === 'heroImage' ? 'image' : 'image',
    _sanityAsset: `image@file://${absoluteImagePath}`,
  }
}

async function updateBandInSanity(bandSlug, heroImageData, mainImageData) {
  console.log(`\n  ── Updating ${bandSlug} ──`)

  const query = `*[_type == "band" && slug.current == $slug][0] { _id }`
  const [bandDoc] = await sanityClient.fetch(query, { slug: bandSlug })

  if (!bandDoc) {
    console.log(`  ⚠️  Band document not found for ${bandSlug}`)
    return
  }

  const updatePatch = sanityClient.patch(bandDoc._id)

  if (heroImageData) {
    updatePatch.set('heroImage', heroImageData)
    console.log(`  ✓ Set heroImage`)
  }

  if (mainImageData && mainImageData.length > 0) {
    updatePatch.set('mainImages', mainImageData)
    console.log(`  ✓ Set mainImages (${mainImageData.length} images)`)
  }

  try {
    await updatePatch.commit()
    console.log(`  ✓ Updated ${bandDoc._id} in Sanity`)
  } catch (err) {
    console.log(`  ✗ Failed to update: ${err.message}`)
  }
}

async function main() {
  console.log('\n🎷 Migrating Missing Hero Images\n')

  for (const bandSlug of BANDS) {
    console.log(`\n  📁 Processing ${bandSlug}...`)

    const { heroImage, mainImages } = detectHeroImage(bandSlug)

    if (!heroImage && mainImages.length === 0) {
      console.log(`  ⚠️  No hero or main images found for ${bandSlug}`)
      continue
    }

    const bandBasePath = join(LEGBACY_BASE, bandSlug)
    const storageImgPath = join(bandBasePath, 'server', 'storage', 'img')

    let heroImageData = null
    let mainImageData = []

    if (heroImage) {
      const imagePath = join(storageImgPath, heroImage)
      heroImageData = await uploadImageToSanity(bandSlug, imagePath, 'heroImage')
    }

    for (const mainPic of mainImages) {
      const imagePath = join(storageImgPath, mainPic)
      const imageData = await uploadImageToSanity(bandSlug, imagePath, 'main')
      if (imageData) {
        mainImageData.push(imageData)
      }
    }

    if (heroImageData || mainImageData.length > 0) {
      await updateBandInSanity(bandSlug, heroImageData, mainImageData)
    }
  }

  console.log('\n\n✅ Migration complete!\n')
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
