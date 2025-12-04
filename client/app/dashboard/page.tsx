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
      <div style={{ padding: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 140, borderRadius: 16 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* Welcome Section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>
            Welcome back{user?.name ? `, ${user.name}` : ''} 👋
          </h1>
          <p style={{ color: '#A0AEC0', fontSize: 15 }}>
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
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 16,
            padding: 20,
            borderRadius: 12,
            marginBottom: 24,
            background: kycStatus.status === 'PENDING' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)',
            border: `1px solid ${kycStatus.status === 'PENDING' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`
          }}
        >
          <FiAlertCircle size={22} color={kycStatus.status === 'PENDING' ? '#8B5CF6' : '#F59E0B'} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
              {kycStatus.status === 'NOT_SUBMITTED' && 'KYC Verification Required'}
              {kycStatus.status === 'PENDING' && 'KYC Verification Pending'}
              {kycStatus.status === 'REJECTED' && 'KYC Verification Rejected'}
            </div>
            <div style={{ fontSize: 14, color: '#A0AEC0' }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 32 }}>
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            style={{
              background: '#12181E',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16,
              padding: 24,
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              background: stat.bg,
              color: stat.color
            }}>
              {stat.icon}
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>{stat.value}</div>
            <div style={{ fontSize: 14, color: '#64748B' }}>{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>
        {/* Recent Plans */}
        <div style={{
          background: '#12181E',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 16,
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '16px 24px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>Recent Plans</h2>
            <Link href="/dashboard/plans" style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#33C5E0', fontSize: 13, textDecoration: 'none' }}>
              View All <FiArrowRight size={14} />
            </Link>
          </div>
          
          {recentPlans.length === 0 ? (
            <div style={{ padding: '64px 24px', textAlign: 'center' }}>
              <FiFileText size={40} color="#64748B" style={{ marginBottom: 16 }} />
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No Plans Yet</h3>
              <p style={{ color: '#A0AEC0', fontSize: 14, marginBottom: 20 }}>
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
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '16px 24px',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      textDecoration: 'none',
                      color: 'inherit',
                      transition: 'background 0.2s'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {plan.planName}
                      </div>
                      <div style={{ fontSize: 13, color: '#64748B' }}>
                        {plan.assetAmount} {token?.symbol} • {plan.beneficiaries.length} beneficiaries
                      </div>
                    </div>
                    <span className={`badge ${statusBadge.variant}`} style={{ marginLeft: 16 }}>
                      {statusBadge.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Quick Actions */}
          <div style={{
            background: '#12181E',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 16,
            padding: 20
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: '#A0AEC0' }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link
                href="/dashboard/plans"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 12,
                  borderRadius: 10,
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'background 0.2s'
                }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(51, 197, 224, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FiPlus size={18} color="#33C5E0" />
                </div>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>Create New Plan</div>
                  <div style={{ fontSize: 12, color: '#64748B' }}>Set up inheritance</div>
                </div>
              </Link>
              <Link
                href="/dashboard/kyc"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 12,
                  borderRadius: 10,
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'background 0.2s'
                }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FiShield size={18} color="#8B5CF6" />
                </div>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>KYC Verification</div>
                  <div style={{ fontSize: 12, color: '#64748B' }}>
                    {kycStatus?.status === 'APPROVED' ? 'Verified' : 'Complete verification'}
                  </div>
                </div>
              </Link>
              <Link
                href="/claim"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 12,
                  borderRadius: 10,
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'background 0.2s'
                }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FiGift size={18} color="#10B981" />
                </div>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>Claim Inheritance</div>
                  <div style={{ fontSize: 12, color: '#64748B' }}>For beneficiaries</div>
                </div>
              </Link>
            </div>
          </div>

          {/* Account Status */}
          <div style={{
            background: '#12181E',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 16,
            padding: 20
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: '#A0AEC0' }}>Account Status</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, color: '#64748B' }}>KYC Status</span>
                <span className={`badge ${
                  kycStatus?.status === 'APPROVED' ? 'badge-success' :
                  kycStatus?.status === 'PENDING' ? 'badge-purple' : 'badge-warning'
                }`}>
                  {kycStatus?.status || 'Not Submitted'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, color: '#64748B' }}>Role</span>
                <span className="badge badge-primary">{user?.role || 'User'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, color: '#64748B' }}>Plans</span>
                <span style={{ fontWeight: 600 }}>{plans.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
