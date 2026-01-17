'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { inheritXABI } from '@/contract/abi';
import { INHERITX_CONTRACT_ADDRESS, ASSET_TYPE_MAP, DISTRIBUTION_METHOD_MAP } from '@/lib/contract';
import { Address, parseUnits } from 'viem';

// Hook to get user's plan count
export function useUserPlanCount(address?: Address) {
  return useReadContract({
    address: INHERITX_CONTRACT_ADDRESS,
    abi: inheritXABI,
    functionName: 'userPlanCount',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

// Hook to get a specific plan by global ID
export function useInheritancePlan(planId: bigint | number | undefined) {
  return useReadContract({
    address: INHERITX_CONTRACT_ADDRESS,
    abi: inheritXABI,
    functionName: 'inheritancePlans',
    args: planId !== undefined ? [BigInt(planId)] : undefined,
    query: {
      enabled: planId !== undefined,
    },
  });
}

// Hook to get plan name hash
export function usePlanNameHash(planId: bigint | number | undefined) {
  return useReadContract({
    address: INHERITX_CONTRACT_ADDRESS,
    abi: inheritXABI,
    functionName: 'planNameHashes',
    args: planId !== undefined ? [BigInt(planId)] : undefined,
    query: {
      enabled: planId !== undefined,
    },
  });
}

// Hook to get distribution plan
export function useDistributionPlan(planId: bigint | number | undefined) {
  return useReadContract({
    address: INHERITX_CONTRACT_ADDRESS,
    abi: inheritXABI,
    functionName: 'distributionPlans',
    args: planId !== undefined ? [BigInt(planId)] : undefined,
    query: {
      enabled: planId !== undefined,
    },
  });
}

// Hook to get distribution config
export function useDistributionConfig(planId: bigint | number | undefined) {
  return useReadContract({
    address: INHERITX_CONTRACT_ADDRESS,
    abi: inheritXABI,
    functionName: 'distributionConfigs',
    args: planId !== undefined ? [BigInt(planId)] : undefined,
    query: {
      enabled: planId !== undefined,
    },
  });
}

// Hook to get beneficiary count for a plan
export function usePlanBeneficiaryCount(planId: bigint | number | undefined) {
  return useReadContract({
    address: INHERITX_CONTRACT_ADDRESS,
    abi: inheritXABI,
    functionName: 'planBeneficiaryCount',
    args: planId !== undefined ? [BigInt(planId)] : undefined,
    query: {
      enabled: planId !== undefined,
    },
  });
}

// Hook to get a specific beneficiary
export function usePlanBeneficiary(
  planId: bigint | number | undefined,
  beneficiaryIndex: number | undefined,
) {
  return useReadContract({
    address: INHERITX_CONTRACT_ADDRESS,
    abi: inheritXABI,
    functionName: 'planBeneficiaries',
    args:
      planId !== undefined && beneficiaryIndex !== undefined
        ? [BigInt(planId), BigInt(beneficiaryIndex)]
        : undefined,
    query: {
      enabled: planId !== undefined && beneficiaryIndex !== undefined,
    },
  });
}

// Hook to get total plan count
export function usePlanCount() {
  return useReadContract({
    address: INHERITX_CONTRACT_ADDRESS,
    abi: inheritXABI,
    functionName: 'planCount',
  });
}

// Hook to get PLAN_CREATION_FEE_BPS (basis points)
export function usePlanCreationFeeBPS() {
  return useReadContract({
    address: INHERITX_CONTRACT_ADDRESS,
    abi: inheritXABI,
    functionName: 'PLAN_CREATION_FEE_BPS',
  });
}

// Hook to preview plan creation fee for a given amount
export function usePreviewPlanCreationFee(assetAmount: bigint | undefined) {
  return useReadContract({
    address: INHERITX_CONTRACT_ADDRESS,
    abi: inheritXABI,
    functionName: 'previewPlanCreationFee',
    args: assetAmount !== undefined ? [assetAmount] : undefined,
    query: {
      enabled: assetAmount !== undefined,
    },
  });
}

// Hook to get token addresses from contract
export function usePrimaryToken() {
  return useReadContract({
    address: INHERITX_CONTRACT_ADDRESS,
    abi: inheritXABI,
    functionName: 'primaryToken',
  });
}

export function useUSDTToken() {
  return useReadContract({
    address: INHERITX_CONTRACT_ADDRESS,
    abi: inheritXABI,
    functionName: 'usdtToken',
  });
}

export function useUSDCToken() {
  return useReadContract({
    address: INHERITX_CONTRACT_ADDRESS,
    abi: inheritXABI,
    functionName: 'usdcToken',
  });
}

// Hook to check if user's KYC is approved
export function useIsKYCApproved(userAddress?: Address) {
  return useReadContract({
    address: INHERITX_CONTRACT_ADDRESS,
    abi: inheritXABI,
    functionName: 'isKYCApproved',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });
}

// Hook to get user's KYC status
export function useKYCStatus(userAddress?: Address) {
  return useReadContract({
    address: INHERITX_CONTRACT_ADDRESS,
    abi: inheritXABI,
    functionName: 'getKYCStatus',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });
}

// Hook to check if plan is claimable
export function useIsPlanClaimable(planId: bigint | number | undefined) {
  return useReadContract({
    address: INHERITX_CONTRACT_ADDRESS,
    abi: inheritXABI,
    functionName: 'isPlanClaimable',
    args: planId !== undefined ? [BigInt(planId)] : undefined,
    query: {
      enabled: planId !== undefined,
    },
  });
}

// Hook to get time until plan is claimable
export function useTimeUntilClaimable(planId: bigint | number | undefined) {
  return useReadContract({
    address: INHERITX_CONTRACT_ADDRESS,
    abi: inheritXABI,
    functionName: 'getTimeUntilClaimable',
    args: planId !== undefined ? [BigInt(planId)] : undefined,
    query: {
      enabled: planId !== undefined,
    },
  });
}

// Hook to get escrow account
export function useEscrowAccount(escrowId: bigint | number | undefined) {
  return useReadContract({
    address: INHERITX_CONTRACT_ADDRESS,
    abi: inheritXABI,
    functionName: 'escrowAccounts',
    args: escrowId !== undefined ? [BigInt(escrowId)] : undefined,
    query: {
      enabled: escrowId !== undefined,
    },
  });
}

// Hook to get fee config
export function useFeeConfig() {
  return useReadContract({
    address: INHERITX_CONTRACT_ADDRESS,
    abi: inheritXABI,
    functionName: 'feeConfig',
  });
}
