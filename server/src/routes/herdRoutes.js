import { Router } from 'express'

import * as herdController from '../controllers/herdController.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { authenticate } from '../middleware/authenticate.js'
import { requireRole } from '../middleware/requireRole.js'
import { validate } from '../middleware/validate.js'
import { cattleIdParamsSchema, createCattleSchema, updateCattleSchema } from '../validators/adminValidators.js'

const router = Router()
router.get('/stats', asyncHandler(herdController.getStats))

const adminRouter = Router()
adminRouter.use(authenticate, requireRole('ADMIN'))
adminRouter.get('/', asyncHandler(herdController.listCattle))
adminRouter.post('/', validate({ body: createCattleSchema }), asyncHandler(herdController.addCattle))
adminRouter.patch('/:id', validate({ params: cattleIdParamsSchema, body: updateCattleSchema }), asyncHandler(herdController.updateCattle))

export { router as herdRoutes, adminRouter as adminCattleRoutes }
