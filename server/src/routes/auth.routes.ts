/**
 * Authentication Routes
 * Handles user registration and login via wallet
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
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

/**
 * @swagger
 * /auth/admin/login:
 *   post:
 *     summary: Admin login with email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "admin@inheritx.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "admin123"
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
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: User is not an admin
 */
router.post('/admin/login', asyncHandler(async (req: Request, res: Response) => {
  const adminLoginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  });

  const { email, password } = adminLoginSchema.parse(req.body);

  // Find user by email (explicitly select password field)
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: {
      id: true,
      walletAddress: true,
      email: true,
      password: true,
      name: true,
      role: true,
      isActive: true,
      kyc: {
        select: {
          status: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  // Check if user is admin
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    throw new AppError('Access denied. Admin privileges required.', 403);
  }

  // Check if user has password set
  if (!user.password) {
    throw new AppError('Password not set for this account. Please contact administrator.', 401);
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  // Check if user is active
  if (!user.isActive) {
    throw new AppError('Account is inactive. Please contact administrator.', 401);
  }

  // Log login activity
  await prisma.activity.create({
    data: {
      userId: user.id,
      type: 'USER_LOGIN',
      description: `Admin logged in via email/password`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    },
  });

  // Generate token
  const token = generateToken(user.id, user.walletAddress);

  logger.info('Admin logged in:', { email: user.email, userId: user.id });

  res.json({
    token,
    user: {
      id: user.id,
      walletAddress: user.walletAddress,
      email: user.email,
      name: user.name,
      role: user.role,
      kycStatus: user.kyc?.status || 'NOT_SUBMITTED',
    },
  });
}));


/**
 * @swagger
 * /auth/2fa/setup:
 *   post:
 *     summary: Setup 2FA
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 2FA setup initiated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 secret:
 *                   type: string
 *                 qrCode:
 *                   type: string
 *       401:
 *         description: Unauthorized
 */
router.post('/2fa/setup', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const { TOTP, ScureBase32Plugin, NobleCryptoPlugin } = await import('otplib');
  const QRCode = await import('qrcode');
  const { encryptTotpSecret } = await import('../utils/crypto');

  const authenticator = new TOTP({
    crypto: new NobleCryptoPlugin(),
    base32: new ScureBase32Plugin(),
    step: 30,
    window: 1,
  } as any) as any;

  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Generate secret
  const secret = authenticator.generateSecret();

  // Create key URI for authenticator apps
  const otpauth = (authenticator as any).toURI({
    secret,
    label: user.email || user.walletAddress,
    issuer: 'InheritX',
  });

  // Generate QR code
  const qrCode = await QRCode.toDataURL(otpauth);

  // Save secret to valid (temporarily or mark as pending verification if we wanted to be strict, 
  // but here we just save it. verification sets enabled=true)
  await prisma.user.update({
    where: { id: user.id },
    data: {
      twoFactorSecret: encryptTotpSecret(secret),
      twoFactorEnabled: false, // Ensure it's false until verified
    },
  });

  res.json({ secret, qrCode });
}));

/**
 * @swagger
 * /auth/2fa/verify:
 *   post:
 *     summary: Verify 2FA token to enable it
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: 6-digit TOTP code
 *     responses:
 *       200:
 *         description: 2FA enabled successfully
 *       400:
 *         description: Invalid token
 *       401:
 *         description: Unauthorized
 */
router.post('/2fa/verify', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const { token } = z.object({ token: z.string() }).parse(req.body);
  const { TOTP, ScureBase32Plugin, NobleCryptoPlugin } = await import('otplib');
  const { decryptTotpSecret } = await import('../utils/crypto');

  const authenticator = new TOTP({
    crypto: new NobleCryptoPlugin(),
    base32: new ScureBase32Plugin(),
    step: 30,
    window: 1,
  } as any) as any;

  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
  });

  // Cast user to any to access twoFactorSecret
  if (!user || !(user as any).twoFactorSecret) {
    throw new AppError('2FA not setup. Please call setup first.', 400);
  }

  const secret = decryptTotpSecret((user as any).twoFactorSecret);
  const isValid = (authenticator as any).verify({ token, secret });

  if (!isValid) {
    throw new AppError('Invalid 2FA code', 400);
  }

  // Enable 2FA
  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorEnabled: true } as any,
  });

  // Log activity
  await prisma.activity.create({
    data: {
      userId: user.id,
      type: 'SYSTEM_EVENT', // Or create a new type if strictly needed, but reusing generic system event for now
      description: '2FA enabled',
    },
  });

  res.json({ success: true, message: '2FA enabled successfully' });
}));

export default router;

