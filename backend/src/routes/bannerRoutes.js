import { Router } from 'express'
import * as bannerController from '../controllers/bannerController.js'
import { authenticate, authorize, optionalAuthenticate } from '../middleware/auth.js'

const router = Router()

router.get('/', optionalAuthenticate, bannerController.listBanners)
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), bannerController.createBanner)
router.put('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), bannerController.updateBanner)
router.delete('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), bannerController.deleteBanner)

export default router
