'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiX, 
  FiPlus, 
  FiTrash2, 
  FiAlertCircle,
  FiCheck,
  FiLoader
} from 'react-icons/fi';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, usePublicClient } from 'wagmi';
import { parseUnits, formatUnits, decodeEventLog } from 'viem';
import { api, CreatePlanData, ContractData as ApiContractData } from '@/lib/api';
import { inheritXABI } from '@/contract/abi';
import { 
  INHERITX_CONTRACT_ADDRESS, 
  TOKENS, 
  DISTRIBUTION_METHODS,
  ASSET_TYPE_MAP,
  DISTRIBUTION_METHOD_MAP,
  ERC20_ABI,
  parseTokenAmount
} from '@/lib/contract';

interface CreatePlanModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface Beneficiary {
  name: string;
  email: string;
  relationship: string;
  allocatedPercentage: number;
}

interface ContractBeneficiary {
  nameHash: `0x${string}`;
  emailHash: `0x${string}`;
  relationshipHash: `0x${string}`;
  allocatedPercentage: number;
}

// Extended ContractData for contract calls (includes additional fields needed for blockchain)
interface ContractData extends ApiContractData {
  assetType: number;
  assetAmount: string;
  distributionMethod: number;
  transferDate: string;
  periodicPercentage?: number;
}

type Step = 'details' | 'beneficiaries' | 'review' | 'approve' | 'create';

export default function CreatePlanModal({ onClose, onSuccess }: CreatePlanModalProps) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [step, setStep] = useState<Step>('details');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Plan details
  const [planName, setPlanName] = useState('');
  const [planDescription, setPlanDescription] = useState('');
  const [assetType, setAssetType] = useState('ERC20_TOKEN1');
  const [assetAmount, setAssetAmount] = useState('');
  const [distributionMethod, setDistributionMethod] = useState('LUMP_SUM');
  const [transferDate, setTransferDate] = useState('');
  const [periodicPercentage, setPeriodicPercentage] = useState(25);
  const [claimCode, setClaimCode] = useState('');
  
  // Beneficiaries
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([
    { name: '', email: '', relationship: '', allocatedPercentage: 100 }
  ]);

  // Contract data from backend
  const [contractData, setContractData] = useState<ContractData | null>(null);
  const [backendPlanId, setBackendPlanId] = useState<string | null>(null);
  
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
  const selectedToken = TOKENS.find(t => t.id === assetType) || TOKENS[0];

  // Check token balance
  const { data: tokenBalance } = useReadContract({
    address: selectedToken.address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  // Check current allowance
  const { data: currentAllowance, refetch: refetchAllowance } = useReadContract({
    address: selectedToken.address,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, INHERITX_CONTRACT_ADDRESS] : undefined,
  });

  // Approval transaction
  const { 
    writeContract: writeApprove, 
    data: approveTxHash, 
    isPending: isApprovePending,
    error: approveError 
  } = useWriteContract();
  
  const { isLoading: isApproveWaiting, isSuccess: approveSuccess } = useWaitForTransactionReceipt({ 
    hash: approveTxHash 
  });

  // Create plan transaction
  const { 
    writeContract: writeCreatePlan, 
    data: createTxHash, 
    isPending: isCreatePending,
    error: createError 
  } = useWriteContract();
  
  const { 
    isLoading: isCreateWaiting, 
    isSuccess: createSuccess, 
    isError: isCreateError,
    error: createReceiptError,
    data: createReceipt 
  } = useWaitForTransactionReceipt({ 
    hash: createTxHash 
  });

  // Calculate required amount with fees (5% creation fee + 2% service fee)
  const calculateTotalRequired = () => {
    if (!assetAmount) return BigInt(0);
    const amount = parseTokenAmount(assetAmount, selectedToken.decimals);
    const creationFee = (amount * BigInt(500)) / BigInt(10000); // 5%
    return amount + creationFee;
  };

  const totalRequired = calculateTotalRequired();
  // Check if approval is needed - use current allowance if available, otherwise assume approval needed
  const allowanceValue = currentAllowance !== undefined 
    ? (typeof currentAllowance === 'bigint' ? currentAllowance : BigInt(0))
    : BigInt(0); // If allowance is still loading, assume 0 and trigger approval
  const needsApproval = totalRequired > allowanceValue;

  // Auto-trigger approval if needed (skip allowance check wait)
  useEffect(() => {
    if (
      step === 'approve' &&
      needsApproval &&
      !approveTxHash &&
      !isApprovePending &&
      !approveSuccess &&
      !approveError &&
      address &&
      pendingPlanArgs // Only trigger if we have pending plan args
    ) {
      // Automatically trigger approval
      handleApprove();
    }
  }, [
    step,
    needsApproval,
    approveTxHash,
    isApprovePending,
    approveSuccess,
    approveError,
    address,
    pendingPlanArgs,
  ]);

  // Handle approval success - automatically proceed to creation
  useEffect(() => {
    if (approveSuccess && approveTxHash && pendingPlanArgs) {
      // Automatically proceed to create step
      setStep('create');
      
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
          setStep('approve');
          return;
        }
      
        // Also verify balance
        if (tokenBalance !== undefined && typeof tokenBalance === 'bigint' && totalRequired > tokenBalance) {
          setError(`Insufficient balance. Required: ${formatUnits(totalRequired, selectedToken.decimals)} ${selectedToken.symbol}, but you have: ${formatUnits(tokenBalance, selectedToken.decimals)} ${selectedToken.symbol}`);
          setStep('review');
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
              args: argsToUse as PlanArgs,
            });
          } catch (err) {
            console.error('Error calling writeCreatePlan:', err);
            setError('Failed to initiate plan creation transaction. Please try again.');
            setStep('review');
          }
        }
      };
      
      checkAndCreate();
    }
  }, [approveSuccess, approveTxHash, pendingPlanArgs, refetchAllowance, createTxHash, isCreatePending, writeCreatePlan, totalRequired, setError]);

  // Handle create success - parse event logs and update backend
  useEffect(() => {
    if (createSuccess && createTxHash && backendPlanId && createReceipt) {
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
      api.updatePlanContract(backendPlanId, {
        globalPlanId: globalPlanId || 0, // Fallback to 0 if parsing fails
        userPlanId: userPlanId || 0,
        txHash: createTxHash,
      }).then(() => {
        onSuccess();
      }).catch((error) => {
        console.error('Error updating plan contract:', error);
        setError('Plan created on-chain but failed to update backend. Please contact support.');
      });
    }
  }, [createSuccess, createTxHash, backendPlanId, createReceipt, onSuccess]);

  // Handle errors
  useEffect(() => {
    if (approveError) {
      const errorMessage = approveError instanceof Error ? approveError.message : 
        (typeof approveError === 'object' && approveError !== null && 'shortMessage' in approveError) 
          ? String(approveError.shortMessage) 
          : 'Unknown error';
      setError('Approval failed: ' + errorMessage);
      setStep('review');
    }
    if (createError) {
      const errorMessage = createError instanceof Error ? createError.message : 
        (typeof createError === 'object' && createError !== null && 'shortMessage' in createError) 
          ? String(createError.shortMessage) 
          : 'Unknown error';
      setError('Transaction failed: ' + errorMessage);
      setStep('review');
    }
  }, [approveError, createError]);

  const addBeneficiary = () => {
    if (beneficiaries.length >= 10) return;
    setBeneficiaries([...beneficiaries, { name: '', email: '', relationship: '', allocatedPercentage: 0 }]);
  };

  const removeBeneficiary = (index: number) => {
    if (beneficiaries.length <= 1) return;
    setBeneficiaries(beneficiaries.filter((_, i) => i !== index));
  };

  const updateBeneficiary = (index: number, field: keyof Beneficiary, value: string | number) => {
    setBeneficiaries(beneficiaries.map((b, i) => 
      i === index ? { ...b, [field]: value } : b
    ));
  };

  const validateDetails = () => {
    if (!planName || planName.length < 2) return 'Plan name is required (min 2 characters)';
    if (!planDescription || planDescription.length < 10) return 'Description is required (min 10 characters)';
    if (!assetAmount || parseFloat(assetAmount) <= 0) return 'Amount must be greater than 0';
    if (!transferDate) return 'Transfer date is required';
    if (new Date(transferDate) <= new Date()) return 'Transfer date must be in the future';
    
    // Check balance
    if (tokenBalance && totalRequired > (tokenBalance as bigint)) {
      return `Insufficient balance. Required: ${formatUnits(totalRequired, selectedToken.decimals)} ${selectedToken.symbol}`;
    }
    
    return null;
  };

  const validateBeneficiaries = () => {
    for (const ben of beneficiaries) {
      if (!ben.name || ben.name.length < 2) return 'All beneficiary names are required';
      if (!ben.email || !ben.email.includes('@')) return 'All beneficiary emails must be valid';
      if (!ben.relationship) return 'All beneficiary relationships are required';
      if (ben.allocatedPercentage <= 0) return 'All beneficiaries must have an allocation';
    }
    
    const totalPercentage = beneficiaries.reduce((sum, b) => sum + b.allocatedPercentage, 0);
    if (totalPercentage !== 100) return `Total allocation must be 100% (currently ${totalPercentage}%)`;
    
    return null;
  };

  const handleNext = () => {
    setError(null);
    
    if (step === 'details') {
      const error = validateDetails();
      if (error) {
        setError(error);
        return;
      }
      setStep('beneficiaries');
    } else if (step === 'beneficiaries') {
      const error = validateBeneficiaries();
      if (error) {
        setError(error);
        return;
      }
      setStep('review');
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setIsProcessing(true);

    try {
      // Submit to backend first
      const planData: CreatePlanData = {
        planName,
        planDescription,
        assetType: assetType as 'ERC20_TOKEN1' | 'ERC20_TOKEN2' | 'ERC20_TOKEN3',
        assetAmount,
        assetAmountWei: totalRequired.toString(),
        distributionMethod: distributionMethod as 'LUMP_SUM' | 'QUARTERLY' | 'YEARLY' | 'MONTHLY',
        transferDate: new Date(transferDate).toISOString(),
        periodicPercentage: distributionMethod !== 'LUMP_SUM' ? periodicPercentage : undefined,
        beneficiaries: beneficiaries.map(b => ({
          ...b,
          allocatedPercentage: b.allocatedPercentage * 100, // Convert to basis points
        })),
        claimCode: claimCode || undefined,
      };

      const { data, error: apiError } = await api.createPlan(planData);
      
      if (apiError || !data) {
        throw new Error(apiError || 'Failed to create plan');
      }

      // Extend backend ContractData with additional fields needed for contract calls
      // Convert string hashes to 0x${string} format and beneficiaries to ContractBeneficiary format
      const extendedContractData: ContractData = {
        planNameHash: data.contractData.planNameHash as `0x${string}`,
        planDescriptionHash: data.contractData.planDescriptionHash as `0x${string}`,
        claimCodeHash: data.contractData.claimCodeHash as `0x${string}`,
        beneficiaries: data.contractData.beneficiaries.map(b => ({
          nameHash: b.nameHash as `0x${string}`,
          emailHash: b.emailHash as `0x${string}`,
          relationshipHash: b.relationshipHash as `0x${string}`,
          allocatedPercentage: b.allocatedPercentage,
        })),
        assetType: ASSET_TYPE_MAP[assetType] ?? 0,
        assetAmount,
        distributionMethod: DISTRIBUTION_METHOD_MAP[distributionMethod] ?? 0,
        transferDate: new Date(transferDate).toISOString(),
        periodicPercentage: distributionMethod !== 'LUMP_SUM' ? periodicPercentage : undefined,
      };
      setContractData(extendedContractData);
      setBackendPlanId(data.plan.id);
      setClaimCode(data.plan.claimCode || claimCode);

      // Prepare plan creation arguments
      const amount = parseTokenAmount(assetAmount, selectedToken.decimals);
      const transferTimestamp = BigInt(Math.floor(new Date(transferDate).getTime() / 1000));
      const planArgs: PlanArgs = [
        extendedContractData.planNameHash as `0x${string}`,
        extendedContractData.planDescriptionHash as `0x${string}`,
        (extendedContractData.beneficiaries as ContractBeneficiary[]).map((b) => ({
          nameHash: b.nameHash as `0x${string}`,
          emailHash: b.emailHash as `0x${string}`,
          relationshipHash: b.relationshipHash as `0x${string}`,
          allocatedPercentage: BigInt(b.allocatedPercentage),
        })) as readonly {
          nameHash: `0x${string}`;
          emailHash: `0x${string}`;
          relationshipHash: `0x${string}`;
          allocatedPercentage: bigint;
        }[],
        ASSET_TYPE_MAP[assetType],
        amount,
        DISTRIBUTION_METHOD_MAP[distributionMethod],
        transferTimestamp,
        distributionMethod !== 'LUMP_SUM' ? periodicPercentage : 0,
        extendedContractData.claimCodeHash as `0x${string}`,
      ];

      // Check if we need approval
      if (needsApproval) {
        // Store plan args and proceed to approval step
        setPendingPlanArgs(planArgs as PlanArgs);
        setStep('approve');
      } else {
        // Approval already sufficient, create plan directly
        setStep('create');
        // Auto-trigger creation after a short delay
        setTimeout(() => {
          writeCreatePlan({
            address: INHERITX_CONTRACT_ADDRESS,
            abi: inheritXABI,
            functionName: 'createInheritancePlan',
            args: planArgs as PlanArgs,
          });
        }, 500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create plan');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApprove = () => {
    // Approve exactly the amount needed (plan amount + 5% creation fee)
    const approvalAmount = totalRequired;
    
    console.log('Approving tokens:', {
      approvalAmount: approvalAmount.toString(),
      approvalAmountFormatted: formatUnits(approvalAmount, selectedToken.decimals),
      tokenSymbol: selectedToken.symbol,
      planAmount: assetAmount,
      totalRequired: formatUnits(totalRequired, selectedToken.decimals),
    });
    
    writeApprove({
      address: selectedToken.address,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [INHERITX_CONTRACT_ADDRESS, approvalAmount],
    });
  };

  // handleCreatePlan is no longer needed - creation is triggered directly with planArgs

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="modal max-w-2xl"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <h2 className="text-xl font-bold">Create Inheritance Plan</h2>
          <button onClick={onClose} className="btn btn-icon btn-ghost">
            <FiX size={20} />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            {['details', 'beneficiaries', 'review', 'approve', 'create'].map((s, i) => {
              const steps: Step[] = ['details', 'beneficiaries', 'review', 'approve', 'create'];
              const stepLabels = ['Details', 'Beneficiaries', 'Review', 'Approve', 'Create'];
              const currentIndex = steps.indexOf(step);
              const stepIndex = i;
              const isActive = stepIndex === currentIndex;
              const isCompleted = stepIndex < currentIndex;
              
              if (s === 'approve' && !needsApproval && !approveSuccess) return null;
              
              return (
                <div key={s} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                      isCompleted ? 'bg-green-500 text-white' :
                      isActive ? 'bg-primary text-[#0D1A1E]' :
                      'bg-[#1A2028] text-gray-500 border border-white/10'
                    }`}>
                      {isCompleted ? <FiCheck size={14} /> : stepIndex + 1}
                    </div>
                    <span className={`text-xs mt-1.5 font-medium ${
                      isActive ? 'text-primary' : 
                      isCompleted ? 'text-green-400' : 
                      'text-gray-500'
                    }`}>
                      {stepLabels[i]}
                    </span>
                  </div>
                  {i < 4 && (
                    <div className={`w-12 h-0.5 mx-2 mb-5 ${
                      isCompleted ? 'bg-green-500' : 'bg-white/10'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="modal-body max-h-[60vh] overflow-y-auto">
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-4">
              <FiAlertCircle className="text-red-500 shrink-0" size={18} />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}

          {/* Step 1: Details */}
          {step === 'details' && (
            <div className="space-y-4">
              <div className="input-group">
                <label className="input-label">Plan Name *</label>
                <input
                  type="text"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  className="input"
                  placeholder="e.g., Family Inheritance Plan"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Description *</label>
                <textarea
                  value={planDescription}
                  onChange={(e) => setPlanDescription(e.target.value)}
                  className="input"
                  placeholder="Describe your inheritance plan..."
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="input-group">
                  <label className="input-label">Asset *</label>
                  <select
                    value={assetType}
                    onChange={(e) => setAssetType(e.target.value)}
                    className="input"
                  >
                    {TOKENS.map((token) => (
                      <option key={token.id} value={token.id}>
                        {token.name} ({token.symbol})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Amount *</label>
                  <input
                    type="number"
                    value={assetAmount}
                    onChange={(e) => setAssetAmount(e.target.value)}
                    className="input"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                  {tokenBalance !== undefined && (
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      Balance: {formatUnits(tokenBalance as bigint, selectedToken.decimals)} {selectedToken.symbol}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="input-group">
                  <label className="input-label">Distribution Method *</label>
                  <select
                    value={distributionMethod}
                    onChange={(e) => setDistributionMethod(e.target.value)}
                    className="input"
                  >
                    {DISTRIBUTION_METHODS.map((method) => (
                      <option key={method.id} value={method.id}>
                        {method.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {DISTRIBUTION_METHODS.find(m => m.id === distributionMethod)?.description}
                  </p>
                </div>

                <div className="input-group">
                  <label className="input-label">Transfer Date *</label>
                  <input
                    type="date"
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                    className="input"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              {distributionMethod !== 'LUMP_SUM' && (
                <div className="input-group">
                  <label className="input-label">Periodic Percentage *</label>
                  <select
                    value={periodicPercentage}
                    onChange={(e) => setPeriodicPercentage(parseInt(e.target.value))}
                    className="input"
                  >
                    <option value={10}>10% per period (10 periods)</option>
                    <option value={20}>20% per period (5 periods)</option>
                    <option value={25}>25% per period (4 periods)</option>
                    <option value={50}>50% per period (2 periods)</option>
                  </select>
                </div>
              )}

              <div className="input-group">
                <label className="input-label">Claim Code (Optional)</label>
                <input
                  type="text"
                  value={claimCode}
                  onChange={(e) => setClaimCode(e.target.value.toUpperCase())}
                  className="input"
                  placeholder="Leave empty to auto-generate"
                  maxLength={6}
                />
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  6-character code for beneficiaries to claim their inheritance
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Beneficiaries */}
          {step === 'beneficiaries' && (
            <div className="space-y-4">
              <p className="text-sm text-[var(--text-secondary)]">
                Add up to 10 beneficiaries. Total allocation must equal 100%.
              </p>

              {beneficiaries.map((ben, index) => (
                <div key={index} className="card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Beneficiary {index + 1}</span>
                    {beneficiaries.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeBeneficiary(index)}
                        className="btn btn-icon btn-ghost text-[var(--accent-red)]"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                      type="text"
                      value={ben.name}
                      onChange={(e) => updateBeneficiary(index, 'name', e.target.value)}
                      className="input"
                      placeholder="Full Name"
                    />
                    <input
                      type="email"
                      value={ben.email}
                      onChange={(e) => updateBeneficiary(index, 'email', e.target.value)}
                      className="input"
                      placeholder="Email"
                    />
                    <input
                      type="text"
                      value={ben.relationship}
                      onChange={(e) => updateBeneficiary(index, 'relationship', e.target.value)}
                      className="input"
                      placeholder="Relationship (e.g., Son, Daughter)"
                    />
                    <div className="relative">
                      <input
                        type="number"
                        value={ben.allocatedPercentage}
                        onChange={(e) => updateBeneficiary(index, 'allocatedPercentage', parseInt(e.target.value) || 0)}
                        className="input pr-8"
                        placeholder="Allocation %"
                        min={1}
                        max={100}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">%</span>
                    </div>
                  </div>
                </div>
              ))}

              {beneficiaries.length < 10 && (
                <button
                  type="button"
                  onClick={addBeneficiary}
                  className="btn btn-secondary w-full"
                >
                  <FiPlus size={16} />
                  Add Beneficiary
                </button>
              )}

              <div className="flex items-center justify-between p-3 bg-[var(--bg-elevated)] rounded-lg">
                <span className="font-medium">Total Allocation</span>
                <span className={`font-bold ${
                  beneficiaries.reduce((sum, b) => sum + b.allocatedPercentage, 0) === 100
                    ? 'text-[var(--accent-green)]'
                    : 'text-[var(--accent-red)]'
                }`}>
                  {beneficiaries.reduce((sum, b) => sum + b.allocatedPercentage, 0)}%
                </span>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 'review' && (
            <div className="space-y-4">
              <div className="card bg-[var(--bg-deep)] p-4 space-y-3">
                <h3 className="font-semibold">Plan Details</h3>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Name</span>
                    <span>{planName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Amount</span>
                    <span>{assetAmount} {selectedToken.symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Distribution</span>
                    <span>{distributionMethod.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Transfer Date</span>
                    <span>{new Date(transferDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Fees (5%)</span>
                    <span>{formatUnits((totalRequired - parseTokenAmount(assetAmount, selectedToken.decimals)), selectedToken.decimals)} {selectedToken.symbol}</span>
                  </div>
                  <div className="flex justify-between font-medium pt-2">
                    <span>Total Required</span>
                    <span>{formatUnits(totalRequired, selectedToken.decimals)} {selectedToken.symbol}</span>
                  </div>
                </div>
              </div>

              <div className="card bg-[var(--bg-deep)] p-4 space-y-3">
                <h3 className="font-semibold">Beneficiaries ({beneficiaries.length})</h3>
                {beneficiaries.map((ben, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{ben.name} ({ben.relationship})</span>
                    <span className="font-medium">{ben.allocatedPercentage}%</span>
                  </div>
                ))}
              </div>

              <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <FiAlertCircle className="text-blue-400 shrink-0 mt-0.5" size={18} />
                <div className="text-sm text-blue-300">
                  By creating this plan, you agree to lock your tokens in escrow until the transfer date.
                  The claim code will be generated and sent to beneficiaries.
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Approve */}
          {step === 'approve' && (
            <div className="text-center py-8">
              {isApprovePending || isApproveWaiting || pendingPlanArgs ? (
                <>
                  <FiLoader className="animate-spin mx-auto text-[var(--primary)]" size={48} />
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
                    disabled={!address}
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

          {/* Step 5: Create */}
          {step === 'create' && (
            <div className="text-center py-8">
              {isCreatePending || isCreateWaiting ? (
                <>
                  <FiLoader className="animate-spin mx-auto text-[var(--primary)]" size={48} />
                  <h3 className="text-lg font-semibold mt-4">Creating Plan...</h3>
                  <p className="text-[var(--text-secondary)] mt-2">
                    {isCreateWaiting ? 'Confirming transaction...' : 'Please confirm the creation transaction in your wallet'}
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
              ) : createSuccess ? (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--accent-green)]/20 flex items-center justify-center">
                    <FiCheck className="text-[var(--accent-green)]" size={32} />
                  </div>
                  <h3 className="text-lg font-semibold">Plan Created!</h3>
                  <p className="text-[var(--text-secondary)] mt-2 mb-4">
                    Your inheritance plan has been created successfully.
                  </p>
                  {claimCode && (
                    <div className="card bg-[var(--bg-deep)] p-4 mb-6">
                      <p className="text-sm text-[var(--text-muted)] mb-2">Claim Code</p>
                      <p className="text-2xl font-mono font-bold text-[var(--primary)]">{claimCode}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-2">
                        Save this code! Beneficiaries will need it to claim.
                      </p>
                    </div>
                  )}
                  <button onClick={onSuccess} className="btn btn-primary">
                    Done
                  </button>
                </>
              ) : pendingPlanArgs ? (
                <>
                  <FiLoader className="animate-spin mx-auto text-[var(--primary)]" size={48} />
                  <h3 className="text-lg font-semibold mt-4">Verifying Approval...</h3>
                  <p className="text-[var(--text-secondary)] mt-2">
                    Checking token allowance before creating plan
                  </p>
                </>
              ) : (
                <>
                  <FiLoader className="animate-spin mx-auto text-[var(--primary)]" size={48} />
                  <h3 className="text-lg font-semibold mt-4">Preparing Creation...</h3>
                  <p className="text-[var(--text-secondary)] mt-2">
                    Setting up plan creation transaction
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {['details', 'beneficiaries', 'review'].includes(step) && (
          <div className="modal-footer">
            {step !== 'details' && (
              <button
                type="button"
                onClick={() => setStep(step === 'review' ? 'beneficiaries' : 'details')}
                className="btn btn-secondary"
              >
                Back
              </button>
            )}
            
            {step === 'review' ? (
              <button
                onClick={handleSubmit}
                disabled={isProcessing}
                className="btn btn-primary"
              >
                {isProcessing ? (
                  <>
                    <FiLoader className="animate-spin" size={16} />
                    Processing...
                  </>
                ) : (
                  'Create Plan'
                )}
              </button>
            ) : (
              <button onClick={handleNext} className="btn btn-primary">
                Next
              </button>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
