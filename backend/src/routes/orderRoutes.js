import { Router } from 'express'
import * as orderController from '../controllers/orderController.js'
import { authenticate, authorize, optionalAuthenticate } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import {
  createOrderSchema,
  getCustomerOrdersQuerySchema,
  listAllOrdersQuerySchema,
  updateOrderStatusSchema
} from '../validations/orderValidation.js'

const router = Router()

// Must come first: specific paths before generic :id
// Guest checkout: orders can be placed without an account
router.post(
  '/',
  optionalAuthenticate,
  validate(createOrderSchema),
  orderController.createOrder
)

router.get(
  '/my-orders',
  authenticate,
  validate(getCustomerOrdersQuerySchema, 'query'),
  orderController.getCustomerOrders
)

// Admin-only routes with :id
router.patch(
  '/:id/status',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  validate(updateOrderStatusSchema),
  orderController.updateOrderStatus
)

// Generic :id routes
router.get(
  '/',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  validate(listAllOrdersQuerySchema, 'query'),
  orderController.listAllOrders
)

router.delete(
  '/:id',
  authenticate,
  orderController.cancelOrder
)

// Guest orders can be viewed without an account; registered-user orders still require ownership
router.get(
  '/:id',
  optionalAuthenticate,
  orderController.getOrder
)

export default router
