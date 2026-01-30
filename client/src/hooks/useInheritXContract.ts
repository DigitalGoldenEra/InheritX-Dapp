'use client';

/**
 * Comprehensive InheritX Contract Hooks
 * Provides all contract interaction functions with server endpoint integration
 */

import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount } from 'wagmi';
import { Address, keccak256, encodePacked } from 'viem';
import inheritXABI from '@/contract/abi';
import {
  INHERITX_CONTRACT_ADDRESS,
  ASSET_TYPE_MAP,
  DISTRIBUTION_METHOD_MAP,
  hashString,
  TOKENS,
  parseTokenAmount,
} from '@/lib/contract';
import { api } from '@/lib/api';

// ============================================
// READ HOOKS (already in useInheritX.ts)
// ============================================

// ============================================
// WRITE HOOKS - Plan Management
// ============================================

/**
 * Hook for creating an inheritance plan
 * Integrates with backend API for data storage
 */
export function useCreateInheritancePlan() {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash,
  });

  const createPlan = async (planData: {
    planName: string;
    planDescription: string;
    beneficiaries: Array<{
      name: string;
      email: string;
      relationship: string;
      allocatedPercentage: number;
      claimCode?: string;
    }>;
    assetType: string;
    assetAmount: string;
    distributionMethod: string;
    transferDate: string;
    periodicPercentage?: number;
    twoFactorCode: string;
  }) => {
    try {
      // Step 1: Create plan in backend (gets contract data with hashes)
      const { data: backendData, error: apiError } = await api.createPlan({
        planName: planData.planName,
        planDescription: planData.planDescription,
        assetType: planData.assetType as 'ERC20_TOKEN1' | 'ERC20_TOKEN2' | 'ERC20_TOKEN3',
        assetAmount: planData.assetAmount,
        assetAmountWei: planData.assetAmount, // Will be converted properly
        distributionMethod: planData.distributionMethod as
          | 'LUMP_SUM'
          | 'QUARTERLY'
          | 'YEARLY'
          | 'MONTHLY',
        transferDate: new Date(planData.transferDate).toISOString(),
        periodicPercentage: planData.periodicPercentage,
        beneficiaries: planData.beneficiaries.map((b) => ({
          ...b,
          allocatedPercentage: b.allocatedPercentage * 100, // Convert to basis points
          claimCode: b.claimCode,
        })),
        twoFactorCode: planData.twoFactorCode,
      });

      if (apiError || !backendData) {
        throw new Error(apiError || 'Failed to create plan in backend');
      }

      const { contractData } = backendData;

      // Step 2: Call smart contract
      // Get token decimals for amount conversion
      const selectedToken = TOKENS.find((t) => t.id === planData.assetType) || TOKENS[0];
      const amount = parseTokenAmount(planData.assetAmount, selectedToken.decimals);
      const transferTimestamp = BigInt(
        Math.floor(new Date(planData.transferDate).getTime() / 1000),
      );

      writeContract({
        address: INHERITX_CONTRACT_ADDRESS,
        abi: inheritXABI,
        functionName: 'createInheritancePlan',
        args: [
          contractData.planNameHash as `0x${string}`,
          contractData.planDescriptionHash as `0x${string}`,
          contractData.beneficiaries.map((b: any, i: number) => ({
            nameHash: (b.nameHash || hashString(planData.beneficiaries[i].name)) as `0x${string}`,
            emailHash: b.emailHash as `0x${string}`,
            relationshipHash: b.relationshipHash as `0x${string}`,
            allocatedPercentage: BigInt(b.allocatedPercentage),
            claimCodeHash: b.claimCodeHash as `0x${string}`, // Per-beneficiary claim code
          })),
          ASSET_TYPE_MAP[planData.assetType],
          amount,
          DISTRIBUTION_METHOD_MAP[planData.distributionMethod],
          transferTimestamp,
          planData.distributionMethod !== 'LUMP_SUM' ? planData.periodicPercentage || 0 : 0,
        ],
      });

      return { backendData, hash };
    } catch (err) {
      console.error('Error creating plan:', err);
      throw err;
    }
  };

  // Update backend when transaction is confirmed
  const updateBackendOnSuccess = async (
    planId: string,
    globalPlanId: number,
    userPlanId: number,
  ) => {
    if (isConfirmed && hash) {
      await api.updatePlanContract(planId, {
        globalPlanId,
        userPlanId,
        txHash: hash,
      });
    }
  };

  return {
    createPlan,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error: error || receiptError,
    updateBackendOnSuccess,
  };
}

/**
 * Hook for claiming inheritance
 * Integrates with backend verification and completion
 */
export function useClaimInheritance() {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash,
  });

  const claim = async (data: {
    planId: number;
    claimCode: string;
    beneficiaryName: string;
    beneficiaryEmail: string;
    beneficiaryRelationship: string;
    beneficiaryIndex: number;
  }) => {
    try {
      // Step 1: Verify claim with backend
      const { data: verification, error: verifyError } = await api.verifyClaim({
        planId: data.planId,
        claimCode: data.claimCode,
        beneficiaryName: data.beneficiaryName,
        beneficiaryEmail: data.beneficiaryEmail,
        beneficiaryRelationship: data.beneficiaryRelationship,
      });

      if (verifyError || !verification?.verified) {
        throw new Error(verifyError || 'Claim verification failed');
      }

      // Step 2: Call smart contract
      writeContract({
        address: INHERITX_CONTRACT_ADDRESS,
        abi: inheritXABI,
        functionName: 'claimInheritance',
        args: [
          BigInt(data.planId),
          data.claimCode,
          data.beneficiaryName,
          data.beneficiaryEmail,
          data.beneficiaryRelationship,
          BigInt(data.beneficiaryIndex),
        ],
      });

      return { verification, hash };
    } catch (err) {
      console.error('Error claiming inheritance:', err);
      throw err;
    }
  };

  // Complete claim in backend when transaction is confirmed
  const completeClaim = async (
    planId: string,
    beneficiaryIndex: number,
    allocatedAmount: string,
  ) => {
    if (isConfirmed && hash && address) {
      await api.completeClaim({
        planId,
        beneficiaryIndex,
        claimerAddress: address,
        txHash: hash,
        claimedAmount: allocatedAmount,
      });
    }
  };

  return {
    claim,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error: error || receiptError,
    completeClaim,
  };
}

/**
 * Hook for canceling a plan
 */
export function useCancelPlan() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const cancelPlan = (planId: number) => {
    writeContract({
      address: INHERITX_CONTRACT_ADDRESS,
      abi: inheritXABI,
      functionName: 'cancelPlan',
      args: [BigInt(planId)],
    });
  };

  return {
    cancelPlan,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

/**
 * Hook for pausing a plan
 */
export function usePausePlan() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const pausePlan = (planId: number) => {
    writeContract({
      address: INHERITX_CONTRACT_ADDRESS,
      abi: inheritXABI,
      functionName: 'pausePlan',
      args: [BigInt(planId)],
    });
  };

  return {
    pausePlan,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

/**
 * Hook for resuming a paused plan
 */
export function useResumePlan() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const resumePlan = (planId: number) => {
    writeContract({
      address: INHERITX_CONTRACT_ADDRESS,
      abi: inheritXABI,
      functionName: 'resumePlan',
      args: [BigInt(planId)],
    });
  };

  return {
    resumePlan,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

// ============================================
// ADMIN HOOKS - KYC Management
// ============================================

/**
 * Hook for approving KYC (admin only)
 * Flow: Contract first -> Backend after confirmation
 */
export function useApproveKYC() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const approveKYC = async (kycId: string, userAddress: Address, kycDataHash?: string) => {
    try {
      // Step 1: Get KYC details to retrieve hash if not provided
      let hashToUse = kycDataHash;
      if (!hashToUse) {
        const { data: kycData } = await api.getAdminKYC(kycId);
        // If backend returns kycDataHash, use it; otherwise generate from address
        hashToUse =
          (kycData as any)?.kycDataHash || keccak256(encodePacked(['address'], [userAddress]));
      }

      // Step 2: Call smart contract FIRST (backend update happens after confirmation)
      writeContract({
        address: INHERITX_CONTRACT_ADDRESS,
        abi: inheritXABI,
        functionName: 'approveKYC',
        args: [userAddress, hashToUse as `0x${string}`],
      });

      return { kycId, userAddress, hash };
    } catch (err) {
      console.error('Error approving KYC:', err);
      throw err;
    }
  };

  // Call this function AFTER contract transaction is confirmed
  const updateBackendOnSuccess = async (kycId: string) => {
    try {
      const { data: backendData, error: apiError } = await api.approveKYC(kycId);
      if (apiError) {
        console.error('Backend update error:', apiError);
        throw new Error(apiError);
      }
      return backendData;
    } catch (err) {
      console.error('Error updating backend after KYC approval:', err);
      throw err;
    }
  };

  return {
    approveKYC,
    updateBackendOnSuccess,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

/**
 * Hook for rejecting KYC (admin only)
 * Flow: Contract first -> Backend after confirmation
 */
export function useRejectKYC() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const rejectKYC = async (kycId: string, userAddress: Address, reason?: string) => {
    try {
      // Step 1: Call smart contract FIRST (backend update happens after confirmation)
      writeContract({
        address: INHERITX_CONTRACT_ADDRESS,
        abi: inheritXABI,
        functionName: 'rejectKYC',
        args: [userAddress],
      });

      return { kycId, reason, hash };
    } catch (err) {
      console.error('Error rejecting KYC:', err);
      throw err;
    }
  };

  // Call this function AFTER contract transaction is confirmed
  const updateBackendOnSuccess = async (kycId: string, reason?: string) => {
    try {
      const { data: backendData, error: apiError } = await api.rejectKYC(kycId, reason);
      if (apiError) {
        console.error('Backend update error:', apiError);
        throw new Error(apiError);
      }
      return backendData;
    } catch (err) {
      console.error('Error updating backend after KYC rejection:', err);
      throw err;
    }
  };

  return {
    rejectKYC,
    updateBackendOnSuccess,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

// ============================================
// ADMIN HOOKS - System Management
// ============================================

/**
 * Hook for updating fee configuration (admin only)
 */
export function useUpdateFeeConfig() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const updateFeeConfig = (feePercentage: number, feeRecipient: Address) => {
    writeContract({
      address: INHERITX_CONTRACT_ADDRESS,
      abi: inheritXABI,
      functionName: 'updateFeeConfig',
      args: [BigInt(feePercentage), feeRecipient],
    });
  };

  return {
    updateFeeConfig,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

/**
 * Hook for updating token addresses (admin only)
 */
export function useUpdateTokenAddresses() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const updateTokenAddresses = (primaryToken: Address, usdtToken: Address, usdcToken: Address) => {
    writeContract({
      address: INHERITX_CONTRACT_ADDRESS,
      abi: inheritXABI,
      functionName: 'updateTokenAddresses',
      args: [primaryToken, usdtToken, usdcToken],
    });
  };

  return {
    updateTokenAddresses,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

/**
 * Hook for setting KYC requirement (admin only)
 */
export function useSetKYCRequired() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const setKYCRequired = (required: boolean) => {
    writeContract({
      address: INHERITX_CONTRACT_ADDRESS,
      abi: inheritXABI,
      functionName: 'setKYCRequired',
      args: [required],
    });
  };

  return {
    setKYCRequired,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

/**
 * Hook for pausing the entire contract (admin only)
 */
export function usePauseContract() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const pause = () => {
    writeContract({
      address: INHERITX_CONTRACT_ADDRESS,
      abi: inheritXABI,
      functionName: 'pause',
    });
  };

  return {
    pause,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

/**
 * Hook for unpausing the contract (admin only)
 */
export function useUnpauseContract() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const unpause = () => {
    writeContract({
      address: INHERITX_CONTRACT_ADDRESS,
      abi: inheritXABI,
      functionName: 'unpause',
    });
  };

  return {
    unpause,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

// ============================================
// UTILITY HOOKS
// ============================================

/**
 * Hook to get user's plans from contract
 */
export function useUserPlans(userAddress?: Address) {
  return useReadContract({
    address: INHERITX_CONTRACT_ADDRESS,
    abi: inheritXABI,
    functionName: 'getUserPlans',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });
}

/**
 * Hook to get all plan beneficiaries
 */
export function useGetPlanBeneficiaries(planId: number | undefined) {
  return useReadContract({
    address: INHERITX_CONTRACT_ADDRESS,
    abi: inheritXABI,
    functionName: 'getPlanBeneficiaries',
    args: planId !== undefined ? [BigInt(planId)] : undefined,
    query: {
      enabled: planId !== undefined,
    },
  });
}

/**
 * Hook to verify claim code for a specific beneficiary
 */
export function useVerifyClaimCode(
  planId: number | undefined,
  beneficiaryIndex: number | undefined,
  claimCode: string | undefined,
) {
  return useReadContract({
    address: INHERITX_CONTRACT_ADDRESS,
    abi: inheritXABI,
    functionName: 'verifyClaimCode',
    args:
      planId !== undefined && beneficiaryIndex !== undefined && claimCode
        ? [BigInt(planId), BigInt(beneficiaryIndex), claimCode]
        : undefined,
    query: {
      enabled: planId !== undefined && beneficiaryIndex !== undefined && !!claimCode,
    },
  });
}

/**
 * Hook to verify beneficiary data
 */
export function useVerifyBeneficiaryData(
  planId: number | undefined,
  beneficiaryIndex: number | undefined,
  name: string | undefined,
  email: string | undefined,
  relationship: string | undefined,
) {
  return useReadContract({
    address: INHERITX_CONTRACT_ADDRESS,
    abi: inheritXABI,
    functionName: 'verifyBeneficiaryData',
    args:
      planId !== undefined && beneficiaryIndex !== undefined && name && email && relationship
        ? [BigInt(planId), BigInt(beneficiaryIndex), name, email, relationship]
        : undefined,
    query: {
      enabled:
        planId !== undefined &&
        beneficiaryIndex !== undefined &&
        !!name &&
        !!email &&
        !!relationship,
    },
  });
}
