'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiSearch,
  FiFilter,
  FiEye,
  FiCheck,
  FiX,
  FiDownload,
  FiChevronLeft,
  FiChevronRight,
  FiAlertCircle,
  FiLoader
} from 'react-icons/fi';
import { api, KYCApplication, Pagination } from '@/lib/api';
import { formatDateTime } from '@/lib/contract';

type StatusFilter = 'all' | 'PENDING' | 'APPROVED' | 'REJECTED';

export default function AdminKYCPage() {
  const searchParams = useSearchParams();
  const initialStatus = (searchParams.get('status') as StatusFilter) || 'all';
  
  const [applications, setApplications] = useState<KYCApplication[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(initialStatus);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  
  // Selected application for detail view
  const [selectedApp, setSelectedApp] = useState<KYCApplication | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await api.getAdminKYCList({
        status: statusFilter === 'all' ? undefined : statusFilter,
        page,
        limit: 20,
      });

      if (data) {
        setApplications(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching KYC applications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [statusFilter, page]);

  const handleApprove = async (id: string) => {
    setIsProcessing(true);
    setActionError(null);

    try {
      const { data, error } = await api.approveKYC(id);
      
      if (error) throw new Error(error);

      // Update local state
      setApplications(prev => prev.map(app => 
        app.id === id ? { ...app, status: 'APPROVED' } : app
      ));
      
      if (selectedApp?.id === id) {
        setSelectedApp({ ...selectedApp, status: 'APPROVED' });
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to approve KYC');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (id: string) => {
    setIsProcessing(true);
    setActionError(null);

    try {
      const { data, error } = await api.rejectKYC(id, rejectReason);
      
      if (error) throw new Error(error);

      // Update local state
      setApplications(prev => prev.map(app => 
        app.id === id ? { ...app, status: 'REJECTED', rejectionReason: rejectReason } : app
      ));
      
      setShowRejectModal(false);
      setRejectReason('');
      
      if (selectedApp?.id === id) {
        setSelectedApp({ ...selectedApp, status: 'REJECTED', rejectionReason: rejectReason });
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to reject KYC');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { class: string; label: string }> = {
      PENDING: { class: 'badge-purple', label: 'Pending' },
      APPROVED: { class: 'badge-success', label: 'Approved' },
      REJECTED: { class: 'badge-error', label: 'Rejected' },
    };
    return badges[status] || { class: 'badge-primary', label: status };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">KYC Management</h1>
        <p className="text-[var(--text-secondary)]">
          Review and manage user KYC applications.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'PENDING', 'APPROVED', 'REJECTED'] as StatusFilter[]).map((status) => (
            <button
              key={status}
              onClick={() => { setStatusFilter(status); setPage(1); }}
              className={`btn btn-sm ${statusFilter === status ? 'btn-primary' : 'btn-secondary'}`}
            >
              {status === 'all' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Applications List */}
      <div className="card">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="spinner mx-auto" />
            <p className="mt-4 text-[var(--text-secondary)]">Loading applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center">
            <FiFilter className="mx-auto text-[var(--text-muted)]" size={48} />
            <h3 className="mt-4 font-semibold">No Applications Found</h3>
            <p className="text-[var(--text-secondary)]">
              {statusFilter !== 'all' 
                ? `No ${statusFilter.toLowerCase()} applications.`
                : 'No KYC applications submitted yet.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>ID Type</th>
                    <th>Submitted</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => {
                    const statusBadge = getStatusBadge(app.status);
                    return (
                      <tr key={app.id}>
                        <td>
                          <div>
                            <div className="font-medium">{app.fullName}</div>
                            <div className="text-sm text-[var(--text-muted)]">{app.email}</div>
                          </div>
                        </td>
                        <td>{app.idType.replace('_', ' ')}</td>
                        <td>{formatDateTime(app.submittedAt)}</td>
                        <td>
                          <span className={`badge ${statusBadge.class}`}>
                            {statusBadge.label}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedApp(app)}
                              className="btn btn-icon btn-ghost"
                              title="View Details"
                            >
                              <FiEye size={16} />
                            </button>
                            {app.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => handleApprove(app.id)}
                                  className="btn btn-icon btn-ghost text-[var(--accent-green)]"
                                  title="Approve"
                                >
                                  <FiCheck size={16} />
                                </button>
                                <button
                                  onClick={() => { setSelectedApp(app); setShowRejectModal(true); }}
                                  className="btn btn-icon btn-ghost text-[var(--accent-red)]"
                                  title="Reject"
                                >
                                  <FiX size={16} />
                                </button>
                              </>
                            )}
                          </div>
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
                  Showing {((page - 1) * pagination.limit) + 1} - {Math.min(page * pagination.limit, pagination.total)} of {pagination.total}
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

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedApp && !showRejectModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedApp(null)}
          >
            <motion.div
              className="modal max-w-lg"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2 className="text-lg font-bold">KYC Application Details</h2>
                <button onClick={() => setSelectedApp(null)} className="btn btn-icon btn-ghost">
                  <FiX size={20} />
                </button>
              </div>

              <div className="modal-body space-y-4">
                {actionError && (
                  <div className="alert alert-error">
                    <FiAlertCircle size={18} />
                    {actionError}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-muted)]">Status</span>
                  <span className={`badge ${getStatusBadge(selectedApp.status).class}`}>
                    {getStatusBadge(selectedApp.status).label}
                  </span>
                </div>

                <div className="divider" />

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Full Name</span>
                    <span className="font-medium">{selectedApp.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Email</span>
                    <span className="font-medium">{selectedApp.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">ID Type</span>
                    <span className="font-medium">{selectedApp.idType.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">ID Number</span>
                    <span className="font-medium">{selectedApp.idNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Wallet</span>
                    <span className="font-mono text-sm">
                      {selectedApp.user?.walletAddress?.slice(0, 10)}...
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Submitted</span>
                    <span>{formatDateTime(selectedApp.submittedAt)}</span>
                  </div>
                  {selectedApp.reviewedAt && (
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Reviewed</span>
                      <span>{formatDateTime(selectedApp.reviewedAt)}</span>
                    </div>
                  )}
                  {selectedApp.rejectionReason && (
                    <div>
                      <span className="text-[var(--text-muted)] block mb-1">Rejection Reason</span>
                      <span className="text-[var(--accent-red)]">{selectedApp.rejectionReason}</span>
                    </div>
                  )}
                </div>

                {/* ID Document */}
                <div>
                  <span className="text-[var(--text-muted)] block mb-2">ID Document</span>
                  <a
                    href={selectedApp.idDocumentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary w-full"
                  >
                    <FiDownload size={16} />
                    View Document
                  </a>
                </div>
              </div>

              {selectedApp.status === 'PENDING' && (
                <div className="modal-footer">
                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={isProcessing}
                    className="btn btn-secondary text-[var(--accent-red)]"
                  >
                    <FiX size={16} />
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(selectedApp.id)}
                    disabled={isProcessing}
                    className="btn btn-primary"
                  >
                    {isProcessing ? (
                      <FiLoader className="animate-spin" size={16} />
                    ) : (
                      <FiCheck size={16} />
                    )}
                    Approve
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reject Modal */}
      <AnimatePresence>
        {showRejectModal && selectedApp && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowRejectModal(false)}
          >
            <motion.div
              className="modal max-w-md"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2 className="text-lg font-bold">Reject KYC Application</h2>
                <button onClick={() => setShowRejectModal(false)} className="btn btn-icon btn-ghost">
                  <FiX size={20} />
                </button>
              </div>

              <div className="modal-body">
                <p className="text-[var(--text-secondary)] mb-4">
                  Are you sure you want to reject the KYC application for <strong>{selectedApp.fullName}</strong>?
                </p>

                <div className="input-group">
                  <label className="input-label">Rejection Reason (Optional)</label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="input"
                    placeholder="Provide a reason for rejection..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(selectedApp.id)}
                  disabled={isProcessing}
                  className="btn bg-[var(--accent-red)] text-white hover:bg-[var(--accent-red)]/80"
                >
                  {isProcessing ? (
                    <FiLoader className="animate-spin" size={16} />
                  ) : (
                    <FiX size={16} />
                  )}
                  Reject Application
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
