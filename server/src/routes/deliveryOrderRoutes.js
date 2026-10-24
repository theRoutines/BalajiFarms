import { Router } from 'express'

import * as deliveryOrderController from '../controllers/deliveryOrderController.js'
import { authenticate } from '../middleware/authenticate.js'
import { requireRole } from '../middleware/requireRole.js'
import { validate } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { completeDeliverySchema } from '../validators/deliveryValidators.js'
import { orderIdParamsSchema } from '../validators/orderValidators.js'

const router = Router()
router.use(authenticate, requireRole('DELIVERY', 'ADMIN'))
router.get('/', asyncHandler(deliveryOrderController.listOrders))
router.post('/:id/start', validate({ params: orderIdParamsSchema }), asyncHandler(deliveryOrderController.startOrder))
router.post('/:id/complete', validate({ params: orderIdParamsSchema, body: completeDeliverySchema }), asyncHandler(deliveryOrderController.completeOrder))

export { router as deliveryOrderRoutes }

