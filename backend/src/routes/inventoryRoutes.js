import { Router } from 'express'
import * as inventoryController from '../controllers/inventoryController.js'
import { authenticate, authorize } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import {
  createInventoryItemSchema,
  restockItemSchema,
  updateInventoryItemSchema
} from '../validations/inventoryValidation.js'

const router = Router()

router.use(authenticate)
router.use(authorize('ADMIN', 'SUPER_ADMIN'))

router.get('/', inventoryController.listInventoryItems)
router.post('/', validate(createInventoryItemSchema), inventoryController.createInventoryItem)
router.put('/:id', validate(updateInventoryItemSchema), inventoryController.updateInventoryItem)
router.delete('/:id', inventoryController.deleteInventoryItem)
router.post('/:id/restock', validate(restockItemSchema), inventoryController.restockInventoryItem)

export default router
