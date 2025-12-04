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
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { api, CreatePlanData } from '@/lib/api';
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

type Step = 'details' | 'beneficiaries' | 'review' | 'approve' | 'create';

export default function CreatePlanModal({ onClose, onSuccess }: CreatePlanModalProps) {
  const { address } = useAccount();
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
  const [contractData, setContractData] = useState<any>(null);
  const [backendPlanId, setBackendPlanId] = useState<string | null>(null);

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
  
  const { isLoading: isCreateWaiting, isSuccess: createSuccess } = useWaitForTransactionReceipt({ 
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
  const needsApproval = currentAllowance !== undefined && totalRequired > (currentAllowance as bigint);

  // Handle approval success
  useEffect(() => {
    if (approveSuccess) {
      refetchAllowance();
      setStep('create');
    }
  }, [approveSuccess, refetchAllowance]);

  // Handle create success
  useEffect(() => {
    if (createSuccess && createTxHash && backendPlanId) {
      // Update backend with transaction hash
      // In a real app, we'd parse the event logs to get the plan IDs
      api.updatePlanContract(backendPlanId, {
        globalPlanId: 1, // Would get from event
        userPlanId: 1,   // Would get from event
        txHash: createTxHash,
      }).then(() => {
        onSuccess();
      });
    }
  }, [createSuccess, createTxHash, backendPlanId, onSuccess]);

  // Handle errors
  useEffect(() => {
    if (approveError) {
      setError('Approval failed: ' + (approveError as any)?.shortMessage || 'Unknown error');
      setStep('review');
    }
    if (createError) {
      setError('Transaction failed: ' + (createError as any)?.shortMessage || 'Unknown error');
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
        assetType: assetType as any,
        assetAmount,
        assetAmountWei: totalRequired.toString(),
        distributionMethod: distributionMethod as any,
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

      setContractData(data.contractData);
      setBackendPlanId(data.plan.id);
      setClaimCode(data.plan.claimCode || claimCode);

      // Check if we need approval
      if (needsApproval) {
        setStep('approve');
      } else {
        setStep('create');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create plan');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApprove = () => {
    const amount = parseTokenAmount(assetAmount, selectedToken.decimals);
    const approvalAmount = amount * BigInt(2); // Approve 2x for safety
    
    writeApprove({
      address: selectedToken.address,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [INHERITX_CONTRACT_ADDRESS, approvalAmount],
    });
  };

  const handleCreatePlan = () => {
    if (!contractData) return;

    const amount = parseTokenAmount(assetAmount, selectedToken.decimals);
    const transferTimestamp = BigInt(Math.floor(new Date(transferDate).getTime() / 1000));

    writeCreatePlan({
      address: INHERITX_CONTRACT_ADDRESS,
      abi: inheritXABI,
      functionName: 'createInheritancePlan',
      args: [
        contractData.planNameHash as `0x${string}`,
        contractData.planDescriptionHash as `0x${string}`,
        contractData.beneficiaries.map((b: any) => ({
          nameHash: b.nameHash as `0x${string}`,
          emailHash: b.emailHash as `0x${string}`,
          relationshipHash: b.relationshipHash as `0x${string}`,
          allocatedPercentage: BigInt(b.allocatedPercentage),
        })),
        ASSET_TYPE_MAP[assetType],
        amount,
        DISTRIBUTION_METHOD_MAP[distributionMethod],
        transferTimestamp,
        distributionMethod !== 'LUMP_SUM' ? periodicPercentage : 0,
        contractData.claimCodeHash as `0x${string}`,
      ],
    });
  };

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
        <div className="px-6 py-3 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            {['details', 'beneficiaries', 'review', 'approve', 'create'].map((s, i) => {
              const steps: Step[] = ['details', 'beneficiaries', 'review', 'approve', 'create'];
              const currentIndex = steps.indexOf(step);
              const stepIndex = i;
              const isActive = stepIndex === currentIndex;
              const isCompleted = stepIndex < currentIndex;
              
              if (s === 'approve' && !needsApproval && !approveSuccess) return null;
              
              return (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    isCompleted ? 'bg-[var(--accent-green)] text-white' :
                    isActive ? 'bg-[var(--primary)] text-[var(--bg-void)]' :
                    'bg-[var(--bg-elevated)] text-[var(--text-muted)]'
                  }`}>
                    {isCompleted ? <FiCheck size={12} /> : stepIndex + 1}
                  </div>
                  {i < 4 && <div className={`w-8 h-0.5 ${isCompleted ? 'bg-[var(--accent-green)]' : 'bg-[var(--bg-elevated)]'}`} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="modal-body max-h-[60vh] overflow-y-auto">
          {error && (
            <div className="alert alert-error mb-4">
              <FiAlertCircle size={18} />
              {error}
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
                  <div className="flex justify-between font-medium pt-2 border-t border-[var(--border-subtle)]">
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

              <div className="alert alert-info">
                <FiAlertCircle size={18} />
                <div className="text-sm">
                  By creating this plan, you agree to lock your tokens in escrow until the transfer date.
                  The claim code will be generated and sent to beneficiaries.
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Approve */}
          {step === 'approve' && (
            <div className="text-center py-8">
              {isApprovePending || isApproveWaiting ? (
                <>
                  <FiLoader className="animate-spin mx-auto text-[var(--primary)]" size={48} />
                  <h3 className="text-lg font-semibold mt-4">Approving Token...</h3>
                  <p className="text-[var(--text-secondary)] mt-2">
                    Please confirm the transaction in your wallet
                  </p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--primary-muted)] flex items-center justify-center">
                    <FiCheck className="text-[var(--primary)]" size={32} />
                  </div>
                  <h3 className="text-lg font-semibold">Approve Token Spending</h3>
                  <p className="text-[var(--text-secondary)] mt-2 mb-6">
                    Allow InheritX to use your {selectedToken.symbol} tokens
                  </p>
                  <button onClick={handleApprove} className="btn btn-primary">
                    Approve {selectedToken.symbol}
                  </button>
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
                    {isCreateWaiting ? 'Confirming transaction...' : 'Please confirm the transaction in your wallet'}
                  </p>
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
              ) : (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--primary-muted)] flex items-center justify-center">
                    <FiCheck className="text-[var(--primary)]" size={32} />
                  </div>
                  <h3 className="text-lg font-semibold">Create Plan</h3>
                  <p className="text-[var(--text-secondary)] mt-2 mb-6">
                    Sign the transaction to create your inheritance plan
                  </p>
                  <button onClick={handleCreatePlan} className="btn btn-primary">
                    Create Plan
                  </button>
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
