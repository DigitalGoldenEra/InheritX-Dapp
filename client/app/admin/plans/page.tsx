'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiFileText,
  FiExternalLink,
} from 'react-icons/fi';
import { api, Plan, Pagination } from '@/lib/api';
import { formatAddress, formatDate, getPlanStatusBadge, getTokenByAssetType } from '@/lib/contract';

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await api.getAdminPlans({
        status: statusFilter === 'all' ? undefined : statusFilter,
        page,
        limit: 20,
      });

      if (data) {
        setPlans(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [statusFilter, page]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">All Plans</h1>
        <p className="text-[var(--text-secondary)]">View all inheritance plans on the platform.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search plans..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'ACTIVE', 'PAUSED', 'EXECUTED', 'CANCELLED'].map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setPage(1);
              }}
              className={`btn btn-sm ${statusFilter === status ? 'btn-primary' : 'btn-secondary'}`}
            >
              {status === 'all' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Plans Table */}
      <div className="card">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="spinner mx-auto" />
            <p className="mt-4 text-[var(--text-secondary)]">Loading plans...</p>
          </div>
        ) : plans.length === 0 ? (
          <div className="p-12 text-center">
            <FiFileText className="mx-auto text-[var(--text-muted)]" size={48} />
            <h3 className="mt-4 font-semibold">No Plans Found</h3>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>Plan</th>
                    <th>Owner</th>
                    <th>Amount</th>
                    <th>Beneficiaries</th>
                    <th>Transfer Date</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((plan) => {
                    const statusBadge = getPlanStatusBadge(plan.status);
                    const token = getTokenByAssetType(plan.assetType);

                    return (
                      <tr key={plan.id}>
                        <td>
                          <div>
                            <div className="font-medium">{plan.planName}</div>
                            <div className="text-sm text-[var(--text-muted)] truncate max-w-[200px]">
                              {plan.planDescription}
                            </div>
                          </div>
                        </td>
                        <td className="font-mono text-sm">
                          {plan.globalPlanId ? `#${plan.globalPlanId}` : '-'}
                        </td>
                        <td>
                          {plan.assetAmount} {token?.symbol}
                        </td>
                        <td>{plan.beneficiaries.length}</td>
                        <td>{formatDate(plan.transferDate)}</td>
                        <td>
                          <span className={`badge ${statusBadge.variant}`}>
                            {statusBadge.label}
                          </span>
                        </td>
                        <td>
                          {plan.txHash && (
                            <a
                              href={`https://sepolia-blockscout.lisk.com/tx/${plan.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-icon btn-ghost"
                              title="View on Explorer"
                            >
                              <FiExternalLink size={16} />
                            </a>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="p-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
                <div className="text-sm text-[var(--text-muted)]">
                  Showing {(page - 1) * pagination.limit + 1} -{' '}
                  {Math.min(page * pagination.limit, pagination.total)} of {pagination.total}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn btn-sm btn-secondary"
                  >
                    <FiChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
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
