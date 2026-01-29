/**
 * Plan Routes
 * Handles inheritance plan management
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import {
  keccak256,
  encryptClaimCode,
  createBeneficiaryHashes,
  generateClaimCode,
} from '../utils/crypto';
import { logger } from '../utils/logger';
import { sendPlanCreationNotification } from '../utils/email';

const router = Router();

// Validation schemas
const beneficiarySchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  relationship: z.string().min(2).max(50),
  allocatedPercentage: z.number().min(1).max(10000), // Basis points
  claimCode: z.string().length(6).optional(), // Optional - will generate if not provided
});

const createPlanSchema = z.object({
  planName: z.string().min(2).max(100),
  planDescription: z.string().min(10).max(1000),
  assetType: z.enum(['ERC20_TOKEN1', 'ERC20_TOKEN2', 'ERC20_TOKEN3']),
  assetAmount: z.string(), // String for precision
  assetAmountWei: z.string(),
  distributionMethod: z.enum(['LUMP_SUM', 'QUARTERLY', 'YEARLY', 'MONTHLY']),
  transferDate: z.string().transform(s => new Date(s)),
  periodicPercentage: z.number().min(1).max(100).optional(),
  beneficiaries: z.array(beneficiarySchema).min(1).max(10),
  // Proof of Life option (LUMP_SUM only)
  proofOfLifeEnabled: z.boolean().optional().default(false),
  // Beneficiary notification option
  notifyBeneficiaries: z.boolean().optional().default(false),
  // On-chain data (after contract call)
  globalPlanId: z.number().optional(),
  userPlanId: z.number().optional(),
  txHash: z.string().optional(),
});

/**
 * @swagger
 * /plans:
 *   get:
 *     summary: Get all plans for current user
 *     tags: [Plans]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's plans
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Plan'
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const plans = await prisma.plan.findMany({
    where: { userId: req.user!.id },
    include: {
      beneficiaries: {
        select: {
          id: true,
          name: true,
          email: true,
          relationship: true,
          allocatedPercentage: true,
          hasClaimed: true,
          claimedAt: true,
        },
      },
      distributions: {
        select: {
          periodNumber: true,
          amount: true,
          scheduledDate: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(plans);
}));

/**
 * @swagger
 * /plans/{id}:
 *   get:
 *     summary: Get a specific plan
 *     tags: [Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Plan ID
 *     responses:
 *       200:
 *         description: Plan retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Plan'
 *       404:
 *         description: Plan not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const plan = await prisma.plan.findFirst({
    where: {
      id: req.params.id as string,
      userId: req.user!.id,
    },
    include: {
      beneficiaries: true,
      distributions: true,
    },
  });

  if (!plan) {
    throw new AppError('Plan not found', 404);
  }

  res.json(plan);
}));

/**
 * @swagger
 * /plans:
 *   post:
 *     summary: Create a new inheritance plan
 *     description: Creates a plan in the backend and returns hashed data for smart contract submission
 *     tags: [Plans]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planName
 *               - planDescription
 *               - assetType
 *               - assetAmount
 *               - assetAmountWei
 *               - distributionMethod
 *               - transferDate
 *               - beneficiaries
 *             properties:
 *               planName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               planDescription:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 1000
 *               assetType:
 *                 type: string
 *                 enum: [ERC20_TOKEN1, ERC20_TOKEN2, ERC20_TOKEN3]
 *               assetAmount:
 *                 type: string
 *                 description: Human-readable amount (e.g., "1.5")
 *               assetAmountWei:
 *                 type: string
 *                 description: Amount in wei/smallest unit
 *               distributionMethod:
 *                 type: string
 *                 enum: [LUMP_SUM, QUARTERLY, YEARLY, MONTHLY]
 *               transferDate:
 *                 type: string
 *                 format: date-time
 *               periodicPercentage:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 100
 *                 description: Required for non-lump sum distributions
 *               beneficiaries:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 10
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                     - email
 *                     - relationship
 *                     - allocatedPercentage
 *                   properties:
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                       format: email
 *                     relationship:
 *                       type: string
 *                     allocatedPercentage:
 *                       type: number
 *                       description: Percentage in basis points (10000 = 100%)
 *               claimCode:
 *                 type: string
 *                 length: 6
 *                 description: Optional - will be generated if not provided
 *     responses:
 *       201:
 *         description: Plan created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 plan:
 *                   allOf:
 *                     - $ref: '#/components/schemas/Plan'
 *                     - type: object
 *                       properties:
 *                         claimCode:
 *                           type: string
 *                           description: Unhashed claim code (only returned once!)
 *                 contractData:
 *                   type: object
 *                   description: Hashed data for smart contract submission
 *                   properties:
 *                     planNameHash:
 *                       type: string
 *                     planDescriptionHash:
 *                       type: string
 *                     claimCodeHash:
 *                       type: string
 *                     beneficiaries:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           nameHash:
 *                             type: string
 *                           emailHash:
 *                             type: string
 *                           relationshipHash:
 *                             type: string
 *                           allocatedPercentage:
 *                             type: number
 *       400:
 *         description: Invalid input or KYC not approved
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: KYC verification required
 */
router.post('/', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const data = createPlanSchema.parse(req.body);

  // Check KYC status
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: { kyc: true },
  });

  if (!user?.kyc || user.kyc.status !== 'APPROVED') {
    throw new AppError('KYC must be approved before creating plans', 403);
  }

  // Check 2FA
  if (!(user as any).twoFactorEnabled) {
    throw new AppError('2FA must be enabled to create plans', 403);
  }

  // Validate total percentage equals 100%
  const totalPercentage = data.beneficiaries.reduce(
    (sum, b) => sum + b.allocatedPercentage,
    0
  );
  if (totalPercentage !== 10000) {
    throw new AppError('Beneficiary percentages must total 100% (10000 basis points)', 400);
  }

  // Hash plan name and description
  const planNameHash = keccak256(data.planName);
  const planDescriptionHash = keccak256(data.planDescription);

  // Create beneficiary hashes with per-beneficiary claim codes
  const beneficiaryData = data.beneficiaries.map((b, index) => {
    const hashes = createBeneficiaryHashes(b.name, b.email, b.relationship);
    const allocatedAmount = (
      (BigInt(data.assetAmountWei) * BigInt(b.allocatedPercentage)) / BigInt(10000)
    ).toString();

    // Generate unique claim code for each beneficiary
    const claimCode = b.claimCode || generateClaimCode(6);
    const claimCodeEncrypted = encryptClaimCode(claimCode);
    const claimCodeHash = keccak256(claimCode);

    return {
      beneficiaryIndex: index + 1,
      name: b.name,
      email: b.email,
      relationship: b.relationship,
      nameHash: hashes.nameHash,
      emailHash: hashes.emailHash,
      relationshipHash: hashes.relationshipHash,
      combinedHash: hashes.combinedHash,
      allocatedPercentage: b.allocatedPercentage,
      allocatedAmount,
      claimCode, // Store for response
      claimCodeEncrypted,
      claimCodeHash,
    };
  });

  // Create the plan with beneficiaries
  const plan = await prisma.plan.create({
    data: {
      userId: req.user!.id,
      globalPlanId: data.globalPlanId,
      userPlanId: data.userPlanId,
      txHash: data.txHash,
      planName: data.planName,
      planDescription: data.planDescription,
      assetType: data.assetType,
      assetAmount: data.assetAmount,
      assetAmountWei: data.assetAmountWei,
      distributionMethod: data.distributionMethod,
      transferDate: data.transferDate,
      periodicPercentage: data.periodicPercentage,
      status: 'PENDING', // Set to PENDING until contract creation is confirmed
      // Proof of Life (only for LUMP_SUM)
      proofOfLifeEnabled: data.distributionMethod === 'LUMP_SUM' ? data.proofOfLifeEnabled : false,
      // Beneficiary notification
      notifyBeneficiaries: data.notifyBeneficiaries,
      beneficiaries: {
        create: beneficiaryData.map(b => ({
          beneficiaryIndex: b.beneficiaryIndex,
          name: b.name,
          email: b.email,
          relationship: b.relationship,
          nameHash: b.nameHash,
          emailHash: b.emailHash,
          relationshipHash: b.relationshipHash,
          combinedHash: b.combinedHash,
          allocatedPercentage: b.allocatedPercentage,
          allocatedAmount: b.allocatedAmount,
          claimCodeEncrypted: b.claimCodeEncrypted,
          claimCodeHash: b.claimCodeHash,
        })),
      },
    },
    include: {
      beneficiaries: true,
    },
  });

  // Create distribution schedule for periodic distributions
  if (data.distributionMethod !== 'LUMP_SUM' && data.periodicPercentage) {
    const totalPeriods = Math.ceil(100 / data.periodicPercentage);
    let periodLength: number;

    switch (data.distributionMethod) {
      case 'QUARTERLY':
        periodLength = 90 * 24 * 60 * 60 * 1000; // 90 days in ms
        break;
      case 'YEARLY':
        periodLength = 365 * 24 * 60 * 60 * 1000; // 365 days in ms
        break;
      case 'MONTHLY':
      default:
        periodLength = 30 * 24 * 60 * 60 * 1000; // 30 days in ms
    }

    const distributions = [];
    for (let i = 0; i < totalPeriods; i++) {
      const scheduledDate = new Date(data.transferDate.getTime() + i * periodLength);
      const periodAmount = (
        (BigInt(data.assetAmountWei) * BigInt(data.periodicPercentage)) / BigInt(100)
      ).toString();

      distributions.push({
        planId: plan.id,
        periodNumber: i + 1,
        amount: periodAmount,
        scheduledDate,
        status: 'PENDING' as const,
      });
    }

    await prisma.distribution.createMany({
      data: distributions,
    });
  }

  // Log activity
  await prisma.activity.create({
    data: {
      userId: req.user!.id,
      planId: plan.id,
      type: 'PLAN_CREATED',
      description: `Created plan "${data.planName}" with ${data.beneficiaries.length} beneficiaries`,
      metadata: {
        assetType: data.assetType,
        assetAmount: data.assetAmount,
        distributionMethod: data.distributionMethod,
        beneficiaryCount: data.beneficiaries.length,
      },
    },
  });

  logger.info('Plan created:', {
    planId: plan.id,
    userId: req.user!.id,
    assetType: data.assetType,
    distributionMethod: data.distributionMethod,
  });

  // Return plan data with hashes for contract call
  res.status(201).json({
    plan: {
      ...plan,
      // Include claim codes per beneficiary for the response
      beneficiaries: plan.beneficiaries.map((b, index) => ({
        ...b,
        claimCode: beneficiaryData[index].claimCode, // Return unhashed claim code (only once!)
      })),
    },
    contractData: {
      planNameHash,
      planDescriptionHash,
      beneficiaries: beneficiaryData.map(b => ({
        nameHash: b.nameHash,
        emailHash: b.emailHash,
        relationshipHash: b.relationshipHash,
        allocatedPercentage: b.allocatedPercentage,
        claimCodeHash: b.claimCodeHash, // Per-beneficiary claim code hash
      })),
    },
  });
}));

/**
 * @swagger
 * /plans/{id}/contract:
 *   put:
 *     summary: Update plan with on-chain data after contract call
 *     tags: [Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - globalPlanId
 *               - userPlanId
 *               - txHash
 *             properties:
 *               globalPlanId:
 *                 type: number
 *                 description: Global plan ID from smart contract
 *               userPlanId:
 *                 type: number
 *                 description: User's local plan ID
 *               txHash:
 *                 type: string
 *                 description: Transaction hash
 *     responses:
 *       200:
 *         description: Plan updated successfully
 *       404:
 *         description: Plan not found
 *       401:
 *         description: Unauthorized
 */
router.put('/:id/contract', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const updateSchema = z.object({
    globalPlanId: z.number(),
    userPlanId: z.number(),
    txHash: z.string(),
  });

  const data = updateSchema.parse(req.body);

  const plan = await prisma.plan.findFirst({
    where: {
      id: req.params.id as string,
      userId: req.user!.id,
    },
  });

  if (!plan) {
    throw new AppError('Plan not found', 404);
  }

  const updatedPlan = await prisma.plan.update({
    where: { id: plan.id },
    data: {
      globalPlanId: data.globalPlanId,
      userPlanId: data.userPlanId,
      txHash: data.txHash,
      status: 'ACTIVE', // Update status to ACTIVE when contract creation is confirmed
    },
    include: {
      user: true, // Include user to get email
    },
  });

  // Log activity
  await prisma.activity.create({
    data: {
      userId: req.user!.id,
      planId: plan.id,
      type: 'PLAN_CREATED',
      description: `Plan confirmed on-chain with transaction ${data.txHash}`,
      metadata: {
        globalPlanId: data.globalPlanId,
        userPlanId: data.userPlanId,
        txHash: data.txHash,
      },
    },
  });

  // Send confirmation email
  if (updatedPlan.user?.email && updatedPlan.user?.name) {
    // Determine asset symbol based on type
    let assetSymbol = 'Tokens';
    switch (updatedPlan.assetType) {
      case 'ERC20_TOKEN1': assetSymbol = 'WETH (Mock)'; break;
      case 'ERC20_TOKEN2': assetSymbol = 'USDT (Mock)'; break;
      case 'ERC20_TOKEN3': assetSymbol = 'USDC (Mock)'; break;
    }

    await sendPlanCreationNotification(
      updatedPlan.user.email,
      updatedPlan.user.name,
      updatedPlan.planName,
      updatedPlan.assetAmount,
      assetSymbol,
      data.txHash
    );
  }

  res.json(updatedPlan);
}));

/**
 * @swagger
 * /plans/{id}/status:
 *   put:
 *     summary: Update plan status
 *     description: Pause, resume, or cancel a plan
 *     tags: [Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, PAUSED, CANCELLED]
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       400:
 *         description: Cannot modify executed or cancelled plan
 *       404:
 *         description: Plan not found
 *       401:
 *         description: Unauthorized
 */
router.put('/:id/status', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const statusSchema = z.object({
    status: z.enum(['ACTIVE', 'PAUSED', 'CANCELLED']),
  });

  const { status } = statusSchema.parse(req.body);

  const plan = await prisma.plan.findFirst({
    where: {
      id: req.params.id as string,
      userId: req.user!.id,
    },
  });

  if (!plan) {
    throw new AppError('Plan not found', 404);
  }

  if (plan.status === 'EXECUTED' || plan.status === 'CANCELLED') {
    throw new AppError('Cannot modify executed or cancelled plan', 400);
  }

  const updatedPlan = await prisma.plan.update({
    where: { id: plan.id },
    data: { status },
  });

  // Log activity
  await prisma.activity.create({
    data: {
      userId: req.user!.id,
      planId: plan.id,
      type: status === 'PAUSED' ? 'PLAN_PAUSED' : status === 'CANCELLED' ? 'PLAN_CANCELLED' : 'PLAN_RESUMED',
      description: `Plan status changed to ${status}`,
    },
  });

  res.json(updatedPlan);
}));

/**
 * @swagger
 * /plans/{id}/claim-codes:
 *   get:
 *     summary: Get decrypted claim codes for all beneficiaries
 *     description: Retrieve the claim codes for all beneficiaries in a plan (plan owner only)
 *     tags: [Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Claim codes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 beneficiaries:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       beneficiaryIndex:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       claimCode:
 *                         type: string
 *                         length: 6
 *       404:
 *         description: Plan not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id/claim-codes', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const plan = await prisma.plan.findFirst({
    where: {
      id: req.params.id as string,
      userId: req.user!.id,
    },
    select: {
      id: true,
      beneficiaries: {
        select: {
          beneficiaryIndex: true,
          name: true,
          email: true,
          claimCodeEncrypted: true,
        },
        orderBy: {
          beneficiaryIndex: 'asc',
        },
      },
    },
  });

  if (!plan) {
    throw new AppError('Plan not found', 404);
  }

  // Decrypt claim codes for each beneficiary
  const { decryptClaimCode } = await import('../utils/crypto');
  const beneficiaries = (plan as any).beneficiaries.map((b: any) => ({
    beneficiaryIndex: b.beneficiaryIndex,
    name: b.name,
    email: b.email,
    claimCode: decryptClaimCode(b.claimCodeEncrypted),
  }));

  res.json({ beneficiaries });
}));

export default router;

