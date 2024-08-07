const { writeFile, readFile } = require('node:fs/promises')
const { resolve } = require('node:path')

const env = process.env

const {
  MONGODB_JAZZOLA_PASSWORD,
  MONGODB_HOST,
} = env

const [host, port] = (MONGODB_HOST || '').split(':')

const mongoDB = {
  host: host || 'localhost',
  database: 'jazzola',
  username: 'jazzola',
  password: MONGODB_JAZZOLA_PASSWORD,
  name: "mongoDB",
  connector: "mongodb"
}

const mkConfig = async () => {
  await writeFile(resolve('./server', 'datasources.json'), JSON.stringify(
    {
      db: {
        name: "db",
        connector: "memory"
      },
      mongoDB,
      storage: {
        name: "storage",
        connector: "loopback-component-storage",
        provider: "filesystem",
        root: "server/storage"
      }
    }
    , null, 2))
}

mkConfig()
