'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  FiArrowLeft,
  FiCopy,
  FiExternalLink,
  FiPause,
  FiPlay,
  FiTrash2,
  FiCalendar,
  FiUsers,
  FiDollarSign,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
} from 'react-icons/fi';
import { api, Plan } from '@/lib/api';
import {
  formatDate,
  getPlanStatusBadge,
  getTokenByAssetType,
  formatTokenAmount,

} from '@/lib/contract';
import Link from 'next/link';

export default function PlanDetailsPage() {
  const params = useParams();
  const planId = params.id as string;

  const [plan, setPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [claimCode, setClaimCode] = useState<string | null>(null);

  useEffect(() => {
    fetchPlan();
  }, [planId]);

  const fetchPlan = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: apiError } = await api.getPlan(planId);
      if (apiError || !data) {
        throw new Error(apiError || 'Failed to load plan');
      }
      setPlan(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load plan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: 'ACTIVE' | 'PAUSED' | 'CANCELLED') => {
    if (!plan) return;

    setIsUpdating(true);
    try {
      const { data, error: apiError } = await api.updatePlanStatus(plan.id, newStatus);
      if (apiError || !data) {
        throw new Error(apiError || 'Failed to update plan status');
      }
      setPlan({ ...plan, status: newStatus });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update plan status');
    } finally {
      setIsUpdating(false);
    }
  };

  const copyClaimCode = async () => {
    if (!plan) return;
    try {
      const { data, error: apiError } = await api.getClaimCode(plan.id);
      if (data?.claimCode) {
        setClaimCode(data.claimCode);
        await navigator.clipboard.writeText(data.claimCode);
        alert('Claim code copied to clipboard!');
      }
    } catch (err) {
      setError('Failed to retrieve claim code');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-32" />
        <div className="card p-6">
          <div className="skeleton h-6 w-3/4 mb-4" />
          <div className="skeleton h-4 w-full mb-2" />
          <div className="skeleton h-4 w-1/2" />
        </div>
      </div>
    );
  }

  if (error && !plan) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard/plans" className="btn btn-secondary inline-flex items-center gap-2">
          <FiArrowLeft size={16} />
          Back to Plans
        </Link>
        <div className="card p-6 text-center">
          <FiAlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h3 className="text-lg font-semibold mb-2">Error Loading Plan</h3>
          <p className="text-[var(--text-secondary)] mb-4">{error}</p>
          <button onClick={fetchPlan} className="btn btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!plan) {
    return null;
  }

  const statusBadge = getPlanStatusBadge(plan.status);
  const token = getTokenByAssetType(plan.assetType);
  const creationFee = plan.assetAmountWei
    ? (BigInt(plan.assetAmountWei) * BigInt(500)) / BigInt(10000)
    : BigInt(0);
  const totalAmount = plan.assetAmountWei
    ? BigInt(plan.assetAmountWei) + creationFee
    : BigInt(0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/plans" className="btn btn-icon btn-primary">
            <FiArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{plan.planName}</h1>
            <p className="text-[var(--text-secondary)] text-sm mt-1">
              Created {formatDate(plan.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`badge ${statusBadge.variant}`}>
            {statusBadge.label}
          </span>
          {plan.txHash && (
            <a
              href={`https://sepolia-blockscout.lisk.com/tx/${plan.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-icon btn-ghost"
              title="View on Explorer"
            >
              <FiExternalLink size={18} />
            </a>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <FiAlertCircle className="text-red-500 shrink-0" size={18} />
          <span className="text-red-400 text-sm">{error}</span>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Plan Overview */}
        <motion.div
          className="card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FiDollarSign size={20} />
            Plan Overview
          </h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)]">Description</label>
              <p className="mt-1 text-sm">{plan.planDescription}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/10">
              <div>
                <label className="text-xs font-medium text-[var(--text-muted)]">Asset Type</label>
                <p className="mt-1 font-medium">{token?.name || plan.assetType}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--text-muted)]">Amount</label>
                <p className="mt-1 font-medium">
                  {plan.assetAmount} {token?.symbol}
                </p>
              </div>
            </div>
            {plan.assetAmountWei && (
              <div className="pt-3 border-t border-white/10">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-muted)]">Creation Fee (5%)</span>
                  <span>{formatTokenAmount(creationFee.toString(), token?.decimals || 18)} {token?.symbol}</span>
                </div>
                <div className="flex justify-between text-sm font-medium mt-2 pt-2 border-t border-white/10">
                  <span>Total Locked</span>
                  <span>{formatTokenAmount(totalAmount.toString(), token?.decimals || 18)} {token?.symbol}</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Distribution Details */}
        <motion.div
          className="card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FiCalendar size={20} />
            Distribution Details
          </h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)]">Method</label>
              <p className="mt-1 font-medium">
                {plan.distributionMethod.replace('_', ' ')}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)]">Transfer Date</label>
              <p className="mt-1 font-medium flex items-center gap-2">
                <FiClock size={14} />
                {formatDate(plan.transferDate)}
              </p>
            </div>
            {plan.periodicPercentage && (
              <div>
                <label className="text-xs font-medium text-[var(--text-muted)]">Periodic Percentage</label>
                <p className="mt-1 font-medium">{plan.periodicPercentage}% per period</p>
              </div>
            )}
            {plan.globalPlanId && (
              <div className="pt-3 border-t border-white/10">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-xs font-medium text-[var(--text-muted)]">Global Plan ID</label>
                    <p className="mt-1 font-mono">{plan.globalPlanId}</p>
                  </div>
                  {plan.userPlanId && (
                    <div>
                      <label className="text-xs font-medium text-[var(--text-muted)]">User Plan ID</label>
                      <p className="mt-1 font-mono">{plan.userPlanId}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Beneficiaries */}
        <motion.div
          className="card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FiUsers size={20} />
            Beneficiaries ({plan.beneficiaries.length})
          </h2>
          <div className="space-y-3">
            {plan.beneficiaries.map((ben, index) => (
              <div
                key={ben.id}
                className="p-3 bg-[var(--bg-deep)] rounded-lg border border-white/10"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-[var(--accent-purple)] flex items-center justify-center text-xs font-semibold text-white">
                        {ben.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{ben.name}</p>
                        <p className="text-xs text-[var(--text-muted)]">{ben.email}</p>
                      </div>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-2">
                      Relationship: {ben.relationship}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary">
                      {(ben.allocatedPercentage / 100).toFixed(1)}%
                    </p>
                    {plan.assetAmountWei && (
                      <p className="text-xs text-[var(--text-muted)]">
                        {formatTokenAmount(
                          ((BigInt(plan.assetAmountWei) * BigInt(ben.allocatedPercentage)) / BigInt(10000)).toString(),
                          token?.decimals || 18
                        )} {token?.symbol}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-[var(--text-muted)]">Claim Status</span>
                  {ben.hasClaimed ? (
                    <span className="flex items-center gap-1 text-green-400">
                      <FiCheckCircle size={14} />
                      Claimed
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[var(--text-muted)]">
                      <FiClock size={14} />
                      Pending
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Actions & Information */}
        <motion.div
          className="card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-lg font-semibold mb-4">Actions</h2>
          <div className="space-y-3">
            {/* Claim Code */}
            <div className="p-4 bg-[var(--bg-deep)] rounded-lg border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Claim Code</label>
                <button
                  onClick={copyClaimCode}
                  className="btn btn-icon btn-ghost btn-sm"
                  title="Copy Claim Code"
                >
                  <FiCopy size={16} />
                </button>
              </div>
              {claimCode ? (
                <p className="font-mono text-lg font-bold text-primary">{claimCode}</p>
              ) : (
                <p className="text-sm text-[var(--text-muted)]">Click to reveal claim code</p>
              )}
            </div>

            {/* Distribution Schedule */}
            {plan.distributions && plan.distributions.length > 0 && (
              <div className="pt-4 border-t border-white/10">
                <h3 className="text-sm font-semibold mb-3">Distribution Schedule</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {plan.distributions.map((dist) => (
                    <div
                      key={dist.periodNumber}
                      className="flex items-center justify-between p-2 bg-[var(--bg-deep)] rounded text-xs"
                    >
                      <div>
                        <span className="font-medium">Period {dist.periodNumber}</span>
                        <span className="text-[var(--text-muted)] ml-2">
                          {formatDate(dist.scheduledDate)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {formatTokenAmount(dist.amount, token?.decimals || 18)} {token?.symbol}
                        </span>
                        {dist.status === 'EXECUTED' ? (
                          <FiCheckCircle className="text-green-400" size={14} />
                        ) : (
                          <FiClock className="text-[var(--text-muted)]" size={14} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
