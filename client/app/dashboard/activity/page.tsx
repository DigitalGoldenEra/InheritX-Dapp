'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FiActivity,
  FiFileText,
  FiUserCheck,
  FiDollarSign,
  FiPause,
  FiPlay,
  FiXCircle
} from 'react-icons/fi';
import { api, Activity as ActivityType } from '@/lib/api';
import { formatDateTime } from '@/lib/contract';

const ACTIVITY_ICONS: Record<string, React.ElementType> = {
  PLAN_CREATED: FiFileText,
  PLAN_PAUSED: FiPause,
  PLAN_RESUMED: FiPlay,
  PLAN_CANCELLED: FiXCircle,
  KYC_SUBMITTED: FiUserCheck,
  KYC_APPROVED: FiUserCheck,
  INHERITANCE_CLAIMED: FiDollarSign,
};

const ACTIVITY_COLORS: Record<string, string> = {
  PLAN_CREATED: 'text-[var(--primary)]',
  PLAN_PAUSED: 'text-[var(--accent-amber)]',
  PLAN_RESUMED: 'text-[var(--accent-green)]',
  PLAN_CANCELLED: 'text-[var(--accent-red)]',
  KYC_SUBMITTED: 'text-[var(--accent-purple)]',
  KYC_APPROVED: 'text-[var(--accent-green)]',
  INHERITANCE_CLAIMED: 'text-[var(--accent-green)]',
};

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // For user dashboard, we'd need to fetch user-specific activity
    // For now, showing a placeholder
    setIsLoading(false);
    setActivities([]);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="card p-4">
            <div className="flex items-center gap-4">
              <div className="skeleton w-10 h-10 rounded-full" />
              <div className="flex-1">
                <div className="skeleton h-4 w-3/4 mb-2" />
                <div className="skeleton h-3 w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Activity</h1>
        <p className="text-[var(--text-secondary)]">
          Track your recent actions and events.
        </p>
      </div>

      {activities.length === 0 ? (
        <div className="card p-12 text-center">
          <FiActivity className="mx-auto text-[var(--text-muted)]" size={48} />
          <h3 className="mt-4 font-semibold">No Activity Yet</h3>
          <p className="text-[var(--text-secondary)]">
            Your recent actions will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity, index) => {
            const Icon = ACTIVITY_ICONS[activity.type] || FiActivity;
            const colorClass = ACTIVITY_COLORS[activity.type] || 'text-[var(--primary)]';

            return (
              <motion.div
                key={activity.id}
                className="card p-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center ${colorClass}`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{activity.description}</p>
                    <p className="text-sm text-[var(--text-muted)]">
                      {formatDateTime(activity.createdAt)}
                    </p>
                  </div>
                  <span className="badge badge-primary text-xs">
                    {activity.type.replace(/_/g, ' ')}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
