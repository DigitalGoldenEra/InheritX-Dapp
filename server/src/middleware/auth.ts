/**
 * Authentication Middleware
 * Handles wallet-based authentication and JWT verification
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ethers } from 'ethers';
import { prisma } from '../utils/prisma';
import { AppError } from './errorHandler';
import { logger } from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'default-jwt-secret';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        walletAddress: string;
        role: string;
      };
    }
  }
}

/**
 * Verify JWT token and attach user to request
 */
export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      throw new AppError('Authentication required', 401);
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      walletAddress: string;
    };

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || !user.isActive) {
      throw new AppError('User not found or inactive', 401);
    }

    req.user = {
      id: user.id,
      walletAddress: user.walletAddress,
      role: user.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError('Invalid token', 401));
    }
    next(error);
  }
}

/**
 * Verify wallet signature for authentication
 * Used for initial login/registration
 */
export async function verifyWalletSignature(
  walletAddress: string,
  message: string,
  signature: string
): Promise<boolean> {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === walletAddress.toLowerCase();
  } catch (error) {
    logger.error('Signature verification failed:', error);
    return false;
  }
}

/**
 * Generate JWT token for user
 */
export function generateToken(userId: string, walletAddress: string): string {
  return jwt.sign(
    { userId, walletAddress },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

/**
 * Require admin role
 */
export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
    return next(new AppError('Admin access required', 403));
  }

  next();
}

/**
 * Require super admin role
 */
export function requireSuperAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  if (req.user.role !== 'SUPER_ADMIN') {
    return next(new AppError('Super admin access required', 403));
  }

  next();
}

/**
 * Optional authentication - doesn't fail if no token
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        walletAddress: string;
      };

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (user && user.isActive) {
        req.user = {
          id: user.id,
          walletAddress: user.walletAddress,
          role: user.role,
        };
      }
    }

    next();
  } catch (error) {
    // Ignore errors and continue without auth
    next();
  }
}

export default {
  authenticateToken,
  verifyWalletSignature,
  generateToken,
  requireAdmin,
  requireSuperAdmin,
  optionalAuth,
};

