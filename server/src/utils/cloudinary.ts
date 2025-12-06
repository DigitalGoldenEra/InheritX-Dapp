/**
 * Cloudinary Configuration and Utilities
 * Handles image uploads to Cloudinary cloud storage
 */

import cloudinary from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { logger } from './logger';

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Verify Cloudinary configuration
 * @returns true if configuration is valid
 */
export function isCloudinaryConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

/**
 * Create Cloudinary storage for multer
 * @returns CloudinaryStorage instance
 */
export function createCloudinaryStorage() {
  if (!isCloudinaryConfigured()) {
    throw new Error(
      'Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.'
    );
  }

  return new CloudinaryStorage({
    cloudinary: cloudinary.v2,
    params: async (req, file) => {
      return {
        folder: 'inheritx/kyc', // Organize files in a folder
        allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
        resource_type: 'auto', // Automatically detect image or raw (for PDF)
        transformation: [
          {
            quality: 'auto:good', // Optimize image quality
            fetch_format: 'auto', // Auto format based on browser
          },
        ],
        public_id: `kyc-${Date.now()}-${Math.round(Math.random() * 1E9)}`, // Unique filename
      };
    },
  });
}

/**
 * Delete an image from Cloudinary
 * @param urlOrPublicId Cloudinary URL or public ID
 * @returns Promise<boolean> true if deleted successfully
 */
export async function deleteCloudinaryImage(urlOrPublicId: string): Promise<boolean> {
  try {
    let publicId = urlOrPublicId;

    // Extract public_id from Cloudinary URL if full URL is provided
    // URL format: https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/v{version}/{public_id}.{format}
    if (urlOrPublicId.includes('cloudinary.com')) {
      // Manual extraction from Cloudinary URL
      const urlParts = urlOrPublicId.split('/');
      const uploadIndex = urlParts.findIndex(part => part === 'upload');
      
      if (uploadIndex !== -1 && uploadIndex < urlParts.length - 1) {
        // Get everything after 'upload/v{version}/'
        // Format: inheritx/kyc/kyc-1234567890-123456789
        const afterUpload = urlParts.slice(uploadIndex + 2).join('/');
        // Remove file extension if present
        publicId = afterUpload.replace(/\.[^/.]+$/, '');
      } else {
        logger.warn('Could not extract public_id from URL:', { url: urlOrPublicId });
        return false;
      }
    }

    const result = await cloudinary.v2.uploader.destroy(publicId, {
      resource_type: 'auto',
    });

    if (result.result === 'ok') {
      logger.info('Cloudinary image deleted:', { publicId, originalInput: urlOrPublicId });
      return true;
    }

    logger.warn('Cloudinary deletion result:', { result, publicId });
    return false;
  } catch (error) {
    logger.error('Error deleting Cloudinary image:', { error, urlOrPublicId });
    return false;
  }
}

/**
 * Upload a file buffer directly to Cloudinary
 * @param buffer File buffer
 * @param originalName Original filename
 * @returns Promise with Cloudinary upload result
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  originalName: string
): Promise<{ url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.v2.uploader.upload_stream(
      {
        folder: 'inheritx/kyc',
        allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
        resource_type: 'auto',
        public_id: `kyc-${Date.now()}-${Math.round(Math.random() * 1E9)}`,
        transformation: [
          {
            quality: 'auto:good',
            fetch_format: 'auto',
          },
        ],
      },
      (error, result) => {
        if (error) {
          logger.error('Cloudinary upload error:', { error, originalName });
          reject(error);
        } else if (result) {
          logger.info('Cloudinary upload successful:', {
            publicId: result.public_id,
            url: result.secure_url,
          });
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
          });
        } else {
          reject(new Error('Upload failed: No result returned'));
        }
      }
    );

    uploadStream.end(buffer);
  });
}

export { cloudinary };
export default cloudinary.v2;
