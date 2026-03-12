const { MongoClient } = require('mongodb');
const uri = 'mongodb://root:xftjeIeWq90ULXAu41Hy7WEBXxxBUvwLVsSGXc7MM8tGvqhnGuF@localhost:27017';

async function checkCollections() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const bands = ['boheme', 'mpquartet', 'jazzola', 'swing-family', 'trio-rsh', 'west-side-trio'];
    
    console.log('=== COLLECTION NAMES AND COUNTS ===\n');
    
    for (const dbName of bands) {
      const db = client.db(dbName);
      const collections = await db.listCollections().toArray();
      console.log(`${dbName}:`);
      console.log(`  Collections: ${collections.map(c => c.name).join(', ')}`);
      
      // Count documents in key collections (try both cases)
      const musicianLower = await db.collection('musician').countDocuments().catch(() => 0);
      const musicianUpper = await db.collection('Musician').countDocuments().catch(() => 0);
      const agendaLower = await db.collection('agenda').countDocuments().catch(() => 0);
      const agendaUpper = await db.collection('Agenda').countDocuments().catch(() => 0);
      const audioLower = await db.collection('audio').countDocuments().catch(() => 0);
      const audioUpper = await db.collection('Audio').countDocuments().catch(() => 0);
      
      console.log(`  musician/Musician: ${musicianLower}/${musicianUpper}`);
      console.log(`  agenda/Agenda: ${agendaLower}/${agendaUpper}`);
      console.log(`  audio/Audio: ${audioLower}/${audioUpper}`);
      console.log('');
    }
  } finally {
    await client.close();
  }
}

checkCollections();
