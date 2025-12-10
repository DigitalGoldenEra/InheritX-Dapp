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
  const [txStep, setTxStep] = useState<'idle' | 'approving' | 'creating'>('idle');
  
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
  
  const [planArgs, setPlanArgs] = useState<PlanArgs | null>(null);

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

  // Calculate required amount with fees (5% creation fee)
  const assetAmountWei = BigInt(plan.assetAmountWei || '0');
  const creationFee = (assetAmountWei * BigInt(500)) / BigInt(10000); // 5%
  const totalRequired = assetAmountWei + creationFee;
  
  // Check balance
  const hasInsufficientBalance = tokenBalance !== undefined && typeof tokenBalance === 'bigint' && totalRequired > tokenBalance;

  // Separate hooks for approval and plan creation
  const { 
    writeContract: writeApprove, 
    data: approveTxHash, 
    isPending: isApprovePending,
    error: approveError,
    reset: resetApprove
  } = useWriteContract();
  
  const { 
    writeContract: writeCreatePlan, 
    data: createTxHash, 
    isPending: isCreatePending,
    error: createError,
    reset: resetCreate
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

  // Prepare plan args when claim code is ready
  useEffect(() => {
    if (!claimCode || planArgs) return;

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
        allocatedPercentage: BigInt(ben.allocatedPercentage),
      };
    });

    const amount = parseTokenAmount(plan.assetAmount, selectedToken.decimals);

    const transferTimestamp = BigInt(Math.floor(new Date(plan.transferDate).getTime() / 1000));
    const periodicPercentage = plan.periodicPercentage ?? 0;

    const args: PlanArgs = [
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
    console.log('amount', amount);
    console.log('args', args);

    setPlanArgs(args);
  }, [claimCode, plan, planArgs, selectedToken.decimals]);

  // Main transaction flow handler
  const startTransactionFlow = useCallback(() => {
    if (!address || !planArgs || hasInsufficientBalance) {
      return;
    }

    setError(null);
    setTxStep('approving');

    // Always start with approval
    console.log('Starting approval:', {
      totalRequired: totalRequired.toString(),
      totalRequiredFormatted: formatUnits(totalRequired, selectedToken.decimals),
    });

    try {
      writeApprove({
        address: selectedToken.address,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [INHERITX_CONTRACT_ADDRESS, totalRequired],
      });
    } catch (err) {
      console.error('Error initiating approval:', err);
      setError('Failed to initiate approval transaction. Please try again.');
      setTxStep('idle');
    }
  }, [address, planArgs, hasInsufficientBalance, totalRequired, selectedToken.address, selectedToken.decimals, writeApprove]);

  // Handle approval confirmation → trigger plan creation
  useEffect(() => {
    if (isApprovalConfirmed && approveTxHash && txStep === 'approving' && planArgs) {
      console.log('Approval confirmed, creating plan...');
      
      setTxStep('creating');
      
      // Small delay to ensure blockchain state is updated
      setTimeout(() => {
        try {
          writeCreatePlan({
            address: INHERITX_CONTRACT_ADDRESS,
            abi: inheritXABI,
            functionName: 'createInheritancePlan',
            args: planArgs,
          });
        } catch (err) {
          console.error('Error initiating plan creation:', err);
          setError('Failed to initiate plan creation transaction. Please try again.');
          setTxStep('idle');
        }
      }, 2000); // 2 second delay for blockchain state propagation
    }
  }, [isApprovalConfirmed, approveTxHash, txStep, planArgs, writeCreatePlan]);

  // Handle create success - parse event logs and update backend
  useEffect(() => {
    if (createSuccess && createTxHash && createReceipt) {
      // Check if transaction was reverted
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
      setTxStep('idle');
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
      setTxStep('idle');
    }
    if (createError) {
      let errorMessage = 'Transaction failed';
      
      if (createError instanceof Error) {
        errorMessage = createError.message;
      } else if (typeof createError === 'object' && createError !== null) {
        const err = createError as { shortMessage?: string; message?: string; cause?: any; data?: any };
        errorMessage = err.shortMessage || err.message || errorMessage;
        
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
      setTxStep('idle');
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
      setTxStep('idle');
    }
  }, [approveError, approveReceiptError, isApproveError, createError, createReceiptError, isCreateError]);

  // Retry handler
  const handleRetry = useCallback(() => {
    setError(null);
    resetApprove();
    resetCreate();
    setTxStep('idle');
    // Small delay before restarting
    setTimeout(() => {
      startTransactionFlow();
    }, 100);
  }, [resetApprove, resetCreate, startTransactionFlow]);

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

          {/* Approval & Creation Flow */}
          {txStep === 'approving' && (
            <div className="text-center py-6">
              <FiLoader className="animate-spin mx-auto text-primary" size={48} />
              <h3 className="text-lg font-semibold mt-4">
                {isApprovePending ? 'Confirm Approval' : 'Approving Tokens...'}
              </h3>
              <p className="text-[var(--text-secondary)] mt-2">
                {isApprovePending 
                  ? 'Please confirm the approval transaction in your wallet' 
                  : 'Waiting for approval confirmation...'}
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
            </div>
          )}

          {txStep === 'creating' && (
            <div className="text-center py-6">
              <FiLoader className="animate-spin mx-auto text-primary" size={48} />
              <h3 className="text-lg font-semibold mt-4">
                {isCreatePending ? 'Confirm Transaction' : 'Creating Plan...'}
              </h3>
              <p className="text-[var(--text-secondary)] mt-2">
                {isCreatePending 
                  ? 'Please confirm the plan creation in your wallet' 
                  : 'Waiting for transaction confirmation...'}
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
            </div>
          )}

          {/* Initial State - Ready to Start */}
          {txStep === 'idle' && !createSuccess && !error && (
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary flex items-center justify-center">
                <FiCheck className="text-black" size={32} />
              </div>
              <h3 className="text-lg font-semibold">Ready to Create Plan</h3>
              <p className="text-[var(--text-secondary)] mt-2 mb-6">
                This will approve tokens and create your inheritance plan on the blockchain
              </p>
              <button 
                onClick={startTransactionFlow} 
                className="btn btn-primary"
                disabled={hasInsufficientBalance || !planArgs || !address}
              >
                Start Transaction
              </button>
              <p className="text-xs text-[var(--text-muted)] mt-3">
                You will need to confirm 2 transactions: approval and plan creation
              </p>
            </div>
          )}

          {/* Error State */}
          {error && txStep === 'idle' && !createSuccess && (
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <FiAlertCircle className="text-red-500" size={32} />
              </div>
              <h3 className="text-lg font-semibold text-red-400 mb-2">
                Transaction Failed
              </h3>
              <p className="text-[var(--text-secondary)] mb-2">
                Please check the error message above and try again.
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
                  onClick={() => setError(null)} 
                  className="btn btn-secondary"
                >
                  Dismiss
                </button>
                <button 
                  onClick={handleRetry} 
                  className="btn btn-primary"
                  disabled={hasInsufficientBalance || !planArgs}
                >
                  Retry
                </button>
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