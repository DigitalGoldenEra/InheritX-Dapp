/**
 * Beneficiary KYC Routes
 * Handles KYC submission and status checks for beneficiaries
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { prisma } from '../utils/prisma';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { keccak256, createKYCHash } from '../utils/crypto';
import { logger } from '../utils/logger';
import { createCloudinaryStorage, isCloudinaryConfigured } from '../utils/cloudinary';

const router = Router();

// Configure multer for Cloudinary uploads
let upload: multer.Multer;

if (isCloudinaryConfigured()) {
  const cloudinaryStorage = createCloudinaryStorage();
  upload = multer({
    storage: cloudinaryStorage,
    limits: {
      fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB default
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
  logger.info('Cloudinary storage configured for Beneficiary KYC uploads');
} else {
  logger.warn('Cloudinary not configured. Using memory storage. Files will not be persisted for Beneficiary KYC.');
  upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10),
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
const beneficiaryIdentificationSchema = z.object({
  // Either internal UUID or globalPlanId
  planId: z.union([z.string(), z.number()]),
  beneficiaryIndex: z.number().min(1),
  beneficiaryName: z.string().min(2),
  beneficiaryEmail: z.string().email(),
  beneficiaryRelationship: z.string().min(2),
});

const beneficiaryKYCSubmitSchema = z.object({
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

async function resolveBeneficiaryFromRequest(req: Request) {
  const idData = beneficiaryIdentificationSchema.parse({
    planId: typeof req.body.planId === 'string' && /^\d+$/.test(req.body.planId)
      ? Number(req.body.planId)
      : req.body.planId,
    beneficiaryIndex: Number(req.body.beneficiaryIndex),
    beneficiaryName: req.body.beneficiaryName,
    beneficiaryEmail: req.body.beneficiaryEmail,
    beneficiaryRelationship: req.body.beneficiaryRelationship,
  });

  const plan = await prisma.plan.findFirst({
    where: typeof idData.planId === 'number'
      ? { globalPlanId: idData.planId }
      : { id: idData.planId },
    include: {
      beneficiaries: true,
    },
  });

  if (!plan) {
    throw new AppError('Plan not found', 404);
  }

  const beneficiary = plan.beneficiaries.find(
    (b) => b.beneficiaryIndex === idData.beneficiaryIndex,
  );

  if (!beneficiary) {
    throw new AppError('Beneficiary not found', 404);
  }

  // Verify that provided identity matches stored hashes (same logic as claim verification)
  const nameHash = keccak256(idData.beneficiaryName);
  const emailHash = keccak256(idData.beneficiaryEmail);
  const relationshipHash = keccak256(idData.beneficiaryRelationship);

  if (
    nameHash !== beneficiary.nameHash ||
    emailHash !== beneficiary.emailHash ||
    relationshipHash !== beneficiary.relationshipHash
  ) {
    throw new AppError('Beneficiary details do not match records', 400);
  }

  return { idData, plan, beneficiary };
}

/**
 * @swagger
 * /beneficiary-kyc/status:
 *   post:
 *     summary: Get beneficiary KYC status
 *     description: Check KYC status for a beneficiary using plan and beneficiary details
 *     tags: [Beneficiary KYC]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planId
 *               - beneficiaryIndex
 *               - beneficiaryName
 *               - beneficiaryEmail
 *               - beneficiaryRelationship
 *             properties:
 *               planId:
 *                 oneOf:
 *                   - type: string
 *                   - type: integer
 *               beneficiaryIndex:
 *                 type: integer
 *               beneficiaryName:
 *                 type: string
 *               beneficiaryEmail:
 *                 type: string
 *                 format: email
 *               beneficiaryRelationship:
 *                 type: string
 *     responses:
 *       200:
 *         description: KYC status retrieved
 *       404:
 *         description: Beneficiary or KYC not found
 */
router.post(
  '/status',
  asyncHandler(async (req: Request, res: Response) => {
    const { beneficiary } = await resolveBeneficiaryFromRequest(req);

    const kyc = await prisma.beneficiaryKYC.findUnique({
      where: { beneficiaryId: beneficiary.id },
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
        message: 'Beneficiary KYC has not been submitted yet',
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
  }),
);

/**
 * @swagger
 * /beneficiary-kyc/submit:
 *   post:
 *     summary: Submit beneficiary KYC documents
 *     description: Beneficiary submits KYC tied to a specific plan and beneficiary index
 *     tags: [Beneficiary KYC]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - planId
 *               - beneficiaryIndex
 *               - beneficiaryName
 *               - beneficiaryEmail
 *               - beneficiaryRelationship
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
 *               planId:
 *                 oneOf:
 *                   - type: string
 *                   - type: integer
 *               beneficiaryIndex:
 *                 type: integer
 *               beneficiaryName:
 *                 type: string
 *               beneficiaryEmail:
 *                 type: string
 *                 format: email
 *               beneficiaryRelationship:
 *                 type: string
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               nationality:
 *                 type: string
 *               idType:
 *                 type: string
 *                 enum: [PASSPORT, DRIVERS_LICENSE, NATIONAL_ID, OTHER]
 *               idNumber:
 *                 type: string
 *               idExpiryDate:
 *                 type: string
 *                 format: date
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               country:
 *                 type: string
 *               postalCode:
 *                 type: string
 *               idDocument:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Beneficiary KYC submitted successfully
 *       400:
 *         description: Invalid data
 */
router.post(
  '/submit',
  upload.single('idDocument'),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      throw new AppError('ID document is required', 400);
    }

    const { beneficiary, idData } = await resolveBeneficiaryFromRequest(req);
    const data = beneficiaryKYCSubmitSchema.parse(req.body);

    let documentUrl: string;

    if (isCloudinaryConfigured()) {
      const cloudinaryFile = req.file as any;
      if (cloudinaryFile?.path) {
        documentUrl = cloudinaryFile.path;
        logger.info('Beneficiary KYC file uploaded to Cloudinary', {
          url: documentUrl,
          publicId: cloudinaryFile.filename,
          size: cloudinaryFile.size,
        });
      } else {
        logger.error('Cloudinary upload failed for beneficiary KYC - missing path', {
          file: req.file,
        });
        throw new AppError('Failed to upload file to Cloudinary', 500);
      }
    } else {
      throw new AppError(
        'File storage is not configured. Please configure Cloudinary.',
        500,
      );
    }

    const existingKYC = await prisma.beneficiaryKYC.findUnique({
      where: { beneficiaryId: beneficiary.id },
      select: {
        status: true,
        idDocumentUrl: true,
      },
    });

    if (existingKYC?.status === 'APPROVED') {
      throw new AppError('Beneficiary KYC already approved', 400);
    }

    if (existingKYC?.status === 'PENDING') {
      throw new AppError('Beneficiary KYC already submitted and pending review', 400);
    }

    const kycDataHash = createKYCHash(data.fullName, data.email, data.idNumber);

    const kyc = await prisma.beneficiaryKYC.upsert({
      where: { beneficiaryId: beneficiary.id },
      create: {
        beneficiaryId: beneficiary.id,
        fullName: data.fullName,
        email: data.email,
        dateOfBirth: new Date(data.dateOfBirth),
        nationality: data.nationality,
        idType: data.idType as any,
        idNumber: data.idNumber,
        idExpiryDate: new Date(data.idExpiryDate),
        idDocumentUrl: documentUrl,
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
        idDocumentUrl: documentUrl,
        address: data.address,
        city: data.city,
        country: data.country,
        postalCode: data.postalCode,
        status: 'PENDING',
        submittedAt: new Date(),
        reviewedAt: null,
        rejectionReason: null,
        kycDataHash,
      },
    });

    if (existingKYC?.idDocumentUrl && existingKYC.idDocumentUrl !== documentUrl) {
      try {
        const { deleteCloudinaryImage } = await import('../utils/cloudinary');
        await deleteCloudinaryImage(existingKYC.idDocumentUrl);
        logger.info('Old beneficiary KYC document deleted from Cloudinary');
      } catch (error) {
        logger.warn('Failed to delete old beneficiary KYC document from Cloudinary', {
          error,
        });
      }
    }

    await prisma.activity.create({
      data: {
        planId: idData.planId.toString(),
        type: 'BENEFICIARY_KYC_SUBMITTED',
        description: `Beneficiary KYC submitted for beneficiary index ${idData.beneficiaryIndex}`,
        metadata: {
          beneficiaryId: beneficiary.id,
          beneficiaryIndex: beneficiary.beneficiaryIndex,
          email: idData.beneficiaryEmail,
        },
      },
    });

    logger.info('Beneficiary KYC submitted', {
      beneficiaryId: beneficiary.id,
      planId: idData.planId,
      beneficiaryIndex: beneficiary.beneficiaryIndex,
    });

    res.status(201).json({
      message: 'Beneficiary KYC submitted successfully',
      status: kyc.status,
      kycDataHash,
    });
  }),
);

export default router;


