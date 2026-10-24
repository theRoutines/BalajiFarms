import * as fulfillmentService from '../services/fulfillmentService.js'

export async function listOrders(request, response) {
  const orders = await fulfillmentService.listDeliveryOrders()
  response.json({ success: true, data: { orders } })
}

export async function startOrder(request, response) {
  const order = await fulfillmentService.startDelivery(request.params.id, request.user.id)
  response.json({ success: true, data: { order } })
}

export async function completeOrder(request, response) {
  const order = await fulfillmentService.completeDelivery(request.params.id, request.user.id, request.body.otp)
  response.json({ success: true, data: { order } })
}

