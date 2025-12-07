'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  FiX, 
  FiAlertCircle,
  FiCheck,
  FiLoader
} from 'react-icons/fi';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, usePublicClient } from 'wagmi';
import { formatUnits, decodeEventLog } from 'viem';
import { api, Plan } from '@/lib/api';
import { inheritXABI } from '@/contract/abi';
import { 
  INHERITX_CONTRACT_ADDRESS, 
  TOKENS, 
  ASSET_TYPE_MAP,
  DISTRIBUTION_METHOD_MAP,
  ERC20_ABI,
  parseTokenAmount,
  hashString
} from '@/lib/contract';
import { keccak256, encodePacked } from 'viem';

interface CompletePendingPlanModalProps {
  plan: Plan;
  onClose: () => void;
  onSuccess: () => void;
}

// Helper to create beneficiary hashes (matches backend)
function createBeneficiaryHashes(name: string, email: string, relationship: string) {
  const nameHash = hashString(name);
  const emailHash = hashString(email);
  const relationshipHash = hashString(relationship);
  
  // Combined hash: keccak256(abi.encodePacked(nameHash, emailHash, relationshipHash))
  // Backend uses ethers.concat which just concatenates bytes, but encodePacked works the same for bytes32
  const combinedHash = keccak256(encodePacked(
    ['bytes32', 'bytes32', 'bytes32'],
    [nameHash, emailHash, relationshipHash]
  ));
  
  return {
    nameHash,
    emailHash,
    relationshipHash,
    combinedHash,
  };
}

export default function CompletePendingPlanModal({ plan, onClose, onSuccess }: CompletePendingPlanModalProps) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [error, setError] = useState<string | null>(null);
  const [claimCode, setClaimCode] = useState<string | null>(null);
  const [isLoadingClaimCode, setIsLoadingClaimCode] = useState(true);
  
  // Define plan args type
  type PlanArgs = [
    `0x${string}`,
    `0x${string}`,
    readonly {
      nameHash: `0x${string}`;
      emailHash: `0x${string}`;
      relationshipHash: `0x${string}`;
      allocatedPercentage: bigint;
    }[],
    number,
    bigint,
    number,
    bigint,
    number,
    `0x${string}`
  ];
  
  const [pendingPlanArgs, setPendingPlanArgs] = useState<PlanArgs | null>(null);

  // Get selected token
  const selectedToken = TOKENS.find(t => t.id === plan.assetType) || TOKENS[0];
  
  if (!selectedToken) {
    return (
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="modal max-w-md"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center py-8">
            <FiAlertCircle className="mx-auto text-red-500" size={48} />
            <h3 className="text-lg font-semibold mt-4">Invalid Asset Type</h3>
            <p className="text-[var(--text-secondary)] mt-2">
              The plan has an invalid asset type. Please contact support.
            </p>
            <button onClick={onClose} className="btn btn-primary mt-4">
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // Check token balance
  const { data: tokenBalance } = useReadContract({
    address: selectedToken.address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  // Check current allowance
  const { 
    data: currentAllowance, 
    refetch: refetchAllowance,
    isLoading: isCheckingAllowance 
  } = useReadContract({
    address: selectedToken.address,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, INHERITX_CONTRACT_ADDRESS] : undefined,
  });

  // Calculate required amount with fees (5% creation fee)
  const assetAmountWei = BigInt(plan.assetAmountWei || '0');
  const creationFee = (assetAmountWei * BigInt(500)) / BigInt(10000); // 5%
  const totalRequired = assetAmountWei + creationFee;
  
  // Check balance (needs to be calculated early)
  const hasInsufficientBalance = tokenBalance !== undefined && typeof tokenBalance === 'bigint' && totalRequired > tokenBalance;
  
  // Check if approval is needed
  // If allowance is undefined (still loading), we should wait
  // If allowance is 0 or less than required, we need approval
  const allowanceValue = currentAllowance !== undefined 
    ? (typeof currentAllowance === 'bigint' ? currentAllowance : BigInt(0))
    : undefined;
  const needsApproval = allowanceValue === undefined 
    ? true // Wait for allowance to load
    : totalRequired > allowanceValue;

  // Separate hooks for approval and plan creation to avoid race conditions
  const { 
    writeContract: writeApprove, 
    data: approveTxHash, 
    isPending: isApprovePending,
    error: approveError 
  } = useWriteContract();
  
  const { 
    writeContract: writeCreatePlan, 
    data: createTxHash, 
    isPending: isCreatePending,
    error: createError 
  } = useWriteContract();

  // Track approval transaction confirmation
  const { 
    isLoading: isApproveWaiting, 
    isSuccess: isApprovalConfirmed,
    isError: isApproveError,
    error: approveReceiptError
  } = useWaitForTransactionReceipt({ 
    hash: approveTxHash 
  });

  // Track plan creation transaction confirmation
  const { 
    isLoading: isCreateWaiting, 
    isSuccess: createSuccess, 
    isError: isCreateError,
    error: createReceiptError,
    data: createReceipt 
  } = useWaitForTransactionReceipt({ 
    hash: createTxHash 
  });

  // Fetch claim code on mount
  useEffect(() => {
    const fetchClaimCode = async () => {
      try {
        const { data, error } = await api.getClaimCode(plan.id);
        if (data?.claimCode) {
          setClaimCode(data.claimCode);
        } else {
          setError('Failed to retrieve claim code. Please contact support.');
        }
      } catch (err) {
        setError('Failed to retrieve claim code. Please contact support.');
      } finally {
        setIsLoadingClaimCode(false);
      }
    };

    fetchClaimCode();
  }, [plan.id]);

  const preparePlanArgs = useCallback((): PlanArgs | null => {
    if (!claimCode) {
      return null;
    }

    // Regenerate hashes from plan data
    const planNameHash = hashString(plan.planName);
    const planDescriptionHash = hashString(plan.planDescription);
    const claimCodeHash = hashString(claimCode);

    // Create beneficiary hashes
    const beneficiaryHashes = plan.beneficiaries.map(ben => {
      const hashes = createBeneficiaryHashes(ben.name, ben.email, ben.relationship);
      return {
        nameHash: hashes.nameHash as `0x${string}`,
        emailHash: hashes.emailHash as `0x${string}`,
        relationshipHash: hashes.relationshipHash as `0x${string}`,
        allocatedPercentage: BigInt(ben.allocatedPercentage), // Already in basis points
      };
    });

    const amount = parseTokenAmount(plan.assetAmount, selectedToken.decimals);
    const transferTimestamp = BigInt(Math.floor(new Date(plan.transferDate).getTime() / 1000));
    const periodicPercentage = plan.periodicPercentage ?? 0;

    return [
      planNameHash as `0x${string}`,
      planDescriptionHash as `0x${string}`,
      beneficiaryHashes as readonly {
        nameHash: `0x${string}`;
        emailHash: `0x${string}`;
        relationshipHash: `0x${string}`;
        allocatedPercentage: bigint;
      }[],
      ASSET_TYPE_MAP[plan.assetType] ?? 0,
      amount,
      DISTRIBUTION_METHOD_MAP[plan.distributionMethod] ?? 0,
      transferTimestamp,
      periodicPercentage,
      claimCodeHash as `0x${string}`,
    ];
  }, [plan, claimCode, selectedToken]);

  // Define handleApprove first (used by handleCreatePlan)
  const handleApprove = useCallback(() => {
    if (!address) {
      setError('Please connect your wallet first');
      return;
    }

    if (!selectedToken.address || selectedToken.address === '0x0000000000000000000000000000000000000000') {
      setError('Invalid token address');
      return;
    }

    // Approve exactly the amount needed (plan amount + 5% creation fee)
    const approvalAmount = totalRequired;
    
    if (approvalAmount === BigInt(0)) {
      setError('Invalid approval amount');
      return;
    }
    
    console.log('Approving tokens:', {
      approvalAmount: approvalAmount.toString(),
      approvalAmountFormatted: formatUnits(approvalAmount, selectedToken.decimals),
      tokenSymbol: selectedToken.symbol,
      planAmount: plan.assetAmount,
      planAmountWei: plan.assetAmountWei,
      creationFee: formatUnits((BigInt(plan.assetAmountWei || '0') * BigInt(500)) / BigInt(10000), selectedToken.decimals),
      totalRequired: formatUnits(totalRequired, selectedToken.decimals),
    });
    
    setError(null); // Clear any previous errors
    
    try {
      writeApprove({
        address: selectedToken.address,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [INHERITX_CONTRACT_ADDRESS, approvalAmount],
      });
    } catch (err) {
      console.error('Error calling writeApprove:', err);
      setError('Failed to initiate approval transaction. Please try again.');
    }
  }, [address, totalRequired, selectedToken.address, selectedToken.decimals, selectedToken.symbol, plan.assetAmount, plan.assetAmountWei, writeApprove, setError]);

  const handleCreatePlan = useCallback(() => {
    if (!claimCode) {
      setError('Claim code not available');
      return;
    }

    const planArgs = preparePlanArgs();
    if (!planArgs) {
      setError('Failed to prepare plan arguments');
      return;
    }

    // Check if approval is needed - use current allowance if available, otherwise assume approval needed
    const allowanceValue = currentAllowance !== undefined 
      ? (typeof currentAllowance === 'bigint' ? currentAllowance : BigInt(0))
      : BigInt(0); // If allowance is still loading, assume 0 and trigger approval

    if (totalRequired > allowanceValue) {
      // Store plan args and trigger approval
      setPendingPlanArgs(planArgs);
      handleApprove();
    } else {
      // Approval already sufficient, create plan directly
      // Also verify balance before creating
      if (tokenBalance !== undefined && typeof tokenBalance === 'bigint' && totalRequired > tokenBalance) {
        setError(`Insufficient balance. Required: ${formatUnits(totalRequired, selectedToken.decimals)} ${selectedToken.symbol}, but you have: ${formatUnits(tokenBalance, selectedToken.decimals)} ${selectedToken.symbol}`);
        return;
      }
      
      console.log('Creating plan directly (no approval needed):', {
        totalRequired: totalRequired.toString(),
        allowance: allowanceValue.toString(),
        balance: tokenBalance?.toString(),
        planArgs: planArgs,
      });
      
      try {
        writeCreatePlan({
          address: INHERITX_CONTRACT_ADDRESS,
          abi: inheritXABI,
          functionName: 'createInheritancePlan',
          args: planArgs,
        });
      } catch (err) {
        console.error('Error calling writeCreatePlan:', err);
        setError('Failed to initiate plan creation transaction. Please try again.');
      }
    }
  }, [claimCode, preparePlanArgs, currentAllowance, totalRequired, handleApprove, writeCreatePlan, setError, tokenBalance, selectedToken.decimals]);

  // Auto-trigger plan creation flow when claim code is ready (skip allowance check)
  useEffect(() => {
    // Only trigger if all conditions are met - don't wait for allowance check
    if (
      !isLoadingClaimCode &&
      claimCode &&
      !createTxHash &&
      !isCreatePending &&
      !isApprovalConfirmed &&
      !createSuccess &&
      !approveTxHash && // Don't trigger if approval is already in progress
      address &&
      !hasInsufficientBalance &&
      selectedToken.address &&
      totalRequired > BigInt(0) &&
      !pendingPlanArgs // Don't trigger if we already have pending args
    ) {
      // Automatically start the creation flow (which will check allowance internally and trigger approval if needed)
      handleCreatePlan();
    }
  }, [
    isLoadingClaimCode,
    claimCode,
    createTxHash,
    isCreatePending,
    isApprovalConfirmed,
    createSuccess,
    approveTxHash,
    address,
    hasInsufficientBalance,
    selectedToken.address,
    totalRequired,
    pendingPlanArgs,
    handleCreatePlan,
  ]);

  // Handle approval confirmation - triggers plan creation automatically
  useEffect(() => {
    if (isApprovalConfirmed && approveTxHash && pendingPlanArgs && claimCode) {
      // Automatically proceed to create step
      // Refetch allowance and wait for it to update before creating
      const checkAndCreate = async () => {
        // Wait longer for the approval to be indexed and confirmed on-chain
        // Retry allowance check up to 5 times with increasing delays
        let allowanceValue = BigInt(0);
        let retries = 0;
        const maxRetries = 5;
        
        while (retries < maxRetries && allowanceValue < totalRequired) {
          // Wait progressively longer: 2s, 3s, 4s, 5s, 6s
          await new Promise(resolve => setTimeout(resolve, 2000 + (retries * 1000)));
          
          // Refetch allowance
          const { data: updatedAllowance } = await refetchAllowance();
          
          // Verify allowance is sufficient before creating
          allowanceValue = updatedAllowance !== undefined 
            ? (typeof updatedAllowance === 'bigint' ? updatedAllowance : BigInt(0))
            : BigInt(0);
          
          console.log(`Allowance check attempt ${retries + 1}:`, {
            allowance: allowanceValue.toString(),
            required: totalRequired.toString(),
            allowanceFormatted: formatUnits(allowanceValue, selectedToken.decimals),
            requiredFormatted: formatUnits(totalRequired, selectedToken.decimals),
          });
          
          if (allowanceValue >= totalRequired) {
            break; // Allowance is sufficient, proceed
          }
          
          retries++;
        }
        
        if (allowanceValue < totalRequired) {
          setError(`Insufficient allowance after approval (got ${formatUnits(allowanceValue, selectedToken.decimals)} ${selectedToken.symbol}, need ${formatUnits(totalRequired, selectedToken.decimals)} ${selectedToken.symbol}). The approval transaction may still be processing. Please wait a moment and try again.`);
          return;
        }
        
        // Also verify balance
        if (tokenBalance !== undefined && typeof tokenBalance === 'bigint' && totalRequired > tokenBalance) {
          setError(`Insufficient balance. Required: ${formatUnits(totalRequired, selectedToken.decimals)} ${selectedToken.symbol}, but you have: ${formatUnits(tokenBalance, selectedToken.decimals)} ${selectedToken.symbol}`);
          return;
        }
        
        // Store args locally before clearing state
        const argsToUse = pendingPlanArgs;
        setPendingPlanArgs(null);
        
        // Create the plan with stored arguments
        if (argsToUse && !createTxHash && !isCreatePending) {
          console.log('Creating plan with args:', {
            totalRequired: totalRequired.toString(),
            allowance: allowanceValue.toString(),
            balance: tokenBalance?.toString(),
            planArgs: argsToUse,
          });
          
          try {
            writeCreatePlan({
              address: INHERITX_CONTRACT_ADDRESS,
              abi: inheritXABI,
              functionName: 'createInheritancePlan',
              args: argsToUse,
            });
          } catch (err) {
            console.error('Error calling writeCreatePlan:', err);
            setError('Failed to initiate plan creation transaction. Please try again.');
          }
        }
      };
      
      checkAndCreate();
    }
  }, [isApprovalConfirmed, approveTxHash, pendingPlanArgs, claimCode, refetchAllowance, writeCreatePlan, totalRequired, selectedToken.decimals, tokenBalance, createTxHash, isCreatePending, setError]);

  // Handle create success - parse event logs and update backend
  useEffect(() => {
    if (createSuccess && createTxHash && createReceipt) {
      // Check if transaction was reverted (this should be caught by isCreateError, but double-check)
      if (createReceipt.status === 'reverted') {
        setError('Transaction was reverted on-chain. Please check the transaction details on the explorer and try again.');
        return;
      }

      // Parse PlanCreated event from transaction logs
      let globalPlanId: number | null = null;
      let userPlanId: number | null = null;

      try {
        // Find PlanCreated event in logs
        const planCreatedEvent = createReceipt.logs.find((log: any) => {
          try {
            const decoded = decodeEventLog({
              abi: inheritXABI,
              data: log.data,
              topics: log.topics,
            });
            return decoded.eventName === 'PlanCreated';
          } catch {
            return false;
          }
        });

        if (planCreatedEvent) {
          const decoded = decodeEventLog({
            abi: inheritXABI,
            data: planCreatedEvent.data,
            topics: planCreatedEvent.topics,
          }) as { eventName: string; args: { globalPlanId: bigint; userPlanId: bigint } };
          
          globalPlanId = Number(decoded.args.globalPlanId);
          userPlanId = Number(decoded.args.userPlanId);
        }
      } catch (error) {
        console.error('Error parsing event logs:', error);
      }

      // Update backend with transaction hash and plan IDs
      // This will also update status from PENDING to ACTIVE
      api.updatePlanContract(plan.id, {
        globalPlanId: globalPlanId || 0,
        userPlanId: userPlanId || 0,
        txHash: createTxHash,
      }).then(() => {
        onSuccess();
      }).catch((error) => {
        console.error('Error updating plan contract:', error);
        setError('Plan created on-chain but failed to update backend. Please contact support.');
      });
    }
  }, [createSuccess, createTxHash, createReceipt, plan.id, onSuccess]);

  // Handle errors
  useEffect(() => {
    if (approveError) {
      console.error('Approval error:', approveError);
      const errorMessage = approveError instanceof Error ? approveError.message : 
        (typeof approveError === 'object' && approveError !== null && 'shortMessage' in approveError) 
          ? String((approveError as { shortMessage: string }).shortMessage) 
          : 'Unknown error';
      setError('Approval failed: ' + errorMessage);
    }
    if (isApproveError || approveReceiptError) {
      let errorMessage = 'Transaction was rejected or failed';
      if (approveReceiptError) {
        if (approveReceiptError instanceof Error) {
          errorMessage = approveReceiptError.message;
        } else if (typeof approveReceiptError === 'object' && approveReceiptError !== null) {
          const err = approveReceiptError as { shortMessage?: string; message?: string };
          errorMessage = err.shortMessage || err.message || errorMessage;
        }
      }
      setError('Approval transaction failed: ' + errorMessage);
    }
    if (createError) {
      let errorMessage = 'Transaction failed';
      
      // Try to extract more detailed error information
      if (createError instanceof Error) {
        errorMessage = createError.message;
      } else if (typeof createError === 'object' && createError !== null) {
        const err = createError as { shortMessage?: string; message?: string; cause?: any; data?: any };
        errorMessage = err.shortMessage || err.message || errorMessage;
        
        // Check for common revert reasons
        const errorStr = JSON.stringify(err).toLowerCase();
        if (errorStr.includes('insufficient allowance') || errorStr.includes('allowance')) {
          errorMessage = 'Insufficient token allowance. Please approve more tokens.';
        } else if (errorStr.includes('insufficient balance') || errorStr.includes('balance')) {
          errorMessage = 'Insufficient token balance.';
        } else if (errorStr.includes('kyc') || errorStr.includes('not approved')) {
          errorMessage = 'KYC verification required. Please complete KYC first.';
        } else if (errorStr.includes('paused')) {
          errorMessage = 'Contract is paused. Please contact support.';
        } else if (errorStr.includes('invalid') || errorStr.includes('revert')) {
          errorMessage = err.shortMessage || err.message || 'Invalid transaction parameters. Please check your plan details.';
        }
      }
      
      setError('Plan creation failed: ' + errorMessage);
    }
    if (isCreateError || createReceiptError) {
      let errorMessage = 'Transaction was rejected or failed. Please check your wallet or the transaction on the explorer.';
      if (createReceiptError) {
        if (createReceiptError instanceof Error) {
          errorMessage = createReceiptError.message;
        } else if (typeof createReceiptError === 'object' && createReceiptError !== null) {
          const err = createReceiptError as { shortMessage?: string; message?: string };
          errorMessage = err.shortMessage || err.message || errorMessage;
        }
      }
      setError('Plan creation transaction failed: ' + errorMessage);
    }
  }, [approveError, approveReceiptError, isApproveError, createError, createReceiptError, isCreateError]);

  if (isLoadingClaimCode) {
    return (
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="modal max-w-md"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center py-8">
            <FiLoader className="animate-spin mx-auto text-primary" size={48} />
            <h3 className="text-lg font-semibold mt-4">Loading Plan Data...</h3>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="modal max-w-md"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <h2 className="text-xl font-bold">Complete Plan Creation</h2>
          <button onClick={onClose} className="btn btn-icon btn-ghost">
            <FiX size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-4">
              <FiAlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
              <div className="flex-1">
                <span className="text-red-400 text-sm block">{error}</span>
                {(createTxHash || approveTxHash) && (
                  <a
                    href={`https://sepolia-blockscout.lisk.com/tx/${createTxHash || approveTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary text-xs mt-2 inline-block hover:underline"
                  >
                    View transaction on explorer →
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Plan Summary */}
          <div className="card bg-[var(--bg-deep)] p-4 space-y-3 mb-4">
            <h3 className="font-semibold">Plan Summary</h3>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Name</span>
                <span>{plan.planName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Amount</span>
                <span>{plan.assetAmount} {selectedToken.symbol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Fees (5%)</span>
                <span>{formatUnits(creationFee, selectedToken.decimals)} {selectedToken.symbol}</span>
              </div>
              <div className="flex justify-between font-medium pt-2">
                <span>Total Required</span>
                <span>{formatUnits(totalRequired, selectedToken.decimals)} {selectedToken.symbol}</span>
              </div>
            </div>
          </div>

          {/* Balance Check */}
          {hasInsufficientBalance && (
            <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-4">
              <FiAlertCircle className="text-amber-500 shrink-0" size={18} />
              <span className="text-amber-400 text-sm">
                Insufficient balance. Required: {formatUnits(totalRequired, selectedToken.decimals)} {selectedToken.symbol}
              </span>
            </div>
          )}

          {/* Approval Step - Show if approval is needed and not yet successful */}
          {(needsApproval || isCheckingAllowance || currentAllowance === undefined || pendingPlanArgs) && !isApprovalConfirmed && !isApproveError && (
            <div className="text-center py-6">
              {isCheckingAllowance || currentAllowance === undefined ? (
                <>
                  <FiLoader className="animate-spin mx-auto text-primary" size={48} />
                  <h3 className="text-lg font-semibold mt-4">Checking Allowance...</h3>
                  <p className="text-[var(--text-secondary)] mt-2">
                    Please wait
                  </p>
                </>
              ) : isApprovePending || isApproveWaiting || pendingPlanArgs ? (
                <>
                  <FiLoader className="animate-spin mx-auto text-primary" size={48} />
                  <h3 className="text-lg font-semibold mt-4">Approving Token...</h3>
                  <p className="text-[var(--text-secondary)] mt-2">
                    Please confirm the approval transaction in your wallet
                  </p>
                  {approveTxHash && (
                    <a
                      href={`https://sepolia-blockscout.lisk.com/tx/${approveTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary text-sm mt-4 inline-block hover:underline"
                    >
                      View Transaction
                    </a>
                  )}
                  <p className="text-xs text-[var(--text-muted)] mt-4">
                    After approval, the plan creation will proceed automatically
                  </p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--primary-muted)] flex items-center justify-center">
                    <FiCheck className="text-[var(--primary)]" size={32} />
                  </div>
                  <h3 className="text-lg font-semibold">Approve Token Spending</h3>
                  <p className="text-[var(--text-secondary)] mt-2 mb-4">
                    You need to approve InheritX to spend your {selectedToken.symbol} tokens
                  </p>
                  <div className="bg-[var(--bg-deep)] p-3 rounded-lg mb-6 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Amount to approve:</span>
                      <span className="font-medium">{formatUnits(totalRequired, selectedToken.decimals)} {selectedToken.symbol}</span>
                    </div>
                  </div>
                  <button 
                    onClick={handleApprove} 
                    className="btn btn-primary w-full"
                    disabled={hasInsufficientBalance || !address}
                  >
                    Approve {selectedToken.symbol} - Confirm in Wallet
                  </button>
                  <p className="text-xs text-[var(--text-muted)] mt-3">
                    After approval, the plan creation will proceed automatically
                  </p>
                </>
              )}
            </div>
          )}

          {/* Create Step - Only show if approval is not needed OR approval succeeded */}
          {((!needsApproval && !pendingPlanArgs) || isApprovalConfirmed) && !createSuccess && !isCreateError && (
            <div className="text-center py-6">
              {isCreatePending || isCreateWaiting ? (
                <>
                  <FiLoader className="animate-spin mx-auto text-primary" size={48} />
                  <h3 className="text-lg font-semibold mt-4">Creating Plan...</h3>
                  <p className="text-[var(--text-secondary)] mt-2">
                    {isCreateWaiting ? 'Confirming transaction...' : 'Please confirm the transaction in your wallet'}
                  </p>
                  {createTxHash && (
                    <a
                      href={`https://sepolia-blockscout.lisk.com/tx/${createTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary text-sm mt-4 inline-block hover:underline"
                    >
                      View Transaction
                    </a>
                  )}
                </>
              ) : (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary flex items-center justify-center">
                    <FiCheck className="text-black" size={32} />
                  </div>
                  <h3 className="text-lg font-semibold">Create Plan on Blockchain</h3>
                  <p className="text-[var(--text-secondary)] mt-2 mb-6">
                    Sign the transaction to complete your inheritance plan
                  </p>
                  <button 
                    onClick={handleCreatePlan} 
                    className="btn btn-primary"
                    disabled={
                      hasInsufficientBalance || 
                      !claimCode || 
                      (needsApproval && !isApprovalConfirmed)
                    }
                  >
                    Create Plan
                  </button>
                </>
              )}
            </div>
          )}

          {/* Transaction Error State */}
          {(isApproveError || isCreateError) && (
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <FiAlertCircle className="text-red-500" size={32} />
              </div>
              <h3 className="text-lg font-semibold text-red-400 mb-2">
                Transaction Failed
              </h3>
              <p className="text-[var(--text-secondary)] mb-2">
                {isCreateError 
                  ? 'The plan creation transaction failed. Please check the error message above and try again.'
                  : 'The approval transaction failed. Please check the error message above and try again.'}
              </p>
              {(createTxHash || approveTxHash) && (
                <a
                  href={`https://sepolia-blockscout.lisk.com/tx/${createTxHash || approveTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary text-sm mb-4 inline-block hover:underline"
                >
                  View Transaction on Explorer
                </a>
              )}
              <div className="flex gap-3 justify-center mt-6">
                <button 
                  onClick={() => {
                    setError(null);
                    // Force component to reset by closing and reopening if needed
                    // The error states will reset when the modal is reopened
                  }} 
                  className="btn btn-secondary"
                >
                  Dismiss
                </button>
                {isCreateError && (
                  <button 
                    onClick={async () => {
                      setError(null);
                      // Small delay to ensure state is reset
                      await new Promise(resolve => setTimeout(resolve, 100));
                      handleCreatePlan();
                    }} 
                    className="btn btn-primary"
                    disabled={hasInsufficientBalance || !claimCode}
                  >
                    Retry Creation
                  </button>
                )}
                {isApproveError && (
                  <button 
                    onClick={async () => {
                      setError(null);
                      // Small delay to ensure state is reset
                      await new Promise(resolve => setTimeout(resolve, 100));
                      handleApprove();
                    }} 
                    className="btn btn-primary"
                    disabled={hasInsufficientBalance}
                  >
                    Retry Approval
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Success */}
          {createSuccess && (
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--accent-green)]/20 flex items-center justify-center">
                <FiCheck className="text-[var(--accent-green)]" size={32} />
              </div>
              <h3 className="text-lg font-semibold">Plan Created!</h3>
              <p className="text-[var(--text-secondary)] mt-2 mb-4">
                Your inheritance plan has been created successfully.
              </p>
              <button onClick={onSuccess} className="btn btn-primary">
                Done
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
