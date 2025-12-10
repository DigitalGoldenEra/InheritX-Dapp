'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import {
  FiArrowLeft,
  FiCheck,
  FiClock,
  FiAlertCircle,
  FiLock,
  FiGift,
  FiLoader
} from 'react-icons/fi';
import { api, ClaimPlanInfo, VerifyClaimResponse } from '@/lib/api';
import { inheritXABI } from '@/contract/abi';
import { INHERITX_CONTRACT_ADDRESS, formatDate, getTimeUntil, getTokenByAssetType, formatTokenAmount } from '@/lib/contract';

export default function ClaimPage() {
  const params = useParams();
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const planId = params.planId as string;

  const [plan, setPlan] = useState<ClaimPlanInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'info' | 'verify' | 'claim' | 'success'>('info');

  // Form state
  const [claimCode, setClaimCode] = useState('');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [beneficiaryEmail, setBeneficiaryEmail] = useState('');
  const [beneficiaryRelationship, setBeneficiaryRelationship] = useState('');

  // Verification response
  const [verificationData, setVerificationData] = useState<VerifyClaimResponse | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Contract interaction
  const {
    writeContractAsync,
    data: txHash,
    isPending: isClaimPending,
    error: claimError
  } = useWriteContract();

  // ... (keep existing useEffects, but maybe they become redundant for error, but good to keep as backup)

  const { isLoading: isClaimWaiting, isSuccess: claimSuccess } = useWaitForTransactionReceipt({
    hash: txHash
  });

  // Fetch plan info
  useEffect(() => {
    const fetchPlan = async () => {
      setIsLoading(true);
      setError(null);

      if (!planId || isNaN(parseInt(planId))) {
        setError('Invalid Plan ID');
        setIsLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await api.getPlanForClaim(parseInt(planId));

        if (fetchError || !data) {
          setError(fetchError || 'Plan not found. Please check the link and try again.');
          return;
        }

        setPlan(data);
      } catch (err) {
        setError('Failed to load plan information');
      } finally {
        setIsLoading(false);
      }
    };

    if (planId) {
      fetchPlan();
    }
  }, [planId]);

  // Handle claim success
  useEffect(() => {
    if (claimSuccess && verificationData && address) {
      // Update backend
      api.completeClaim({
        planId: verificationData.planId,
        beneficiaryIndex: verificationData.beneficiaryIndex,
        claimerAddress: address,
        txHash: txHash!,
        claimedAmount: verificationData.allocatedAmount,
      }).then(() => {
        setStep('success');
      });
    }
  }, [claimSuccess, verificationData, txHash, address]);

  // Handle claim error
  useEffect(() => {
    if (claimError) {
      setError('Claim transaction failed: ' + (claimError as any)?.shortMessage || 'Unknown error');
    }
  }, [claimError]);

  const handleVerify = async () => {
    setError(null);
    setIsVerifying(true);

    try {
      if (!claimCode || claimCode.length !== 6) {
        throw new Error('Please enter a valid 6-character claim code');
      }
      if (!beneficiaryName) throw new Error('Please enter your name');
      if (!beneficiaryEmail) throw new Error('Please enter your email');
      if (!beneficiaryRelationship) throw new Error('Please enter your relationship');

      const { data, error: verifyError } = await api.verifyClaim({
        planId: parseInt(planId),
        claimCode,
        beneficiaryName,
        beneficiaryEmail,
        beneficiaryRelationship,
      });

      if (verifyError || !data) {
        throw new Error(verifyError || 'Verification failed');
      }

      setVerificationData(data);
      setStep('claim');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClaim = async () => {
    if (!verificationData) return;
    setError(null);

    try {
      await writeContractAsync({
        address: INHERITX_CONTRACT_ADDRESS,
        abi: inheritXABI,
        functionName: 'claimInheritance',
        args: [
          BigInt(verificationData.contractCallData.planId),
          claimCode,
          beneficiaryName,
          beneficiaryEmail,
          beneficiaryRelationship,
          BigInt(verificationData.contractCallData.beneficiaryIndex),
        ],
      });
    } catch (err: any) {
      console.error('Claim error:', err);
      // Try to extract a readable message
      const message = err.shortMessage || err.message || 'Transaction failed';
      setError(`Claim failed: ${message}`);
    }
  };

  const timeUntil = plan ? getTimeUntil(plan.transferDate) : null;
  const token = plan ? getTokenByAssetType(plan.assetType) : null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto" />
          <p className="mt-4 text-[var(--text-secondary)]">Loading plan information...</p>
        </div>
      </div>
    );
  }

  if (error && !plan) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--accent-red)]/20 flex items-center justify-center">
            <FiAlertCircle className="text-[var(--accent-red)]" size={32} />
          </div>
          <h1 className="text-xl font-bold mb-2">Plan Not Found</h1>
          <p className="text-[var(--text-secondary)] mb-6">{error}</p>
          <Link href="/claim" className="btn btn-primary">
            <FiArrowLeft size={16} />
            Try Another Plan
          </Link>
          <Link href="/" className="btn btn-ghost mt-2">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <nav className="border-b border-white/5 bg-[#0D1A1E]/20 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 group">
              <img src="/img/logo.svg" alt="InheritX" className="w-10 h-10" />
              <span className="text-lg font-bold text-[#E2E8F0]">InheritX</span>
            </Link>

            <ConnectButton />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto p-4 py-12">
        <Link href="/claim" className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--primary)] mb-6">
          <FiArrowLeft size={16} />
          Back to search
        </Link>

        {/* Plan Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6 mb-6"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold">{plan?.planName}</h1>
              <p className="text-[var(--text-secondary)]">{plan?.planDescription}</p>
            </div>
            <span className={`badge ${plan?.isClaimable ? 'badge-success' : 'badge-warning'}`}>
              {plan?.isClaimable ? 'Claimable' : 'Pending'}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 text-sm">
            <div className="card bg-[var(--bg-deep)] p-3">
              <div className="text-[var(--text-muted)] mb-1">Total Amount</div>
              <div className="font-semibold">{plan?.assetAmount} {token?.symbol}</div>
            </div>
            <div className="card bg-[var(--bg-deep)] p-3">
              <div className="text-[var(--text-muted)] mb-1">Distribution</div>
              <div className="font-semibold">{plan?.distributionMethod.replace('_', ' ')}</div>
            </div>
            <div className="card bg-[var(--bg-deep)] p-3">
              <div className="text-[var(--text-muted)] mb-1">Transfer Date</div>
              <div className="font-semibold">{plan && formatDate(plan.transferDate)}</div>
            </div>
          </div>

          {!plan?.isClaimable && timeUntil && (
            <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
              <div className="flex items-center gap-2 text-yellow-500">
                <FiClock size={18} />
                <span className="font-medium">Claim available in:</span>
              </div>
              <div className="mt-2 flex gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{timeUntil.days}</div>
                  <div className="text-xs text-[var(--text-muted)]">Days</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{timeUntil.hours}</div>
                  <div className="text-xs text-[var(--text-muted)]">Hours</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{timeUntil.minutes}</div>
                  <div className="text-xs text-[var(--text-muted)]">Minutes</div>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Claim Flow */}
        {!isConnected ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-8 text-center"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--primary-muted)] flex items-center justify-center">
              <FiLock className="text-[var(--primary)]" size={32} />
            </div>
            <h2 className="text-xl font-bold mb-2">Connect Your Wallet</h2>
            <p className="text-[var(--text-secondary)] mb-6">
              Connect your wallet to claim your inheritance.
            </p>
            <ConnectButton />
          </motion.div>
        ) : step === 'success' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-8 text-center"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--accent-green)]/20 flex items-center justify-center">
              <FiCheck className="text-[var(--accent-green)]" size={40} />
            </div>
            <h2 className="text-2xl font-bold mb-2">Claim Successful!</h2>
            <p className="text-[var(--text-secondary)] mb-6">
              Your inheritance has been transferred to your wallet.
            </p>
            <div className="card bg-[var(--bg-deep)] p-4 mb-6">
              <div className="text-sm text-[var(--text-muted)] mb-1">Amount Received</div>
              <div className="text-2xl font-bold text-[var(--primary)]">
                {verificationData?.allocatedAmount} {token?.symbol}
              </div>
            </div>
            <Link href="/" className="btn btn-primary">
              Done
            </Link>
          </motion.div>
        ) : step === 'claim' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--accent-green)]/20 flex items-center justify-center">
                <FiGift className="text-[var(--accent-green)]" size={32} />
              </div>
              <h2 className="text-xl font-bold">Verification Successful!</h2>
              <p className="text-[var(--text-secondary)]">
                You&apos;re eligible to claim your inheritance.
              </p>
            </div>

            <div className="card bg-[var(--bg-deep)] p-4 mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-[var(--text-muted)]">Your Allocation</span>
                <span className="font-bold text-[var(--primary)]">
                  {verificationData && formatTokenAmount(verificationData.allocatedAmount, token?.decimals || 18)} {token?.symbol}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Receiving Address</span>
                <span className="font-mono text-sm">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
              </div>
            </div>

            {error && (
              <div className="alert alert-error mb-4">
                <FiAlertCircle size={18} />
                {error}
              </div>
            )}

            <button
              onClick={handleClaim}
              disabled={isClaimPending || isClaimWaiting}
              className="btn btn-primary w-full"
            >
              {isClaimPending || isClaimWaiting ? (
                <>
                  <FiLoader className="animate-spin" size={18} />
                  {isClaimWaiting ? 'Confirming...' : 'Claiming...'}
                </>
              ) : (
                <>
                  <FiGift size={18} />
                  Claim Inheritance
                </>
              )}
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6"
          >
            <h2 className="text-xl font-bold mb-2">Verify Your Identity</h2>
            <p className="text-[var(--text-secondary)] mb-6">
              Enter your details to verify your claim eligibility.
            </p>

            {error && (
              <div className="bg-red-500/10! flex gap-2 items-center border border-red-500/20! p-4 rounded-lg mb-4">
                <FiAlertCircle size={18} />
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="input-group">
                <label className="input-label">Claim Code *</label>
                <input
                  type="text"
                  value={claimCode}
                  onChange={(e) => setClaimCode(e.target.value.toUpperCase())}
                  className="input text-xl tracking-wider"
                  placeholder="XXXXXX"
                  maxLength={6}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Your Full Name *</label>
                <input
                  type="text"
                  value={beneficiaryName}
                  onChange={(e) => setBeneficiaryName(e.target.value)}
                  className="input"
                  placeholder="As registered in the plan"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Your Email *</label>
                <input
                  type="email"
                  value={beneficiaryEmail}
                  onChange={(e) => setBeneficiaryEmail(e.target.value)}
                  className="input"
                  placeholder="your@email.com"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Relationship to Plan Creator *</label>
                <input
                  type="text"
                  value={beneficiaryRelationship}
                  onChange={(e) => setBeneficiaryRelationship(e.target.value)}
                  className="input"
                  placeholder="e.g., Son, Daughter, Spouse"
                />
              </div>

              <button
                onClick={handleVerify}
                disabled={isVerifying || !plan?.isClaimable}
                className="btn btn-primary w-full"
              >
                {isVerifying ? (
                  <>
                    <FiLoader className="animate-spin" size={18} />
                    Verifying...
                  </>
                ) : !plan?.isClaimable ? (
                  <>
                    <FiClock size={18} />
                    Not Yet Claimable
                  </>
                ) : (
                  <>
                    <FiCheck size={18} />
                    Verify & Continue
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
