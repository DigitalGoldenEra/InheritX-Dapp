"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount, useReadContracts } from "wagmi";
import { CONTRACT_ADDRESS, inheritXABI, AssetType, DistributionMethod, type BeneficiaryInput } from "@/src/lib/contract";
import { Address, formatEther, parseEther } from "viem";

// Hook to get user's plan count
export function useUserPlanCount(address?: Address) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: inheritXABI,
    functionName: "userPlanCount",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

// Hook to get a specific plan by global ID
export function useInheritancePlan(planId: bigint | number | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: inheritXABI,
    functionName: "inheritancePlans",
    args: planId !== undefined ? [BigInt(planId)] : undefined,
    query: {
      enabled: planId !== undefined,
    },
  });
}

// Hook to get plan name
export function usePlanName(planId: bigint | number | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: inheritXABI,
    functionName: "planNames",
    args: planId !== undefined ? [BigInt(planId)] : undefined,
    query: {
      enabled: planId !== undefined,
    },
  });
}

// Hook to get plan description
export function usePlanDescription(planId: bigint | number | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: inheritXABI,
    functionName: "planDescriptions",
    args: planId !== undefined ? [BigInt(planId)] : undefined,
    query: {
      enabled: planId !== undefined,
    },
  });
}

// Hook to get distribution plan
export function useDistributionPlan(planId: bigint | number | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: inheritXABI,
    functionName: "distributionPlans",
    args: planId !== undefined ? [BigInt(planId)] : undefined,
    query: {
      enabled: planId !== undefined,
    },
  });
}

// Hook to get distribution config
export function useDistributionConfig(planId: bigint | number | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: inheritXABI,
    functionName: "distributionConfigs",
    args: planId !== undefined ? [BigInt(planId)] : undefined,
    query: {
      enabled: planId !== undefined,
    },
  });
}

// Hook to get beneficiary count for a plan
export function usePlanBeneficiaryCount(planId: bigint | number | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: inheritXABI,
    functionName: "planBeneficiaryCount",
    args: planId !== undefined ? [BigInt(planId)] : undefined,
    query: {
      enabled: planId !== undefined,
    },
  });
}

// Hook to get a specific beneficiary
export function usePlanBeneficiary(planId: bigint | number | undefined, beneficiaryIndex: number | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: inheritXABI,
    functionName: "planBeneficiaries",
    args: planId !== undefined && beneficiaryIndex !== undefined ? [BigInt(planId), BigInt(beneficiaryIndex)] : undefined,
    query: {
      enabled: planId !== undefined && beneficiaryIndex !== undefined,
    },
  });
}

// Hook to get user plan ID to global ID mapping
export function useUserPlanIdToGlobal(userAddress: Address | undefined, userPlanId: bigint | number | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: inheritXABI,
    functionName: "userPlanIdToGlobal",
    args: userAddress && userPlanId !== undefined ? [userAddress, BigInt(userPlanId)] : undefined,
    query: {
      enabled: !!userAddress && userPlanId !== undefined,
    },
  });
}

// Hook to get global plan ID to user mapping
export function useGlobalPlanIdToUser(globalPlanId: bigint | number | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: inheritXABI,
    functionName: "globalPlanIdToUser",
    args: globalPlanId !== undefined ? [BigInt(globalPlanId)] : undefined,
    query: {
      enabled: globalPlanId !== undefined,
    },
  });
}

// Hook to get total plan count
export function usePlanCount() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: inheritXABI,
    functionName: "planCount",
  });
}

// Hook to get PLAN_CREATION_FEE
export function usePlanCreationFee() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: inheritXABI,
    functionName: "PLAN_CREATION_FEE",
  });
}

// Hook to create an inheritance plan
export function useCreateInheritancePlan() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const createPlan = async (
    planName: string,
    planDescription: string,
    beneficiaries: BeneficiaryInput[],
    assetType: AssetType,
    assetAmount: string, // in ether/wei string
    distributionMethod: DistributionMethod,
    lumpSumDate: bigint | number,
    quarterlyPercentage: number,
    yearlyPercentage: number,
    monthlyPercentage: number,
    additionalNote: string,
    claimCode: string
  ) => {
    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: inheritXABI,
        functionName: "createInheritancePlan",
        args: [
          planName,
          planDescription,
          beneficiaries,
          assetType,
          parseEther(assetAmount),
          distributionMethod,
          BigInt(lumpSumDate),
          quarterlyPercentage,
          yearlyPercentage,
          monthlyPercentage,
          additionalNote,
          claimCode,
        ],
      });
    } catch (err) {
      console.error("Error creating plan:", err);
    }
  };

  return {
    createPlan,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

// Hook to get escrow account
export function useEscrowAccount(escrowId: bigint | number | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: inheritXABI,
    functionName: "escrowAccounts",
    args: escrowId !== undefined ? [BigInt(escrowId)] : undefined,
    query: {
      enabled: escrowId !== undefined,
    },
  });
}

// Hook to get fee config
export function useFeeConfig() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: inheritXABI,
    functionName: "feeConfig",
  });
}

