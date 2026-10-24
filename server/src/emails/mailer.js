import nodemailer from 'nodemailer'

import { env } from '../config/env.js'

const transportConfig = {
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE || env.SMTP_PORT === 465,
}

if (env.SMTP_USER && env.SMTP_PASS) {
  transportConfig.auth = {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  }
}

const transport = nodemailer.createTransport(transportConfig)

export async function sendEmail({ to, subject, html }) {
  try {
    return await transport.sendMail({ from: env.EMAIL_FROM, to, subject, html })
  } catch (error) {
    if (env.NODE_ENV === 'development' && (!env.SMTP_USER || env.SMTP_HOST === 'localhost')) {
      console.warn(`[Mailer] Development SMTP warning for ${to}: ${error.message}`)
      return { messageId: 'dev-fallback' }
    }
    throw error
  }
}
