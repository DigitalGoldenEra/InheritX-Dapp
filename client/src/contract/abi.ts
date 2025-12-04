/**
 * InheritX Smart Contract ABI
 * Updated for new contract with hashed beneficiary data
 */

export const inheritXABI = [
  // ============================================
  // CONSTANTS
  // ============================================
  {
    type: "function",
    name: "ADMIN_ROLE",
    inputs: [],
    outputs: [{ name: "", type: "bytes32", internalType: "bytes32" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "BPS_DENOMINATOR",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "OPERATOR_ROLE",
    inputs: [],
    outputs: [{ name: "", type: "bytes32", internalType: "bytes32" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "PLAN_CREATION_FEE_BPS",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },

  // ============================================
  // KYC FUNCTIONS
  // ============================================
  {
    type: "function",
    name: "submitKYC",
    inputs: [{ name: "kycDataHash", type: "bytes32", internalType: "bytes32" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "approveKYC",
    inputs: [{ name: "user", type: "address", internalType: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "rejectKYC",
    inputs: [{ name: "user", type: "address", internalType: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "isKYCApproved",
    inputs: [{ name: "user", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getKYCStatus",
    inputs: [{ name: "user", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint8", internalType: "enum KYCStatus" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "userKYC",
    inputs: [{ name: "", type: "address", internalType: "address" }],
    outputs: [
      { name: "userAddress", type: "address", internalType: "address" },
      { name: "status", type: "uint8", internalType: "enum KYCStatus" },
      { name: "submittedAt", type: "uint64", internalType: "uint64" },
      { name: "reviewedAt", type: "uint64", internalType: "uint64" },
      { name: "reviewedBy", type: "address", internalType: "address" },
      { name: "kycDataHash", type: "bytes32", internalType: "bytes32" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "kycRequired",
    inputs: [],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "setKYCRequired",
    inputs: [{ name: "required", type: "bool", internalType: "bool" }],
    outputs: [],
    stateMutability: "nonpayable",
  },

  // ============================================
  // PLAN CREATION
  // ============================================
  {
    type: "function",
    name: "createInheritancePlan",
    inputs: [
      { name: "planNameHash", type: "bytes32", internalType: "bytes32" },
      { name: "planDescriptionHash", type: "bytes32", internalType: "bytes32" },
      {
        name: "beneficiaries",
        type: "tuple[]",
        internalType: "struct BeneficiaryInput[]",
        components: [
          { name: "nameHash", type: "bytes32", internalType: "bytes32" },
          { name: "emailHash", type: "bytes32", internalType: "bytes32" },
          { name: "relationshipHash", type: "bytes32", internalType: "bytes32" },
          { name: "allocatedPercentage", type: "uint256", internalType: "uint256" },
        ],
      },
      { name: "assetType", type: "uint8", internalType: "uint8" },
      { name: "assetAmount", type: "uint256", internalType: "uint256" },
      { name: "distributionMethod", type: "uint8", internalType: "uint8" },
      { name: "transferDate", type: "uint64", internalType: "uint64" },
      { name: "periodicPercentage", type: "uint8", internalType: "uint8" },
      { name: "claimCodeHash", type: "bytes32", internalType: "bytes32" },
    ],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "nonpayable",
  },

  // ============================================
  // CLAIM FUNCTIONS
  // ============================================
  {
    type: "function",
    name: "claimInheritance",
    inputs: [
      { name: "planId", type: "uint256", internalType: "uint256" },
      { name: "claimCode", type: "string", internalType: "string" },
      { name: "beneficiaryName", type: "string", internalType: "string" },
      { name: "beneficiaryEmail", type: "string", internalType: "string" },
      { name: "beneficiaryRelationship", type: "string", internalType: "string" },
      { name: "beneficiaryIndex", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "isPlanClaimable",
    inputs: [{ name: "planId", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getTimeUntilClaimable",
    inputs: [{ name: "planId", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "verifyBeneficiaryData",
    inputs: [
      { name: "planId", type: "uint256", internalType: "uint256" },
      { name: "beneficiaryIndex", type: "uint256", internalType: "uint256" },
      { name: "name", type: "string", internalType: "string" },
      { name: "email", type: "string", internalType: "string" },
      { name: "relationship", type: "string", internalType: "string" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "verifyClaimCode",
    inputs: [
      { name: "planId", type: "uint256", internalType: "uint256" },
      { name: "claimCode", type: "string", internalType: "string" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },

  // ============================================
  // PLAN MANAGEMENT
  // ============================================
  {
    type: "function",
    name: "pausePlan",
    inputs: [{ name: "planId", type: "uint256", internalType: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "resumePlan",
    inputs: [{ name: "planId", type: "uint256", internalType: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "cancelPlan",
    inputs: [{ name: "planId", type: "uint256", internalType: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },

  // ============================================
  // VIEW FUNCTIONS - STATE
  // ============================================
  {
    type: "function",
    name: "planCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "escrowCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "primaryToken",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "usdtToken",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "usdcToken",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalFeesCollected",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },

  // ============================================
  // VIEW FUNCTIONS - PLANS
  // ============================================
  {
    type: "function",
    name: "inheritancePlans",
    inputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    outputs: [
      { name: "id", type: "uint256", internalType: "uint256" },
      { name: "owner", type: "address", internalType: "address" },
      { name: "beneficiaryCount", type: "uint8", internalType: "uint8" },
      { name: "assetType", type: "uint8", internalType: "enum AssetType" },
      { name: "assetAmount", type: "uint256", internalType: "uint256" },
      { name: "createdAt", type: "uint64", internalType: "uint64" },
      { name: "transferDate", type: "uint64", internalType: "uint64" },
      { name: "status", type: "uint8", internalType: "enum PlanStatus" },
      { name: "isClaimed", type: "bool", internalType: "bool" },
      { name: "claimCodeHash", type: "bytes32", internalType: "bytes32" },
      { name: "escrowId", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "planNameHashes",
    inputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "", type: "bytes32", internalType: "bytes32" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "planDescriptionHashes",
    inputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "", type: "bytes32", internalType: "bytes32" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "planBeneficiaryCount",
    inputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "planBeneficiaries",
    inputs: [
      { name: "", type: "uint256", internalType: "uint256" },
      { name: "", type: "uint256", internalType: "uint256" },
    ],
    outputs: [
      { name: "nameHash", type: "bytes32", internalType: "bytes32" },
      { name: "emailHash", type: "bytes32", internalType: "bytes32" },
      { name: "relationshipHash", type: "bytes32", internalType: "bytes32" },
      { name: "beneficiaryDataHash", type: "bytes32", internalType: "bytes32" },
      { name: "claimedBy", type: "address", internalType: "address" },
      { name: "hasClaimed", type: "bool", internalType: "bool" },
      { name: "claimedAmount", type: "uint256", internalType: "uint256" },
      { name: "allocatedPercentage", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getPlanBeneficiaries",
    inputs: [{ name: "planId", type: "uint256", internalType: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        internalType: "struct Beneficiary[]",
        components: [
          { name: "nameHash", type: "bytes32", internalType: "bytes32" },
          { name: "emailHash", type: "bytes32", internalType: "bytes32" },
          { name: "relationshipHash", type: "bytes32", internalType: "bytes32" },
          { name: "beneficiaryDataHash", type: "bytes32", internalType: "bytes32" },
          { name: "claimedBy", type: "address", internalType: "address" },
          { name: "hasClaimed", type: "bool", internalType: "bool" },
          { name: "claimedAmount", type: "uint256", internalType: "uint256" },
          { name: "allocatedPercentage", type: "uint256", internalType: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getUserPlans",
    inputs: [{ name: "user", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256[]", internalType: "uint256[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "userPlanCount",
    inputs: [{ name: "", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "userPlanIdCounter",
    inputs: [{ name: "", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "userPlanIdToGlobal",
    inputs: [
      { name: "", type: "address", internalType: "address" },
      { name: "", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "globalPlanIdToUser",
    inputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    outputs: [
      { name: "user", type: "address", internalType: "address" },
      { name: "userPlanId", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },

  // ============================================
  // VIEW FUNCTIONS - DISTRIBUTIONS
  // ============================================
  {
    type: "function",
    name: "distributionPlans",
    inputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    outputs: [
      { name: "planId", type: "uint256", internalType: "uint256" },
      { name: "owner", type: "address", internalType: "address" },
      { name: "totalAmount", type: "uint256", internalType: "uint256" },
      { name: "distributionMethod", type: "uint8", internalType: "enum DistributionMethod" },
      { name: "periodAmount", type: "uint256", internalType: "uint256" },
      { name: "startDate", type: "uint64", internalType: "uint64" },
      { name: "endDate", type: "uint64", internalType: "uint64" },
      { name: "totalPeriods", type: "uint8", internalType: "uint8" },
      { name: "completedPeriods", type: "uint8", internalType: "uint8" },
      { name: "nextDisbursementDate", type: "uint64", internalType: "uint64" },
      { name: "isActive", type: "bool", internalType: "bool" },
      { name: "disbursementStatus", type: "uint8", internalType: "enum DisbursementStatus" },
      { name: "createdAt", type: "uint64", internalType: "uint64" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "distributionConfigs",
    inputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    outputs: [
      { name: "distributionMethod", type: "uint8", internalType: "enum DistributionMethod" },
      { name: "transferDate", type: "uint64", internalType: "uint64" },
      { name: "periodicPercentage", type: "uint8", internalType: "uint8" },
      { name: "startDate", type: "uint64", internalType: "uint64" },
      { name: "endDate", type: "uint64", internalType: "uint64" },
    ],
    stateMutability: "view",
  },

  // ============================================
  // VIEW FUNCTIONS - ESCROW
  // ============================================
  {
    type: "function",
    name: "escrowAccounts",
    inputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    outputs: [
      { name: "id", type: "uint256", internalType: "uint256" },
      { name: "planId", type: "uint256", internalType: "uint256" },
      { name: "assetType", type: "uint8", internalType: "enum AssetType" },
      { name: "amount", type: "uint256", internalType: "uint256" },
      { name: "isLocked", type: "bool", internalType: "bool" },
      { name: "lockedAt", type: "uint64", internalType: "uint64" },
      { name: "fees", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "planEscrow",
    inputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },

  // ============================================
  // VIEW FUNCTIONS - FEE
  // ============================================
  {
    type: "function",
    name: "feeConfig",
    inputs: [],
    outputs: [
      { name: "feePercentage", type: "uint256", internalType: "uint256" },
      { name: "feeRecipient", type: "address", internalType: "address" },
      { name: "isActive", type: "bool", internalType: "bool" },
      { name: "minFee", type: "uint256", internalType: "uint256" },
      { name: "maxFee", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "previewPlanCreationFee",
    inputs: [{ name: "assetAmount", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "pure",
  },

  // ============================================
  // ADMIN FUNCTIONS
  // ============================================
  {
    type: "function",
    name: "updateFeeConfig",
    inputs: [
      { name: "newFeePercentage", type: "uint256", internalType: "uint256" },
      { name: "newFeeRecipient", type: "address", internalType: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "updateTokenAddresses",
    inputs: [
      { name: "_primaryToken", type: "address", internalType: "address" },
      { name: "_usdtToken", type: "address", internalType: "address" },
      { name: "_usdcToken", type: "address", internalType: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "pause",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "unpause",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },

  // ============================================
  // EVENTS
  // ============================================
  {
    type: "event",
    name: "PlanCreated",
    inputs: [
      { name: "globalPlanId", type: "uint256", indexed: true },
      { name: "userPlanId", type: "uint256", indexed: true },
      { name: "owner", type: "address", indexed: true },
      { name: "assetType", type: "uint8", indexed: false },
      { name: "assetAmount", type: "uint256", indexed: false },
      { name: "distributionMethod", type: "uint8", indexed: false },
      { name: "transferDate", type: "uint64", indexed: false },
      { name: "beneficiaryCount", type: "uint8", indexed: false },
      { name: "createdAt", type: "uint64", indexed: false },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "FeeCollected",
    inputs: [
      { name: "planId", type: "uint256", indexed: true },
      { name: "feeAmount", type: "uint256", indexed: false },
      { name: "netAmount", type: "uint256", indexed: false },
      { name: "feeRecipient", type: "address", indexed: false },
      { name: "collectedAt", type: "uint64", indexed: false },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "InheritanceClaimed",
    inputs: [
      { name: "planId", type: "uint256", indexed: true },
      { name: "claimer", type: "address", indexed: true },
      { name: "beneficiaryIndex", type: "uint256", indexed: false },
      { name: "amount", type: "uint256", indexed: false },
      { name: "claimedAt", type: "uint64", indexed: false },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "PlanStatusChanged",
    inputs: [
      { name: "planId", type: "uint256", indexed: true },
      { name: "oldStatus", type: "uint8", indexed: false },
      { name: "newStatus", type: "uint8", indexed: false },
      { name: "changedAt", type: "uint64", indexed: false },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "KYCSubmitted",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "kycDataHash", type: "bytes32", indexed: false },
      { name: "submittedAt", type: "uint64", indexed: false },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "KYCStatusChanged",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "oldStatus", type: "uint8", indexed: false },
      { name: "newStatus", type: "uint8", indexed: false },
      { name: "reviewedBy", type: "address", indexed: true },
      { name: "changedAt", type: "uint64", indexed: false },
    ],
    anonymous: false,
  },
] as const;

export default inheritXABI;

