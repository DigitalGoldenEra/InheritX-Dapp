'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiSearch, FiChevronLeft, FiChevronRight, FiShield, FiUser } from 'react-icons/fi';
import { api, User, Pagination } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { formatAddress, formatDateTime } from '@/lib/contract';

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await api.getAdminUsers({
        role: roleFilter === 'all' ? undefined : roleFilter,
        page,
        limit: 20,
      });

      if (data) {
        setUsers(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, page]);

  const handleRoleChange = async (userId: string, newRole: 'USER' | 'ADMIN' | 'SUPER_ADMIN') => {
    try {
      const { data, error } = await api.updateUserRole(userId, newRole);
      if (data) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      }
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  const getRoleBadge = (role: string) => {
    const badges: Record<string, { class: string }> = {
      USER: { class: 'badge-primary' },
      ADMIN: { class: 'badge-purple' },
      SUPER_ADMIN: { class: 'badge-success' },
    };
    return badges[role] || badges.USER;
  };

  const getKYCBadge = (status: string) => {
    const badges: Record<string, { class: string; label: string }> = {
      NOT_SUBMITTED: { class: 'badge-warning', label: 'No KYC' },
      PENDING: { class: 'badge-purple', label: 'Pending' },
      APPROVED: { class: 'badge-success', label: 'Verified' },
      REJECTED: { class: 'badge-error', label: 'Rejected' },
    };
    return badges[status] || badges.NOT_SUBMITTED;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-[var(--text-secondary)]">View and manage platform users.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search by address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'USER', 'ADMIN', 'SUPER_ADMIN'].map((role) => (
            <button
              key={role}
              onClick={() => {
                setRoleFilter(role);
                setPage(1);
              }}
              className={`btn btn-sm ${roleFilter === role ? 'btn-primary' : 'btn-secondary'}`}
            >
              {role === 'all' ? 'All' : role.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="spinner mx-auto" />
            <p className="mt-4 text-[var(--text-secondary)]">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <FiUser className="mx-auto text-[var(--text-muted)]" size={48} />
            <h3 className="mt-4 font-semibold">No Users Found</h3>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>KYC Status</th>
                    <th>Plans</th>
                    <th>Joined</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const kycBadge = getKYCBadge(user.kycStatus);
                    const roleBadge = getRoleBadge(user.role);
                    const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
                    const isCurrentUser = user.id === currentUser?.id;

                    return (
                      <tr key={user.id}>
                        <td>
                          <div>
                            <div className="font-medium font-mono">
                              {formatAddress(user.walletAddress)}
                            </div>
                            {user.name && (
                              <div className="text-sm text-[var(--text-muted)]">{user.name}</div>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${kycBadge.class}`}>{kycBadge.label}</span>
                        </td>
                        <td>{user.planCount}</td>
                        <td className="text-[var(--text-muted)]">
                          {formatDateTime(user.createdAt)}
                        </td>
                        <td>
                          {isSuperAdmin && !isCurrentUser ? (
                            <select
                              value={user.role}
                              onChange={(e) => handleRoleChange(user.id, e.target.value as any)}
                              className="input py-1 px-2 text-sm"
                            >
                              <option value="USER">User</option>
                              <option value="ADMIN">Admin</option>
                              <option value="SUPER_ADMIN">Super Admin</option>
                            </select>
                          ) : (
                            <span className={`badge ${roleBadge.class}`}>
                              {user.role.replace('_', ' ')}
                            </span>
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
