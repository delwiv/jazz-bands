import { readFileSync, existsSync, readdirSync } from 'fs'
import { join } from 'path'

const BANDS = [
  'boheme', 'canto', 'jazzola', 
  'swing-family', 'trio-rsh', 'west-side-trio'
]

const LEGACY_BASE = '/home/leon/dev/jazz-bands/apps'

console.log('\n🔍 Detecting Hero Images in Legacy Apps:\n')
console.log('Band                  Hero Image              Background           Status')
console.log('────────────────────────────────────────────────────────────────────────────────')

const results = []

for (const bandSlug of BANDS) {
  const bandBasePath = join(LEGACY_BASE, bandSlug)
  const bodyHtmlPath = join(bandBasePath, 'client', 'partials', 'body.html')
  const storageImgPath = join(bandBasePath, 'server', 'storage', 'img')

  let heroImage = null
  let backgroundImage = null

  // Check for background image
  if (existsSync(storageImgPath)) {
    const bgFiles = readdirSync(storageImgPath).filter(
      f => /^bg\.jpe?g$/i.test(f) || /^background\.jpe?g$/i.test(f)
    )
    if (bgFiles.length > 0) {
      backgroundImage = bgFiles.find(f => /^bg\.jpe?g$/i.test(f)) || bgFiles[0]
    }
  }

  // Check for hardcoded main picture
  if (existsSync(bodyHtmlPath)) {
    const bodyHtml = readFileSync(bodyHtmlPath, 'utf-8')
    const imgMatches = bodyHtml.match(
      /<img[^>]+(?:id=["']homePicture["']|class=["'][^"']*main-pic[^"']*["'])[^>]*>/g
    ) || []

    for (const match of imgMatches) {
      const srcMatch = match.match(/src=["']([^"']+)["']/)
      if (srcMatch) {
        const fileName = srcMatch[1].replace(/^\/assets\//, '')
        if (!heroImage) {
          heroImage = fileName
        }
      }
    }
  }

  // Determine effective hero (background preferred over main picture)
  const effectiveHero = backgroundImage || heroImage
  const status = effectiveHero ? '✅' : '❌'

  const bandSlugPadded = bandSlug + ' '.repeat(19 - bandSlug.length)
  const heroImagePadded = (heroImage || 'N/A') + ' '.repeat(22 - (heroImage || 'N/A').length)
  const backgroundImagePadded = (backgroundImage || 'N/A') + ' '.repeat(20 - (backgroundImage || 'N/A').length)
  console.log(bandSlugPadded + ' ' + heroImagePadded + ' ' + backgroundImagePadded + ' ' + status)

  results.push({
    bandSlug,
    heroImage: heroImage || null,
    backgroundImage: backgroundImage || null,
    effectiveHero: effectiveHero
  })
}

console.log('\n\nSummary:')
const missingHero = results.filter(r => !r.effectiveHero)
const hasHero = results.filter(r => r.effectiveHero)

console.log(`  - Bands with hero/background: ${hasHero.length}`)
hasHero.forEach(r => console.log(`    ✓ ${r.bandSlug}: ${r.effectiveHero}`))

console.log(`  - Bands missing hero: ${missingHero.length}`)
missingHero.forEach(r => console.log(`    ✗ ${r.bandSlug}`))
