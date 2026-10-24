import * as fulfillmentService from '../services/fulfillmentService.js'

export async function listOrders(request, response) {
  const result = await fulfillmentService.listAdminOrders(request.query)
  response.json({ success: true, data: result })
}

export async function getOrder(request, response) {
  const order = await fulfillmentService.getAdminOrder(request.params.id)
  response.json({ success: true, data: { order } })
}

export async function packOrder(request, response) {
  const order = await fulfillmentService.markPacked(request.params.id, request.user.id)
  response.json({ success: true, data: { order } })
}

export async function cancelOrder(request, response) {
  const order = await fulfillmentService.adminCancelOrder(request.params.id, request.user.id)
  response.json({ success: true, data: { order } })
}

