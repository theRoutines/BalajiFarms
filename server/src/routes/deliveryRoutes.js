import { Router } from 'express'

import * as deliveryZoneController from '../controllers/deliveryZoneController.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { authenticate } from '../middleware/authenticate.js'
import { requireRole } from '../middleware/requireRole.js'
import { validate } from '../middleware/validate.js'
import { pincodeQuerySchema } from '../validators/deliveryValidators.js'
import { createZoneSchema, updateZoneSchema, zoneIdParamsSchema } from '../validators/adminValidators.js'

const router = Router()
router.get('/check', validate({ query: pincodeQuerySchema }), asyncHandler(deliveryZoneController.checkPincode))

const adminRouter = Router()
adminRouter.use(authenticate, requireRole('ADMIN'))
adminRouter.get('/', asyncHandler(deliveryZoneController.listZones))
adminRouter.post('/', validate({ body: createZoneSchema }), asyncHandler(deliveryZoneController.createZone))
adminRouter.patch('/:id', validate({ params: zoneIdParamsSchema, body: updateZoneSchema }), asyncHandler(deliveryZoneController.updateZone))

export { router as deliveryRoutes, adminRouter as adminZoneRoutes }
