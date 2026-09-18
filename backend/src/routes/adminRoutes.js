import { Router } from 'express'
import * as adminController from '../controllers/adminController.js'
import { authenticate, authorize } from '../middleware/auth.js'

const router = Router()

// All admin routes require admin authentication
router.use(authenticate)
router.use(authorize('ADMIN', 'SUPER_ADMIN'))

// Dashboard and stats
router.get('/dashboard', adminController.getDashboardStats)

// Reports
router.get('/reports/sales', adminController.getSalesReport)
router.get('/reports/products', adminController.getTopProducts)

// Customers
router.get('/customers', adminController.getCustomers)

// List endpoints for all resources
router.get('/products', adminController.listAllProducts)
router.get('/categories', adminController.listAllCategories)
router.get('/branches', adminController.listAllBranches)
router.get('/delivery-areas', adminController.listAllDeliveryAreas)
router.get('/deals', adminController.listAllDeals)
router.get('/coupons', adminController.listAllCoupons)

export default router
