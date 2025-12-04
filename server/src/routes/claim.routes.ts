/**
 * Claim Routes
 * Handles inheritance claiming by beneficiaries
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { keccak256, verifyHash } from '../utils/crypto';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const verifyClaimSchema = z.object({
  planId: z.string().or(z.number()),
  claimCode: z.string().length(6),
  beneficiaryName: z.string().min(2),
  beneficiaryEmail: z.string().email(),
  beneficiaryRelationship: z.string().min(2),
});

const completeClaimSchema = z.object({
  planId: z.string(),
  beneficiaryIndex: z.number().min(1),
  claimerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  txHash: z.string(),
  claimedAmount: z.string(),
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
  const globalPlanId = parseInt(req.params.globalPlanId);

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

  // Verify claim code hash
  const claimCodeHash = keccak256(data.claimCode);
  if (claimCodeHash !== plan.claimCodeHash) {
    throw new AppError('Invalid claim code', 401);
  }

  // Find matching beneficiary
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

  if (beneficiary.hasClaimed) {
    throw new AppError('This beneficiary has already claimed their inheritance', 400);
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

export default router;

