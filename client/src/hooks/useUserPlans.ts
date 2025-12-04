"use client";

import { useAccount } from "wagmi";
import { useUserPlanCount } from "./useInheritX";
import { useMemo } from "react";

export interface UserPlan {
  userPlanId: number;
  globalPlanId: bigint;
  planName: string;
  planDescription: string;
  inheritancePlan: unknown;
  distributionPlan: unknown;
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

  const isLoading = isLoadingCount || !address;

  return {
    planCount: planCount ? Number(planCount) : 0,
    planIds,
    isLoading,
    address,
  };
}
