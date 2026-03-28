import { createClient } from '@sanity/client';

const client = createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || '94fpfdn8',
  dataset: 'staging',
  token: process.env.SANITY_API_WRITE_TOKEN || '',
  apiVersion: '2025-01-10',
  useCdn: false,
});

const query = `*[_type == "band" && slug.current == "boheme"][0] {
  name,
  "recordings": recordings[] {
    title, composer, trackNumber, album, duration
  }
}`;

async function main() {
  try {
    const result = await client.fetch(query);
    console.log(`\n${result.name} recordings:`);
    result.recordings.forEach((r, i) => {
      const composer = r.composer || '(No composer)';
      const track = r.trackNumber ? `#${r.trackNumber}` : '';
      console.log(`  ${i + 1}. ${r.title}`);
      console.log(`     Composer: ${composer}`);
      console.log(`     Track: ${track}, Album: ${r.album || 'N/A'}`);
      console.log(`     Duration: ${Math.floor(r.duration / 60)}:${String(Math.floor(r.duration % 60)).padStart(2, '0')}`);
    });
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
