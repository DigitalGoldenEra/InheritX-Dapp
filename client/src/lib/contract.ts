/**
 * Contract Configuration
 * Smart contract addresses and utilities
 */

import { keccak256, toHex, encodePacked } from 'viem';

// Contract address - update with deployed address
export const INHERITX_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}` || '0x0000000000000000000000000000000000000000';

// Token addresses on Lisk Sepolia
// ETH: 0x6033f7f88332b8db6ad452b7c6d5bb643990ae3f (Wrapped ETH)
// USDC: Set in NEXT_PUBLIC_TOKEN2_ADDRESS
// USDT: Set in NEXT_PUBLIC_TOKEN3_ADDRESS
export const TOKEN_ADDRESSES = {
  ERC20_TOKEN1: process.env.NEXT_PUBLIC_TOKEN1_ADDRESS as `0x${string}` || '0x0000000000000000000000000000000000000000', // ETH
  ERC20_TOKEN2: process.env.NEXT_PUBLIC_TOKEN2_ADDRESS as `0x${string}` || '0x0000000000000000000000000000000000000000', // USDC
  ERC20_TOKEN3: process.env.NEXT_PUBLIC_TOKEN3_ADDRESS as `0x${string}` || '0x0000000000000000000000000000000000000000', // USDT
};

// Token metadata
export const TOKENS = [
  { id: 'ERC20_TOKEN1', name: 'Ethereum', symbol: 'ETH', decimals: 18, address: TOKEN_ADDRESSES.ERC20_TOKEN1 },
  { id: 'ERC20_TOKEN2', name: 'USD Coin', symbol: 'USDC', decimals: 6, address: TOKEN_ADDRESSES.ERC20_TOKEN2 },
  { id: 'ERC20_TOKEN3', name: 'Tether USD', symbol: 'USDT', decimals: 6, address: TOKEN_ADDRESSES.ERC20_TOKEN3 },
];

// Distribution methods
export const DISTRIBUTION_METHODS = [
  { id: 'LUMP_SUM', name: 'Lump Sum', description: 'Single distribution on transfer date', value: 0 },
  { id: 'QUARTERLY', name: 'Quarterly', description: 'Distribution every 3 months', value: 1 },
  { id: 'YEARLY', name: 'Yearly', description: 'Distribution every year', value: 2 },
  { id: 'MONTHLY', name: 'Monthly', description: 'Distribution every month', value: 3 },
];

// Asset type mapping
export const ASSET_TYPE_MAP: Record<string, number> = {
  ERC20_TOKEN1: 0,
  ERC20_TOKEN2: 1,
  ERC20_TOKEN3: 2,
};

// Distribution method mapping
export const DISTRIBUTION_METHOD_MAP: Record<string, number> = {
  LUMP_SUM: 0,
  QUARTERLY: 1,
  YEARLY: 2,
  MONTHLY: 3,
};

/**
 * Hash a string using keccak256
 */
export function hashString(value: string): `0x${string}` {
  return keccak256(encodePacked(['string'], [value]));
}

/**
 * Get token info by asset type
 */
export function getTokenByAssetType(assetType: string) {
  return TOKENS.find(t => t.id === assetType) || TOKENS[0];
}

/**
 * Get token info by address
 */
export function getTokenByAddress(address: string) {
  return TOKENS.find(t => t.address.toLowerCase() === address.toLowerCase());
}

/**
 * Format token amount for display
 */
export function formatTokenAmount(amount: string | bigint, decimals: number = 18): string {
  const value = typeof amount === 'string' ? BigInt(amount) : amount;
  const divisor = BigInt(10 ** decimals);
  const integerPart = value / divisor;
  const fractionalPart = value % divisor;
  
  const fractionalStr = fractionalPart.toString().padStart(decimals, '0').slice(0, 4);
  const cleanedFractional = fractionalStr.replace(/0+$/, '') || '0';
  
  if (cleanedFractional === '0') {
    return integerPart.toString();
  }
  
  return `${integerPart}.${cleanedFractional}`;
}

/**
 * Parse token amount to wei
 */
export function parseTokenAmount(amount: string, decimals: number = 18): bigint {
  const [integerPart, fractionalPart = ''] = amount.split('.');
  const paddedFractional = fractionalPart.padEnd(decimals, '0').slice(0, decimals);
  const fullValue = integerPart + paddedFractional;
  return BigInt(fullValue);
}

/**
 * Format address for display
 */
export function formatAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format datetime for display
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Calculate time until date
 */
export function getTimeUntil(dateString: string): { days: number; hours: number; minutes: number; isPast: boolean } {
  const target = new Date(dateString).getTime();
  const now = Date.now();
  const diff = target - now;
  
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, isPast: true };
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return { days, hours, minutes, isPast: false };
}

/**
 * Get plan status badge info
 */
export function getPlanStatusBadge(status: string): { label: string; variant: string } {
  const statusMap: Record<string, { label: string; variant: string }> = {
    ACTIVE: { label: 'Active', variant: 'badge-success' },
    PAUSED: { label: 'Paused', variant: 'badge-warning' },
    CANCELLED: { label: 'Cancelled', variant: 'badge-error' },
    EXECUTED: { label: 'Executed', variant: 'badge-primary' },
    PENDING: { label: 'Pending', variant: 'badge-purple' },
  };
  
  return statusMap[status] || { label: status, variant: 'badge-primary' };
}

/**
 * Get KYC status badge info
 */
export function getKYCStatusBadge(status: string): { label: string; variant: string } {
  const statusMap: Record<string, { label: string; variant: string }> = {
    NOT_SUBMITTED: { label: 'Not Submitted', variant: 'badge-warning' },
    PENDING: { label: 'Pending Review', variant: 'badge-purple' },
    APPROVED: { label: 'Approved', variant: 'badge-success' },
    REJECTED: { label: 'Rejected', variant: 'badge-error' },
  };
  
  return statusMap[status] || { label: status, variant: 'badge-primary' };
}

// ERC20 ABI for approvals
export const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'allowance',
    type: 'function',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'decimals',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    name: 'symbol',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
] as const;
