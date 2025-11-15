import { Address } from "viem";
import { inheritXABI } from "@/src/contract/abi";

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as Address;

if (!CONTRACT_ADDRESS) {
  throw new Error("NEXT_PUBLIC_CONTRACT_ADDRESS is not set in environment variables");
}

export { inheritXABI };

// Contract enums (matching Solidity)
export enum AssetType {
  ERC20_TOKEN1 = 0,
  ERC20_TOKEN2 = 1,
  ERC20_TOKEN3 = 2,
  NFT = 3,
}

export enum PlanStatus {
  Active = 0,
  Executed = 1,
  Cancelled = 2,
  Overridden = 3,
  Paused = 4,
  Expired = 5,
  AssetsLocked = 6,
  AssetsReleased = 7,
}

export enum DistributionMethod {
  LumpSum = 0,
  Quarterly = 1,
  Yearly = 2,
  Monthly = 3,
}

export enum DisbursementStatus {
  Pending = 0,
  Active = 1,
  Paused = 2,
  Completed = 3,
  Cancelled = 4,
}

// Type definitions
export interface BeneficiaryInput {
  name: string;
  email: string;
  relationship: string;
}

export interface InheritancePlan {
  id: bigint;
  owner: Address;
  beneficiaryCount: number;
  assetType: AssetType;
  assetAmount: bigint;
  nftTokenId: bigint;
  nftContract: Address;
  timeframe: bigint;
  createdAt: bigint;
  becomesActiveAt: bigint;
  guardian: Address;
  encryptedDetails: string;
  status: PlanStatus;
  isClaimed: boolean;
  claimCodeHash: string;
  inactivityThreshold: bigint;
  lastActivity: bigint;
  swapRequestId: bigint;
  escrowId: bigint;
  securityLevel: number;
  autoExecute: boolean;
  emergencyContactsCount: number;
}

export interface Beneficiary {
  beneficiaryAddress: Address;
  name: string;
  email: string;
  relationship: string;
  claimCodeHash: string;
  hasClaimed: boolean;
  claimedAmount: bigint;
}

export interface DistributionPlan {
  planId: bigint;
  owner: Address;
  totalAmount: bigint;
  distributionMethod: DistributionMethod;
  periodAmount: bigint;
  startDate: bigint;
  endDate: bigint;
  totalPeriods: number;
  completedPeriods: number;
  nextDisbursementDate: bigint;
  isActive: boolean;
  beneficiariesCount: number;
  disbursementStatus: DisbursementStatus;
  createdAt: bigint;
  lastActivity: bigint;
  pausedAt: bigint;
  resumedAt: bigint;
}

export interface DistributionConfig {
  distributionMethod: DistributionMethod;
  lumpSumDate: bigint;
  quarterlyPercentage: number;
  yearlyPercentage: number;
  monthlyPercentage: number;
  additionalNote: string;
  startDate: bigint;
  endDate: bigint;
}

export interface EscrowAccount {
  id: bigint;
  planId: bigint;
  assetType: AssetType;
  amount: bigint;
  nftTokenId: bigint;
  nftContract: Address;
  isLocked: boolean;
  lockedAt: bigint;
  beneficiary: Address;
  releaseConditionsCount: number;
  fees: bigint;
  taxLiability: bigint;
  lastValuation: bigint;
  valuationPrice: bigint;
}

// Helper functions
export const getAssetTypeName = (assetType: AssetType): string => {
  switch (assetType) {
    case AssetType.ERC20_TOKEN1:
      return "Primary Token";
    case AssetType.ERC20_TOKEN2:
      return "USDT";
    case AssetType.ERC20_TOKEN3:
      return "USDC";
    case AssetType.NFT:
      return "NFT";
    default:
      return "Unknown";
  }
};

export const getPlanStatusName = (status: PlanStatus): string => {
  switch (status) {
    case PlanStatus.Active:
      return "ACTIVE";
    case PlanStatus.Executed:
      return "EXECUTED";
    case PlanStatus.Cancelled:
      return "CANCELLED";
    case PlanStatus.Overridden:
      return "OVERRIDDEN";
    case PlanStatus.Paused:
      return "PAUSED";
    case PlanStatus.Expired:
      return "EXPIRED";
    case PlanStatus.AssetsLocked:
      return "ASSETS LOCKED";
    case PlanStatus.AssetsReleased:
      return "ASSETS RELEASED";
    default:
      return "UNKNOWN";
  }
};

export const getDistributionMethodName = (method: DistributionMethod): string => {
  switch (method) {
    case DistributionMethod.LumpSum:
      return "Lump Sum";
    case DistributionMethod.Quarterly:
      return "Quarterly";
    case DistributionMethod.Yearly:
      return "Yearly";
    case DistributionMethod.Monthly:
      return "Monthly";
    default:
      return "Unknown";
  }
};

export const formatTokenAmount = (amount: bigint, decimals: number = 18): string => {
  const divisor = BigInt(10 ** decimals);
  const whole = amount / divisor;
  const remainder = amount % divisor;
  const decimalsStr = remainder.toString().padStart(decimals, "0");
  const trimmed = decimalsStr.replace(/0+$/, "");
  return trimmed ? `${whole}.${trimmed}` : whole.toString();
};

