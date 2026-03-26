require('dotenv/config')

const sanityClient = require('@sanity/client').createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_STUDIO_DATASET || process.env.SANITY_DATASET || 'production',
  token: process.env.SANITY_API_WRITE_TOKEN,
  apiVersion: '2024-01-01',
})

async function checkHeroImages() {
  const query = `*[_type == "band"] {
    _id,
    name,
    "slug": slug.current,
    "hasHeroImage": defined(heroImage.asset),
    "heroImageName": heroImage.asset->originalFilename,
    "mainImagesCount": mainImages | length
  }`

  const bands = await sanityClient.fetch(query)
  
  console.log('\n🎷 Hero Image Status by Band:\n')
  console.log('Band                  Has Hero     Hero Image Name              Main Images')
  console.log('────────────────────────────────────────────────────────────────')
  
  for (const band of bands) {
    const hasHero = band.hasHeroImage ? '✅' : '❌'
    const heroName = band.heroImageName || 'N/A'
    const mainCount = band.mainImagesCount || 0
    console.log(`${band.name} ${hasHero.padStart(12)} ${heroName.padEnd(30)} ${String(mainCount).padStart(2)}`)
  }
  
  console.log('\n')
  
  return bands
}

checkHeroImages().then(bands => {
  const bandsWithoutHero = bands.filter(b => !b.hasHeroImage)
  if (bandsWithoutHero.length === 0) {
    console.log('✅ All bands have hero images!')
  } else {
    console.log(`⚠️  ${bandsWithoutHero.length} band(s) missing hero image:`)
    bandsWithoutHero.forEach(b => console.log(`   - ${b.name}`))
  }
  process.exit(bandsWithoutHero.length > 0 ? 1 : 0)
}).catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
