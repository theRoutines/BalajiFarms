import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Buffer } from 'node:buffer'

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

import request from 'supertest'

import { app } from '../src/app.js'
import { buildCheckoutBody, countOrderHistory, countPayments, countWebhookEvents, createProductWithVariant, createUser, createZone, getOrder, getOrderWithRelations, getPayment, loginAs, resetDatabase, signWebhookBody } from './setup/testHelpers.js'
import { transitionOrder } from '../src/services/orderService.js'

beforeEach(async () => {
  await resetDatabase()
  createRazorpayOrder.mockImplementation(async ({ receipt }) => ({ id: `razorpay-${receipt}` }))
  refundPayment.mockReset()
  refundPayment.mockResolvedValue({ id: 'refund-1' })
  scheduleOrderExpiry.mockResolvedValue({})
  enqueueEmail.mockResolvedValue({})
})

async function createPendingOrder() {
  const user = await createUser()
  const { variant } = await createProductWithVariant({ stock: 5, pricePaise: 10000 })
  await createZone('110001', 0)
  const agent = await loginAs(user)
  const response = await agent.post('/api/orders/checkout').set('Idempotency-Key', 'webhook-001').send(buildCheckoutBody(variant.id)).expect(201)
  return response.body.data.order
}

function capturedPayload(order, eventId = 'event-1', paymentId = 'payment-1', amount = order.totalPaise) {
  const payload = { event: 'payment.captured', payload: { payment: { entity: {
    id: paymentId, order_id: order.payment?.razorpayOrderId || `razorpay-${order.orderNumber}`, amount, method: 'card', status: 'captured',
  } } } }
  const signed = signWebhookBody(payload)
  return { payload, signed, eventId }
}

describe('payment webhook', () => {
  it('rejects an invalid signature without changing data', async () => {
    await request(app).post('/api/payments/webhook').set('Content-Type', 'application/json').set('x-razorpay-signature', 'bad').set('x-razorpay-event-id', 'bad-event').send(Buffer.from('{}')).expect(400)
    expect(await countWebhookEvents()).toBe(0)
  })

  it('marks a pending order paid and records one payment', async () => {
    const order = await createPendingOrder()
    const savedOrder = await getOrder(order.id)
    const { payload, signed } = capturedPayload({ ...order, payment: { razorpayOrderId: savedOrder.razorpayOrderId } }, 'event-2', 'payment-2')

    await request(app).post('/api/payments/webhook').set('Content-Type', 'application/json').set('x-razorpay-signature', signed.signature).set('x-razorpay-event-id', 'event-2').send(signed.rawBody.toString('utf8')).expect(200)
    const updated = await getOrderWithRelations(order.id)
    expect(updated.status).toBe('PAID')
    expect(updated.payments).toHaveLength(1)
    expect(updated.history.filter((entry) => entry.toStatus === 'PAID')).toHaveLength(1)
    expect(payload.event).toBe('payment.captured')
  })

  it('deduplicates concurrent replays and duplicate payment ids', async () => {
    const order = await createPendingOrder()
    const savedOrder = await getOrder(order.id)
    const { signed } = capturedPayload({ ...order, payment: { razorpayOrderId: savedOrder.razorpayOrderId } }, 'event-3', 'payment-3')
    const headers = { 'Content-Type': 'application/json', 'x-razorpay-signature': signed.signature, 'x-razorpay-event-id': 'event-3' }

    await Promise.all(Array.from({ length: 5 }, () => request(app).post('/api/payments/webhook').set(headers).send(signed.rawBody.toString('utf8'))))
    const anotherSigned = capturedPayload({ ...order, payment: { razorpayOrderId: savedOrder.razorpayOrderId } }, 'event-4', 'payment-3').signed
    await request(app).post('/api/payments/webhook').set('Content-Type', 'application/json').set('x-razorpay-signature', anotherSigned.signature).set('x-razorpay-event-id', 'event-4').send(anotherSigned.rawBody.toString('utf8')).expect(200)

    expect(await countPayments()).toBe(1)
    expect(await countOrderHistory(order.id, 'PAID')).toBe(1)
  })

  it('records an amount mismatch without marking the order paid', async () => {
    const order = await createPendingOrder()
    const savedOrder = await getOrder(order.id)
    const { signed } = capturedPayload({ ...order, payment: { razorpayOrderId: savedOrder.razorpayOrderId } }, 'event-5', 'payment-5', order.totalPaise + 1)

    await request(app).post('/api/payments/webhook').set('Content-Type', 'application/json').set('x-razorpay-signature', signed.signature).set('x-razorpay-event-id', 'event-5').send(signed.rawBody.toString('utf8')).expect(200)
    expect((await getOrder(order.id)).status).toBe('PENDING_PAYMENT')
    expect((await getPayment('payment-5')).status).toBe('AMOUNT_MISMATCH')
  })

  it('refunds a valid payment that arrives after expiry', async () => {
    const order = await createPendingOrder()
    await transitionOrder({ orderId: order.id, to: 'EXPIRED', changedBy: 'system', note: 'test expiry' })
    const savedOrder = await getOrder(order.id)
    const { signed } = capturedPayload({ ...order, payment: { razorpayOrderId: savedOrder.razorpayOrderId } }, 'event-6', 'payment-6')

    await request(app).post('/api/payments/webhook').set('Content-Type', 'application/json').set('x-razorpay-signature', signed.signature).set('x-razorpay-event-id', 'event-6').send(signed.rawBody.toString('utf8')).expect(200)
    expect(refundPayment).toHaveBeenCalledWith('payment-6', { amount: order.totalPaise })
    expect((await getPayment('payment-6')).status).toBe('REFUNDED')
  })

  it('does not refund the same late payment twice across different webhook events', async () => {
    const order = await createPendingOrder()
    await transitionOrder({ orderId: order.id, to: 'EXPIRED', changedBy: 'system', note: 'test expiry' })
    const savedOrder = await getOrder(order.id)
    const first = capturedPayload({ ...order, payment: { razorpayOrderId: savedOrder.razorpayOrderId } }, 'event-late-1', 'payment-late-1')
    const second = capturedPayload({ ...order, payment: { razorpayOrderId: savedOrder.razorpayOrderId } }, 'event-late-2', 'payment-late-1')

    for (const webhook of [first, second]) {
      await request(app).post('/api/payments/webhook')
        .set('Content-Type', 'application/json')
        .set('x-razorpay-signature', webhook.signed.signature)
        .set('x-razorpay-event-id', webhook.eventId)
        .send(webhook.signed.rawBody.toString('utf8'))
        .expect(200)
    }

    expect(refundPayment).toHaveBeenCalledTimes(1)
    expect((await getPayment('payment-late-1')).status).toBe('REFUNDED')
  })

  it('records failed payments without changing the order status', async () => {
    const order = await createPendingOrder()
    const savedOrder = await getOrder(order.id)
    const payload = { event: 'payment.failed', payload: { payment: { entity: {
      id: 'payment-failed', order_id: savedOrder.razorpayOrderId, amount: order.totalPaise, method: 'card', status: 'failed',
    } } } }
    const signed = signWebhookBody(payload)

    await request(app).post('/api/payments/webhook').set('Content-Type', 'application/json').set('x-razorpay-signature', signed.signature).set('x-razorpay-event-id', 'event-failed').send(signed.rawBody.toString('utf8')).expect(200)
    expect((await getOrder(order.id)).status).toBe('PENDING_PAYMENT')
    expect((await getPayment('payment-failed')).status).toBe('FAILED')
  })
})
