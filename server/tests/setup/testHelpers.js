import crypto from 'node:crypto'
import { Buffer } from 'node:buffer'

import bcrypt from 'bcryptjs'
import request from 'supertest'

import { env } from '../../src/config/env.js'
import { query, withTransaction } from '../../src/config/pg.js'
import { app } from '../../src/app.js'

export async function resetDatabase() {
  await query('TRUNCATE TABLE "OrderStatusHistory", "WebhookEvent", "Payment", "OrderItem", "Order", "Variant", "Product", "DeliveryZone", "RefreshToken", "User", "Cattle" RESTART IDENTITY CASCADE')
}

export async function createUser(role = 'CUSTOMER') {
  const suffix = crypto.randomUUID().slice(0, 8)
  const result = await query(`
    INSERT INTO "User" ("name", "email", "phone", "passwordHash", "role")
    VALUES ($1, $2, $3, $4, $5)
    RETURNING "id", "name", "email", "phone", "role"
  `, [
    `${role} User`,
    `${role.toLowerCase()}-${suffix}@test.example`,
    `9${String(Date.now()).slice(-9)}`,
    await bcrypt.hash('Password123', 4),
    role,
  ])
  return result.rows[0]
}

export async function loginAs(user) {
  const agent = request.agent(app)
  await agent.post('/api/auth/login').send({ email: user.email, password: 'Password123' }).expect(200)
  return agent
}

export async function createProductWithVariant({ stock = 10, pricePaise = 10000 } = {}) {
  return withTransaction(async (client) => {
    const productResult = await client.query(`
      INSERT INTO "Product" ("name", "slug", "description", "imageUrl")
      VALUES ($1, $2, $3, $4)
      RETURNING "id", "name", "slug", "description", "imageUrl", "isActive"
    `, ['Test Ghee', `test-ghee-${crypto.randomUUID()}`, 'Test product', '/test.jpg'])
    const product = productResult.rows[0]
    const variantResult = await client.query(`
      INSERT INTO "Variant" ("productId", "sku", "label", "pricePaise", "stock")
      VALUES ($1, $2, $3, $4, $5)
      RETURNING "id", "productId", "sku", "label", "pricePaise", "stock", "isActive"
    `, [product.id, `TEST-${crypto.randomUUID()}`, '500g', pricePaise, stock])
    return { product: { ...product, variants: [variantResult.rows[0]] }, variant: variantResult.rows[0] }
  })
}

export function createZone(pincode = '110001', feePaise = 2500) {
  return query(`
    INSERT INTO "DeliveryZone" ("pincode", "areaName", "deliveryFeePaise")
    VALUES ($1, $2, $3)
    RETURNING "id", "pincode", "areaName", "deliveryFeePaise", "isActive"
  `, [pincode, 'Test Area', feePaise]).then((result) => result.rows[0])
}

export function getVariant(variantId) {
  return query('SELECT * FROM "Variant" WHERE "id" = $1', [variantId]).then((result) => result.rows[0])
}

export function setVariantActive(variantId, isActive) {
  return query('UPDATE "Variant" SET "isActive" = $1 WHERE "id" = $2', [isActive, variantId])
}

export function countOrders() {
  return query('SELECT COUNT(*)::int AS "count" FROM "Order"').then((result) => result.rows[0].count)
}

export function getOrder(orderId) {
  return query('SELECT * FROM "Order" WHERE "id" = $1', [orderId]).then((result) => result.rows[0])
}

export function getOrderByUser(userId) {
  return query('SELECT * FROM "Order" WHERE "userId" = $1 ORDER BY "id" DESC LIMIT 1', [userId]).then((result) => result.rows[0])
}

export function setOrderStatus(orderId, status) {
  return query('UPDATE "Order" SET "status" = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $2', [status, orderId])
}

export function setOrderCreatedAt(orderId, createdAt) {
  return query('UPDATE "Order" SET "createdAt" = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $2', [createdAt, orderId])
}

export function countWebhookEvents() {
  return query('SELECT COUNT(*)::int AS "count" FROM "WebhookEvent"').then((result) => result.rows[0].count)
}

export function countPayments() {
  return query('SELECT COUNT(*)::int AS "count" FROM "Payment"').then((result) => result.rows[0].count)
}

export function getPayment(razorpayPaymentId) {
  return query('SELECT * FROM "Payment" WHERE "razorpayPaymentId" = $1', [razorpayPaymentId]).then((result) => result.rows[0])
}

export function getPaymentByOrder(orderId) {
  return query('SELECT * FROM "Payment" WHERE "orderId" = $1 ORDER BY "id" ASC LIMIT 1', [orderId]).then((result) => result.rows[0])
}

export function countOrderHistory(orderId, toStatus) {
  return query('SELECT COUNT(*)::int AS "count" FROM "OrderStatusHistory" WHERE "orderId" = $1 AND "toStatus" = $2', [orderId, toStatus]).then((result) => result.rows[0].count)
}

export async function getOrderWithRelations(orderId) {
  const [order, payments, history] = await Promise.all([
    getOrder(orderId),
    query('SELECT * FROM "Payment" WHERE "orderId" = $1 ORDER BY "id" ASC', [orderId]),
    query('SELECT * FROM "OrderStatusHistory" WHERE "orderId" = $1 ORDER BY "id" ASC', [orderId]),
  ])
  return { ...order, payments: payments.rows, history: history.rows }
}

export function createCattleRows(rows) {
  return withTransaction(async (client) => {
    for (const row of rows) {
      await client.query(`
        INSERT INTO "Cattle" ("tagId", "type", "breed", "category")
        VALUES ($1, $2, $3, $4)
      `, [row.tagId, row.type, row.breed, row.category ?? null])
    }
  })
}

export function buildCheckoutBody(variantId, quantity = 1, pincode = '110001') {
  return {
    items: [{ variantId, quantity }],
    shippingAddress: { name: 'Test Customer', phone: '9111111111', line1: '1 Test Street', city: 'Delhi', state: 'Delhi', pincode },
  }
}

export function signWebhookBody(payload) {
  const rawBody = Buffer.from(JSON.stringify(payload))
  const signature = crypto.createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest('hex')
  return { rawBody, signature }
}

export { query }
