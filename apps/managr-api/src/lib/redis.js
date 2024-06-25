import { createClient } from 'redis'

const ONE_DAY = 60 * 60 * 24

const redisClient = createClient({ url: 'redis://redis' })

export const MAILCOUNT_KEY = 'email.task'

const client = {
  set: (key, value, expire = ONE_DAY) => redisClient.set(key, value, 'EX', expire),
  get: key => redisClient.get(key),
  del: key => redisClient.del(key),
  find: pattern => redisClient.keys(pattern),
  expire: (key, expire = ONE_DAY) => redisClient.expire(key, expire),
}

export default client
