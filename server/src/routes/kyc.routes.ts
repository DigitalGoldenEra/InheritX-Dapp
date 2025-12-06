/**
 * KYC Routes
 * Handles KYC submission and verification
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { prisma } from '../utils/prisma';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import { createKYCHash } from '../utils/crypto';
import { logger } from '../utils/logger';
import { createCloudinaryStorage, isCloudinaryConfigured } from '../utils/cloudinary';

const router = Router();

// Configure multer for Cloudinary uploads
let upload: multer.Multer;

if (isCloudinaryConfigured()) {
  // Use Cloudinary storage
  const cloudinaryStorage = createCloudinaryStorage();
  upload = multer({
    storage: cloudinaryStorage,
    limits: {
      fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB default
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, and PDF are allowed.'));
      }
    },
  });
  logger.info('Cloudinary storage configured for KYC uploads');
} else {
  // Fallback to memory storage if Cloudinary is not configured
  logger.warn('Cloudinary not configured. Using memory storage. Files will not be persisted.');
  upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'),
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, and PDF are allowed.'));
      }
    },
  });
}

// Validation schemas
const kycSubmitSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  nationality: z.string().min(2, 'Nationality is required'),
  idType: z.enum(['PASSPORT', 'DRIVERS_LICENSE', 'NATIONAL_ID', 'OTHER']),
  idNumber: z.string().min(4).max(50),
  idExpiryDate: z.string().min(1, 'ID expiry date is required'),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  country: z.string().min(2, 'Country is required'),
  postalCode: z.string().min(3, 'Postal code is required'),
});

/**
 * @swagger
 * /kyc/status:
 *   get:
 *     summary: Get current user's KYC status
 *     tags: [KYC]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: KYC status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [NOT_SUBMITTED, PENDING, APPROVED, REJECTED]
 *                 submittedAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                 reviewedAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                 rejectionReason:
 *                   type: string
 *                   nullable: true
 *                 fullName:
 *                   type: string
 *                   nullable: true
 *                 email:
 *                   type: string
 *                   nullable: true
 *                 idType:
 *                   type: string
 *                   nullable: true
 *       401:
 *         description: Unauthorized
 */
router.get('/status', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const kyc = await prisma.kYC.findUnique({
    where: { userId: req.user!.id },
    select: {
      status: true,
      submittedAt: true,
      reviewedAt: true,
      rejectionReason: true,
      fullName: true,
      email: true,
      idType: true,
    },
  });

  if (!kyc) {
    return res.json({
      status: 'NOT_SUBMITTED',
      message: 'KYC has not been submitted yet',
    });
  }

  res.json({
    status: kyc.status,
    submittedAt: kyc.submittedAt,
    reviewedAt: kyc.reviewedAt,
    rejectionReason: kyc.rejectionReason,
    fullName: kyc.fullName,
    email: kyc.email,
    idType: kyc.idType,
  });
}));

/**
 * @swagger
 * /kyc/submit:
 *   post:
 *     summary: Submit KYC documents
 *     tags: [KYC]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - dateOfBirth
 *               - nationality
 *               - idType
 *               - idNumber
 *               - idExpiryDate
 *               - address
 *               - city
 *               - country
 *               - postalCode
 *               - idDocument
 *             properties:
 *               fullName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 description: Required
 *               nationality:
 *                 type: string
 *                 description: Required
 *               idType:
 *                 type: string
 *                 enum: [PASSPORT, DRIVERS_LICENSE, NATIONAL_ID, OTHER]
 *               idNumber:
 *                 type: string
 *                 minLength: 4
 *                 maxLength: 50
 *               idExpiryDate:
 *                 type: string
 *                 format: date
 *                 description: Required
 *               address:
 *                 type: string
 *                 description: Required
 *               city:
 *                 type: string
 *                 description: Required
 *               country:
 *                 type: string
 *                 description: Required
 *               postalCode:
 *                 type: string
 *                 description: Required
 *               idDocument:
 *                 type: string
 *                 format: binary
 *                 description: ID document file (JPEG, PNG, or PDF, max 5MB)
 *     responses:
 *       201:
 *         description: KYC submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 status:
 *                   type: string
 *                   example: "PENDING"
 *                 kycDataHash:
 *                   type: string
 *                   description: Hash for on-chain submission
 *       400:
 *         description: Invalid input or KYC already submitted
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/submit',
  authenticateToken,
  upload.single('idDocument'),
  asyncHandler(async (req: Request, res: Response) => {
    // Validate file was uploaded
    if (!req.file) {
      throw new AppError('ID document is required', 400);
    }

    const data = kycSubmitSchema.parse(req.body);

    // Get file URL from Cloudinary
    // multer-storage-cloudinary stores the result in req.file.path (secure URL)
    let documentUrl: string;
    
    if (isCloudinaryConfigured()) {
      // File is already uploaded to Cloudinary via multer-storage-cloudinary
      // The file object will have the Cloudinary result with 'path' (secure URL) property
      const cloudinaryFile = req.file as any;
      if (cloudinaryFile?.path) {
        documentUrl = cloudinaryFile.path; // This is the secure URL from Cloudinary
        logger.info('File uploaded to Cloudinary:', { 
          url: documentUrl,
          publicId: cloudinaryFile.filename,
          size: cloudinaryFile.size 
        });
      } else {
        logger.error('Cloudinary upload failed - missing path:', { file: req.file });
        throw new AppError('Failed to upload file to Cloudinary', 500);
      }
    } else {
      // Fallback: If Cloudinary is not configured, we need to handle memory storage
      // For production, Cloudinary should always be configured
      throw new AppError('File storage is not configured. Please configure Cloudinary.', 500);
    }
    
    // Check if user already has approved KYC
    const existingKYC = await prisma.kYC.findUnique({
      where: { userId: req.user!.id },
      select: {
        status: true,
        idDocumentUrl: true,
      },
    });

    if (existingKYC?.status === 'APPROVED') {
      throw new AppError('KYC already approved', 400);
    }

    if (existingKYC?.status === 'PENDING') {
      throw new AppError('KYC already submitted and pending review', 400);
    }

    // Create KYC data hash for on-chain verification
    const kycDataHash = createKYCHash(data.fullName, data.email, data.idNumber);

    // Create or update KYC record
    const kyc = await prisma.kYC.upsert({
      where: { userId: req.user!.id },
      create: {
        userId: req.user!.id,
        fullName: data.fullName,
        email: data.email,
        dateOfBirth: new Date(data.dateOfBirth),
        nationality: data.nationality,
        idType: data.idType as any,
        idNumber: data.idNumber,
        idExpiryDate: new Date(data.idExpiryDate),
        idDocumentUrl: documentUrl, // Store Cloudinary URL
        address: data.address,
        city: data.city,
        country: data.country,
        postalCode: data.postalCode,
        status: 'PENDING',
        kycDataHash,
      },
      update: {
        fullName: data.fullName,
        email: data.email,
        dateOfBirth: new Date(data.dateOfBirth),
        nationality: data.nationality,
        idType: data.idType as any,
        idNumber: data.idNumber,
        idExpiryDate: new Date(data.idExpiryDate),
        idDocumentUrl: documentUrl, // Store Cloudinary URL
        address: data.address,
        city: data.city,
        country: data.country,
        postalCode: data.postalCode,
        status: 'PENDING',
        submittedAt: new Date(),
        reviewedAt: null, // Reset review date on resubmission
        rejectionReason: null,
        kycDataHash,
      },
    });

    // Delete old document from Cloudinary if resubmitting
    if (existingKYC?.idDocumentUrl && existingKYC.idDocumentUrl !== documentUrl) {
      try {
        const { deleteCloudinaryImage } = await import('../utils/cloudinary');
        await deleteCloudinaryImage(existingKYC.idDocumentUrl);
        logger.info('Old KYC document deleted from Cloudinary');
      } catch (error) {
        // Log but don't fail the request if deletion fails
        logger.warn('Failed to delete old document from Cloudinary:', { error });
      }
    }

    // Update user email if provided
    await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        email: data.email,
        name: data.fullName,
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        userId: req.user!.id,
        type: 'KYC_SUBMITTED',
        description: `KYC submitted for review`,
        metadata: { idType: data.idType },
      },
    });

    logger.info('KYC submitted:', {
      userId: req.user!.id,
      idType: data.idType,
    });

    res.status(201).json({
      message: 'KYC submitted successfully',
      status: 'PENDING',
      kycDataHash,
    });
  })
);

/**
 * @swagger
 * /kyc/hash:
 *   get:
 *     summary: Get KYC data hash for on-chain submission
 *     tags: [KYC]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: KYC hash retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 kycDataHash:
 *                   type: string
 *                   description: Keccak256 hash of KYC data
 *                   example: "0x..."
 *                 status:
 *                   type: string
 *                   enum: [PENDING, APPROVED, REJECTED]
 *       404:
 *         description: KYC not submitted
 *       401:
 *         description: Unauthorized
 */
router.get('/hash', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const kyc = await prisma.kYC.findUnique({
    where: { userId: req.user!.id },
    select: { kycDataHash: true, status: true },
  });

  if (!kyc) {
    throw new AppError('KYC not submitted', 404);
  }

  res.json({
    kycDataHash: kyc.kycDataHash,
    status: kyc.status,
  });
}));

export default router;

