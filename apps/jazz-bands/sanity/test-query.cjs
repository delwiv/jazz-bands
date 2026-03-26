require('dotenv/config')
const sanityClient = require('@sanity/client').createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID,
  dataset: process.env.SANITY_STUDIO_DATASET,
  token: process.env.SANITY_API_READ_TOKEN,
  apiVersion: '2024-01-01',
})

sanityClient
.fetch(`*[_type == "band"] {name, "slug": slug.current, "hasHero": defined(heroImage.asset)}`)
.then(bands => {
  bands.forEach(b => {
    const status = b.hasHero ? '✅' : '❌'
    console.log(`${status} ${b.name} - ${b.slug}`)
  })
})
.catch(err => console.error(err.message))
