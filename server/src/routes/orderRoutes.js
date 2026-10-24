import { Router } from 'express'

import * as orderController from '../controllers/orderController.js'
import { authenticate } from '../middleware/authenticate.js'
import { checkoutLimiter } from '../middleware/rateLimiters.js'
import { validate } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { checkoutSchema, idempotencyHeaderSchema, orderIdParamsSchema } from '../validators/orderValidators.js'

const router = Router()
router.use(authenticate)
router.post('/checkout', checkoutLimiter, validate({ body: checkoutSchema, headers: idempotencyHeaderSchema }), asyncHandler(orderController.checkout))
router.get('/', asyncHandler(orderController.listOrders))
router.get('/:id/payment-session', validate({ params: orderIdParamsSchema }), asyncHandler(orderController.paymentSession))
router.post('/:id/cancel', validate({ params: orderIdParamsSchema }), asyncHandler(orderController.cancelOrder))
router.get('/:id', validate({ params: orderIdParamsSchema }), asyncHandler(orderController.getOrder))

export { router as orderRoutes }
