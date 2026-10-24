import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const Redis = require('../server/node_modules/ioredis')

const redis = new Redis('redis://127.0.0.1:6379')

async function main() {
  const emailKeys = await redis.keys('bull:email:*')
  let latestOtp = null
  let matchedOrder = null
  let highestTimestamp = 0

  for (const key of emailKeys) {
    if (/bull:email:\d+$/.test(key)) {
      const jobData = await redis.hgetall(key)
      if (jobData && jobData.data && jobData.data.includes('Delivery OTP:')) {
        const match = jobData.data.match(/Delivery OTP:\s*(\d{6})/)
        const orderMatch = jobData.data.match(/Order\s*<strong>(DM-[^<]+)<\/strong>/)
        const timestamp = parseInt(jobData.timestamp || '0', 10)

        if (match && timestamp >= highestTimestamp) {
          highestTimestamp = timestamp
          latestOtp = match[1]
          matchedOrder = orderMatch ? orderMatch[1] : 'Latest Order'
        }
      }
    }
  }

  if (latestOtp) {
    console.log(`\n🚚 [Balaji Farms Delivery Handover OTP]`)
    console.log(`Order: ${matchedOrder}`)
    console.log(`Customer OTP: ${latestOtp}`)
    console.log(`Enter this 6-digit OTP on the /delivery page to mark handover complete.\n`)
  } else {
    console.log('⚠️ No delivery OTP found in queue. Click "Start Delivery" on /delivery first.')
  }

  await redis.quit()
}

main().catch((err) => {
  console.error('Error fetching OTP:', err.message)
  process.exit(1)
})

