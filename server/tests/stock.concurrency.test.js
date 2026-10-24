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

import { buildCheckoutBody, countOrders, createProductWithVariant, createUser, createZone, getVariant, loginAs, resetDatabase } from './setup/testHelpers.js'

beforeEach(async () => {
  await resetDatabase()
  let sequence = 0
  createRazorpayOrder.mockImplementation(async () => ({ id: `razorpay-concurrency-${sequence += 1}` }))
  scheduleOrderExpiry.mockResolvedValue({})
  enqueueEmail.mockResolvedValue({})
})

describe('stock concurrency', () => {
  it('never oversells stock when many customers check out together', async () => {
    const { variant } = await createProductWithVariant({ stock: 10 })
    await createZone()
    const agents = await Promise.all(Array.from({ length: 30 }, async () => loginAs(await createUser())))

    const responses = await Promise.all(agents.map((agent, index) => agent.post('/api/orders/checkout')
      .set('Idempotency-Key', `parallel-${index}`)
      .send(buildCheckoutBody(variant.id))))

    expect(responses.filter((response) => response.status === 201)).toHaveLength(10)
    expect(responses.filter((response) => response.status === 409)).toHaveLength(20)
    expect((await getVariant(variant.id)).stock).toBe(0)
    expect(await countOrders()).toBe(10)
  })

  it('decrements once when one customer repeats the same key concurrently', async () => {
    const user = await createUser()
    const { variant } = await createProductWithVariant({ stock: 5 })
    await createZone()
    const agent = await loginAs(user)

    const responses = await Promise.all(Array.from({ length: 10 }, () => agent.post('/api/orders/checkout')
      .set('Idempotency-Key', 'same-key-001')
      .send(buildCheckoutBody(variant.id))))

    expect(responses.every((response) => response.status === 201)).toBe(true)
    expect(await countOrders()).toBe(1)
    expect((await getVariant(variant.id)).stock).toBe(4)
  })
})
