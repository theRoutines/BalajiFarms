import { Queue } from 'bullmq'

import { createRedisConnection } from '../config/redis.js'

const connection = createRedisConnection()
export const emailQueue = new Queue('email', { connection })
export const orderExpiryQueue = new Queue('order-expiry', { connection })
export const reconciliationQueue = new Queue('reconciliation', { connection })

export function enqueueEmail(data) {
  return emailQueue.add('send-email', data, {
    attempts: 5,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: true,
  })
}

export function scheduleOrderExpiry(orderId, delayMs) {
  return orderExpiryQueue.add('expire-order', { orderId }, {
    jobId: `expire-${orderId}`,
    delay: Math.max(0, delayMs),
    removeOnComplete: true,
  })
}

export function scheduleReconciliation() {
  return reconciliationQueue.add('reconcile-orders', {}, {
    jobId: 'reconcile-orders',
    repeat: { every: 5 * 60 * 1000 },
    removeOnComplete: true,
  })
}
