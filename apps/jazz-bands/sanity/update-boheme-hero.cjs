#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Use environment variables or defaults
const sanity = require('@sanity/client');
const { createAssetUploadStream } = require('@sanity/assets');

const projectId = process.env.SANITY_PROJECT_ID || '94fpfdn8';
const dataset = process.env.SANITY_DATASET || 
  process.env.SANITY_IMPORT_TOKEN ? 'production' : 'staging';
const token = process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_IMPORT_TOKEN;

const backgrounfImagePath = path.join(__dirname, '../../../apps/boheme/client/img/background.jpg');

if (!token) {
  console.error('❌ Missing write token! Set SANITY_API_WRITE_TOKEN or SANITY_IMPORT_TOKEN');
  process.exit(1);
}

if (!fs.existsSync(backgroundImagePath)) {
  console.error(`❌ Background image not found at: ${backgroundImagePath}`);
  console.error('Please check the legacy boheme directory');
  process.exit(1);
}

async function updateBohemeHero() {
  console.log('🔧 Updating boheme hero image...');
  console.log(`📂 Reading image from: ${backgroundImagePath}`);

  // Create Sanity client
  const client = sanity({
    projectId,
    dataset,
    token,
    apiVersion: '2024-01-01',
  });

  // Get current boheme document
  const band = await client.fetch(
    '*[_type == "band" && slug.current == "boheme"][0]{_id, heroImage}'
  );

  if (!band) {
    console.error('❌ Boheme band document not found!');
    process.exit(1);
  }

  console.log(`📄 Found band: ${band._id}`);

  if (band.heroImage) {
    console.log(`♻️  Current hero image: ${band.heroImage.asset?._ref || 'unknown'}`);
    console.log('🗑️  Deleting current hero image asset...');
    
    try {
      await client.delete(`${band.heroImage.asset._ref}`);
      console.log('✅ Deleted old hero image asset');
    } catch (err) {
      console.error('⚠️  Could not delete old asset:', err.message);
    }
  }

  // Upload new background image
  console.log('⬆️  Uploading background.jpg as new hero image...');
  
  const fileBuffer = fs.readFileSync(backgroundImagePath);
  
  // Upload the file
  const newAsset = await client.assets.upload('image', fileBuffer, {
    filename: 'boheme-background.jpg',
  });

  console.log(`✅ Uploaded new asset: ${newAsset._id}`);

  // Update band document with new hero image
  console.log('📝 Updating band document...');
  await client.patch(band._id)
    .set({
      heroImage: {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: newAsset._id,
        },
      },
    })
    .commit();

  console.log('✅ Updated boheme band document!');
  console.log('🎉 Done! Boheme now uses background.jpg as hero image');
}

updateBohemeHero().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
