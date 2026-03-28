import { createClient } from '@sanity/client'

const client = createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || '94fpfdn8',
  dataset: 'staging',
  token: process.env.SANITY_API_WRITE_TOKEN || '',
  apiVersion: '2025-01-10',
  useCdn: false,
})

const query = `*[_type == "band"] {
  name,
  "recordings": recordings[] {
    title, composer
  }
}`

async function main() {
  try {
    const result = await client.fetch(query)
    console.log('\n=== Bands with multiple composers (semicolon-separated) ===\n')
    
    result.forEach(band => {
      const multiComposer = band.recordings.filter(r => r.composer && r.composer.includes(';'))
      if (multiComposer.length > 0) {
        console.log(`${band.name}:`)
        multiComposer.forEach(r => {
          console.log(`  ✓ ${r.title}`)
          console.log(`    Composer: "${r.composer}"`)
        })
        console.log('')
      }
    })
    
    console.log('\n=== Bands with ampersand-separated composers ===\n')
    result.forEach(band => {
      const ampComposer = band.recordings.filter(r => r.composer && r.composer.includes('&'))
      if (ampComposer.length > 0) {
        console.log(`${band.name}:`)
        ampComposer.forEach(r => {
          console.log(`  ✓ ${r.title}`)
          console.log(`    Composer: "${r.composer}"`)
        })
        console.log('')
      }
    })
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  }
}

main()
