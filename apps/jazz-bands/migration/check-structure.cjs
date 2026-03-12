const { MongoClient } = require('mongodb');
const uri = 'mongodb://root:xftjeIeWq90ULXAu41Hy7WEBXxxBUvwLVsSGXc7MM8tGvqhnGuF@localhost:27017';

async function checkDataStructure() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db('boheme');
    
    console.log('=== DateJazz Structure ===');
    const dateJazzSample = await db.collection('DateJazz').findOne();
    if (dateJazzSample) {
      console.log(JSON.stringify(dateJazzSample, null, 2));
    }
    
    console.log('\n=== Video Structure ===');
    const videoSample = await db.collection('Video').findOne();
    if (videoSample) {
      console.log(JSON.stringify(videoSample, null, 2));
    }
    
    console.log('\n=== Home Structure ===');
    const homeSample = await db.collection('Home').findOne();
    if (homeSample) {
      console.log(JSON.stringify(homeSample, null, 2));
    }
    
    console.log('\n=== galleries Structure ===');
    const galleriesSample = await db.collection('galleries').findOne();
    if (galleriesSample) {
      console.log(JSON.stringify(galleriesSample, null, 2));
    }
    
  } finally {
    await client.close();
  }
}

checkDataStructure();
