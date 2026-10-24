import nodemailer from 'nodemailer'

import { env } from '../config/env.js'

const transport = nodemailer.createTransport({ host: env.SMTP_HOST, port: env.SMTP_PORT, secure: false })

export function sendEmail({ to, subject, html }) {
  return transport.sendMail({ from: env.EMAIL_FROM, to, subject, html })
}
