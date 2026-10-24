import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createRazorpayOrder, refundPayment, scheduleOrderExpiry, enqueueEmail } = vi.hoisted(() => ({
  createRazorpayOrder: vi.fn(),
  refundPayment: vi.fn(),
  scheduleOrderExpiry: vi.fn(),
  enqueueEmail: vi.fn(),
}))

vi.mock('../src/config/razorpay.js', () => ({
  razorpay: { orders: { create: createRazorpayOrder }, payments: { refund: refundPayment } },
}))
vi.mock('../src/queues/queues.js', () => ({
  scheduleOrderExpiry,
  enqueueEmail,
  scheduleReconciliation: vi.fn(),
}))

import crypto from 'node:crypto'
import request from 'supertest'

import { app } from '../src/app.js'
import { buildCheckoutBody, createProductWithVariant, createUser, createZone, getOrder, getOrderWithRelations, getPaymentByOrder, loginAs, resetDatabase, signWebhookBody } from './setup/testHelpers.js'
import { transitionOrder } from '../src/services/orderService.js'

beforeEach(async () => {
  await resetDatabase()
  enqueueEmail.mockReset()
  createRazorpayOrder.mockImplementation(async ({ receipt }) => ({ id: `razorpay-${receipt}` }))
  refundPayment.mockResolvedValue({ id: 'refund-1' })
  scheduleOrderExpiry.mockResolvedValue({})
  enqueueEmail.mockResolvedValue({})
})

async function createCheckout(user, idempotencyKey) {
  const { variant } = await createProductWithVariant({ stock: 10, pricePaise: 10000 })
  await createZone('110001', 0)
  const agent = await loginAs(user)
  const response = await agent.post('/api/orders/checkout')
    .set('Idempotency-Key', idempotencyKey)
    .send(buildCheckoutBody(variant.id))
    .expect(201)
  return { agent, order: response.body.data.order, payment: response.body.data.payment }
}

async function markPaid(order, payment, eventId = crypto.randomUUID()) {
  const payload = {
    event: 'payment.captured',
    payload: { payment: { entity: {
      id: `payment-${eventId}`,
      order_id: payment.razorpayOrderId,
      amount: payment.amountPaise,
      method: 'card',
      status: 'captured',
    } } },
  }
  const signed = signWebhookBody(payload)
  await request(app).post('/api/payments/webhook')
    .set('Content-Type', 'application/json')
    .set('x-razorpay-signature', signed.signature)
    .set('x-razorpay-event-id', eventId)
    .send(signed.rawBody.toString('utf8'))
    .expect(200)
  return getOrder(order.id)
}

describe('admin and delivery order flow', () => {
  it('allows only one competing status transition to commit', async () => {
    const customer = await createUser('CUSTOMER')
    const { order } = await createCheckout(customer, 'flow-concurrent-transition')

    const results = await Promise.allSettled([
      transitionOrder({ orderId: order.id, to: 'PAID', changedBy: 'webhook', note: 'Payment captured' }),
      transitionOrder({ orderId: order.id, to: 'PAID', changedBy: 'webhook', note: 'Payment captured' }),
    ])

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
    const rejected = results.find((result) => result.status === 'rejected')
    expect(rejected.reason.statusCode).toBe(409)
    const saved = await getOrderWithRelations(order.id)
    expect(saved.status).toBe('PAID')
    expect(saved.history.filter((entry) => entry.toStatus === 'PAID')).toHaveLength(1)
  })

  it('moves a paid order through packing and OTP delivery', async () => {
    const customer = await createUser('CUSTOMER')
    const admin = await createUser('ADMIN')
    const delivery = await createUser('DELIVERY')
    const { order, payment } = await createCheckout(customer, 'flow-001')
    await markPaid(order, payment, 'flow-payment-1')

    const adminAgent = await loginAs(admin)
    const adminView = await adminAgent.get(`/api/admin/orders/${order.id}`).expect(200)
    expect(adminView.body.data.order.user).toEqual({ name: customer.name, email: customer.email, phone: customer.phone })
    await adminAgent.post(`/api/admin/orders/${order.id}/pack`).expect(200)

    const deliveryAgent = await loginAs(delivery)
    const listed = await deliveryAgent.get('/api/delivery/orders').expect(200)
    expect(listed.body.data.orders[0].status).toBe('PACKED')
    await deliveryAgent.post(`/api/delivery/orders/${order.id}/start`).expect(200)

    const otpEmail = enqueueEmail.mock.calls.find((call) => call[0].subject.startsWith('Out for delivery'))
    const otp = otpEmail?.[0].html.match(/\b\d{6}\b/)?.[0]
    expect(otp).toMatch(/^\d{6}$/)

    await deliveryAgent.post(`/api/delivery/orders/${order.id}/complete`).send({ otp: '000000' }).expect(400)
    expect((await getOrder(order.id)).status).toBe('OUT_FOR_DELIVERY')
    await deliveryAgent.post(`/api/delivery/orders/${order.id}/complete`).send({ otp }).expect(200)

    const finalOrder = await getOrderWithRelations(order.id)
    expect(finalOrder.status).toBe('DELIVERED')
    expect(finalOrder.history.map((entry) => entry.toStatus)).toEqual([
      'PENDING_PAYMENT', 'PAID', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED',
    ])
    expect(enqueueEmail).toHaveBeenCalledTimes(4)

    const otherCustomer = await createUser('CUSTOMER')
    const otherAgent = await loginAs(otherCustomer)
    await otherAgent.get(`/api/orders/${order.id}`).expect(404)
  })

  it('cancels a paid admin order and refunds its captured payment', async () => {
    const customer = await createUser('CUSTOMER')
    const admin = await createUser('ADMIN')
    const { order, payment } = await createCheckout(customer, 'flow-002')
    await markPaid(order, payment, 'flow-payment-2')

    const adminAgent = await loginAs(admin)
    const response = await adminAgent.post(`/api/admin/orders/${order.id}/cancel`).expect(200)
    expect(response.body.data.order.status).toBe('CANCELLED')
    expect(refundPayment).toHaveBeenCalledWith(expect.stringMatching(/^payment-flow-payment-2$/), { amount: order.totalPaise })
    expect((await getPaymentByOrder(order.id)).status).toBe('REFUNDED')
  })
})

