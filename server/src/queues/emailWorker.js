import { Worker } from 'bullmq'

import { createRedisConnection } from '../config/redis.js'
import { sendEmail } from '../emails/mailer.js'

export function createEmailWorker() {
  return new Worker('email', async (job) => {
    await sendEmail(job.data)
  }, { connection: createRedisConnection() })
}
