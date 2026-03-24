/**
 * Add missing slug fields to existing musician documents
 * Run: node migration/add-musician-slugs.js
 */

const { createClient } = require('@sanity/client')

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || '94fpfdn8',
  dataset: process.env.SANITY_DATASET || 'production',
  token: process.env.SANITY_API_WRITE_TOKEN,
  apiVersion: '2024-01-01',
})

function generateSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function addSlugs() {
  console.log('Fetching musicians without slugs...')

  const musicians = await client.fetch(`
    *[_type == "musician" && !defined(slug.current)] {
      _id,
      name
    }
  `)

  if (musicians.length === 0) {
    console.log('✅ All musicians already have slugs!')
    return
  }

  console.log(`Found ${musicians.length} musicians missing slugs`)

  for (const musician of musicians) {
    const slug = generateSlug(musician.name)
    console.log(`  - ${musician.name} → ${slug}`)

    await client.patch(musician._id).set({
      slug: {
        current: slug,
        type: 'slug'
      }
    }).commit()
  }

  console.log('✅ Done! Slug fields added to all musicians')
}

addSlugs().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
