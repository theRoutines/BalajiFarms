import { Worker } from 'bullmq'

import { query } from '../config/pg.js'
import { razorpay } from '../config/razorpay.js'
import { createRedisConnection } from '../config/redis.js'
import { processCapturedPayment } from '../services/paymentService.js'
import { expireOrderIfUnpaid } from '../services/orderService.js'

export async function reconcileOrders() {
  const paymentCutoff = new Date(Date.now() - 2 * 60 * 1000)
  const pendingResult = await query(`
    SELECT "id", "razorpayOrderId"
    FROM "Order"
    WHERE "status" = 'PENDING_PAYMENT'
      AND "createdAt" <= $1
      AND "razorpayOrderId" IS NOT NULL
    ORDER BY "id" ASC
  `, [paymentCutoff])

  for (const order of pendingResult.rows) {
    const result = await razorpay.orders.fetchPayments(order.razorpayOrderId)
    const payments = Array.isArray(result) ? result : result.items || []
    const capturedPayment = payments.find((payment) => payment.status === 'captured')
    if (capturedPayment) {
      await processCapturedPayment({
        razorpayOrderId: order.razorpayOrderId,
        razorpayPaymentId: capturedPayment.id,
        amountPaise: Number(capturedPayment.amount),
        method: capturedPayment.method,
      })
    }
  }

  const expiredResult = await query(`
    SELECT "id"
    FROM "Order"
    WHERE "status" = 'PENDING_PAYMENT' AND "reservationExpiresAt" <= $1
    ORDER BY "id" ASC
  `, [new Date()])
  for (const order of expiredResult.rows) await expireOrderIfUnpaid(order.id)
}

export function createReconciliationWorker() {
  return new Worker('reconciliation', async () => reconcileOrders(), { connection: createRedisConnection() })
}

export const runReconciliation = reconcileOrders
