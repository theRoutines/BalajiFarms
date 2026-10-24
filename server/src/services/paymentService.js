import crypto from 'node:crypto'
import { Buffer } from 'node:buffer'

import { query, withTransaction } from '../config/pg.js'
import { env } from '../config/env.js'
import { AppError } from '../utils/AppError.js'
import { refundPayment } from './refundService.js'
import { transitionOrder } from './orderService.js'

function paymentEntity(payload) {
  return payload?.payload?.payment?.entity
}

function parsePaymentAmount(entity) {
  return Number(entity?.amount)
}

async function createPaymentIfMissing(data) {
  const inserted = await query(`
    INSERT INTO "Payment" ("orderId", "razorpayPaymentId", "amountPaise", "status", "method")
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT ("razorpayPaymentId") DO NOTHING
    RETURNING "id", "orderId", "razorpayPaymentId", "amountPaise", "status", "method", "createdAt"
  `, [data.orderId, data.razorpayPaymentId, data.amountPaise, data.status, data.method ?? null])

  if (inserted.rowCount > 0) return inserted.rows[0]

  const existing = await query(`
    SELECT "id", "orderId", "razorpayPaymentId", "amountPaise", "status", "method", "createdAt"
    FROM "Payment"
    WHERE "razorpayPaymentId" = $1
  `, [data.razorpayPaymentId])
  return existing.rows[0]
}

async function refundCapturedPayment(payment) {
  return withTransaction(async (client) => {
    // Locking the payment while calling Razorpay prevents duplicate refunds for replayed events.
    const lockedResult = await client.query(`
      SELECT "id", "razorpayPaymentId", "amountPaise", "status"
      FROM "Payment"
      WHERE "id" = $1
      FOR UPDATE
    `, [payment.id])
    const lockedPayment = lockedResult.rows[0]
    if (!lockedPayment || lockedPayment.status !== 'CAPTURED') return lockedPayment

    await refundPayment(lockedPayment.razorpayPaymentId, lockedPayment.amountPaise)
    const updated = await client.query(`
      UPDATE "Payment"
      SET "status" = 'REFUNDED'
      WHERE "id" = $1 AND "status" = 'CAPTURED'
      RETURNING "id", "orderId", "razorpayPaymentId", "amountPaise", "status", "method", "createdAt"
    `, [lockedPayment.id])
    return updated.rows[0]
  })
}

export function verifyWebhookSignature(rawBody, signature) {
  if (!rawBody || !signature) return false
  const expectedSignature = crypto.createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest('hex')
  const expectedBuffer = Buffer.from(expectedSignature)
  const receivedBuffer = Buffer.from(signature)
  if (expectedBuffer.length !== receivedBuffer.length) return false
  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
}

export async function processCapturedPayment({ razorpayOrderId, razorpayPaymentId, amountPaise, method }) {
  const orderResult = await query(`
    SELECT "id", "orderNumber", "status", "totalPaise"
    FROM "Order"
    WHERE "razorpayOrderId" = $1
  `, [razorpayOrderId])
  if (orderResult.rowCount === 0) return null
  const order = orderResult.rows[0]

  if (amountPaise !== order.totalPaise) {
    const payment = await createPaymentIfMissing({
      orderId: order.id,
      razorpayPaymentId,
      amountPaise,
      status: 'AMOUNT_MISMATCH',
      method,
    })
    console.error(`Payment amount mismatch for order ${order.orderNumber}`)
    return payment
  }

  if (order.status === 'PENDING_PAYMENT') {
    const payment = await createPaymentIfMissing({
      orderId: order.id,
      razorpayPaymentId,
      amountPaise,
      status: 'CAPTURED',
      method,
    })
    if (payment.status === 'CAPTURED') {
      try {
        await transitionOrder({ orderId: order.id, to: 'PAID', changedBy: 'webhook', note: 'Payment captured' })
      } catch (error) {
        const latestOrder = await query('SELECT "status" FROM "Order" WHERE "id" = $1', [order.id])
        if (latestOrder.rows[0]?.status !== 'PAID') throw error
      }
    }
    return payment
  }

  if (order.status === 'EXPIRED' || order.status === 'CANCELLED') {
    const payment = await createPaymentIfMissing({
      orderId: order.id,
      razorpayPaymentId,
      amountPaise,
      status: 'CAPTURED',
      method,
    })
    if (payment.status === 'CAPTURED') {
      return refundCapturedPayment(payment)
    }
    return payment
  }

  return null
}

export async function recordFailedPayment({ razorpayOrderId, razorpayPaymentId, amountPaise, method }) {
  const orderResult = await query('SELECT "id" FROM "Order" WHERE "razorpayOrderId" = $1', [razorpayOrderId])
  if (orderResult.rowCount === 0) return null
  const order = orderResult.rows[0]
  return createPaymentIfMissing({ orderId: order.id, razorpayPaymentId, amountPaise, status: 'FAILED', method })
}

export async function handleWebhook(rawBody, signature, eventId) {
  if (!verifyWebhookSignature(rawBody, signature)) throw new AppError('Invalid webhook signature', 400)
  if (!eventId) throw new AppError('Missing webhook event id', 400)

  const payload = JSON.parse(rawBody.toString('utf8'))
  const eventResult = await query(`
    INSERT INTO "WebhookEvent" ("eventId", "eventType")
    VALUES ($1, $2)
    ON CONFLICT ("eventId") DO NOTHING
    RETURNING "id"
  `, [eventId, payload.event || 'unknown'])
  if (eventResult.rowCount === 0) return { received: true }

  const entity = paymentEntity(payload)
  if (payload.event === 'payment.captured' && entity) {
    await processCapturedPayment({
      razorpayOrderId: entity.order_id,
      razorpayPaymentId: entity.id,
      amountPaise: parsePaymentAmount(entity),
      method: entity.method,
    })
  }

  if (payload.event === 'payment.failed' && entity) {
    await recordFailedPayment({
      razorpayOrderId: entity.order_id,
      razorpayPaymentId: entity.id,
      amountPaise: parsePaymentAmount(entity),
      method: entity.method,
    })
  }

  return { received: true }
}
