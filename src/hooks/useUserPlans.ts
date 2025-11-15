"use client";

import { useAccount } from "wagmi";
import { useUserPlanCount, useUserPlanIdToGlobal, useInheritancePlan, usePlanName, usePlanDescription, useDistributionPlan } from "./useInheritX";
import { useMemo } from "react";
import { Address } from "viem";

export interface UserPlan {
  userPlanId: number;
  globalPlanId: bigint;
  planName: string;
  planDescription: string;
  inheritancePlan: any;
  distributionPlan: any;
}

// Hook to get all plans for the connected user
export function useUserPlans() {
  const { address } = useAccount();
  const { data: planCount, isLoading: isLoadingCount } = useUserPlanCount(address);

  // Create array of plan IDs to fetch
  const planIds = useMemo(() => {
    if (!planCount || planCount === BigInt(0)) return [];
    return Array.from({ length: Number(planCount) }, (_, i) => i + 1);
  }, [planCount]);

  // Fetch all user plan ID to global ID mappings
  const globalIdQueries = planIds.map((userPlanId) => ({
    address: address as Address,
    userPlanId,
  }));

  // For now, we'll need to fetch them individually
  // This is a simplified version - in production, you might want to batch these
  const isLoading = isLoadingCount || !address;

  return {
    planCount: planCount ? Number(planCount) : 0,
    planIds,
    isLoading,
    address,
  };
}

