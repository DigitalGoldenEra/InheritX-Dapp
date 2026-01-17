/**
 * Admin Routes
 * Super Admin dashboard endpoints for KYC verification and system management
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authenticateToken, requireAdmin, requireSuperAdmin } from '../middleware/auth';
import { sendKYCApprovalNotification, sendKYCRejectionNotification } from '../utils/email';
import { logger } from '../utils/logger';
import { approveKYCOnContract, rejectKYCOnContract, isContractConfigured } from '../utils/contract';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// ============================================
// DASHBOARD STATS
// ============================================

/**
 * @swagger
 * /admin/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     description: Retrieve platform-wide statistics for admin dashboard
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                 kyc:
 *                   type: object
 *                   properties:
 *                     pending:
 *                       type: number
 *                     approved:
 *                       type: number
 *                     rejected:
 *                       type: number
 *                     total:
 *                       type: number
 *                 plans:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     active:
 *                       type: number
 *                 claims:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                 recentActivity:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  const [
    totalUsers,
    pendingKYC,
    approvedKYC,
    rejectedKYC,
    totalPlans,
    activePlans,
    totalClaims,
    recentActivity,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.kYC.count({ where: { status: 'PENDING' } }),
    prisma.kYC.count({ where: { status: 'APPROVED' } }),
    prisma.kYC.count({ where: { status: 'REJECTED' } }),
    prisma.plan.count(),
    prisma.plan.count({ where: { status: 'ACTIVE' } }),
    prisma.beneficiary.count({ where: { hasClaimed: true } }),
    prisma.activity.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { walletAddress: true, name: true } },
      },
    }),
  ]);

  res.json({
    users: {
      total: totalUsers,
    },
    kyc: {
      pending: pendingKYC,
      approved: approvedKYC,
      rejected: rejectedKYC,
      total: pendingKYC + approvedKYC + rejectedKYC,
    },
    plans: {
      total: totalPlans,
      active: activePlans,
    },
    claims: {
      total: totalClaims,
    },
    recentActivity,
  });
}));

// ============================================
// KYC MANAGEMENT
// ============================================

/**
 * @swagger
 * /admin/kyc:
 *   get:
 *     summary: Get all KYC applications
 *     description: List KYC applications with optional filters and pagination
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED, all]
 *         description: Filter by KYC status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: KYC applications retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/KYC'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     page:
 *                       type: number
 *                     limit:
 *                       type: number
 *                     pages:
 *                       type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get('/kyc', asyncHandler(async (req: Request, res: Response) => {
  const { status, page = '1', limit = '20' } = req.query as { status?: string; page?: string; limit?: string };

  const where: any = {};
  if (status && status !== 'all') {
    where.status = status;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [kycs, total] = await Promise.all([
    prisma.kYC.findMany({
      where,
      include: {
        user: {
          select: {
            walletAddress: true,
            createdAt: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
      skip,
      take: Number(limit),
    }),
    prisma.kYC.count({ where }),
  ]);

  res.json({
    data: kycs,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)),
    },
  });
}));

/**
 * @swagger
 * /admin/kyc/{id}:
 *   get:
 *     summary: Get KYC application details
 *     tags: [Admin]
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
 *         description: KYC details retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/KYC'
 *                 - type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         walletAddress:
 *                           type: string
 *                         createdAt:
 *                           type: string
 *                         _count:
 *                           type: object
 *                           properties:
 *                             plans:
 *                               type: number
 *       404:
 *         description: KYC not found
 *       403:
 *         description: Admin access required
 */
router.get('/kyc/:id', asyncHandler(async (req: Request, res: Response) => {
  const kyc = await prisma.kYC.findUnique({
    where: { id: req.params.id as string },
    include: {
      user: {
        select: {
          id: true,
          walletAddress: true,
          createdAt: true,
          _count: { select: { plans: true } },
        },
      },
    },
  });

  if (!kyc) {
    throw new AppError('KYC not found', 404);
  }

  res.json(kyc);
}));

/**
 * @swagger
 * /admin/kyc/{id}/approve:
 *   post:
 *     summary: Approve a KYC application
 *     description: Approves a pending KYC application and sends notification email
 *     tags: [Admin]
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
 *         description: KYC approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 kyc:
 *                   $ref: '#/components/schemas/KYC'
 *       400:
 *         description: KYC is not pending
 *       404:
 *         description: KYC not found
 *       403:
 *         description: Admin access required
 */
router.post('/kyc/:id/approve', asyncHandler(async (req: Request, res: Response) => {
  const kyc = await prisma.kYC.findUnique({
    where: { id: req.params.id as string },
    include: { user: true },
  });

  if (!kyc) {
    throw new AppError('KYC not found', 404);
  }

  if (kyc.status !== 'PENDING') {
    throw new AppError('KYC is not pending', 400);
  }

  if (!(kyc as any).user?.walletAddress) {
    throw new AppError('User wallet address not found', 400);
  }

  if (!kyc.kycDataHash) {
    throw new AppError('KYC data hash not found', 400);
  }

  // Step 1: Call smart contract FIRST
  logger.info('Approving KYC on blockchain...', {
    kycId: kyc.id,
    userAddress: (kyc as any).user.walletAddress,
  });

  const contractResult = await approveKYCOnContract(
    (kyc as any).user.walletAddress,
    kyc.kycDataHash
  );

  if (!contractResult.success) {
    throw new AppError(contractResult.error || 'Failed to approve KYC on blockchain', 500);
  }

  // Step 2: Update database ONLY after contract success
  const updatedKYC = await prisma.kYC.update({
    where: { id: req.params.id as string },
    data: {
      status: 'APPROVED',
      reviewedAt: new Date(),
      reviewedBy: req.user!.id,
    },
  });

  // Log activity with transaction hash
  await prisma.activity.create({
    data: {
      userId: kyc.userId,
      type: 'KYC_APPROVED',
      description: `KYC approved by admin`,
      metadata: {
        adminId: req.user!.id,
        txHash: contractResult.txHash,
      },
    },
  });

  // Send notification email
  await sendKYCApprovalNotification(kyc.email, kyc.fullName);

  logger.info('KYC approved:', {
    kycId: kyc.id,
    userId: kyc.userId,
    adminId: req.user!.id,
    txHash: contractResult.txHash,
  });

  res.json({
    message: 'KYC approved successfully',
    kyc: updatedKYC,
    txHash: contractResult.txHash,
  });
}));

/**
 * @swagger
 * /admin/kyc/{id}/reject:
 *   post:
 *     summary: Reject a KYC application
 *     description: Rejects a pending KYC application with optional reason
 *     tags: [Admin]
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
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Optional rejection reason
 *     responses:
 *       200:
 *         description: KYC rejected successfully
 *       400:
 *         description: KYC is not pending
 *       404:
 *         description: KYC not found
 *       403:
 *         description: Admin access required
 */
router.post('/kyc/:id/reject', asyncHandler(async (req: Request, res: Response) => {
  const { reason } = z.object({
    reason: z.string().optional(),
  }).parse(req.body);

  const kyc = await prisma.kYC.findUnique({
    where: { id: req.params.id as string },
    include: { user: true },
  });

  if (!kyc) {
    throw new AppError('KYC not found', 404);
  }

  if (kyc.status !== 'PENDING') {
    throw new AppError('KYC is not pending', 400);
  }

  if (!(kyc as any).user?.walletAddress) {
    throw new AppError('User wallet address not found', 400);
  }

  // Step 1: Call smart contract FIRST
  logger.info('Rejecting KYC on blockchain...', {
    kycId: kyc.id,
    userAddress: (kyc as any).user.walletAddress,
  });

  const contractResult = await rejectKYCOnContract((kyc as any).user.walletAddress);

  if (!contractResult.success) {
    throw new AppError(contractResult.error || 'Failed to reject KYC on blockchain', 500);
  }

  // Step 2: Update database ONLY after contract success
  const updatedKYC = await prisma.kYC.update({
    where: { id: req.params.id as string },
    data: {
      status: 'REJECTED',
      reviewedAt: new Date(),
      reviewedBy: req.user!.id,
      rejectionReason: reason,
    },
  });

  // Log activity with transaction hash
  await prisma.activity.create({
    data: {
      userId: kyc.userId,
      type: 'KYC_REJECTED',
      description: `KYC rejected by admin. Reason: ${reason || 'Not specified'}`,
      metadata: {
        adminId: req.user!.id,
        reason,
        txHash: contractResult.txHash,
      },
    },
  });

  // Send notification email
  await sendKYCRejectionNotification(kyc.email, kyc.fullName, reason);

  logger.info('KYC rejected:', {
    kycId: kyc.id,
    userId: kyc.userId,
    adminId: req.user!.id,
    reason,
    txHash: contractResult.txHash,
  });

  res.json({
    message: 'KYC rejected',
    kyc: updatedKYC,
    txHash: contractResult.txHash,
  });
}));

// ============================================
// USER MANAGEMENT
// ============================================

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [USER, ADMIN, SUPER_ADMIN]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       403:
 *         description: Admin access required
 */
router.get('/users', asyncHandler(async (req: Request, res: Response) => {
  const { role, page = '1', limit = '20' } = req.query as { role?: string; page?: string; limit?: string };

  const where: any = {};
  if (role) {
    where.role = role;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        kyc: { select: { status: true } },
        _count: { select: { plans: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit),
    }),
    prisma.user.count({ where }),
  ]);

  res.json({
    data: users,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)),
    },
  });
}));

/**
 * @swagger
 * /admin/users/{id}/role:
 *   put:
 *     summary: Update user role
 *     description: Change a user's role (SUPER_ADMIN only)
 *     tags: [Admin]
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
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [USER, ADMIN, SUPER_ADMIN]
 *     responses:
 *       200:
 *         description: Role updated successfully
 *       403:
 *         description: Super admin access required
 */
router.put('/users/:id/role', requireSuperAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { role } = z.object({
    role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN']),
  }).parse(req.body);

  const user = await prisma.user.update({
    where: { id: req.params.id as string },
    data: { role },
  });

  // Log activity
  await prisma.activity.create({
    data: {
      userId: req.params.id as string,
      type: 'ADMIN_ACTION',
      description: `User role changed to ${role}`,
      metadata: { adminId: req.user!.id, newRole: role },
    },
  });

  res.json(user);
}));

// ============================================
// PLAN MANAGEMENT
// ============================================

/**
 * @swagger
 * /admin/plans:
 *   get:
 *     summary: Get all plans
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Plans retrieved successfully
 *       403:
 *         description: Admin access required
 */
router.get('/plans', asyncHandler(async (req: Request, res: Response) => {
  const { status, page = '1', limit = '20' } = req.query as { status?: string; page?: string; limit?: string };

  const where: any = {};
  if (status) {
    where.status = status;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [plans, total] = await Promise.all([
    prisma.plan.findMany({
      where,
      include: {
        user: { select: { walletAddress: true, name: true } },
        beneficiaries: { select: { hasClaimed: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit),
    }),
    prisma.plan.count({ where }),
  ]);

  res.json({
    data: plans.map(p => ({
      ...p,
      claimedCount: p.beneficiaries.filter(b => b.hasClaimed).length,
      totalBeneficiaries: p.beneficiaries.length,
    })),
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)),
    },
  });
}));

// ============================================
// ACTIVITY LOG
// ============================================

/**
 * @swagger
 * /admin/activity:
 *   get:
 *     summary: Get activity log
 *     description: Retrieve platform activity log with filters
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by activity type
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Activity log retrieved
 *       403:
 *         description: Admin access required
 */
router.get('/activity', asyncHandler(async (req: Request, res: Response) => {
  const { type, userId, page = '1', limit = '50' } = req.query as { type?: string; userId?: string; page?: string; limit?: string };

  const where: any = {};
  if (type) where.type = type;
  if (userId) where.userId = userId;

  const skip = (Number(page) - 1) * Number(limit);

  const [activities, total] = await Promise.all([
    prisma.activity.findMany({
      where,
      include: {
        user: { select: { walletAddress: true, name: true } },
        plan: { select: { planName: true, globalPlanId: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit),
    }),
    prisma.activity.count({ where }),
  ]);

  res.json({
    data: activities,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)),
    },
  });
}));

export default router;

