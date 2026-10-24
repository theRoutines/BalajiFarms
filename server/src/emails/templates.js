import { BRAND_NAME } from '../config/env.js'
import { formatRupees } from '../utils/money.js'

function layout(title, bodyHtml) {
  return `<!doctype html><html><body style="margin:0;background:#fbf7ee;color:#26352a;font-family:Arial,sans-serif">
    <div style="max-width:620px;margin:24px auto;background:#fff;padding:28px;border-radius:12px">
      <h1 style="color:#2f5d3a;margin-top:0">${BRAND_NAME}</h1>
      <h2>${title}</h2>${bodyHtml}
    </div></body></html>`
}

function orderSummary(order) {
  const rows = (order.items || []).map((item) => `<tr>
    <td style="padding:6px 0">${item.productName} (${item.variantLabel}) × ${item.quantity}</td>
    <td style="padding:6px 0;text-align:right">${formatRupees(item.unitPricePaise * item.quantity)}</td>
  </tr>`).join('')
  return `<table style="width:100%;border-collapse:collapse">${rows}
    <tr><td style="padding-top:10px"><strong>Total</strong></td><td style="padding-top:10px;text-align:right"><strong>${formatRupees(order.totalPaise)}</strong></td></tr>
  </table>`
}

function orderBody(order, message) {
  return `<p>${message}</p><p>Order <strong>${order.orderNumber}</strong></p>${orderSummary(order)}`
}

export function paymentConfirmedEmail(order) {
  return { subject: `Payment confirmed for ${order.orderNumber}`, html: layout('Payment confirmed', orderBody(order, 'We received your payment and are preparing your order.')) }
}

export function packedEmail(order) {
  return { subject: `Order packed: ${order.orderNumber}`, html: layout('Your order is packed', orderBody(order, 'Your order has been packed and is ready for delivery.')) }
}

export function outForDeliveryEmail(order, { otp } = {}) {
  const otpBlock = `<p style="font-size:22px"><strong>Delivery OTP: ${otp || '------'}</strong></p>`
  return { subject: `Out for delivery: ${order.orderNumber}`, html: layout('Out for delivery', `${orderBody(order, 'Your order is on its way.')}${otpBlock}<p>Share this OTP with the delivery partner only when your order arrives.</p>`) }
}

export function deliveredEmail(order) {
  return { subject: `Delivered: ${order.orderNumber}`, html: layout('Order delivered', orderBody(order, 'Your order has been delivered. Thank you for shopping with us.')) }
}

export function cancelledEmail(order, { refund = false } = {}) {
  const refundMessage = refund ? '<p>Your captured payment will be refunded to the original payment method.</p>' : ''
  return { subject: `Order cancelled: ${order.orderNumber}`, html: layout('Order cancelled', `${orderBody(order, 'Your order has been cancelled.')}${refundMessage}`) }
}

export function expiredEmail(order) {
  return { subject: `Payment window expired: ${order.orderNumber}`, html: layout('Payment window expired', orderBody(order, 'The payment window for this order expired, so the reservation was released.')) }
}

