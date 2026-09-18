import { Router } from 'express'
import * as branchController from '../controllers/branchController.js'
import { authenticate, authorize, optionalAuthenticate } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { createBranchSchema, listBranchesQuerySchema, updateBranchSchema } from '../validations/branchValidation.js'

const router = Router()

router.get('/', optionalAuthenticate, validate(listBranchesQuerySchema, 'query'), branchController.listBranches)
router.get('/:id', branchController.getBranch)
router.post(
  '/',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  validate(createBranchSchema),
  branchController.createBranch
)
router.put(
  '/:id',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  validate(updateBranchSchema),
  branchController.updateBranch
)
router.delete('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), branchController.deleteBranch)

export default router
