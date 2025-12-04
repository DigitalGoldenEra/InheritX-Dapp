'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  FiUsers, 
  FiShield, 
  FiFileText, 
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiArrowRight,
  FiActivity
} from 'react-icons/fi';
import { api, AdminStats, Activity } from '@/lib/api';
import { formatDateTime } from '@/lib/contract';

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await api.getAdminStats();
        if (data) setStats(data);
      } catch (error) {
        console.error('Error fetching admin stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-6">
              <div className="skeleton h-12 w-12 rounded-xl mb-4" />
              <div className="skeleton h-8 w-24 mb-2" />
              <div className="skeleton h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      icon: <FiUsers size={24} />,
      label: 'Total Users',
      value: stats?.users.total || 0,
      color: 'primary',
    },
    {
      icon: <FiClock size={24} />,
      label: 'Pending KYC',
      value: stats?.kyc.pending || 0,
      color: 'purple',
      link: '/admin/kyc?status=PENDING',
    },
    {
      icon: <FiFileText size={24} />,
      label: 'Total Plans',
      value: stats?.plans.total || 0,
      color: 'green',
    },
    {
      icon: <FiCheckCircle size={24} />,
      label: 'Total Claims',
      value: stats?.claims.total || 0,
      color: 'amber',
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      primary: { bg: 'bg-[var(--primary-muted)]', text: 'text-[var(--primary)]' },
      purple: { bg: 'bg-[var(--accent-purple)]/20', text: 'text-[var(--accent-purple)]' },
      green: { bg: 'bg-[var(--accent-green)]/20', text: 'text-[var(--accent-green)]' },
      amber: { bg: 'bg-[var(--accent-amber)]/20', text: 'text-[var(--accent-amber)]' },
    };
    return colors[color] || colors.primary;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-[var(--text-secondary)]">
          Overview of platform statistics and pending tasks.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => {
          const colors = getColorClasses(stat.color);
          const cardContent = (
            <>
              <div className={`stat-icon ${colors.bg} ${colors.text}`}>
                {stat.icon}
              </div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </>
          );
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {stat.link ? (
                <Link
                  href={stat.link}
                  className="stat-card block cursor-pointer hover:border-[var(--border-hover)]"
                >
                  {cardContent}
                </Link>
              ) : (
                <div className="stat-card block">
                  {cardContent}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* KYC Overview */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="card">
            <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
              <h2 className="text-lg font-semibold">KYC Overview</h2>
              <Link href="/admin/kyc" className="btn btn-ghost btn-sm">
                View All <FiArrowRight size={14} />
              </Link>
            </div>

            <div className="p-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="card bg-[var(--bg-deep)] p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <FiClock className="text-[var(--accent-purple)]" size={20} />
                    <span className="text-[var(--text-muted)]">Pending</span>
                  </div>
                  <div className="text-2xl font-bold">{stats?.kyc.pending || 0}</div>
                </div>
                <div className="card bg-[var(--bg-deep)] p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <FiCheckCircle className="text-[var(--accent-green)]" size={20} />
                    <span className="text-[var(--text-muted)]">Approved</span>
                  </div>
                  <div className="text-2xl font-bold">{stats?.kyc.approved || 0}</div>
                </div>
                <div className="card bg-[var(--bg-deep)] p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <FiXCircle className="text-[var(--accent-red)]" size={20} />
                    <span className="text-[var(--text-muted)]">Rejected</span>
                  </div>
                  <div className="text-2xl font-bold">{stats?.kyc.rejected || 0}</div>
                </div>
              </div>

              {stats?.kyc.pending && stats.kyc.pending > 0 && (
                <div className="mt-4 p-3 bg-[var(--accent-purple)]/10 border border-[var(--accent-purple)]/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">
                      <strong>{stats.kyc.pending}</strong> KYC applications awaiting review
                    </span>
                    <Link href="/admin/kyc?status=PENDING" className="btn btn-sm btn-secondary">
                      Review Now
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="card">
          <div className="p-4 border-b border-[var(--border-subtle)]">
            <h2 className="text-lg font-semibold">Quick Stats</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)]">Active Plans</span>
              <span className="font-semibold">{stats?.plans.active || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)]">KYC Approval Rate</span>
              <span className="font-semibold">
                {stats?.kyc.total 
                  ? Math.round((stats.kyc.approved / stats.kyc.total) * 100)
                  : 0}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)]">Avg. Review Time</span>
              <span className="font-semibold">~24h</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FiActivity className="text-[var(--primary)]" />
            Recent Activity
          </h2>
          <Link href="/admin/activity" className="btn btn-ghost btn-sm">
            View All <FiArrowRight size={14} />
          </Link>
        </div>

        {!stats?.recentActivity || stats.recentActivity.length === 0 ? (
          <div className="p-8 text-center text-[var(--text-muted)]">
            No recent activity
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {stats.recentActivity.slice(0, 5).map((activity) => (
              <div key={activity.id} className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center">
                  <FiActivity className="text-[var(--primary)]" size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {activity.description}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {activity.user?.walletAddress?.slice(0, 6)}...{activity.user?.walletAddress?.slice(-4)} • {formatDateTime(activity.createdAt)}
                  </p>
                </div>
                <span className="badge badge-primary text-xs">
                  {activity.type.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
