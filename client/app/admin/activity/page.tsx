'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FiActivity,
  FiChevronLeft,
  FiChevronRight,
  FiFilter
} from 'react-icons/fi';
import { api, Activity, Pagination } from '@/lib/api';
import { formatDateTime, formatAddress } from '@/lib/contract';

const ACTIVITY_COLORS: Record<string, string> = {
  PLAN_CREATED: 'bg-[var(--primary-muted)] text-[var(--primary)]',
  PLAN_PAUSED: 'bg-[var(--accent-amber)]/20 text-[var(--accent-amber)]',
  PLAN_RESUMED: 'bg-[var(--accent-green)]/20 text-[var(--accent-green)]',
  PLAN_CANCELLED: 'bg-[var(--accent-red)]/20 text-[var(--accent-red)]',
  KYC_SUBMITTED: 'bg-[var(--accent-purple)]/20 text-[var(--accent-purple)]',
  KYC_APPROVED: 'bg-[var(--accent-green)]/20 text-[var(--accent-green)]',
  KYC_REJECTED: 'bg-[var(--accent-red)]/20 text-[var(--accent-red)]',
  INHERITANCE_CLAIMED: 'bg-[var(--accent-green)]/20 text-[var(--accent-green)]',
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
        limit: 50,
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

  const activityTypes = ['all', 'PLAN_CREATED', 'KYC_SUBMITTED', 'KYC_APPROVED', 'INHERITANCE_CLAIMED'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Activity Log</h1>
        <p className="text-[var(--text-secondary)]">
          View all platform activity.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {activityTypes.map((type) => (
          <button
            key={type}
            onClick={() => { setTypeFilter(type); setPage(1); }}
            className={`btn btn-sm ${typeFilter === type ? 'btn-primary' : 'btn-secondary'}`}
          >
            {type === 'all' ? 'All' : type.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Activity List */}
      <div className="card">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="spinner mx-auto" />
            <p className="mt-4 text-[var(--text-secondary)]">Loading activity...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="p-12 text-center">
            <FiActivity className="mx-auto text-[var(--text-muted)]" size={48} />
            <h3 className="mt-4 font-semibold">No Activity Found</h3>
          </div>
        ) : (
          <>
            <div className="divide-y divide-[var(--border-subtle)]">
              {activities.map((activity, index) => {
                const colorClass = ACTIVITY_COLORS[activity.type] || 'bg-[var(--bg-elevated)]';

                return (
                  <motion.div
                    key={activity.id}
                    className="p-4 flex items-center gap-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}>
                      <FiActivity size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{activity.description}</p>
                      <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                        <span className="font-mono">
                          {activity.user?.walletAddress ? formatAddress(activity.user.walletAddress) : 'System'}
                        </span>
                        <span>•</span>
                        <span>{formatDateTime(activity.createdAt)}</span>
                      </div>
                    </div>
                    <span className="badge badge-primary text-xs whitespace-nowrap">
                      {activity.type.replace(/_/g, ' ')}
                    </span>
                  </motion.div>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="p-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
                <div className="text-sm text-[var(--text-muted)]">
                  Page {page} of {pagination.pages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn btn-sm btn-secondary"
                  >
                    <FiChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                    disabled={page === pagination.pages}
                    className="btn btn-sm btn-secondary"
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

