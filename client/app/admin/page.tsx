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
  FiActivity,
  FiDollarSign,
  FiSettings,
} from 'react-icons/fi';
import { api, AdminStats } from '@/lib/api';
import { formatDateTime } from '@/lib/contract';
import { useAuth } from '@/hooks/useAuth';

export default function AdminDashboard() {
  const { user } = useAuth();
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

  const statCards = [
    {
      icon: <FiUsers size={22} />,
      label: 'Total Users',
      value: stats?.users.total || 0,
      color: '#33C5E0',
      bg: 'rgba(51, 197, 224, 0.1)',
    },
    {
      icon: <FiClock size={22} />,
      label: 'Pending KYC',
      value: stats?.kyc.pending || 0,
      color: '#8B5CF6',
      bg: 'rgba(139, 92, 246, 0.1)',
      link: '/admin/kyc?status=PENDING',
    },
    {
      icon: <FiFileText size={22} />,
      label: 'Total Plans',
      value: stats?.plans.total || 0,
      color: '#10B981',
      bg: 'rgba(16, 185, 129, 0.1)',
    },
    {
      icon: <FiDollarSign size={22} />,
      label: 'Total Claims',
      value: stats?.claims.total || 0,
      color: '#F59E0B',
      bg: 'rgba(245, 158, 11, 0.1)',
    },
  ];

  if (isLoading) {
    return (
      <div className="max-w-[1400px] mx-auto">
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
          <h1 className="text-[28px] font-bold mb-1">Admin Dashboard 🛡️</h1>
          <p className="text-[#A0AEC0] text-[15px]">
            Welcome back, {user?.name || 'Admin'}. Here&apos;s the platform overview.
          </p>
        </div>
        <Link href="/admin/kyc?status=PENDING" className="btn btn-primary">
          <FiShield size={18} />
          Review KYC
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-5 mb-8">
        {statCards.map((stat, index) => {
          const cardContent = (
            <>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ background: stat.bg, color: stat.color }}
              >
                {stat.icon}
              </div>
              <div className="text-[28px] font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-[#64748B]">{stat.label}</div>
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
                  className="block bg-[#12181E] border border-white/6 rounded-2xl p-6 cursor-pointer hover:border-white/10 transition-colors"
                >
                  {cardContent}
                </Link>
              ) : (
                <div className="block bg-[#12181E] border border-white/6 rounded-2xl p-6">
                  {cardContent}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* Recent Activity */}
        <div className="bg-[#12181E] border border-white/6 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/6 flex items-center justify-between">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <FiActivity size={18} className="text-[#33C5E0]" />
              Recent Activity
            </h2>
            <Link
              href="/admin/activity"
              className="flex items-center gap-1 text-[#33C5E0] text-[13px] no-underline"
            >
              View All <FiArrowRight size={14} />
            </Link>
          </div>

          {!stats?.recentActivity || stats.recentActivity.length === 0 ? (
            <div className="py-16 px-6 text-center">
              <FiActivity size={40} color="#64748B" className="mb-4 mx-auto" />
              <h3 className="text-base font-semibold mb-2">No Recent Activity</h3>
              <p className="text-[#A0AEC0] text-sm">Platform activity will appear here.</p>
            </div>
          ) : (
            <div>
              {stats.recentActivity.slice(0, 5).map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center px-6 py-4 border-b border-white/4 transition-colors hover:bg-white/2"
                >
                  <div className="w-10 h-10 rounded-xl bg-[rgba(51,197,224,0.1)] flex items-center justify-center mr-4">
                    <FiActivity size={18} color="#33C5E0" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm mb-1 overflow-hidden text-ellipsis whitespace-nowrap">
                      {activity.description}
                    </div>
                    <div className="text-[13px] text-[#64748B]">
                      {activity.user?.walletAddress?.slice(0, 6)}...
                      {activity.user?.walletAddress?.slice(-4)} •{' '}
                      {formatDateTime(activity.createdAt)}
                    </div>
                  </div>
                  <span className="badge badge-primary text-xs ml-4">
                    {activity.type.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-5">
          {/* KYC Overview */}
          <div className="bg-[#12181E] border border-white/6 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#A0AEC0]">KYC Overview</h3>
              <Link href="/admin/kyc" className="text-primary text-xs">
                View All
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 p-3 rounded-[10px] bg-[rgba(139,92,246,0.1)]">
                <FiClock size={18} color="#8B5CF6" />
                <div className="flex-1">
                  <div className="text-xs text-[#64748B]">Pending</div>
                  <div className="font-semibold">{stats?.kyc.pending || 0}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-[10px] bg-[rgba(16,185,129,0.1)]">
                <FiCheckCircle size={18} color="#10B981" />
                <div className="flex-1">
                  <div className="text-xs text-[#64748B]">Approved</div>
                  <div className="font-semibold">{stats?.kyc.approved || 0}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-[10px] bg-[rgba(239,68,68,0.1)]">
                <FiXCircle size={18} color="#EF4444" />
                <div className="flex-1">
                  <div className="text-xs text-[#64748B]">Rejected</div>
                  <div className="font-semibold">{stats?.kyc.rejected || 0}</div>
                </div>
              </div>
            </div>

            {stats?.kyc.pending && stats.kyc.pending > 0 && (
              <Link
                href="/admin/kyc?status=PENDING"
                className="mt-4 w-full btn btn-sm btn-secondary flex items-center justify-center gap-2"
              >
                Review {stats.kyc.pending} Pending
                <FiArrowRight size={14} />
              </Link>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-[#12181E] border border-white/6 rounded-2xl p-5">
            <h3 className="text-sm font-semibold mb-4 text-[#A0AEC0]">Quick Actions</h3>
            <div className="flex flex-col gap-2">
              <Link
                href="/admin/users"
                className="flex items-center gap-3 p-3 rounded-[10px] no-underline text-inherit transition-colors hover:bg-white/2"
              >
                <div className="w-10 h-10 rounded-[10px] bg-[rgba(51,197,224,0.1)] flex items-center justify-center">
                  <FiUsers size={18} color="#33C5E0" />
                </div>
                <div>
                  <div className="font-medium text-sm">Manage Users</div>
                  <div className="text-xs text-[#64748B]">View all users</div>
                </div>
              </Link>
              <Link
                href="/admin/plans"
                className="flex items-center gap-3 p-3 rounded-[10px] no-underline text-inherit transition-colors hover:bg-white/2"
              >
                <div className="w-10 h-10 rounded-[10px] bg-[rgba(139,92,246,0.1)] flex items-center justify-center">
                  <FiFileText size={18} color="#8B5CF6" />
                </div>
                <div>
                  <div className="font-medium text-sm">All Plans</div>
                  <div className="text-xs text-[#64748B]">Monitor platform plans</div>
                </div>
              </Link>
              <Link
                href="/admin/activity"
                className="flex items-center gap-3 p-3 rounded-[10px] no-underline text-inherit transition-colors hover:bg-white/2"
              >
                <div className="w-10 h-10 rounded-[10px] bg-[rgba(16,185,129,0.1)] flex items-center justify-center">
                  <FiActivity size={18} color="#10B981" />
                </div>
                <div>
                  <div className="font-medium text-sm">Activity Log</div>
                  <div className="text-xs text-[#64748B]">View all activity</div>
                </div>
              </Link>
            </div>
          </div>

          {/* Platform Stats */}
          <div className="bg-[#12181E] border border-white/6 rounded-2xl p-5">
            <h3 className="text-sm font-semibold mb-4 text-[#A0AEC0]">Platform Stats</h3>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#64748B]">Active Plans</span>
                <span className="font-semibold">{stats?.plans.active || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#64748B]">KYC Approval Rate</span>
                <span className="font-semibold">
                  {stats?.kyc.total ? Math.round((stats.kyc.approved / stats.kyc.total) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#64748B]">Total Users</span>
                <span className="font-semibold">{stats?.users.total || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
