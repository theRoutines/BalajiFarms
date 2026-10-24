import { env } from '../config/env.js'
import { query, withTransaction } from '../config/pg.js'
import { razorpay } from '../config/razorpay.js'
import { scheduleOrderExpiry } from '../queues/queues.js'
import { AppError } from '../utils/AppError.js'
import { calculateSubtotal, calculateTotal } from '../utils/money.js'
import { generateOrderNumber } from '../utils/orderNumber.js'
import { toOrderResponse, transitionOrder } from './orderService.js'

function paymentResponse(order) {
  return {
    keyId: env.RAZORPAY_KEY_ID,
    razorpayOrderId: order.razorpayOrderId,
    amountPaise: order.totalPaise,
    currency: 'INR',
  }
}

async function loadCheckoutOrder(orderId) {
  const [orderResult, itemResult, historyResult] = await Promise.all([
    query(`
      SELECT "id", "orderNumber", "userId", "status", "subtotalPaise", "deliveryFeePaise", "totalPaise", "shippingAddress", "idempotencyKey", "razorpayOrderId", "reservationExpiresAt", "createdAt", "updatedAt"
      FROM "Order"
      WHERE "id" = $1
    `, [orderId]),
    query(`
      SELECT "id", "orderId", "variantId", "productName", "variantLabel", "unitPricePaise", "quantity"
      FROM "OrderItem"
      WHERE "orderId" = $1
      ORDER BY "id" ASC
    `, [orderId]),
    query(`
      SELECT "id", "orderId", "fromStatus", "toStatus", "changedBy", "note", "createdAt"
      FROM "OrderStatusHistory"
      WHERE "orderId" = $1
      ORDER BY "createdAt" ASC, "id" ASC
    `, [orderId]),
  ])

  if (orderResult.rowCount === 0) return null
  return { ...orderResult.rows[0], items: itemResult.rows, history: historyResult.rows }
}

async function getExistingOrder(userId, idempotencyKey) {
  const result = await query('SELECT "id" FROM "Order" WHERE "userId" = $1 AND "idempotencyKey" = $2', [userId, idempotencyKey])
  if (result.rowCount === 0) return null
  return loadCheckoutOrder(result.rows[0].id)
}

export async function createCheckout({ userId, items, shippingAddress, idempotencyKey }) {
  const existingOrder = await getExistingOrder(userId, idempotencyKey)
  if (existingOrder) {
    return { order: toOrderResponse(existingOrder), payment: paymentResponse(existingOrder) }
  }

  const zoneResult = await query('SELECT "deliveryFeePaise" FROM "DeliveryZone" WHERE "pincode" = $1 AND "isActive" = true', [shippingAddress.pincode])
  if (zoneResult.rowCount === 0) throw new AppError('We do not deliver to this pincode yet', 400)
  const zone = zoneResult.rows[0]

  const variantIds = items.map((item) => item.variantId)
  const variantsResult = await query(`
    SELECT v."id", v."productId", v."label", v."pricePaise", p."name" AS "productName"
    FROM "Variant" v
    JOIN "Product" p ON p."id" = v."productId"
    WHERE v."id" = ANY($1::int[]) AND v."isActive" = true AND p."isActive" = true
  `, [variantIds])
  const variants = variantsResult.rows
  const variantsById = new Map(variants.map((variant) => [variant.id, variant]))

  for (const item of items) {
    if (!variantsById.has(item.variantId)) throw new AppError('Product variant is not available', 400)
  }

  const sortedItems = [...items].sort((first, second) => first.variantId - second.variantId)
  const lines = sortedItems.map((item) => {
    const variant = variantsById.get(item.variantId)
    return { item, variant, unitPricePaise: variant.pricePaise, quantity: item.quantity }
  })
  const subtotalPaise = calculateSubtotal(lines)
  const totalPaise = calculateTotal(subtotalPaise, zone.deliveryFeePaise)
  const reservationExpiresAt = new Date(Date.now() + env.RESERVATION_MINUTES * 60 * 1000)
  let order

  try {
    const orderId = await withTransaction(async (client) => {
      for (const line of lines) {
        const reserved = await client.query(`
          UPDATE "Variant"
          SET "stock" = "stock" - $1
          WHERE "id" = $2 AND "isActive" = true AND "stock" >= $1
          RETURNING "id"
        `, [line.item.quantity, line.variant.id])
        if (reserved.rowCount === 0) throw new AppError(`Not enough stock for ${line.variant.productName} ${line.variant.label}`, 409)
      }

      const orderResult = await client.query(`
        INSERT INTO "Order" ("orderNumber", "userId", "subtotalPaise", "deliveryFeePaise", "totalPaise", "shippingAddress", "idempotencyKey", "reservationExpiresAt", "status", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING_PAYMENT', CURRENT_TIMESTAMP)
        RETURNING "id"
      `, [generateOrderNumber(), userId, subtotalPaise, zone.deliveryFeePaise, totalPaise, JSON.stringify(shippingAddress), idempotencyKey, reservationExpiresAt])
      const createdOrderId = orderResult.rows[0].id

      for (const line of lines) {
        await client.query(`
          INSERT INTO "OrderItem" ("orderId", "variantId", "productName", "variantLabel", "unitPricePaise", "quantity")
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [createdOrderId, line.variant.id, line.variant.productName, line.variant.label, line.unitPricePaise, line.item.quantity])
      }

      await client.query(`
        INSERT INTO "OrderStatusHistory" ("orderId", "fromStatus", "toStatus", "changedBy", "note")
        VALUES ($1, NULL, 'PENDING_PAYMENT', 'system', 'Order created')
      `, [createdOrderId])
      return createdOrderId
    })
    order = await loadCheckoutOrder(orderId)
  } catch (error) {
    if (error.code === '23505') {
      const concurrentOrder = await getExistingOrder(userId, idempotencyKey)
      if (concurrentOrder) return { order: toOrderResponse(concurrentOrder), payment: paymentResponse(concurrentOrder) }
    }
    throw error
  }

  try {
    const razorpayOrder = await razorpay.orders.create({
      amount: totalPaise,
      currency: 'INR',
      receipt: order.orderNumber,
    })
    await query('UPDATE "Order" SET "razorpayOrderId" = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $2', [razorpayOrder.id, order.id])
    const savedOrder = await loadCheckoutOrder(order.id)
    await scheduleOrderExpiry(order.id, reservationExpiresAt.getTime() - Date.now())
    return { order: toOrderResponse(savedOrder), payment: paymentResponse(savedOrder) }
  } catch {
    await transitionOrder({ orderId: order.id, to: 'CANCELLED', changedBy: 'system', note: 'Payment session could not be created' })
    throw new AppError('Unable to start payment right now', 502)
  }
}

export async function getPaymentSession(userId, orderId) {
  const orderResult = await query('SELECT "id" FROM "Order" WHERE "id" = $1 AND "userId" = $2', [orderId, userId])
  const order = orderResult.rowCount === 0 ? null : await loadCheckoutOrder(orderResult.rows[0].id)
  if (!order) throw new AppError('Order not found', 404)
  if (order.status !== 'PENDING_PAYMENT') throw new AppError('This order is no longer awaiting payment', 409)
  if (order.reservationExpiresAt <= new Date()) throw new AppError('This payment window has expired', 409)
  if (!order.razorpayOrderId) throw new AppError('Payment session is not available', 409)
  return { order: toOrderResponse(order), payment: paymentResponse(order) }
}
