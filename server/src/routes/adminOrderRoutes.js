import { Router } from 'express'

import * as adminOrderController from '../controllers/adminOrderController.js'
import { authenticate } from '../middleware/authenticate.js'
import { requireRole } from '../middleware/requireRole.js'
import { validate } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { adminOrderQuerySchema, orderIdParamsSchema } from '../validators/orderValidators.js'

const router = Router()
router.use(authenticate, requireRole('ADMIN'))
router.get('/', validate({ query: adminOrderQuerySchema }), asyncHandler(adminOrderController.listOrders))
router.get('/:id', validate({ params: orderIdParamsSchema }), asyncHandler(adminOrderController.getOrder))
router.post('/:id/pack', validate({ params: orderIdParamsSchema }), asyncHandler(adminOrderController.packOrder))
router.post('/:id/cancel', validate({ params: orderIdParamsSchema }), asyncHandler(adminOrderController.cancelOrder))

export { router as adminOrderRoutes }

