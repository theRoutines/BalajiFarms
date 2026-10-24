import { handleWebhook } from '../services/paymentService.js'

export async function webhook(request, response) {
  const result = await handleWebhook(
    request.body,
    request.headers['x-razorpay-signature'],
    request.headers['x-razorpay-event-id'],
  )
  response.json({ success: true, data: result })
}
