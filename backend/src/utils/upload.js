import crypto from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import multer from 'multer'
import { ApiError } from './ApiError.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const UPLOADS_DIR = path.join(__dirname, '..', 'uploads')

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`)
  }
})

function fileFilter(req, file, cb) {
  if (!ALLOWED_TYPES.has(file.mimetype)) {
    cb(ApiError.badRequest('Only JPEG, PNG, WEBP or GIF images are allowed'))
    return
  }
  cb(null, true)
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
})

export function toPublicUrl(filename) {
  return `/uploads/${filename}`
}
