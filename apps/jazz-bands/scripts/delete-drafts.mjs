import { createClient } from '@sanity/client';
import 'dotenv/config';

const client = createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID,
  dataset: process.env.SANITY_STUDIO_DATASET,
  token: process.env.SANITY_API_WRITE_TOKEN,
  apiVersion: '2025-01-10',
  useCdn: false
});

async function deleteDrafts() {
  // Find all draft band documents
  const drafts = await client.fetch('*[_type == "band" && _id.match("drafts\\\\..*") { _id }]');
  
  console.log(`Found ${drafts.length} draft band documents:`);
  for (const doc of drafts) {
    console.log(`  - ${doc._id}`);
  }
  
  if (confirm('\nDelete all draft band documents? (y/n): ')) {
    console.log('\nDeleting draft documents...');
    for (const doc of drafts) {
      await client.delete(doc._id).catch(err => {
        console.error(`Failed to delete ${doc._id}:`, err.message);
      });
    }
    console.log('Done!');
  }
}

deleteDrafts().catch(console.error);
