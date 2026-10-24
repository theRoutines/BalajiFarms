import { query, withTransaction } from '../config/pg.js'
import { AppError } from '../utils/AppError.js'
import { canTransition } from '../utils/orderStateMachine.js'
import { emitOrderUpdate } from '../sockets/socketEmitter.js'
import { sendOrderStatusEmail } from './notificationService.js'
import { releaseStock } from './stockService.js'

export async function loadOrder(orderId) {
  const [orderResult, itemResult, historyResult] = await Promise.all([
    query(`
      SELECT o."id", o."orderNumber", o."userId", o."status", o."subtotalPaise", o."deliveryFeePaise", o."totalPaise",
             o."shippingAddress", o."idempotencyKey", o."razorpayOrderId", o."reservationExpiresAt", o."deliveryOtpHash",
             o."createdAt", o."updatedAt", u."name" AS "userName", u."email" AS "userEmail", u."phone" AS "userPhone"
      FROM "Order" o
      JOIN "User" u ON u."id" = o."userId"
      WHERE o."id" = $1
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
      ORDER BY "id" ASC
    `, [orderId]),
  ])

  if (orderResult.rowCount === 0) return null

  const row = orderResult.rows[0]
  const { userName, userEmail, userPhone, ...orderFields } = row
  return {
    ...orderFields,
    items: itemResult.rows,
    history: historyResult.rows,
    user: { id: row.userId, name: userName, email: userEmail, phone: userPhone },
  }
}

export function toOrderResponse(order, includeUser = false) {
  const response = {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    subtotalPaise: order.subtotalPaise,
    deliveryFeePaise: order.deliveryFeePaise,
    totalPaise: order.totalPaise,
    shippingAddress: order.shippingAddress,
    reservationExpiresAt: order.reservationExpiresAt,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    items: order.items?.map((item) => ({
      id: item.id,
      variantId: item.variantId,
      productName: item.productName,
      variantLabel: item.variantLabel,
      unitPricePaise: item.unitPricePaise,
      quantity: item.quantity,
    })) || [],
    history: order.history || [],
  }

  if (includeUser && order.user) {
    response.user = {
      name: order.user.name,
      email: order.user.email,
      phone: order.user.phone,
    }
  }
  return response
}

export async function transitionOrder({ orderId, to, changedBy, note, notificationExtra = {}, deliveryOtpHash }) {
  const currentResult = await query('SELECT "status" FROM "Order" WHERE "id" = $1', [orderId])
  if (currentResult.rowCount === 0) throw new AppError('Order not found', 404)

  const currentStatus = currentResult.rows[0].status
  if (!canTransition(currentStatus, to)) {
    throw new AppError(`Cannot move order from ${currentStatus} to ${to}`, 409)
  }

  await withTransaction(async (client) => {
    // The conditional update makes competing transitions fail instead of overwriting one another.
    const changed = await client.query(`
      UPDATE "Order"
      SET "status" = $1, "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = $2 AND "status" = $3
      RETURNING "id"
    `, [to, orderId, currentStatus])

    if (changed.rowCount === 0) {
      throw new AppError('Order status changed by another request', 409)
    }

    await client.query(`
      INSERT INTO "OrderStatusHistory" ("orderId", "fromStatus", "toStatus", "changedBy", "note")
      VALUES ($1, $2, $3, $4, $5)
    `, [orderId, currentStatus, to, changedBy, note ?? null])

    // Releasing inside the guarded transaction makes cancellation and expiry exactly once.
    if ((to === 'CANCELLED' || to === 'EXPIRED') && currentStatus === 'PENDING_PAYMENT') {
      await releaseStock(client, orderId)
    }

    if (deliveryOtpHash !== undefined) {
      await client.query(`
        UPDATE "Order"
        SET "deliveryOtpHash" = $1, "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = $2
      `, [deliveryOtpHash, orderId])
    }
  })

  const updatedOrder = await loadOrder(orderId)

  // Notifications and sockets must not undo a committed order transition.
  try {
    emitOrderUpdate(updatedOrder)
  } catch (error) {
    console.error(error)
  }

  try {
    await sendOrderStatusEmail(updatedOrder, to, notificationExtra)
  } catch (error) {
    console.error(error)
  }

  return toOrderResponse(updatedOrder)
}

export async function expireOrderIfUnpaid(orderId) {
  try {
    return await transitionOrder({ orderId, to: 'EXPIRED', changedBy: 'system', note: 'Payment window expired' })
  } catch (error) {
    if (error instanceof AppError && error.statusCode === 409) return null
    throw error
  }
}

export async function listMyOrders(userId) {
  const result = await query(`
    SELECT "id"
    FROM "Order"
    WHERE "userId" = $1
    ORDER BY "createdAt" DESC, "id" DESC
  `, [userId])
  const orders = await Promise.all(result.rows.map((row) => loadOrder(row.id)))
  return orders.map((order) => toOrderResponse(order))
}

export async function getMyOrder(userId, orderId) {
  const ownerResult = await query('SELECT "id" FROM "Order" WHERE "id" = $1 AND "userId" = $2', [orderId, userId])
  if (ownerResult.rowCount === 0) throw new AppError('Order not found', 404)
  return toOrderResponse(await loadOrder(orderId))
}

export async function cancelMyOrder(userId, orderId) {
  const result = await query('SELECT "status" FROM "Order" WHERE "id" = $1 AND "userId" = $2', [orderId, userId])
  if (result.rowCount === 0) throw new AppError('Order not found', 404)
  if (result.rows[0].status !== 'PENDING_PAYMENT') throw new AppError('Only unpaid orders can be cancelled', 409)

  return transitionOrder({ orderId, to: 'CANCELLED', changedBy: `user:${userId}`, note: 'Cancelled by customer' })
}
