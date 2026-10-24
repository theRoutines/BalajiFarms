import { createRequire } from 'node:module'
import crypto from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const dotenv = require('../server/node_modules/dotenv')
const { Pool } = require('../server/node_modules/pg')

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../server/.env') })

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'local-development-webhook-secret'
const baseUrl = process.env.API_URL || 'http://localhost:5000'

function signWebhook(payload) {
  const rawBody = Buffer.from(JSON.stringify(payload))
  const signature = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex')
  return { rawBody, signature }
}

async function main() {
  const targetOrderNumber = process.argv[2]

  let order
  if (targetOrderNumber) {
    const result = await pool.query('SELECT * FROM "Order" WHERE "orderNumber" = $1', [targetOrderNumber])
    order = result.rows[0]
  } else {
    // Find latest PENDING_PAYMENT order
    const result = await pool.query(`
      SELECT *
      FROM "Order"
      WHERE "status" = 'PENDING_PAYMENT'
      ORDER BY "createdAt" DESC, "id" DESC
      LIMIT 1
    `)
    order = result.rows[0]
  }

  if (!order) {
    console.log('⚠️ No pending order found to capture payment for.')
    console.log('Create an order from checkout first, or provide an order number: node scripts/simulateWebhook.js <orderNumber>')
    await pool.end()
    process.exit(0)
  }

  console.log(`\nSimulating payment capture for Order #${order.orderNumber}...`)

  const payload = {
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: `pay_sim_${Date.now()}`,
          order_id: order.razorpayOrderId,
          amount: order.totalPaise,
          currency: 'INR',
          status: 'captured',
          method: 'upi',
        },
      },
    },
  }

  const { rawBody, signature } = signWebhook(payload)

  const res = await fetch(`${baseUrl}/api/payments/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-razorpay-signature': signature,
      'x-razorpay-event-id': `sim_evt_${Date.now()}`,
    },
    body: rawBody,
  })

  const data = await res.json()
  if (res.ok) {
    console.log(`✅ Webhook sent successfully!`)
    console.log(`Order #${order.orderNumber} is now marked as PAID.`)
    console.log(`Watch the customer timeline or /admin/orders update live in real-time via Socket.io!\n`)
  } else {
    console.error('❌ Failed to capture webhook:', data)
  }

  await pool.end()
}

main().catch((err) => {
  console.error('Error running simulator:', err.message)
  process.exit(1)
})

