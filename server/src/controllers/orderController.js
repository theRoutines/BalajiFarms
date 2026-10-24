import * as checkoutService from '../services/checkoutService.js'
import * as orderService from '../services/orderService.js'

export async function checkout(request, response) {
  const result = await checkoutService.createCheckout({
    userId: request.user.id,
    items: request.body.items,
    shippingAddress: request.body.shippingAddress,
    idempotencyKey: request.headers['idempotency-key'],
  })
  response.status(201).json({ success: true, data: result })
}

export async function listOrders(request, response) {
  const orders = await orderService.listMyOrders(request.user.id)
  response.json({ success: true, data: { orders } })
}

export async function getOrder(request, response) {
  const order = await orderService.getMyOrder(request.user.id, request.params.id)
  response.json({ success: true, data: { order } })
}

export async function paymentSession(request, response) {
  const result = await checkoutService.getPaymentSession(request.user.id, request.params.id)
  response.json({ success: true, data: { payment: result.payment } })
}

export async function cancelOrder(request, response) {
  const order = await orderService.cancelMyOrder(request.user.id, request.params.id)
  response.json({ success: true, data: { order } })
}
