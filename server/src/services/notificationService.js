import { enqueueEmail } from '../queues/queues.js'
import {
  cancelledEmail,
  deliveredEmail,
  expiredEmail,
  outForDeliveryEmail,
  packedEmail,
  paymentConfirmedEmail,
} from '../emails/templates.js'

const templates = {
  PAID: paymentConfirmedEmail,
  PACKED: packedEmail,
  OUT_FOR_DELIVERY: outForDeliveryEmail,
  DELIVERED: deliveredEmail,
  CANCELLED: cancelledEmail,
  EXPIRED: expiredEmail,
}

export async function sendOrderStatusEmail(order, toStatus, extra = {}) {
  if (!order?.user?.email) return
  const createTemplate = templates[toStatus]
  if (!createTemplate) return

  const email = createTemplate(order, extra)
  await enqueueEmail({ to: order.user.email, ...email })
}
