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
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  // Auto-hide success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

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

  /**
   * Handle KYC approval
   * Backend handles both contract call and database update
   */
  const handleApprove = async (id: string) => {
    setActionError(null);
    setSuccessMessage(null);
    setIsApproving(true);

    try {
      const { data, error } = await api.approveKYC(id);
      
      if (error) {
        throw new Error(error);
      }

      // Success - refresh the list and show message
      await fetchApplications();
      setSelectedApp(null);
      setSuccessMessage('KYC approved successfully! Email notification sent to user.');
      
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to approve KYC');
    } finally {
      setIsApproving(false);
    }
  };

  /**
   * Handle KYC rejection
   * Backend handles both contract call and database update
   */
  const handleReject = async (id: string) => {
    setActionError(null);
    setSuccessMessage(null);
    setIsRejecting(true);

    try {
      const { data, error } = await api.rejectKYC(id, rejectReason || undefined);
      
      if (error) {
        throw new Error(error);
      }

      // Success - refresh the list, close modals, and show message
      await fetchApplications();
      setSelectedApp(null);
      setShowRejectModal(false);
      setRejectReason('');
      setSuccessMessage('KYC rejected. Email notification sent to user.');
      
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to reject KYC');
    } finally {
      setIsRejecting(false);
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

      {/* Success Message */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-4 bg-green-500/10! border border-green-500/20! rounded-xl"
          >
            <FiCheck className="text-green-500! shrink-0" size={20} />
            <span className="text-green-400! flex-1">{successMessage}</span>
            <button 
              onClick={() => setSuccessMessage(null)}
              className="text-green-400! hover:text-green-300"
            >
              <FiX size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {actionError && !selectedApp && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-4 bg-red-500/10! border border-red-500/20! rounded-xl"
          >
            <FiAlertCircle className="text-red-500! shrink-0" size={20} />
            <span className="text-red-400! flex-1">{actionError}</span>
            <button 
              onClick={() => setActionError(null)}
              className="text-red-400! hover:text-red-300"
            >
              <FiX size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10! w-full"
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
                            {/* {app.status === 'PENDING' && (
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
                            )} */}
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

              <div className="modal-body space-y-4 max-h-[70vh] overflow-y-auto">
                {actionError && (
                  <div className="alert! alert-error! bg-red-500/10! border border-red-500/20! p-4 rounded-lg flex gap-3 items-center">
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

                {/* Personal Information */}
                <div>
                  <h4 className="text-sm font-semibold text-primary! mb-3">Personal Information</h4>
                  <div className="space-y-2 bg-[var(--bg-deep)] rounded-lg p-3">
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)] text-sm">Full Name</span>
                      <span className="font-medium text-sm">{selectedApp.fullName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)] text-sm">Email</span>
                      <span className="font-medium text-sm">{selectedApp.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)] text-sm">Date of Birth</span>
                      <span className="font-medium text-sm">
                        {selectedApp.dateOfBirth ? new Date(selectedApp.dateOfBirth).toLocaleDateString() : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)] text-sm">Nationality</span>
                      <span className="font-medium text-sm">{selectedApp.nationality || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)] text-sm">Wallet Address</span>
                      <span className="font-mono text-sm">
                        {selectedApp.user?.walletAddress 
                          ? `${selectedApp.user.walletAddress.slice(0, 6)}...${selectedApp.user.walletAddress.slice(-4)}`
                          : '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ID Information */}
                <div>
                  <h4 className="text-sm font-semibold text-primary! mb-3">ID Information</h4>
                  <div className="space-y-2 bg-[var(--bg-deep)] rounded-lg p-3">
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)] text-sm">ID Type</span>
                      <span className="font-medium text-sm">{selectedApp.idType.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)] text-sm">ID Number</span>
                      <span className="font-medium text-sm">{selectedApp.idNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)] text-sm">Expiry Date</span>
                      <span className="font-medium text-sm">
                        {selectedApp.idExpiryDate ? new Date(selectedApp.idExpiryDate).toLocaleDateString() : '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div>
                  <h4 className="text-sm font-semibold text-primary! mb-3">Address</h4>
                  <div className="space-y-2 bg-[var(--bg-deep)] rounded-lg p-3">
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)] text-sm">Street Address</span>
                      <span className="font-medium text-sm text-right max-w-[60%]">{selectedApp.address || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)] text-sm">City</span>
                      <span className="font-medium text-sm">{selectedApp.city || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)] text-sm">Country</span>
                      <span className="font-medium text-sm">{selectedApp.country || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)] text-sm">Postal Code</span>
                      <span className="font-medium text-sm">{selectedApp.postalCode || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Submission Details */}
                <div>
                  <h4 className="text-sm font-semibold text-primary! mb-3">Submission Details</h4>
                  <div className="space-y-2 bg-[var(--bg-deep)] rounded-lg p-3">
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)] text-sm">Submitted At</span>
                      <span className="font-medium text-sm">{formatDateTime(selectedApp.submittedAt)}</span>
                    </div>
                    {selectedApp.reviewedAt && (
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)] text-sm">Reviewed At</span>
                        <span className="font-medium text-sm">{formatDateTime(selectedApp.reviewedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rejection Reason */}
                {selectedApp.rejectionReason && (
                  <div>
                    <h4 className="text-sm font-semibold text-[var(--text-muted)] mb-3">Rejection Reason</h4>
                    <div className="bg-[var(--accent-red)]/10 border border-[var(--accent-red)]/20 rounded-lg p-3">
                      <span className="text-[var(--accent-red)] text-sm">{selectedApp.rejectionReason}</span>
                    </div>
                  </div>
                )}

                {/* ID Document */}
                <div>
                  <h4 className="text-sm font-semibold text-primary! mb-3">ID Document</h4>
                  {selectedApp.idDocumentUrl && selectedApp.idDocumentUrl.startsWith('http') ? (
                    <div className="space-y-3">
                      <div className="rounded-lg overflow-hidden border border-[var(--border-subtle)]">
                        <img 
                          src={selectedApp.idDocumentUrl} 
                          alt="ID Document" 
                          className="w-full h-auto max-h-[200px] object-contain bg-[var(--bg-deep)]"
                        />
                      </div>
                      <a
                        href={selectedApp.idDocumentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary w-full"
                      >
                        <FiDownload size={16} />
                        Open Full Size
                      </a>
                    </div>
                  ) : (
                    <a
                      href={selectedApp.idDocumentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary w-full"
                    >
                      <FiDownload size={16} />
                      View Document
                    </a>
                  )}
                </div>
              </div>

              {selectedApp.status === 'PENDING' && (
                <div className="modal-footer">
                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={isApproving || isRejecting}
                    className="btn btn-secondary text-[var(--accent-red)]"
                  >
                    <FiX size={16} />
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(selectedApp.id)}
                    disabled={isApproving || isRejecting}
                    className="btn btn-primary"
                  >
                    {isApproving ? (
                      <>
                        <FiLoader className="animate-spin" size={16} />
                        Processing...
                      </>
                    ) : (
                      <>
                        <FiCheck size={16} />
                        Approve
                      </>
                    )}
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
                  disabled={isRejecting}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(selectedApp.id)}
                  disabled={isRejecting}
                  className="btn bg-red-500! text-white hover:bg-[var(--accent-red)]/80"
                >
                  {isRejecting ? (
                    <>
                      <FiLoader className="animate-spin" size={16} />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FiX size={16} />
                      Reject Application
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
