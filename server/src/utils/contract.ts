/**
 * Smart Contract Utility
 * Handles blockchain interactions from the backend using owner private key
 * Used for admin operations like KYC approval/rejection
 */

import { ethers, JsonRpcProvider, Wallet, Contract, TransactionReceipt } from 'ethers';
import { logger } from './logger';

// Contract ABI (only the functions we need)
const INHERITX_ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'user', type: 'address' },
      { internalType: 'bytes32', name: 'kycDataHash', type: 'bytes32' },
    ],
    name: 'approveKYC',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'rejectKYC',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'getKYCStatus',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
];

// Environment variables
const RPC_URL = process.env.RPC_URL || 'https://rpc.sepolia-api.lisk.com';
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const OWNER_PRIVATE_KEY = process.env.OWNER_PRIVATE_KEY;

// Contract instance (lazy initialization)
let provider: JsonRpcProvider | null = null;
let wallet: Wallet | null = null;
let contract: Contract | null = null;

/**
 * Check if contract configuration is available
 */
export function isContractConfigured(): boolean {
  return !!(CONTRACT_ADDRESS && OWNER_PRIVATE_KEY);
}

/**
 * Initialize the contract connection
 */
function initializeContract(): { provider: JsonRpcProvider; wallet: Wallet; contract: Contract } {
  if (!CONTRACT_ADDRESS) {
    throw new Error('CONTRACT_ADDRESS not configured in environment');
  }
  if (!OWNER_PRIVATE_KEY) {
    throw new Error('OWNER_PRIVATE_KEY not configured in environment');
  }

  if (!provider) {
    provider = new JsonRpcProvider(RPC_URL);
    logger.info(`Connected to RPC: ${RPC_URL}`);
  }

  if (!wallet) {
    wallet = new Wallet(OWNER_PRIVATE_KEY, provider);
    logger.info(`Wallet initialized: ${wallet.address}`);
  }

  if (!contract) {
    contract = new Contract(CONTRACT_ADDRESS, INHERITX_ABI, wallet);
    logger.info(`Contract initialized: ${CONTRACT_ADDRESS}`);
  }

  return { provider, wallet, contract };
}

/**
 * Get the contract instance
 */
export function getContract(): Contract {
  const { contract } = initializeContract();
  return contract;
}

/**
 * Get the wallet address
 */
export function getWalletAddress(): string {
  const { wallet } = initializeContract();
  return wallet.address;
}

/**
 * Approve KYC on the smart contract
 * @param userAddress - The user's wallet address
 * @param kycDataHash - The hash of the KYC data
 * @returns Transaction receipt
 */
export async function approveKYCOnContract(
  userAddress: string,
  kycDataHash: string
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    if (!isContractConfigured()) {
      logger.warn('Contract not configured, skipping on-chain KYC approval');
      return { success: true, txHash: 'contract-not-configured' };
    }

    const contract = getContract();
    
    logger.info('Approving KYC on contract:', { userAddress, kycDataHash });

    // Call the contract function
    const tx = await contract.approveKYC(userAddress, kycDataHash);
    logger.info('Transaction sent:', { hash: tx.hash });

    // Wait for confirmation
    const receipt: TransactionReceipt = await tx.wait();
    
    if (receipt.status === 0) {
      throw new Error('Transaction failed on-chain');
    }

    logger.info('KYC approved on contract:', {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
    });

    return { success: true, txHash: receipt.hash };
  } catch (error: any) {
    logger.error('Failed to approve KYC on contract:', {
      error: error.message,
      code: error.code,
      userAddress,
    });

    // Parse common errors
    let errorMessage = 'Failed to approve KYC on blockchain';
    
    if (error.code === 'CALL_EXCEPTION') {
      // Contract reverted
      if (error.reason) {
        errorMessage = `Contract error: ${error.reason}`;
      } else if (error.message?.includes('KYCAlreadyApproved')) {
        errorMessage = 'KYC is already approved on blockchain';
      } else if (error.message?.includes('OnlyAdmin')) {
        errorMessage = 'Only admin can approve KYC';
      }
    } else if (error.code === 'INSUFFICIENT_FUNDS') {
      errorMessage = 'Insufficient funds for gas';
    } else if (error.code === 'NETWORK_ERROR') {
      errorMessage = 'Network error. Please try again.';
    }

    return { success: false, error: errorMessage };
  }
}

/**
 * Reject KYC on the smart contract
 * @param userAddress - The user's wallet address
 * @returns Transaction receipt
 */
export async function rejectKYCOnContract(
  userAddress: string
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    if (!isContractConfigured()) {
      logger.warn('Contract not configured, skipping on-chain KYC rejection');
      return { success: true, txHash: 'contract-not-configured' };
    }

    const contract = getContract();
    
    logger.info('Rejecting KYC on contract:', { userAddress });

    // Call the contract function
    const tx = await contract.rejectKYC(userAddress);
    logger.info('Transaction sent:', { hash: tx.hash });

    // Wait for confirmation
    const receipt: TransactionReceipt = await tx.wait();
    
    if (receipt.status === 0) {
      throw new Error('Transaction failed on-chain');
    }

    logger.info('KYC rejected on contract:', {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
    });

    return { success: true, txHash: receipt.hash };
  } catch (error: any) {
    logger.error('Failed to reject KYC on contract:', {
      error: error.message,
      code: error.code,
      userAddress,
    });

    // Parse common errors
    let errorMessage = 'Failed to reject KYC on blockchain';
    
    if (error.code === 'CALL_EXCEPTION') {
      if (error.reason) {
        errorMessage = `Contract error: ${error.reason}`;
      } else if (error.message?.includes('OnlyAdmin')) {
        errorMessage = 'Only admin can reject KYC';
      }
    } else if (error.code === 'INSUFFICIENT_FUNDS') {
      errorMessage = 'Insufficient funds for gas';
    } else if (error.code === 'NETWORK_ERROR') {
      errorMessage = 'Network error. Please try again.';
    }

    return { success: false, error: errorMessage };
  }
}

/**
 * Get KYC status from contract
 * @param userAddress - The user's wallet address
 * @returns KYC status (0 = NotSubmitted, 1 = Pending, 2 = Approved, 3 = Rejected)
 */
export async function getKYCStatusFromContract(
  userAddress: string
): Promise<{ success: boolean; status?: number; error?: string }> {
  try {
    if (!isContractConfigured()) {
      return { success: false, error: 'Contract not configured' };
    }

    const contract = getContract();
    const status = await contract.getKYCStatus(userAddress);
    
    return { success: true, status: Number(status) };
  } catch (error: any) {
    logger.error('Failed to get KYC status from contract:', {
      error: error.message,
      userAddress,
    });
    return { success: false, error: error.message };
  }
}
