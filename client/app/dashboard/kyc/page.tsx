'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiCheck, 
  FiClock, 
  FiShield,
  FiAlertCircle
} from 'react-icons/fi';
import { useAuth } from '@/hooks/useAuth';
import { api, KYCStatus } from '@/lib/api';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { inheritXABI } from '@/contract/abi';
import { INHERITX_CONTRACT_ADDRESS } from '@/lib/contract';
import Input from '@/components/Input';

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
      if (!formData.fullName || !formData.email || !formData.dateOfBirth || !formData.nationality || 
          !formData.idType || !formData.idNumber || !formData.idExpiryDate || 
          !formData.address || !formData.city || !formData.country || !formData.postalCode) {
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
      <div className="max-w-2xl my-10 mx-auto">
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
    <div className="max-w-5xl mx-auto py-5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mb-6">
          <h1 className="text-3xl mb-2 font-bold">KYC Verification</h1>
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

        <form onSubmit={handleSubmit} className="border border-white/6 rounded-[15px] p-8 space-y-6">
          {/* Personal Information */}
          <div>
            <h3 className="font-semibold text-2xl mb-6 flex items-center text-primary gap-2">
              Personal Information
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Full Name"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="As shown on ID"
                required
              />
              <Input
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="your@email.com"
                required
              />
              <Input
                label="Date of Birth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                required
              />
              <Input
                label="Nationality"
                name="nationality"
                type="text"
                value={formData.nationality}
                onChange={handleInputChange}
                placeholder="Country of citizenship"
                required
              />
            </div>
          </div>

          <div className="divider" />

          {/* ID Document */}
          <div>
            <h3 className="font-semibold text-2xl mb-6 flex items-center text-primary gap-2">
              Identity Document
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="ID Type"
                name="idType"
                type="select"
                value={formData.idType}
                onChange={handleInputChange}
                options={ID_TYPES}
                required
              />
              <Input
                label="ID Number"
                name="idNumber"
                type="text"
                value={formData.idNumber}
                onChange={handleInputChange}
                placeholder="Document number"
                required
              />
              <Input
                label="Expiry Date"
                name="idExpiryDate"
                type="date"
                value={formData.idExpiryDate}
                onChange={handleInputChange}
                colSpan={2}
                required
              />
            </div>

            {/* File Upload */}
            <div className="mt-4">
              <Input
                label="Upload ID Document"
                name="idDocument"
                type="file"
                onFileChange={handleFileChange}
                accept=".jpg,.jpeg,.png,.pdf"
                file={idDocument}
                required
              />
            </div>
          </div>

          <div className="divider" />

          {/* Address */}
          <div>
            <h3 className="font-semibold mb-4">Address</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Street Address"
                name="address"
                type="text"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Street address"
                colSpan={2}
                required
              />
              <Input
                label="City"
                name="city"
                type="text"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="City"
                required
              />
              <Input
                label="Country"
                name="country"
                type="text"
                value={formData.country}
                onChange={handleInputChange}
                placeholder="Country"
                required
              />
              <Input
                label="Postal Code"
                name="postalCode"
                type="text"
                value={formData.postalCode}
                onChange={handleInputChange}
                placeholder="Postal code"
                required
              />
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
