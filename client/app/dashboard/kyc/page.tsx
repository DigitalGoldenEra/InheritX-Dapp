'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiUpload, 
  FiCheck, 
  FiX, 
  FiClock, 
  FiShield,
  FiAlertCircle,
  FiFile
} from 'react-icons/fi';
import { useAuth } from '@/hooks/useAuth';
import { api, KYCStatus } from '@/lib/api';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { keccak256, encodePacked } from 'viem';
import { inheritXABI } from '@/contract/abi';
import { INHERITX_CONTRACT_ADDRESS } from '@/lib/contract';

const ID_TYPES = [
  { value: 'PASSPORT', label: 'International Passport' },
  { value: 'DRIVERS_LICENSE', label: "Driver's License" },
  { value: 'NATIONAL_ID', label: 'National ID Card' },
  { value: 'OTHER', label: 'Other Government ID' },
];

export default function KYCPage() {
  const { user, refreshUser } = useAuth();
  const [kycStatus, setKycStatus] = useState<KYCStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    dateOfBirth: '',
    nationality: '',
    idType: 'PASSPORT',
    idNumber: '',
    idExpiryDate: '',
    address: '',
    city: '',
    country: '',
    postalCode: '',
  });
  const [idDocument, setIdDocument] = useState<File | null>(null);

  // Contract interaction
  const { writeContract, data: txHash, isPending: isContractPending, error: contractError } = useWriteContract();
  const { isLoading: isWaiting, isSuccess: txSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    const fetchKYCStatus = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await api.getKYCStatus();
        if (data) {
          setKycStatus(data);
          if (data.fullName) setFormData(prev => ({ ...prev, fullName: data.fullName! }));
          if (data.email) setFormData(prev => ({ ...prev, email: data.email! }));
        }
      } catch (err) {
        console.error('Error fetching KYC status:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchKYCStatus();
  }, []);

  // Handle transaction success
  useEffect(() => {
    if (txSuccess) {
      setSuccess('KYC submitted successfully! Your verification is now pending review.');
      refreshUser();
      // Refetch KYC status
      api.getKYCStatus().then(({ data }) => {
        if (data) setKycStatus(data);
      });
    }
  }, [txSuccess, refreshUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      // Validate file type
      if (!['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'].includes(file.type)) {
        setError('File must be JPEG, PNG, or PDF');
        return;
      }
      setIdDocument(file);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!formData.fullName || !formData.email || !formData.idType || !formData.idNumber) {
        throw new Error('Please fill in all required fields');
      }

      if (!idDocument) {
        throw new Error('Please upload your ID document');
      }

      // Create FormData for upload
      const uploadData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value) uploadData.append(key, value);
      });
      uploadData.append('idDocument', idDocument);

      // Submit to backend
      const { data, error: submitError } = await api.submitKYC(uploadData);

      if (submitError || !data) {
        throw new Error(submitError || 'Failed to submit KYC');
      }

      // Submit hash to smart contract
      const kycDataHash = data.kycDataHash as `0x${string}`;
      
      writeContract({
        address: INHERITX_CONTRACT_ADDRESS,
        abi: inheritXABI,
        functionName: 'submitKYC',
        args: [kycDataHash],
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit KYC');
      setIsSubmitting(false);
    }
  };

  // Update submitting state based on contract state
  useEffect(() => {
    if (!isContractPending && !isWaiting) {
      setIsSubmitting(false);
    }
  }, [isContractPending, isWaiting]);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card p-8">
          <div className="skeleton h-8 w-48 mb-4" />
          <div className="skeleton h-4 w-full mb-2" />
          <div className="skeleton h-4 w-3/4" />
        </div>
      </div>
    );
  }

  // Show status if already submitted
  if (kycStatus && kycStatus.status !== 'NOT_SUBMITTED' && kycStatus.status !== 'REJECTED') {
    return (
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-8 text-center"
        >
          <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${
            kycStatus.status === 'APPROVED' 
              ? 'bg-[var(--accent-green)]/20' 
              : 'bg-[var(--accent-purple)]/20'
          }`}>
            {kycStatus.status === 'APPROVED' ? (
              <FiCheck className="text-[var(--accent-green)]" size={40} />
            ) : (
              <FiClock className="text-[var(--accent-purple)]" size={40} />
            )}
          </div>

          <h1 className="text-2xl font-bold mb-2">
            {kycStatus.status === 'APPROVED' ? 'KYC Verified' : 'KYC Pending Review'}
          </h1>
          <p className="text-[var(--text-secondary)] mb-6">
            {kycStatus.status === 'APPROVED' 
              ? 'Your identity has been verified. You can now create inheritance plans.'
              : 'Your KYC submission is being reviewed. This usually takes 24-48 hours.'}
          </p>

          <div className="card bg-[var(--bg-deep)] p-4 text-left space-y-3">
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Full Name</span>
              <span>{kycStatus.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Email</span>
              <span>{kycStatus.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">ID Type</span>
              <span>{kycStatus.idType?.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Submitted</span>
              <span>{kycStatus.submittedAt ? new Date(kycStatus.submittedAt).toLocaleDateString() : '-'}</span>
            </div>
            {kycStatus.reviewedAt && (
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Reviewed</span>
                <span>{new Date(kycStatus.reviewedAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mb-6">
          <h1 className="text-2xl font-bold">KYC Verification</h1>
          <p className="text-[var(--text-secondary)]">
            Complete your identity verification to create inheritance plans.
          </p>
        </div>

        {kycStatus?.status === 'REJECTED' && (
          <div className="alert alert-error mb-6">
            <FiAlertCircle size={20} />
            <div>
              <div className="font-medium">Previous submission rejected</div>
              <div className="text-sm opacity-80">
                {kycStatus.rejectionReason || 'Please resubmit with valid documents.'}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="alert alert-error mb-6">
            <FiAlertCircle size={20} />
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success mb-6">
            <FiCheck size={20} />
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="card p-6 space-y-6">
          {/* Personal Information */}
          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <FiShield className="text-[var(--primary)]" />
              Personal Information
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="input-group">
                <label className="input-label">Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="As shown on ID"
                  required
                />
              </div>
              <div className="input-group">
                <label className="input-label">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div className="input-group">
                <label className="input-label">Date of Birth</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className="input"
                />
              </div>
              <div className="input-group">
                <label className="input-label">Nationality</label>
                <input
                  type="text"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Country of citizenship"
                />
              </div>
            </div>
          </div>

          <div className="divider" />

          {/* ID Document */}
          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <FiFile className="text-[var(--primary)]" />
              Identity Document
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="input-group">
                <label className="input-label">ID Type *</label>
                <select
                  name="idType"
                  value={formData.idType}
                  onChange={handleInputChange}
                  className="input"
                  required
                >
                  {ID_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">ID Number *</label>
                <input
                  type="text"
                  name="idNumber"
                  value={formData.idNumber}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Document number"
                  required
                />
              </div>
              <div className="input-group md:col-span-2">
                <label className="input-label">Expiry Date</label>
                <input
                  type="date"
                  name="idExpiryDate"
                  value={formData.idExpiryDate}
                  onChange={handleInputChange}
                  className="input"
                />
              </div>
            </div>

            {/* File Upload */}
            <div className="mt-4">
              <label className="input-label">Upload ID Document *</label>
              <div className="mt-2">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[var(--border-default)] rounded-xl cursor-pointer hover:border-[var(--primary)] transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {idDocument ? (
                      <>
                        <FiCheck className="text-[var(--accent-green)] mb-2" size={24} />
                        <p className="text-sm text-[var(--text-secondary)]">{idDocument.name}</p>
                        <p className="text-xs text-[var(--text-muted)]">Click to replace</p>
                      </>
                    ) : (
                      <>
                        <FiUpload className="text-[var(--primary)] mb-2" size={24} />
                        <p className="text-sm text-[var(--text-secondary)]">Click to upload</p>
                        <p className="text-xs text-[var(--text-muted)]">JPEG, PNG or PDF (max 5MB)</p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="divider" />

          {/* Address (Optional) */}
          <div>
            <h3 className="font-semibold mb-4">Address (Optional)</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="input-group md:col-span-2">
                <label className="input-label">Street Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Street address"
                />
              </div>
              <div className="input-group">
                <label className="input-label">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="City"
                />
              </div>
              <div className="input-group">
                <label className="input-label">Country</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Country"
                />
              </div>
              <div className="input-group">
                <label className="input-label">Postal Code</label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Postal code"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button
              type="submit"
              disabled={isSubmitting || isContractPending || isWaiting}
              className="btn btn-primary"
            >
              {isSubmitting || isContractPending || isWaiting ? (
                <>
                  <span className="spinner" />
                  {isWaiting ? 'Confirming...' : 'Submitting...'}
                </>
              ) : (
                <>
                  <FiShield size={18} />
                  Submit KYC
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
