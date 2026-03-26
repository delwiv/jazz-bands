require('dotenv/config')
const { createClient } = require('@sanity/client')
const fs = require('fs')

const client = createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID,
  dataset: process.env.SANITY_STUDIO_DATASET,
  token: process.env.SANITY_API_WRITE_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

async function fixBohemeHero() {
  // Get bohemee band ID
  const bohemeId = await client.fetch(`*[_type == "band" && slug.current == "boheme"][0]._id`, {})
  if (!bohemeId) {
    console.log('Bohème band not found')
    return
  }

  console.log('Found Bohème band:', bohemeId)

  // Upload background.jpg instead of remy.png
  const bgPath = '/home/leon/dev/jazz-bands/apps/boheme/client/img/background.jpg'
  
  if (!fs.existsSync(bgPath)) {
    console.log('background.jpg not found at:', bgPath)
    return
  }

  console.log('Uploading background.jpg...')
  const imageUrl = await client.assets.upload('image', fs.createReadStream(bgPath), {
    filename: 'boheme-background.jpg'
  })
  console.log('✓ Uploaded:', imageUrl._id)

  // Update heroImage
  await client.patch(bohemeId)
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
  console.log('✓ Updated Bohème heroImage to background.jpg')
}

fixBohemeHero().catch(console.error)
