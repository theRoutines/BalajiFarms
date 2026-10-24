import { createRedisConnection } from '../src/config/redis.js'

async function flush() {
  const redis = createRedisConnection()
  try {
    await redis.flushall()
    console.log('Redis cleared successfully! All old queue jobs have been removed.')
  } catch (error) {
    console.error('Failed to clear Redis:', error.message)
  } finally {
    redis.disconnect()
    process.exit(0)
  }
}

flush()

