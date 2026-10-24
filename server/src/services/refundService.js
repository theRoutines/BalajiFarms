import { withTransaction } from '../config/pg.js'
import { razorpay } from '../config/razorpay.js'

export function refundPayment(razorpayPaymentId, amountPaise) {
  return razorpay.payments.refund(razorpayPaymentId, { amount: amountPaise })
}

export async function refundOrderPayments(orderId) {
  await withTransaction(async (client) => {
    const result = await client.query(`
      SELECT "id", "razorpayPaymentId", "amountPaise"
      FROM "Payment"
      WHERE "orderId" = $1 AND "status" = 'CAPTURED'
      ORDER BY "id" ASC
      FOR UPDATE
    `, [orderId])

    for (const payment of result.rows) {
      await refundPayment(payment.razorpayPaymentId, payment.amountPaise)
      await client.query(`
        UPDATE "Payment"
        SET "status" = 'REFUNDED'
        WHERE "id" = $1 AND "status" = 'CAPTURED'
      `, [payment.id])
    }
  })
}
