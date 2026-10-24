import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createRazorpayOrder, fetchPayments, refundPayment, scheduleOrderExpiry, enqueueEmail } = vi.hoisted(() => ({
  createRazorpayOrder: vi.fn(),
  fetchPayments: vi.fn(),
  refundPayment: vi.fn(),
  scheduleOrderExpiry: vi.fn(),
  enqueueEmail: vi.fn(),
}))

vi.mock('../src/config/razorpay.js', () => ({
  razorpay: { orders: { create: createRazorpayOrder, fetchPayments }, payments: { refund: refundPayment } },
}))
vi.mock('../src/queues/queues.js', () => ({
  scheduleOrderExpiry,
  enqueueEmail,
  scheduleReconciliation: vi.fn(),
}))

import { expireOrderIfUnpaid } from '../src/services/orderService.js'
import { reconcileOrders } from '../src/queues/reconciliationWorker.js'
import { buildCheckoutBody, createProductWithVariant, createUser, createZone, getOrder, getPayment, getVariant, loginAs, resetDatabase, setOrderCreatedAt, setOrderStatus } from './setup/testHelpers.js'

beforeEach(async () => {
  await resetDatabase()
  createRazorpayOrder.mockImplementation(async ({ receipt }) => ({ id: `razorpay-${receipt}` }))
  fetchPayments.mockResolvedValue({ items: [] })
  refundPayment.mockResolvedValue({ id: 'refund-1' })
  scheduleOrderExpiry.mockResolvedValue({})
  enqueueEmail.mockResolvedValue({})
})

async function createOrder() {
  const user = await createUser()
  const { variant } = await createProductWithVariant({ stock: 5, pricePaise: 10000 })
  await createZone('110001', 0)
  const agent = await loginAs(user)
  const response = await agent.post('/api/orders/checkout').set('Idempotency-Key', 'expiry-001').send(buildCheckoutBody(variant.id)).expect(201)
  return { order: response.body.data.order, variant }
}

describe('expiry and reconciliation', () => {
  it('expires an unpaid order and restores stock exactly once', async () => {
    const { order, variant } = await createOrder()

    await expireOrderIfUnpaid(order.id)
    await expireOrderIfUnpaid(order.id)

    expect((await getOrder(order.id)).status).toBe('EXPIRED')
    expect((await getVariant(variant.id)).stock).toBe(5)
  })

  it('does not expire a paid order', async () => {
    const { order } = await createOrder()
    await setOrderStatus(order.id, 'PAID')

    await expireOrderIfUnpaid(order.id)

    expect((await getOrder(order.id)).status).toBe('PAID')
  })

  it('reconciles a captured payment reported by Razorpay', async () => {
    const { order } = await createOrder()
    const savedOrder = await getOrder(order.id)
    await setOrderCreatedAt(order.id, new Date(Date.now() - 3 * 60 * 1000))
    fetchPayments.mockResolvedValue({ items: [{ id: 'reconciled-payment', order_id: savedOrder.razorpayOrderId, amount: savedOrder.totalPaise, method: 'card', status: 'captured' }] })

    await reconcileOrders()

    expect((await getOrder(order.id)).status).toBe('PAID')
    expect(await getPayment('reconciled-payment')).not.toBeNull()
  })
})
