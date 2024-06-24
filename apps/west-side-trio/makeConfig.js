const { writeFile, readFile } = require('node:fs/promises')
const { resolve } = require('node:path')

const env = process.env

const {
  MONGODB_WESTSIDETRIO_PASSWORD,
  MONGODB_HOST,
} = env

const [host, port] = (MONGODB_HOST || '').split(':')

const mongoDB = {
  host: host || 'localhost',
  database: 'west-side-trio',
  username: 'west-side-trio',
  password: MONGODB_WESTSIDETRIO_PASSWORD,
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
