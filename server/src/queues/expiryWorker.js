import { Worker } from 'bullmq'

import { createRedisConnection } from '../config/redis.js'
import { expireOrderIfUnpaid } from '../services/orderService.js'

export function createExpiryWorker() {
  return new Worker('order-expiry', async (job) => {
    await expireOrderIfUnpaid(job.data.orderId)
  }, { connection: createRedisConnection() })
}
