import { Router } from 'express'
import { authenticate, authorize } from '../middleware/auth.js'
import { upload, toPublicUrl } from '../utils/upload.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'
import { ApiError } from '../utils/ApiError.js'

const router = Router()

router.post(
  '/image',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  upload.single('image'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw ApiError.badRequest('No image file provided')
    sendSuccess(res, {
      statusCode: 201,
      message: 'Image uploaded successfully',
      data: { url: toPublicUrl(req.file.filename) }
    })
  })
)

export default router
