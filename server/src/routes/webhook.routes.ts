/**
 * Webhook Routes
 * Handles webhooks and external integrations
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @swagger
 * /webhooks/blockchain:
 *   post:
 *     summary: Blockchain event webhook
 *     description: Receives blockchain events from indexer service
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - event
 *               - data
 *             properties:
 *               event:
 *                 type: string
 *                 enum: [PlanCreated, InheritanceClaimed, KYCStatusChanged]
 *                 description: Event type
 *               data:
 *                 type: object
 *                 description: Event-specific data
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 received:
 *                   type: boolean
 */
router.post('/blockchain', asyncHandler(async (req: Request, res: Response) => {
  const { event, data } = req.body;

  logger.info('Blockchain webhook received:', { event, data });

  switch (event) {
    case 'PlanCreated':
      // Handle plan creation event
      await handlePlanCreated(data);
      break;
    case 'InheritanceClaimed':
      // Handle claim event
      await handleInheritanceClaimed(data);
      break;
    case 'KYCStatusChanged':
      // Handle KYC status change
      await handleKYCStatusChanged(data);
      break;
    default:
      logger.warn('Unknown webhook event:', event);
  }

  res.json({ received: true });
}));

/**
 * Handle PlanCreated blockchain event
 */
async function handlePlanCreated(data: any) {
  const { globalPlanId, userPlanId, owner, txHash } = data;

  // Update plan with on-chain data
  const plan = await prisma.plan.findFirst({
    where: {
      user: { walletAddress: owner.toLowerCase() },
      globalPlanId: null,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (plan) {
    await prisma.plan.update({
      where: { id: plan.id },
      data: {
        globalPlanId,
        userPlanId,
        txHash,
      },
    });

    logger.info('Plan updated with on-chain data:', {
      planId: plan.id,
      globalPlanId,
    });
  }
}

/**
 * Handle InheritanceClaimed blockchain event
 */
async function handleInheritanceClaimed(data: any) {
  const { planId, beneficiary, beneficiaryIndex, amount, txHash } = data;

  await prisma.beneficiary.updateMany({
    where: {
      plan: { globalPlanId: planId },
      beneficiaryIndex,
    },
    data: {
      hasClaimed: true,
      claimedAt: new Date(),
      claimedByAddress: beneficiary,
      claimedAmount: amount.toString(),
      claimTxHash: txHash,
    },
  });

  // Log activity
  const plan = await prisma.plan.findFirst({
    where: { globalPlanId: planId },
  });

  if (plan) {
    await prisma.activity.create({
      data: {
        planId: plan.id,
        type: 'CLAIM_COMPLETED',
        description: `Beneficiary ${beneficiaryIndex} claimed via blockchain`,
        metadata: { txHash, beneficiary, amount: amount.toString() },
      },
    });
  }

  logger.info('Claim recorded from blockchain:', {
    planId,
    beneficiaryIndex,
    beneficiary,
  });
}

/**
 * Handle KYCStatusChanged blockchain event
 */
async function handleKYCStatusChanged(data: any) {
  const { user, status } = data;

  // Map on-chain status to database status
  const statusMap: Record<number, string> = {
    0: 'NOT_SUBMITTED',
    1: 'PENDING',
    2: 'APPROVED',
    3: 'REJECTED',
  };

  const dbStatus = statusMap[status] as 'PENDING' | 'APPROVED' | 'REJECTED';

  if (dbStatus && dbStatus !== 'NOT_SUBMITTED') {
    await prisma.kYC.updateMany({
      where: { user: { walletAddress: user.toLowerCase() } },
      data: { status: dbStatus },
    });

    logger.info('KYC status updated from blockchain:', {
      user,
      status: dbStatus,
    });
  }
}

export default router;

