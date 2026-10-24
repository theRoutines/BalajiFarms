import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createRazorpayOrder, scheduleOrderExpiry, enqueueEmail } = vi.hoisted(() => ({
  createRazorpayOrder: vi.fn(),
  scheduleOrderExpiry: vi.fn(),
  enqueueEmail: vi.fn(),
}))

vi.mock('../src/config/razorpay.js', () => ({
  razorpay: { orders: { create: createRazorpayOrder }, payments: { refund: vi.fn() } },
}))
vi.mock('../src/queues/queues.js', () => ({
  scheduleOrderExpiry,
  enqueueEmail,
  scheduleReconciliation: vi.fn(),
}))

import { buildCheckoutBody, countOrders, createProductWithVariant, createUser, createZone, getOrderByUser, getVariant, loginAs, resetDatabase, setVariantActive } from './setup/testHelpers.js'

beforeEach(async () => {
  await resetDatabase()
  createRazorpayOrder.mockReset()
  createRazorpayOrder.mockImplementation(async ({ receipt }) => ({ id: `razorpay-${receipt}` }))
  scheduleOrderExpiry.mockReset()
  scheduleOrderExpiry.mockResolvedValue({})
  enqueueEmail.mockReset()
  enqueueEmail.mockResolvedValue({})
})

describe('checkout', () => {
  it('creates a pending order using the database price and reserves stock', async () => {
    const user = await createUser()
    const { variant } = await createProductWithVariant({ stock: 5, pricePaise: 49900 })
    await createZone('110001', 2500)
    const agent = await loginAs(user)
    const body = { ...buildCheckoutBody(variant.id, 2), items: [{ variantId: variant.id, quantity: 2, pricePaise: 1 }] }

    const response = await agent.post('/api/orders/checkout').set('Idempotency-Key', 'checkout-001').send(body).expect(201)

    expect(response.body.data.order.status).toBe('PENDING_PAYMENT')
    expect(response.body.data.order.subtotalPaise).toBe(99800)
    expect(response.body.data.order.totalPaise).toBe(102300)
    expect(response.body.data.payment.amountPaise).toBe(102300)
    const savedVariant = await getVariant(variant.id)
    expect(savedVariant.stock).toBe(3)
  })

  it('returns the same order for a repeated idempotency key', async () => {
    const user = await createUser()
    const { variant } = await createProductWithVariant({ stock: 5 })
    await createZone()
    const agent = await loginAs(user)
    const body = buildCheckoutBody(variant.id)

    const first = await agent.post('/api/orders/checkout').set('Idempotency-Key', 'checkout-002').send(body).expect(201)
    const second = await agent.post('/api/orders/checkout').set('Idempotency-Key', 'checkout-002').send(body).expect(201)

    expect(second.body.data.order.id).toBe(first.body.data.order.id)
    expect(await countOrders()).toBe(1)
    expect((await getVariant(variant.id)).stock).toBe(4)
  })

  it('returns the payment session for the order owner', async () => {
    const user = await createUser()
    const { variant } = await createProductWithVariant({ stock: 5, pricePaise: 49900 })
    await createZone('110001', 2500)
    const agent = await loginAs(user)
    const checkout = await agent.post('/api/orders/checkout').set('Idempotency-Key', 'checkout-session-001').send(buildCheckoutBody(variant.id)).expect(201)

    const session = await agent.get(`/api/orders/${checkout.body.data.order.id}/payment-session`).expect(200)
    expect(session.body.data.payment).toMatchObject({ amountPaise: 52400, currency: 'INR' })
  })

  it('rejects unavailable zones, inactive variants and missing idempotency keys', async () => {
    const user = await createUser()
    const { variant } = await createProductWithVariant()
    const agent = await loginAs(user)

    await agent.post('/api/orders/checkout').set('Idempotency-Key', 'checkout-003').send(buildCheckoutBody(variant.id)).expect(400)
    await setVariantActive(variant.id, false)
    await createZone()
    await agent.post('/api/orders/checkout').set('Idempotency-Key', 'checkout-004').send(buildCheckoutBody(variant.id)).expect(400)
    await agent.post('/api/orders/checkout').send(buildCheckoutBody(variant.id)).expect(400)
  })

  it('rolls back earlier stock reservations when a later line lacks stock', async () => {
    const user = await createUser()
    const first = await createProductWithVariant({ stock: 5 })
    const second = await createProductWithVariant({ stock: 0 })
    await createZone()
    const agent = await loginAs(user)

    await agent.post('/api/orders/checkout').set('Idempotency-Key', 'checkout-005').send({
      ...buildCheckoutBody(first.variant.id),
      items: [{ variantId: first.variant.id, quantity: 1 }, { variantId: second.variant.id, quantity: 1 }],
    }).expect(409)

    expect((await getVariant(first.variant.id)).stock).toBe(5)
    expect(await countOrders()).toBe(0)
  })

  it('restores reserved stock once when the customer cancels', async () => {
    const user = await createUser()
    const { variant } = await createProductWithVariant({ stock: 5 })
    await createZone()
    const agent = await loginAs(user)
    const checkout = await agent.post('/api/orders/checkout').set('Idempotency-Key', 'checkout-006').send(buildCheckoutBody(variant.id)).expect(201)

    await agent.post(`/api/orders/${checkout.body.data.order.id}/cancel`).expect(200)
    await agent.post(`/api/orders/${checkout.body.data.order.id}/cancel`).expect(409)
    expect((await getVariant(variant.id)).stock).toBe(5)
  })

  it('cancels a SQL-created order and restores stock when Razorpay fails', async () => {
    const user = await createUser()
    const { variant } = await createProductWithVariant({ stock: 5 })
    await createZone()
    const agent = await loginAs(user)
    createRazorpayOrder.mockRejectedValueOnce(new Error('Razorpay unavailable'))

    await agent.post('/api/orders/checkout').set('Idempotency-Key', 'checkout-007').send(buildCheckoutBody(variant.id)).expect(502)

    const cancelledOrder = await getOrderByUser(user.id)
    expect(cancelledOrder.status).toBe('CANCELLED')
    expect((await getVariant(variant.id)).stock).toBe(5)
  })
})
