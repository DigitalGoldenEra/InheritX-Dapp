/**
 * Two-Factor Authentication Utilities
 * Provides simple in-memory 2FA for sensitive actions like plan creation and claims.
 *
 * NOTE: This uses in-memory stores and is suitable for a single server instance.
 * For production with multiple instances, move this to Redis or a shared store.
 */

import { sendEmail } from './email';
import { logger } from './logger';

type UserAction = 'CREATE_PLAN';

interface TwoFACodeEntry {
  code: string;
  expiresAt: number;
}

// 5 minutes
const EXPIRY_MS = 5 * 60 * 1000;

// In-memory stores
const userAction2FAStore = new Map<string, TwoFACodeEntry>();
const beneficiaryClaim2FAStore = new Map<string, TwoFACodeEntry>();

function generateNumericCode(length: number = 6): string {
  const digits = '0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += digits[Math.floor(Math.random() * digits.length)];
  }
  return code;
}

function isExpired(entry: TwoFACodeEntry | undefined): boolean {
  if (!entry) return true;
  return Date.now() > entry.expiresAt;
}

function buildUserActionKey(userId: string, action: UserAction): string {
  return `${userId}:${action}`;
}

function buildBeneficiaryKey(planId: string, beneficiaryId: string): string {
  return `${planId}:${beneficiaryId}`;
}

/**
 * Initiate 2FA for a user action (e.g., plan creation).
 */
export async function initiateUserAction2FA(
  userId: string,
  email: string | null,
  action: UserAction
): Promise<void> {
  if (!email) {
    throw new Error('Email is required for 2FA');
  }

  const code = generateNumericCode(6);
  const key = buildUserActionKey(userId, action);

  userAction2FAStore.set(key, {
    code,
    expiresAt: Date.now() + EXPIRY_MS,
  });

  const subject = 'InheritX Verification Code';
  const text = `Your InheritX verification code is: ${code}

This code expires in 5 minutes. If you did not request this code, you can ignore this email.`;

  await sendEmail(email, subject, text);

  logger.info('2FA code sent for user action', { userId, action });
}

/**
 * Verify 2FA code for a user action.
 * Returns true if valid, false otherwise.
 */
export function verifyUserAction2FA(
  userId: string,
  action: UserAction,
  code: string
): boolean {
  const key = buildUserActionKey(userId, action);
  const entry = userAction2FAStore.get(key);

  if (!entry || isExpired(entry)) {
    userAction2FAStore.delete(key);
    return false;
  }

  if (entry.code !== code) {
    return false;
  }

  // One-time use
  userAction2FAStore.delete(key);
  return true;
}

/**
 * Initiate 2FA for a beneficiary claim.
 */
export async function initiateBeneficiaryClaim2FA(
  planId: string,
  beneficiaryId: string,
  email: string
): Promise<void> {
  const code = generateNumericCode(6);
  const key = buildBeneficiaryKey(planId, beneficiaryId);

  beneficiaryClaim2FAStore.set(key, {
    code,
    expiresAt: Date.now() + EXPIRY_MS,
  });

  const subject = 'InheritX Claim Verification Code';
  const text = `Your InheritX claim verification code is: ${code}

This code expires in 5 minutes. Use it to verify your identity before claiming your inheritance.`;

  await sendEmail(email, subject, text);

  logger.info('2FA code sent for beneficiary claim', { planId, beneficiaryId });
}

/**
 * Verify 2FA code for a beneficiary claim.
 * Returns true if valid, false otherwise.
 */
export function verifyBeneficiaryClaim2FA(
  planId: string,
  beneficiaryId: string,
  code: string
): boolean {
  const key = buildBeneficiaryKey(planId, beneficiaryId);
  const entry = beneficiaryClaim2FAStore.get(key);

  if (!entry || isExpired(entry)) {
    beneficiaryClaim2FAStore.delete(key);
    return false;
  }

  if (entry.code !== code) {
    return false;
  }

  beneficiaryClaim2FAStore.delete(key);
  return true;
}


