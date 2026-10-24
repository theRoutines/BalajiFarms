import path from 'node:path'
import { fileURLToPath } from 'node:url'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import express from 'express'
import helmet from 'helmet'

import { env } from './config/env.js'
import { apiLimiter } from './middleware/rateLimiters.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { authenticate } from './middleware/authenticate.js'
import { requireRole } from './middleware/requireRole.js'
import { paymentRoutes } from './routes/paymentRoutes.js'
import { apiRoutes } from './routes/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

app.use(helmet())
app.use(cors({ origin: env.CLIENT_URL, credentials: true }))
app.use(cookieParser())
app.use('/uploads', express.static(path.resolve(__dirname, '../public/uploads')))
app.use('/api/payments', paymentRoutes)
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))
app.use('/api', apiLimiter)

app.get('/api/health', (request, response) => {
  response.json({
    success: true,
    data: { status: 'ok' },
  })
})

// These guards make authorization failures consistent even for staff endpoints added in later phases.
app.use('/api/admin', authenticate, requireRole('ADMIN'))
app.use('/api/delivery/orders', authenticate, requireRole('DELIVERY', 'ADMIN'))
app.use('/api', apiRoutes)
app.use(notFoundHandler)
app.use(errorHandler)

export { app }
