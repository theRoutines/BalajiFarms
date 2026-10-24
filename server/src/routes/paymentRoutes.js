import express, { Router } from 'express'

import * as paymentController from '../controllers/paymentController.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()
router.post('/webhook', express.raw({ type: 'application/json' }), asyncHandler(paymentController.webhook))

export { router as paymentRoutes }
