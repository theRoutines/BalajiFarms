import { sendEmail } from '../src/emails/mailer.js'
import { env } from '../src/config/env.js'

async function run() {
  console.log(`Sending test email via ${env.SMTP_HOST}:${env.SMTP_PORT} to ${env.SMTP_USER}...`)
  try {
    const result = await sendEmail({
      to: env.SMTP_USER,
      subject: 'Balaji Farms - SMTP Integration Test',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #fbf7ee; color: #26352a; border-radius: 8px;">
          <h2 style="color: #2f5d3a; margin-top: 0;">Balaji Farms Mailer Connected!</h2>
          <p>Congratulations, your Gmail SMTP integration is active and working properly.</p>
          <p>Your background BullMQ workers are now set up to send live order receipts, OTPs, and delivery status updates to real customer emails.</p>
        </div>
      `,
    })
    console.log('Success! Test email sent. Message ID:', result?.messageId)
    process.exit(0)
  } catch (err) {
    console.error('Failed to send test email:', err)
    process.exit(1)
  }
}

run()

