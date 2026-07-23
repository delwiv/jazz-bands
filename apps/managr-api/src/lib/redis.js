import { createClient } from 'redis'

export const ONE_DAY = 60 * 60 * 24
const MAIL_COUNT_KEY = 'email:sent'

const client = createClient({ url: 'redis://redis' })
client.on('error', err => console.error('Redis error', err))
client.connect()

export const MAILCOUNT_KEY = MAIL_COUNT_KEY

export default {
  set: (key, value, ...args) => client.set(key, value, ...args),
  get: key => client.get(key),
  del: key => client.del(key),
  expire: (key, expire = ONE_DAY) => client.expire(key, expire),
  addToCount: uuid => client.zAdd(MAIL_COUNT_KEY, { score: Date.now(), value: uuid }),
  countLast24h: () => {
    const min = Date.now() - ONE_DAY * 1000
    return client.zCount(MAIL_COUNT_KEY, min, '+inf')
  },
}
