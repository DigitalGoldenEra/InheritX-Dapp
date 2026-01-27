/**
 * Claim Routes
 * Handles inheritance claiming by beneficiaries
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { prisma } from '../utils/prisma';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { keccak256, verifyHash } from '../utils/crypto';
import { logger } from '../utils/logger';
import { initiateBeneficiaryClaim2FA, verifyBeneficiaryClaim2FA } from '../utils/twoFactor';
import { createCloudinaryStorage, isCloudinaryConfigured } from '../utils/cloudinary';

const router = Router();

// Configure multer for Cloudinary uploads (same as KYC routes)
let upload: multer.Multer;

if (isCloudinaryConfigured()) {
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
} else {
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
const verifyClaimSchema = z.object({
  planId: z.string().or(z.number()),
  claimCode: z.string().length(6),
  beneficiaryName: z.string().min(2),
  beneficiaryEmail: z.string().email(),
  beneficiaryRelationship: z.string().min(2),
  twoFactorCode: z.string().length(6, 'Two-factor code must be 6 digits'),
});

const completeClaimSchema = z.object({
  planId: z.string(),
  beneficiaryIndex: z.number().min(1),
  claimerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  txHash: z.string(),
  claimedAmount: z.string(),
});

const requestClaim2FASchema = z.object({
  planId: z.string().or(z.number()),
  beneficiaryName: z.string().min(2),
  beneficiaryEmail: z.string().email(),
  beneficiaryRelationship: z.string().min(2),
});

const beneficiaryKYCSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2).max(100),
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
 * /claim/plan/{globalPlanId}:
 *   get:
 *     summary: Get plan info for claiming
 *     description: Public endpoint to retrieve plan information for beneficiaries
 *     tags: [Claims]
 *     parameters:
 *       - in: path
 *         name: globalPlanId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Global plan ID from smart contract
 *     responses:
 *       200:
 *         description: Plan information retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 planName:
 *                   type: string
 *                 planDescription:
 *                   type: string
 *                 assetType:
 *                   type: string
 *                 assetAmount:
 *                   type: string
 *                 distributionMethod:
 *                   type: string
 *                 transferDate:
 *                   type: string
 *                   format: date-time
 *                 status:
 *                   type: string
 *                 isClaimable:
 *                   type: boolean
 *                 timeUntilClaimable:
 *                   type: number
 *                   description: Milliseconds until claimable
 *                 beneficiaries:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       beneficiaryIndex:
 *                         type: number
 *                       allocatedPercentage:
 *                         type: number
 *                       allocatedAmount:
 *                         type: string
 *                       hasClaimed:
 *                         type: boolean
 *       404:
 *         description: Plan not found
 */
router.get('/plan/:globalPlanId', asyncHandler(async (req: Request, res: Response) => {
  const globalPlanId = parseInt(req.params.globalPlanId as string);

  const plan = await prisma.plan.findFirst({
    where: { globalPlanId },
    select: {
      id: true,
      planName: true,
      planDescription: true,
      assetType: true,
      assetAmount: true,
      distributionMethod: true,
      transferDate: true,
      status: true,
      beneficiaries: {
        select: {
          beneficiaryIndex: true,
          allocatedPercentage: true,
          allocatedAmount: true,
          hasClaimed: true,
        },
      },
    },
  });

  if (!plan) {
    throw new AppError('Plan not found', 404);
  }

  // Check if plan is claimable
  const isClaimable = plan.status === 'ACTIVE' && new Date() >= plan.transferDate;
  const timeUntilClaimable = Math.max(0, plan.transferDate.getTime() - Date.now());

  res.json({
    ...plan,
    isClaimable,
    timeUntilClaimable,
    // Don't expose sensitive data
    claimCodeHash: undefined,
  });
}));

/**
 * @swagger
 * /claim/2fa/request:
 *   post:
 *     summary: Request 2FA code for claim verification
 *     description: Sends a verification code to the beneficiary's email before claim verification.
 *     tags: [Claims]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planId
 *               - beneficiaryName
 *               - beneficiaryEmail
 *               - beneficiaryRelationship
 *             properties:
 *               planId:
 *                 oneOf:
 *                   - type: string
 *                   - type: integer
 *               beneficiaryName:
 *                 type: string
 *               beneficiaryEmail:
 *                 type: string
 *                 format: email
 *               beneficiaryRelationship:
 *                 type: string
 *     responses:
 *       200:
 *         description: 2FA code sent successfully
 *       400:
 *         description: Invalid data
 *       404:
 *         description: Plan or beneficiary not found
 */
router.post('/2fa/request', asyncHandler(async (req: Request, res: Response) => {
  const data = requestClaim2FASchema.parse(req.body);

  const plan = await prisma.plan.findFirst({
    where: typeof data.planId === 'number'
      ? { globalPlanId: data.planId }
      : { id: data.planId },
    include: {
      beneficiaries: true,
    },
  });

  if (!plan) {
    throw new AppError('Plan not found', 404);
  }

  const beneficiary = plan.beneficiaries.find(b => {
    const nameHash = keccak256(data.beneficiaryName);
    const emailHash = keccak256(data.beneficiaryEmail);
    const relationshipHash = keccak256(data.beneficiaryRelationship);

    return (
      nameHash === b.nameHash &&
      emailHash === b.emailHash &&
      relationshipHash === b.relationshipHash
    );
  });

  if (!beneficiary) {
    throw new AppError('Beneficiary not found or details do not match', 404);
  }

  await initiateBeneficiaryClaim2FA(plan.id, beneficiary.id, data.beneficiaryEmail);

  res.json({
    message: 'Two-factor code sent to beneficiary email',
  });
}));

/**
 * @swagger
 * /claim/verify:
 *   post:
 *     summary: Verify claim data before submitting to contract
 *     description: Verifies beneficiary details and claim code before contract interaction
 *     tags: [Claims]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planId
 *               - claimCode
 *               - beneficiaryName
 *               - beneficiaryEmail
 *               - beneficiaryRelationship
 *             properties:
 *               planId:
 *                 oneOf:
 *                   - type: string
 *                     format: uuid
 *                   - type: integer
 *                 description: Plan ID (database UUID or global ID)
 *               claimCode:
 *                 type: string
 *                 length: 6
 *                 description: 6-character claim code
 *               beneficiaryName:
 *                 type: string
 *                 minLength: 2
 *               beneficiaryEmail:
 *                 type: string
 *                 format: email
 *               beneficiaryRelationship:
 *                 type: string
 *                 minLength: 2
 *     responses:
 *       200:
 *         description: Verification successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 verified:
 *                   type: boolean
 *                 planId:
 *                   type: string
 *                 globalPlanId:
 *                   type: number
 *                 beneficiaryIndex:
 *                   type: number
 *                 allocatedAmount:
 *                   type: string
 *                 assetType:
 *                   type: string
 *                 contractCallData:
 *                   type: object
 *                   properties:
 *                     planId:
 *                       type: number
 *                     beneficiaryIndex:
 *                       type: number
 *       400:
 *         description: Invalid claim data or plan not claimable
 *       404:
 *         description: Plan or beneficiary not found
 */
router.post('/verify', asyncHandler(async (req: Request, res: Response) => {
  const data = verifyClaimSchema.parse(req.body);

  // Find plan by global ID or database ID
  const plan = await prisma.plan.findFirst({
    where: typeof data.planId === 'number'
      ? { globalPlanId: data.planId }
      : { id: data.planId },
    include: {
      beneficiaries: true,
    },
  });

  if (!plan) {
    throw new AppError('Plan not found', 404);
  }

  // Check plan status
  if (plan.status !== 'ACTIVE') {
    throw new AppError(`Plan is not active. Current status: ${plan.status}`, 400);
  }

  // Check transfer date
  if (new Date() < plan.transferDate) {
    throw new AppError('Plan is not yet claimable', 400);
  }

  // Hash the claim code and beneficiary details
  const claimCodeHash = keccak256(data.claimCode);
  const nameHash = keccak256(data.beneficiaryName);
  const emailHash = keccak256(data.beneficiaryEmail);
  const relationshipHash = keccak256(data.beneficiaryRelationship);

  // Find matching beneficiary by name/email/relationship hashes
  const beneficiary = plan.beneficiaries.find(b => (
    nameHash === b.nameHash &&
    emailHash === b.emailHash &&
    relationshipHash === b.relationshipHash
  ));

  if (!beneficiary) {
    throw new AppError('Beneficiary not found or details do not match', 404);
  }

  // Verify claim code against this specific beneficiary's claimCodeHash
  if (claimCodeHash !== beneficiary.claimCodeHash) {
    throw new AppError('Invalid claim code', 401);
  }

  // Verify 2FA code for this beneficiary
  const is2FAValid = verifyBeneficiaryClaim2FA(plan.id, beneficiary.id, data.twoFactorCode);
  if (!is2FAValid) {
    throw new AppError('Invalid or expired two-factor code', 400);
  }

  if (beneficiary.hasClaimed) {
    throw new AppError('This beneficiary has already claimed their inheritance', 400);
  }

  // Check beneficiary KYC status
  const beneficiaryKYC = await prisma.beneficiaryKYC.findUnique({
    where: { email: data.beneficiaryEmail.toLowerCase() },
    select: { status: true },
  });

  if (!beneficiaryKYC || beneficiaryKYC.status !== 'APPROVED') {
    const kycStatus = beneficiaryKYC?.status || 'NOT_SUBMITTED';
    throw new AppError(
      kycStatus === 'PENDING'
        ? 'Your KYC verification is pending approval. Please wait for admin review.'
        : kycStatus === 'REJECTED'
          ? 'Your KYC verification was rejected. Please resubmit with valid documents.'
          : 'KYC verification is required before claiming. Please submit your KYC.',
      403
    );
  }

  // Log verification attempt
  await prisma.activity.create({
    data: {
      planId: plan.id,
      type: 'CLAIM_VERIFIED',
      description: `Claim verified for beneficiary ${beneficiary.beneficiaryIndex}`,
      metadata: {
        beneficiaryIndex: beneficiary.beneficiaryIndex,
        email: data.beneficiaryEmail,
      },
    },
  });

  logger.info('Claim verified:', {
    planId: plan.id,
    beneficiaryIndex: beneficiary.beneficiaryIndex,
  });

  res.json({
    verified: true,
    planId: plan.id,
    globalPlanId: plan.globalPlanId,
    beneficiaryIndex: beneficiary.beneficiaryIndex,
    allocatedAmount: beneficiary.allocatedAmount,
    assetType: plan.assetType,
    // Return data needed for contract call
    contractCallData: {
      planId: plan.globalPlanId,
      beneficiaryIndex: beneficiary.beneficiaryIndex,
      // Note: Frontend will need to send unhashed data to contract
    },
  });
}));

/**
 * @swagger
 * /claim/complete:
 *   post:
 *     summary: Mark claim as completed
 *     description: Updates backend after successful on-chain claim transaction
 *     tags: [Claims]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planId
 *               - beneficiaryIndex
 *               - claimerAddress
 *               - txHash
 *               - claimedAmount
 *             properties:
 *               planId:
 *                 type: string
 *                 format: uuid
 *               beneficiaryIndex:
 *                 type: number
 *                 minimum: 1
 *               claimerAddress:
 *                 type: string
 *                 pattern: '^0x[a-fA-F0-9]{40}$'
 *               txHash:
 *                 type: string
 *                 description: Transaction hash from blockchain
 *               claimedAmount:
 *                 type: string
 *                 description: Amount claimed in wei
 *     responses:
 *       200:
 *         description: Claim marked as complete
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 allBeneficiariesClaimed:
 *                   type: boolean
 *       400:
 *         description: Invalid input or already claimed
 *       404:
 *         description: Beneficiary not found
 */
router.post('/complete', asyncHandler(async (req: Request, res: Response) => {
  const data = completeClaimSchema.parse(req.body);

  const beneficiary = await prisma.beneficiary.findFirst({
    where: {
      planId: data.planId,
      beneficiaryIndex: data.beneficiaryIndex,
    },
    include: {
      plan: true,
    },
  });

  if (!beneficiary) {
    throw new AppError('Beneficiary not found', 404);
  }

  if (beneficiary.hasClaimed) {
    throw new AppError('Already claimed', 400);
  }

  // Update beneficiary
  await prisma.beneficiary.update({
    where: { id: beneficiary.id },
    data: {
      hasClaimed: true,
      claimedAt: new Date(),
      claimedByAddress: data.claimerAddress,
      claimedAmount: data.claimedAmount,
      claimTxHash: data.txHash,
    },
  });

  // Check if all beneficiaries have claimed
  const allBeneficiaries = await prisma.beneficiary.findMany({
    where: { planId: data.planId },
  });

  const allClaimed = allBeneficiaries.every(b =>
    b.id === beneficiary.id ? true : b.hasClaimed
  );

  if (allClaimed) {
    await prisma.plan.update({
      where: { id: data.planId },
      data: {
        status: 'EXECUTED',
        isClaimedFully: true,
      },
    });
  }

  // Log activity
  await prisma.activity.create({
    data: {
      planId: data.planId,
      type: 'CLAIM_COMPLETED',
      description: `Beneficiary ${data.beneficiaryIndex} claimed ${data.claimedAmount}`,
      metadata: {
        beneficiaryIndex: data.beneficiaryIndex,
        claimerAddress: data.claimerAddress,
        claimedAmount: data.claimedAmount,
        txHash: data.txHash,
      },
    },
  });

  logger.info('Claim completed:', {
    planId: data.planId,
    beneficiaryIndex: data.beneficiaryIndex,
    claimerAddress: data.claimerAddress,
    txHash: data.txHash,
  });

  res.json({
    success: true,
    message: 'Claim completed successfully',
    allBeneficiariesClaimed: allClaimed,
  });
}));

/**
 * @swagger
 * /claim/my-claims:
 *   get:
 *     summary: Get claims by email
 *     description: Retrieve all plans where the provided email is a beneficiary
 *     tags: [Claims]
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Email address to search for
 *     responses:
 *       200:
 *         description: List of claims for the email
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   beneficiaryId:
 *                     type: string
 *                   beneficiaryIndex:
 *                     type: number
 *                   name:
 *                     type: string
 *                   relationship:
 *                     type: string
 *                   allocatedPercentage:
 *                     type: number
 *                   allocatedAmount:
 *                     type: string
 *                   hasClaimed:
 *                     type: boolean
 *                   claimedAt:
 *                     type: string
 *                     format: date-time
 *                     nullable: true
 *                   plan:
 *                     $ref: '#/components/schemas/Plan'
 *                   isClaimable:
 *                     type: boolean
 *       400:
 *         description: Email required
 */
router.get('/my-claims', asyncHandler(async (req: Request, res: Response) => {
  const email = req.query.email as string;

  if (!email) {
    throw new AppError('Email required', 400);
  }

  // Hash the email to find matching beneficiaries
  const emailHash = keccak256(email);

  const beneficiaries = await prisma.beneficiary.findMany({
    where: { emailHash },
    include: {
      plan: {
        select: {
          id: true,
          planName: true,
          planDescription: true,
          assetType: true,
          assetAmount: true,
          distributionMethod: true,
          transferDate: true,
          status: true,
          globalPlanId: true,
        },
      },
    },
  });

  const claims = beneficiaries.map(b => ({
    beneficiaryId: b.id,
    beneficiaryIndex: b.beneficiaryIndex,
    name: b.name,
    relationship: b.relationship,
    allocatedPercentage: b.allocatedPercentage,
    allocatedAmount: b.allocatedAmount,
    hasClaimed: b.hasClaimed,
    claimedAt: b.claimedAt,
    claimedAmount: b.claimedAmount,
    plan: b.plan,
    isClaimable: b.plan.status === 'ACTIVE' && new Date() >= b.plan.transferDate && !b.hasClaimed,
  }));

  res.json(claims);
}));

// ============================================
// BENEFICIARY KYC ENDPOINTS
// ============================================

/**
 * @swagger
 * /claim/kyc/status:
 *   get:
 *     summary: Get beneficiary KYC status by email
 *     description: Public endpoint to check KYC status for a beneficiary
 *     tags: [Claims]
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Beneficiary's email address
 *     responses:
 *       200:
 *         description: KYC status retrieved
 *       400:
 *         description: Email required
 */
router.get('/kyc/status', asyncHandler(async (req: Request, res: Response) => {
  const email = req.query.email as string;

  if (!email) {
    throw new AppError('Email is required', 400);
  }

  const kyc = await prisma.beneficiaryKYC.findUnique({
    where: { email: email.toLowerCase() },
    select: {
      status: true,
      submittedAt: true,
      reviewedAt: true,
      rejectionReason: true,
      fullName: true,
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
  });
}));

/**
 * @swagger
 * /claim/kyc/submit:
 *   post:
 *     summary: Submit beneficiary KYC
 *     description: Public endpoint for beneficiaries to submit KYC before claiming
 *     tags: [Claims]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - fullName
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
 *               email:
 *                 type: string
 *                 format: email
 *               fullName:
 *                 type: string
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
 *         description: KYC submitted successfully
 *       400:
 *         description: Invalid input or KYC already approved
 */
router.post(
  '/kyc/submit',
  upload.single('idDocument'),
  asyncHandler(async (req: Request, res: Response) => {
    // Validate file was uploaded
    if (!req.file) {
      throw new AppError('ID document is required', 400);
    }

    const data = beneficiaryKYCSchema.parse(req.body);
    const normalizedEmail = data.email.toLowerCase();

    // Get file URL from Cloudinary
    let documentUrl: string;

    if (isCloudinaryConfigured()) {
      const cloudinaryFile = req.file as any;
      if (cloudinaryFile?.path) {
        documentUrl = cloudinaryFile.path;
        logger.info('Beneficiary KYC file uploaded to Cloudinary:', {
          url: documentUrl,
          email: normalizedEmail,
        });
      } else {
        throw new AppError('Failed to upload file', 500);
      }
    } else {
      throw new AppError('File storage is not configured', 500);
    }

    // Check existing KYC
    const existingKYC = await prisma.beneficiaryKYC.findUnique({
      where: { email: normalizedEmail },
      select: { status: true, idDocumentUrl: true },
    });

    if (existingKYC?.status === 'APPROVED') {
      throw new AppError('KYC already approved', 400);
    }

    if (existingKYC?.status === 'PENDING') {
      throw new AppError('KYC already submitted and pending review', 400);
    }

    // Create or update BeneficiaryKYC record
    const kyc = await prisma.beneficiaryKYC.upsert({
      where: { email: normalizedEmail },
      create: {
        email: normalizedEmail,
        fullName: data.fullName,
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
      },
      update: {
        fullName: data.fullName,
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
      },
    });

    // Delete old document from Cloudinary if resubmitting
    if (existingKYC?.idDocumentUrl && existingKYC.idDocumentUrl !== documentUrl) {
      try {
        const { deleteCloudinaryImage } = await import('../utils/cloudinary');
        await deleteCloudinaryImage(existingKYC.idDocumentUrl);
      } catch (error) {
        logger.warn('Failed to delete old document:', { error });
      }
    }

    logger.info('Beneficiary KYC submitted:', {
      email: normalizedEmail,
      idType: data.idType,
    });

    res.status(201).json({
      message: 'KYC submitted successfully. Your verification is pending review.',
      status: 'PENDING',
    });
  })
);

export default router;


