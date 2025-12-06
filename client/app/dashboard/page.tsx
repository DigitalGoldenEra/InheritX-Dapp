'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  FiFileText, 
  FiUsers, 
  FiDollarSign, 
  FiClock,
  FiPlus,
  FiArrowRight,
  FiAlertCircle,
  FiShield,
  FiGift
} from 'react-icons/fi';
import { useAuth } from '@/hooks/useAuth';
import { api, Plan, KYCStatus } from '@/lib/api';
import { formatDate, getPlanStatusBadge, getTokenByAssetType } from '@/lib/contract';

export default function DashboardPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [kycStatus, setKycStatus] = useState<KYCStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [plansRes, kycRes] = await Promise.all([
          api.getPlans(),
          api.getKYCStatus(),
        ]);

        if (plansRes.data) setPlans(plansRes.data);
        if (kycRes.data) setKycStatus(kycRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const stats = [
    {
      icon: <FiFileText size={22} />,
      label: 'Total Plans',
      value: plans.length.toString(),
      color: '#33C5E0',
      bg: 'rgba(51, 197, 224, 0.1)'
    },
    {
      icon: <FiUsers size={22} />,
      label: 'Beneficiaries',
      value: plans.reduce((acc, p) => acc + p.beneficiaries.length, 0).toString(),
      color: '#8B5CF6',
      bg: 'rgba(139, 92, 246, 0.1)'
    },
    {
      icon: <FiDollarSign size={22} />,
      label: 'Assets Locked',
      value: `$${plans.reduce((acc, p) => acc + parseFloat(p.assetAmount || '0'), 0).toLocaleString()}`,
      color: '#10B981',
      bg: 'rgba(16, 185, 129, 0.1)'
    },
    {
      icon: <FiClock size={22} />,
      label: 'Active Plans',
      value: plans.filter(p => p.status === 'ACTIVE').length.toString(),
      color: '#F59E0B',
      bg: 'rgba(245, 158, 11, 0.1)'
    },
  ];

  const recentPlans = plans.slice(0, 5);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-[140px] rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Welcome Section */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-[28px] font-bold mb-1">
            Welcome back{user?.name ? `, ${user.name}` : ''} 👋
          </h1>
          <p className="text-[#A0AEC0] text-[15px]">
            Here's an overview of your inheritance plans.
          </p>
        </div>
        <Link href="/dashboard/plans" className="btn btn-primary">
          <FiPlus size={18} />
          Create Plan
        </Link>
      </div>

      {/* KYC Alert */}
      {kycStatus && kycStatus.status !== 'APPROVED' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-start gap-4 p-5 rounded-xl mb-6 ${
            kycStatus.status === 'PENDING' 
              ? 'bg-[rgba(139,92,246,0.1)] border border-[rgba(139,92,246,0.2)]' 
              : 'bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.2)]'
          }`}
        >
          <FiAlertCircle size={22} color={kycStatus.status === 'PENDING' ? '#8B5CF6' : '#F59E0B'} />
          <div className="flex-1">
            <div className="font-semibold mb-1">
              {kycStatus.status === 'NOT_SUBMITTED' && 'KYC Verification Required'}
              {kycStatus.status === 'PENDING' && 'KYC Verification Pending'}
              {kycStatus.status === 'REJECTED' && 'KYC Verification Rejected'}
            </div>
            <div className="text-sm text-[#A0AEC0]">
              {kycStatus.status === 'NOT_SUBMITTED' && 'Complete KYC verification to create inheritance plans.'}
              {kycStatus.status === 'PENDING' && 'Your KYC is being reviewed. This usually takes 24-48 hours.'}
              {kycStatus.status === 'REJECTED' && (kycStatus.rejectionReason || 'Please resubmit your KYC.')}
            </div>
          </div>
          {kycStatus.status !== 'PENDING' && (
            <Link href="/dashboard/kyc" className="btn btn-sm btn-secondary">
              {kycStatus.status === 'NOT_SUBMITTED' ? 'Complete KYC' : 'Resubmit'}
            </Link>
          )}
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-5 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            className="bg-[#12181E] border border-white/6 rounded-2xl p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
              style={{ background: stat.bg, color: stat.color }}
            >
              {stat.icon}
            </div>
            <div className="text-[28px] font-bold mb-1">{stat.value}</div>
            <div className="text-sm text-[#64748B]">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-[1fr_360px] gap-6">
        {/* Recent Plans */}
        <div className="bg-[#12181E] border border-white/6 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/6 flex items-center justify-between">
            <h2 className="text-base font-semibold">Recent Plans</h2>
            <Link href="/dashboard/plans" className="flex items-center gap-1 text-[#33C5E0] text-[13px] no-underline">
              View All <FiArrowRight size={14} />
            </Link>
          </div>
          
          {recentPlans.length === 0 ? (
            <div className="py-16 px-6 text-center">
              <FiFileText size={40} color="#64748B" className="mb-4 mx-auto" />
              <h3 className="text-base font-semibold mb-2">No Plans Yet</h3>
              <p className="text-[#A0AEC0] text-sm mb-5">
                Create your first inheritance plan.
              </p>
              <Link href="/dashboard/plans" className="btn btn-primary btn-sm">
                <FiPlus size={14} />
                Create Plan
              </Link>
            </div>
          ) : (
            <div>
              {recentPlans.map((plan) => {
                const statusBadge = getPlanStatusBadge(plan.status);
                const token = getTokenByAssetType(plan.assetType);
                return (
                  <Link
                    key={plan.id}
                    href={`/dashboard/plans/${plan.id}`}
                    className="flex items-center px-6 py-4 border-b border-white/[0.04] no-underline text-inherit transition-colors hover:bg-white/[0.02]"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium mb-1 overflow-hidden text-ellipsis whitespace-nowrap">
                        {plan.planName}
                      </div>
                      <div className="text-[13px] text-[#64748B]">
                        {plan.assetAmount} {token?.symbol} • {plan.beneficiaries.length} beneficiaries
                      </div>
                    </div>
                    <span className={`badge ${statusBadge.variant} ml-4`}>
                      {statusBadge.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-5">
          {/* Quick Actions */}
          <div className="bg-[#12181E] border border-white/6 rounded-2xl p-5">
            <h3 className="text-sm font-semibold mb-4 text-[#A0AEC0]">Quick Actions</h3>
            <div className="flex flex-col gap-2">
              <Link
                href="/dashboard/plans"
                className="flex items-center gap-3 p-3 rounded-[10px] no-underline text-inherit transition-colors hover:bg-white/[0.02]"
              >
                <div className="w-10 h-10 rounded-[10px] bg-[rgba(51,197,224,0.1)] flex items-center justify-center">
                  <FiPlus size={18} color="#33C5E0" />
                </div>
                <div>
                  <div className="font-medium text-sm">Create New Plan</div>
                  <div className="text-xs text-[#64748B]">Set up inheritance</div>
                </div>
              </Link>
              <Link
                href="/dashboard/kyc"
                className="flex items-center gap-3 p-3 rounded-[10px] no-underline text-inherit transition-colors hover:bg-white/[0.02]"
              >
                <div className="w-10 h-10 rounded-[10px] bg-[rgba(139,92,246,0.1)] flex items-center justify-center">
                  <FiShield size={18} color="#8B5CF6" />
                </div>
                <div>
                  <div className="font-medium text-sm">KYC Verification</div>
                  <div className="text-xs text-[#64748B]">
                    {kycStatus?.status === 'APPROVED' ? 'Verified' : 'Complete verification'}
                  </div>
                </div>
              </Link>
              <Link
                href="/claim"
                className="flex items-center gap-3 p-3 rounded-[10px] no-underline text-inherit transition-colors hover:bg-white/[0.02]"
              >
                <div className="w-10 h-10 rounded-[10px] bg-[rgba(16,185,129,0.1)] flex items-center justify-center">
                  <FiGift size={18} color="#10B981" />
                </div>
                <div>
                  <div className="font-medium text-sm">Claim Inheritance</div>
                  <div className="text-xs text-[#64748B]">For beneficiaries</div>
                </div>
              </Link>
            </div>
          </div>

          {/* Account Status */}
          <div className="bg-[#12181E] border border-white/6 rounded-2xl p-5">
            <h3 className="text-sm font-semibold mb-4 text-[#A0AEC0]">Account Status</h3>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#64748B]">KYC Status</span>
                <span className={`badge ${
                  kycStatus?.status === 'APPROVED' ? 'badge-success' :
                  kycStatus?.status === 'PENDING' ? 'badge-purple' : 'badge-warning'
                }`}>
                  {kycStatus?.status || 'Not Submitted'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#64748B]">Role</span>
                <span className="badge badge-primary">{user?.role || 'User'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#64748B]">Plans</span>
                <span className="font-semibold">{plans.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
