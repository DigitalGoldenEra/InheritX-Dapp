'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiSave, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '@/hooks/useAuth';
import { formatAddress } from '@/lib/contract';

export default function SettingsPage() {
  const { user, address, updateProfile } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSaving(true);

    try {
      const result = await updateProfile({ name, email });
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update profile');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-[var(--text-secondary)]">
          Manage your account settings and preferences.
        </p>
      </div>

      {/* Profile Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6"
      >
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <FiUser className="text-[var(--primary)]" />
          Profile Information
        </h2>

        {error && (
          <div className="alert alert-error mb-4">
            <FiAlertCircle size={18} />
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success mb-4">
            <FiCheck size={18} />
            Profile updated successfully!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="input-group">
            <label className="input-label">Wallet Address</label>
            <input
              type="text"
              value={address ? formatAddress(address) : ''}
              className="input bg-[var(--bg-deep)]"
              disabled
            />
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Your wallet address cannot be changed.
            </p>
          </div>

          <div className="input-group">
            <label className="input-label">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="Enter your name"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="your@email.com"
            />
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Used for notifications about your plans.
            </p>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="btn btn-primary"
            >
              {isSaving ? (
                <>
                  <span className="spinner" />
                  Saving...
                </>
              ) : (
                <>
                  <FiSave size={16} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>

      {/* Account Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card p-6"
      >
        <h2 className="text-lg font-semibold mb-4">Account Information</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">Account Status</span>
            <span className="badge badge-success">Active</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">Role</span>
            <span className="badge badge-primary">{user?.role || 'User'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">KYC Status</span>
            <span className={`badge ${
              user?.kycStatus === 'APPROVED' ? 'badge-success' :
              user?.kycStatus === 'PENDING' ? 'badge-purple' :
              'badge-warning'
            }`}>
              {user?.kycStatus || 'Not Submitted'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">Plans Created</span>
            <span>{user?.planCount || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">Member Since</span>
            <span>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</span>
          </div>
        </div>
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card p-6 badge-error border border-[var(--accent-red)]/50"
      >
        <h2 className="text-lg font-semibold mb-4 text-[var(--accent-red)]">Danger Zone</h2>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Disconnecting your wallet will log you out. Your plans and data will remain safe on the blockchain.
        </p>
        <button className="btn btn-secondary text-[var(--accent-red)] border-[var(--accent-red)]/30 hover:bg-[var(--accent-red)]/10">
          Disconnect Wallet
        </button>
      </motion.div>
    </div>
  );
}

