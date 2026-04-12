import { v2 as cloudinary } from 'cloudinary'
import streamifier from 'streamifier'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

/**
 * Upload a buffer to Cloudinary
 * @param {Buffer} buffer - file buffer from multer
 * @param {string} folder - cloudinary folder path
 * @returns {Promise<string>} secure URL
 */
export const uploadImage = (buffer, folder = 'pixora') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [
          { quality: 'auto:good', fetch_format: 'auto' },
          { width: 1080, crop: 'limit' },
        ],
      },
      (error, result) => {
        if (error) return reject(error)
        resolve(result.secure_url)
      }
    )
    streamifier.createReadStream(buffer).pipe(uploadStream)
  })
}

export default cloudinary
