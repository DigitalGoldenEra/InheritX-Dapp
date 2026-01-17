'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FiActivity,
  FiChevronLeft,
  FiChevronRight,
  FiFileText,
  FiShield,
  FiGift,
  FiPause,
  FiPlay,
  FiXCircle,
} from 'react-icons/fi';
import { api, Activity, Pagination } from '@/lib/api';
import { formatDateTime, formatAddress } from '@/lib/contract';

// Activity type configurations with colors and icons
const ACTIVITY_CONFIG: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
  PLAN_CREATED: {
    bg: 'rgba(51, 197, 224, 0.1)',
    color: '#33C5E0',
    icon: <FiFileText size={18} />,
  },
  PLAN_PAUSED: {
    bg: 'rgba(245, 158, 11, 0.1)',
    color: '#F59E0B',
    icon: <FiPause size={18} />,
  },
  PLAN_RESUMED: {
    bg: 'rgba(16, 185, 129, 0.1)',
    color: '#10B981',
    icon: <FiPlay size={18} />,
  },
  PLAN_CANCELLED: {
    bg: 'rgba(239, 68, 68, 0.1)',
    color: '#EF4444',
    icon: <FiXCircle size={18} />,
  },
  KYC_SUBMITTED: {
    bg: 'rgba(139, 92, 246, 0.1)',
    color: '#8B5CF6',
    icon: <FiShield size={18} />,
  },
  KYC_APPROVED: {
    bg: 'rgba(16, 185, 129, 0.1)',
    color: '#10B981',
    icon: <FiShield size={18} />,
  },
  KYC_REJECTED: {
    bg: 'rgba(239, 68, 68, 0.1)',
    color: '#EF4444',
    icon: <FiShield size={18} />,
  },
  INHERITANCE_CLAIMED: {
    bg: 'rgba(16, 185, 129, 0.1)',
    color: '#10B981',
    icon: <FiGift size={18} />,
  },
};

const DEFAULT_CONFIG = {
  bg: 'rgba(51, 197, 224, 0.1)',
  color: '#33C5E0',
  icon: <FiActivity size={18} />,
};

export default function AdminActivityPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);

  const fetchActivity = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await api.getAdminActivity({
        type: typeFilter === 'all' ? undefined : typeFilter,
        page,
        limit: 20,
      });

      if (data) {
        setActivities(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching activity:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, [typeFilter, page]);

  const activityTypes = [
    'all',
    'PLAN_CREATED',
    'KYC_SUBMITTED',
    'KYC_APPROVED',
    'INHERITANCE_CLAIMED',
  ];

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-[28px] font-bold mb-1">Activity Log 📋</h1>
          <p className="text-[#A0AEC0] text-[15px]">View all platform activity and events.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {activityTypes.map((type) => (
          <button
            key={type}
            onClick={() => {
              setTypeFilter(type);
              setPage(1);
            }}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
              typeFilter === type
                ? 'bg-primary text-white'
                : 'bg-[#12181E] border border-white/6 text-[#A0AEC0] hover:border-white/10'
            }`}
          >
            {type === 'all' ? 'All Activity' : type.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Activity List */}
      <div className="bg-[#12181E] border border-white/6 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/6 flex items-center justify-between">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <FiActivity size={18} className="text-primary" />
            Recent Activity
          </h2>
          {pagination && (
            <span className="text-sm text-[#64748B]">{pagination.total} total events</span>
          )}
        </div>

        {isLoading ? (
          <div className="py-16 px-6 text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#A0AEC0] text-sm">Loading activity...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="py-16 px-6 text-center">
            <FiActivity size={40} color="#64748B" className="mb-4 mx-auto" />
            <h3 className="text-base font-semibold mb-2">No Activity Found</h3>
            <p className="text-[#A0AEC0] text-sm">
              {typeFilter === 'all'
                ? 'Platform activity will appear here.'
                : `No ${typeFilter.replace(/_/g, ' ').toLowerCase()} events found.`}
            </p>
          </div>
        ) : (
          <>
            <div>
              {activities.map((activity, index) => {
                const config = ACTIVITY_CONFIG[activity.type] || DEFAULT_CONFIG;

                return (
                  <motion.div
                    key={activity.id}
                    className="flex items-center px-6 py-4 border-b border-white/4 transition-colors hover:bg-white/2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center mr-4"
                      style={{ background: config.bg, color: config.color }}
                    >
                      {config.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm mb-1 overflow-hidden text-ellipsis whitespace-nowrap">
                        {activity.description}
                      </div>
                      <div className="text-[13px] text-[#64748B]">
                        <span className="font-mono">
                          {activity.user?.walletAddress
                            ? formatAddress(activity.user.walletAddress)
                            : 'System'}
                        </span>
                        <span className="mx-2">•</span>
                        <span>{formatDateTime(activity.createdAt)}</span>
                      </div>
                    </div>
                    <span
                      className="text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap ml-4"
                      style={{ background: config.bg, color: config.color }}
                    >
                      {activity.type.replace(/_/g, ' ')}
                    </span>
                  </motion.div>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="px-6 py-4 border-t border-white/6 flex items-center justify-between">
                <div className="text-sm text-[#64748B]">
                  Page {page} of {pagination.pages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#1A2028] border border-white/6 text-[#A0AEC0] transition-colors hover:border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                    disabled={page === pagination.pages}
                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#1A2028] border border-white/6 text-[#A0AEC0] transition-colors hover:border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
