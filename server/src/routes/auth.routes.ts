/**
 * Authentication Routes
 * Handles user registration and login via wallet
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { verifyWalletSignature, generateToken, authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const nonceSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'),
});

const loginSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'),
  signature: z.string(),
  message: z.string(),
});

// Store for temporary nonces (in production, use Redis)
const nonceStore = new Map<string, { nonce: string; expires: number }>();

/**
 * @swagger
 * /auth/nonce:
 *   get:
 *     summary: Get nonce for wallet signature
 *     tags: [Authentication]
 *     parameters:
 *       - in: query
 *         name: walletAddress
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^0x[a-fA-F0-9]{40}$'
 *         description: User's wallet address
 *     responses:
 *       200:
 *         description: Nonce generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 nonce:
 *                   type: string
 *                   description: Message to sign with wallet
 *                   example: "Sign this message to authenticate with InheritX.\n\nNonce: 1234567890-abc123"
 *       400:
 *         description: Invalid wallet address
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/nonce', asyncHandler(async (req: Request, res: Response) => {
  const { walletAddress } = nonceSchema.parse(req.query);
  
  // Generate nonce
  const nonce = `Sign this message to authenticate with InheritX.\n\nNonce: ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Store nonce with expiration (5 minutes)
  nonceStore.set(walletAddress.toLowerCase(), {
    nonce,
    expires: Date.now() + 5 * 60 * 1000,
  });

  res.json({ nonce });
}));

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login or register with wallet signature
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - walletAddress
 *               - signature
 *               - message
 *             properties:
 *               walletAddress:
 *                 type: string
 *                 pattern: '^0x[a-fA-F0-9]{40}$'
 *                 example: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
 *               signature:
 *                 type: string
 *                 description: Signed message from wallet
 *                 example: "0x..."
 *               message:
 *                 type: string
 *                 description: Original message that was signed
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT authentication token
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 isNewUser:
 *                   type: boolean
 *                   description: Whether this is a new user registration
 *       400:
 *         description: Invalid signature or expired nonce
 *       401:
 *         description: Signature verification failed
 */
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { walletAddress, signature, message } = loginSchema.parse(req.body);
  const normalizedAddress = walletAddress.toLowerCase();

  // Verify nonce exists and hasn't expired
  const storedNonce = nonceStore.get(normalizedAddress);
  if (!storedNonce || storedNonce.expires < Date.now()) {
    throw new AppError('Invalid or expired nonce. Please request a new one.', 400);
  }

  // Verify the message matches
  if (message !== storedNonce.nonce) {
    throw new AppError('Invalid message', 400);
  }

  // Verify signature
  const isValid = await verifyWalletSignature(walletAddress, message, signature);
  if (!isValid) {
    throw new AppError('Invalid signature', 401);
  }

  // Clear used nonce
  nonceStore.delete(normalizedAddress);

  // Find or create user
  let user = await prisma.user.findUnique({
    where: { walletAddress: normalizedAddress },
    include: { kyc: true },
  });

  let isNewUser = false;
  if (!user) {
    isNewUser = true;
    user = await prisma.user.create({
      data: {
        walletAddress: normalizedAddress,
        role: 'USER',
      },
      include: { kyc: true },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        type: 'USER_REGISTERED',
        description: `New user registered with wallet ${normalizedAddress}`,
      },
    });

    logger.info('New user registered:', { walletAddress: normalizedAddress });
  }

  // Log login activity
  await prisma.activity.create({
    data: {
      userId: user.id,
      type: 'USER_LOGIN',
      description: `User logged in`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    },
  });

  // Generate token
  const token = generateToken(user.id, user.walletAddress);

  res.json({
    token,
    user: {
      id: user.id,
      walletAddress: user.walletAddress,
      email: user.email,
      name: user.name,
      role: user.role,
      kycStatus: user.kyc?.status || 'NOT_SUBMITTED',
      isNewUser,
    },
  });
}));

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/User'
 *                 - type: object
 *                   properties:
 *                     kycSubmittedAt:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                     kycReviewedAt:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
router.get('/me', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: {
      kyc: {
        select: {
          status: true,
          submittedAt: true,
          reviewedAt: true,
        },
      },
      _count: {
        select: { plans: true },
      },
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    id: user.id,
    walletAddress: user.walletAddress,
    email: user.email,
    name: user.name,
    role: user.role,
    kycStatus: user.kyc?.status || 'NOT_SUBMITTED',
    kycSubmittedAt: user.kyc?.submittedAt,
    kycReviewedAt: user.kyc?.reviewedAt,
    planCount: user._count.plans,
    createdAt: user.createdAt,
  });
}));

/**
 * @swagger
 * /auth/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: "John Doe"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.put('/profile', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const updateSchema = z.object({
    email: z.string().email().optional(),
    name: z.string().min(2).max(100).optional(),
  });

  const data = updateSchema.parse(req.body);

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data,
    select: {
      id: true,
      walletAddress: true,
      email: true,
      name: true,
      role: true,
    },
  });

  res.json(user);
}));

export default router;

