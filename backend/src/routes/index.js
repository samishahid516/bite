import { Router } from 'express'
import authRoutes from './authRoutes.js'
import categoryRoutes from './categoryRoutes.js'
import productRoutes from './productRoutes.js'
import dealRoutes from './dealRoutes.js'
import branchRoutes from './branchRoutes.js'
import deliveryAreaRoutes from './deliveryAreaRoutes.js'
import couponRoutes from './couponRoutes.js'
import reviewRoutes from './reviewRoutes.js'
import orderRoutes from './orderRoutes.js'
import userRoutes from './userRoutes.js'
import bannerRoutes from './bannerRoutes.js'
import addressRoutes from './addressRoutes.js'
import favoriteRoutes from './favoriteRoutes.js'
import adminRoutes from './adminRoutes.js'
import uploadRoutes from './uploadRoutes.js'
import inventoryRoutes from './inventoryRoutes.js'

const router = Router()

router.use('/auth', authRoutes)
router.use('/categories', categoryRoutes)
router.use('/products', productRoutes)
router.use('/deals', dealRoutes)
router.use('/branches', branchRoutes)
router.use('/delivery-areas', deliveryAreaRoutes)
router.use('/coupons', couponRoutes)
router.use('/reviews', reviewRoutes)
router.use('/orders', orderRoutes)
router.use('/users', userRoutes)
router.use('/banners', bannerRoutes)
router.use('/addresses', addressRoutes)
router.use('/favorites', favoriteRoutes)
router.use('/uploads', uploadRoutes)
router.use('/inventory', inventoryRoutes)
router.use('/admin', adminRoutes)

export default router
