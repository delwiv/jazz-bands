import IORedis from 'ioredis'

export const ONE_DAY = 60 * 60 * 24
const MAIL_COUNT_KEY = 'email:sent'

const REDIS_HOST = process.env.REDIS_HOST || 'redis'

const client = new IORedis({
  host: REDIS_HOST,
  retryStrategy: times => Math.min(times * 100, 3000),
  maxRetriesPerRequest: null,
})
client.on('error', err => console.error('Redis error', err))

export const MAILCOUNT_KEY = MAIL_COUNT_KEY

export default {
  set: (key, value, ...args) => client.set(key, value, ...args),
  get: key => client.get(key),
  del: key => client.del(key),
  expire: (key, expire = ONE_DAY) => client.expire(key, expire),
  addToCount: uuid => client.zadd(MAIL_COUNT_KEY, Date.now(), uuid),
  countLast24h: () => {
    const min = Date.now() - ONE_DAY * 1000
    return client.zcount(MAIL_COUNT_KEY, min, '+inf')
  },
}
