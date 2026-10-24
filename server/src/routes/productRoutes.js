import { Router } from 'express'

import * as productController from '../controllers/productController.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { authenticate } from '../middleware/authenticate.js'
import { requireRole } from '../middleware/requireRole.js'
import { validate } from '../middleware/validate.js'
import {
  createProductSchema,
  createVariantSchema,
  productIdParamsSchema,
  slugParamsSchema,
  updateProductSchema,
  updateVariantSchema,
  variantIdParamsSchema,
} from '../validators/productValidators.js'

const router = Router()

router.get('/', asyncHandler(productController.listProducts))
router.get('/:slug', validate({ params: slugParamsSchema }), asyncHandler(productController.getProduct))

const adminRouter = Router()
adminRouter.use(authenticate, requireRole('ADMIN'))
adminRouter.get('/', asyncHandler(productController.listAdminProducts))
adminRouter.post('/', validate({ body: createProductSchema }), asyncHandler(productController.createProduct))
adminRouter.patch('/:id', validate({ params: productIdParamsSchema, body: updateProductSchema }), asyncHandler(productController.updateProduct))
adminRouter.delete('/:id', validate({ params: productIdParamsSchema }), asyncHandler(productController.deleteProduct))
adminRouter.post('/:id/variants', validate({ params: productIdParamsSchema, body: createVariantSchema }), asyncHandler(productController.createVariant))

export { router as productRoutes, adminRouter as adminProductRoutes }

export const adminVariantRoutes = Router()
adminVariantRoutes.use(authenticate, requireRole('ADMIN'))
adminVariantRoutes.patch('/:id', validate({ params: variantIdParamsSchema, body: updateVariantSchema }), asyncHandler(productController.updateVariant))
