/**
 * Cryptographic Utilities
 * Handles hashing, encryption, and decryption for InheritX
 */

import { ethers } from 'ethers';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const CLAIM_CODE_SECRET = process.env.JWT_CLAIM_CODE_SECRET || 'default-claim-code-secret';

/**
 * Generate Keccak256 hash (same as Solidity)
 * @param data - String data to hash
 * @returns Keccak256 hash as hex string (with 0x prefix)
 */
export function keccak256(data: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(data));
}

/**
 * Generate Keccak256 hash without 0x prefix
 */
export function keccak256NoPrefix(data: string): string {
  return keccak256(data).slice(2);
}

/**
 * Encrypt claim code using JWT-based encryption
 * @param claimCode - Plain text claim code
 * @returns Encrypted claim code
 */
export function encryptClaimCode(claimCode: string): string {
  // Use JWT to "encrypt" the claim code with the secret
  const token = jwt.sign(
    { code: claimCode, iat: Date.now() },
    CLAIM_CODE_SECRET,
    { algorithm: 'HS256' }
  );
  return token;
}

/**
 * Decrypt claim code using JWT-based decryption
 * @param encryptedCode - Encrypted claim code (JWT token)
 * @returns Plain text claim code
 */
export function decryptClaimCode(encryptedCode: string): string {
  try {
    const decoded = jwt.verify(encryptedCode, CLAIM_CODE_SECRET) as { code: string };
    return decoded.code;
  } catch (error) {
    throw new Error('Invalid or expired claim code encryption');
  }
}

/**
 * Generate a random claim code
 * @param length - Length of claim code (default 6)
 * @returns Random alphanumeric claim code
 */
export function generateClaimCode(length: number = 6): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    code += chars[randomBytes[i] % chars.length];
  }
  return code;
}

/**
 * Create beneficiary data hash (matches Solidity implementation)
 * @param name - Beneficiary name
 * @param email - Beneficiary email
 * @param relationship - Relationship to plan owner
 * @returns Object with individual hashes and combined hash
 */
export function createBeneficiaryHashes(
  name: string,
  email: string,
  relationship: string
): {
  nameHash: string;
  emailHash: string;
  relationshipHash: string;
  combinedHash: string;
} {
  const nameHash = keccak256(name);
  const emailHash = keccak256(email);
  const relationshipHash = keccak256(relationship);
  
  // Combined hash matches Solidity: keccak256(abi.encodePacked(nameHash, emailHash, relationshipHash))
  const combinedHash = ethers.keccak256(
    ethers.concat([nameHash, emailHash, relationshipHash])
  );
  
  return {
    nameHash,
    emailHash,
    relationshipHash,
    combinedHash,
  };
}

/**
 * Create KYC data hash for on-chain storage
 * @param name - User's full name
 * @param email - User's email
 * @param idNumber - ID document number
 * @returns Keccak256 hash
 */
export function createKYCHash(name: string, email: string, idNumber: string): string {
  const combined = `${name}:${email}:${idNumber}`;
  return keccak256(combined);
}

/**
 * Verify if provided data matches a hash
 * @param data - Plain text data
 * @param hash - Expected hash
 * @returns Boolean indicating match
 */
export function verifyHash(data: string, hash: string): boolean {
  const computedHash = keccak256(data);
  return computedHash.toLowerCase() === hash.toLowerCase();
}

/**
 * Generate a secure random token
 * @param length - Length in bytes (default 32)
 * @returns Hex string token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

export default {
  keccak256,
  keccak256NoPrefix,
  encryptClaimCode,
  decryptClaimCode,
  generateClaimCode,
  createBeneficiaryHashes,
  createKYCHash,
  verifyHash,
  generateSecureToken,
};

