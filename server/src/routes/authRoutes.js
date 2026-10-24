import { Router } from 'express'

import * as authController from '../controllers/authController.js'
import { authenticate } from '../middleware/authenticate.js'
import { authLimiter } from '../middleware/rateLimiters.js'
import { validate } from '../middleware/validate.js'
import { loginSchema, registerSchema } from '../validators/authValidators.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

router.post('/register', authLimiter, validate({ body: registerSchema }), asyncHandler(authController.register))
router.post('/login', authLimiter, validate({ body: loginSchema }), asyncHandler(authController.login))
router.post('/refresh', asyncHandler(authController.refresh))
router.post('/logout', asyncHandler(authController.logout))
router.get('/me', authenticate, authController.me)

export { router as authRoutes }
