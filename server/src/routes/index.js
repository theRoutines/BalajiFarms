import { Router } from 'express'

import { authRoutes } from './authRoutes.js'
import { adminCattleRoutes, herdRoutes } from './herdRoutes.js'
import { adminProductRoutes, adminVariantRoutes, productRoutes } from './productRoutes.js'
import { adminZoneRoutes, deliveryRoutes } from './deliveryRoutes.js'
import { orderRoutes } from './orderRoutes.js'
import { adminOrderRoutes } from './adminOrderRoutes.js'
import { deliveryOrderRoutes } from './deliveryOrderRoutes.js'
import { adminUploadRoutes } from './uploadRoutes.js'

const router = Router()

router.use('/auth', authRoutes)
router.use('/products', productRoutes)
router.use('/delivery', deliveryRoutes)
router.use('/herd', herdRoutes)
router.use('/orders', orderRoutes)
router.use('/admin/orders', adminOrderRoutes)
router.use('/delivery/orders', deliveryOrderRoutes)
router.use('/admin/products', adminProductRoutes)
router.use('/admin/variants', adminVariantRoutes)
router.use('/admin/zones', adminZoneRoutes)
router.use('/admin/cattle', adminCattleRoutes)
router.use('/admin/upload', adminUploadRoutes)

export { router as apiRoutes }
