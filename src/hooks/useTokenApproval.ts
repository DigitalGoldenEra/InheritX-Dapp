"use client";

import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount } from "wagmi";
import { Address, parseUnits, formatUnits, erc20Abi } from "viem";
import { CONTRACT_ADDRESS, AssetType } from "@/src/lib/contract";

// ERC20 ABI for approve function
const ERC20_ABI = [
  {
    constant: false,
    inputs: [
      { name: "_spender", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [
      { name: "_owner", type: "address" },
      { name: "_spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    type: "function",
  },
] as const;

// Hook to check token allowance
export function useTokenAllowance(
  tokenAddress: Address | undefined,
  owner: Address | undefined,
  spender: Address | undefined
) {
  return useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: owner && spender ? [owner, spender] : undefined,
    query: {
      enabled: !!tokenAddress && !!owner && !!spender,
    },
  });
}

// Hook to approve tokens
export function useApproveToken() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const approve = async (tokenAddress: Address, amount: string, decimals: number = 18) => {
    try {
      writeContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [CONTRACT_ADDRESS, parseUnits(amount, decimals)],
      });
    } catch (err) {
      console.error("Error approving token:", err);
    }
  };

  return {
    approve,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

// Hook to get token address from asset type
export function useTokenAddress(assetType: AssetType) {
  // This would need to fetch from contract or use a mapping
  // For now, return undefined - you'll need to implement based on your contract setup
  return undefined;
}

