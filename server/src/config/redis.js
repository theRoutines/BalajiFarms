import Redis from 'ioredis'

import { env } from './env.js'

export function createRedisConnection() {
  // Lazy connection keeps the phase-2 API usable when Redis is not installed locally.
  return new Redis(env.REDIS_URL, { maxRetriesPerRequest: null, lazyConnect: true })
}

export const redis = createRedisConnection()
