import { Router } from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary.js'
import { AppError } from '../utils/AppError.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { image } = req.body
    if (!image || typeof image !== 'string') {
      throw new AppError('Image data is required', 400)
    }

    const isDataUri = image.startsWith('data:image/')
    const isHttpUrl = image.startsWith('http://') || image.startsWith('https://')
    if (!isDataUri && !isHttpUrl) {
      throw new AppError('Invalid image data format. Expected image data URI or URL.', 400)
    }

    // If Cloudinary credentials are fully configured in .env, upload directly to Cloudinary
    if (isCloudinaryConfigured) {
      try {
        const uploadResponse = await cloudinary.uploader.upload(image, {
          folder: 'balaji-farms/products',
          resource_type: 'image',
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        })

        return res.json({
          success: true,
          data: {
            url: uploadResponse.secure_url,
            publicId: uploadResponse.public_id,
            provider: 'cloudinary',
          },
        })
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError)
        throw new AppError(
          uploadError.message || 'Failed to upload image to Cloudinary',
          502
        )
      }
    }

    // Graceful fallback for local development if Cloudinary credentials are not configured yet
    const base64Matches = image.match(/^data:([A-Za-z-+/]+);base64,(.+)$/)
    if (!base64Matches) {
      throw new AppError('Invalid image data format. Expected base64 data URI.', 400)
    }

    const mimeType = base64Matches[1]
    const base64Data = base64Matches[2]
    const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg'
    const fileName = `product_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`

    // Target both server/public/uploads and client/public/uploads so either dev server can serve it directly
    const serverUploadsDir = path.resolve(__dirname, '../../public/uploads')
    const clientUploadsDir = path.resolve(__dirname, '../../../client/public/uploads')

    if (!fs.existsSync(serverUploadsDir)) {
      fs.mkdirSync(serverUploadsDir, { recursive: true })
    }
    if (!fs.existsSync(clientUploadsDir)) {
      fs.mkdirSync(clientUploadsDir, { recursive: true })
    }

    const fileBuffer = Buffer.from(base64Data, 'base64')
    fs.writeFileSync(path.join(serverUploadsDir, fileName), fileBuffer)
    try {
      fs.writeFileSync(path.join(clientUploadsDir, fileName), fileBuffer)
    } catch {
      // Ignored if client folder is in different environment
    }

    return res.json({
      success: true,
      data: {
        url: `/uploads/${fileName}`,
        provider: 'local',
        message:
          'Saved locally. Configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in server/.env for Cloudinary CDN hosting.',
      },
    })
  })
)

export { router as adminUploadRoutes }

