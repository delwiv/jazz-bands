const { writeFile, readFile } = require('node:fs/promises')
const { resolve } = require('node:path')

const env = process.env

const {
  MONGODB_ROOT_PASSWORD,
  MONGODB_HOST,
} = env

const [host, port] = (MONGODB_HOST || '').split(':')

const mkConfig = async () => {
  await writeFile(resolve('./server', 'datasources.json'), JSON.stringify(
    {
      db: {
        name: "db",
        connector: "memory"
      },
      mongoDB: {
        host: host || 'localhost',
        database: 'boheme',
        username: 'root',
        password: MONGODB_ROOT_PASSWORD,
        name: "mongoDB",
        connector: "mongodb"
      },
      storage: {
        name: "storage",
        connector: "loopback-component-storage",
        provider: "filesystem",
        root: "server/storage"
      }
    }
    , null, 2))
}

console.log({MONGODB_ROOT_PASSWORD, MONGODB_HOST})

mkConfig()
