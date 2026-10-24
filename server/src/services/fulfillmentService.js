import { query } from '../config/pg.js'
import { AppError } from '../utils/AppError.js'
import { generateOtp, hashOtp, verifyOtp } from '../utils/otp.js'
import { refundOrderPayments } from './refundService.js'
import { loadOrder, toOrderResponse, transitionOrder } from './orderService.js'

async function findFulfillmentOrder(orderId) {
  const order = await loadOrder(orderId)
  if (!order) throw new AppError('Order not found', 404)
  return order
}

export async function listAdminOrders({ status, page, pageSize }) {
  const values = []
  const conditions = []
  if (status) {
    values.push(status)
    conditions.push(`"status" = $${values.length}`)
  }
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const offset = (page - 1) * pageSize
  values.push(pageSize, offset)
  const [orderResult, countResult] = await Promise.all([
    query(`
      SELECT "id"
      FROM "Order"
      ${whereClause}
      ORDER BY "createdAt" DESC, "id" DESC
      LIMIT $${values.length - 1} OFFSET $${values.length}
    `, values),
    query(`SELECT COUNT(*)::int AS "total" FROM "Order" ${whereClause}`, values.slice(0, -2)),
  ])
  const orders = await Promise.all(orderResult.rows.map((row) => loadOrder(row.id)))

  return { orders: orders.map((order) => toOrderResponse(order, true)), total: countResult.rows[0].total, page, pageSize }
}

export async function getAdminOrder(orderId) {
  const order = await findFulfillmentOrder(orderId)
  return toOrderResponse(order, true)
}

export function markPacked(orderId, adminId) {
  return transitionOrder({
    orderId,
    to: 'PACKED',
    changedBy: `admin:${adminId}`,
    note: 'Order packed by admin',
  })
}

export async function adminCancelOrder(orderId, adminId) {
  const result = await query('SELECT "status" FROM "Order" WHERE "id" = $1', [orderId])
  if (result.rowCount === 0) throw new AppError('Order not found', 404)
  if (!['PAID', 'PACKED'].includes(result.rows[0].status)) {
    throw new AppError('Only paid or packed orders can be cancelled by admin', 409)
  }

  const cancelledOrder = await transitionOrder({
    orderId,
    to: 'CANCELLED',
    changedBy: `admin:${adminId}`,
    note: 'Cancelled by admin; captured payment will be refunded',
    notificationExtra: { refund: true },
  })
  await refundOrderPayments(orderId)
  return cancelledOrder
}

export async function listDeliveryOrders() {
  const result = await query(`
    SELECT "id"
    FROM "Order"
    WHERE "status" IN ('PACKED', 'OUT_FOR_DELIVERY')
    ORDER BY "createdAt" ASC, "id" ASC
  `)
  const orders = await Promise.all(result.rows.map((row) => loadOrder(row.id)))
  return orders.map((order) => toOrderResponse(order, true))
}

export async function startDelivery(orderId, deliveryId) {
  await findFulfillmentOrder(orderId)
  const otp = generateOtp()
  const deliveryOtpHash = await hashOtp(otp)
  const order = await transitionOrder({
    orderId,
    to: 'OUT_FOR_DELIVERY',
    changedBy: `delivery:${deliveryId}`,
    note: 'Order handed to delivery',
    notificationExtra: { otp },
    deliveryOtpHash,
  })
  return order
}

export async function completeDelivery(orderId, deliveryId, otp) {
  const result = await query('SELECT "status", "deliveryOtpHash" FROM "Order" WHERE "id" = $1', [orderId])
  if (result.rowCount === 0) throw new AppError('Order not found', 404)
  const order = result.rows[0]
  if (order.status !== 'OUT_FOR_DELIVERY') {
    throw new AppError('Only out-for-delivery orders can be completed', 409)
  }
  if (!order.deliveryOtpHash || !(await verifyOtp(otp, order.deliveryOtpHash))) {
    throw new AppError('Invalid delivery OTP', 400)
  }

  return transitionOrder({
    orderId,
    to: 'DELIVERED',
    changedBy: `delivery:${deliveryId}`,
    note: 'Delivery completed with OTP',
  })
}

