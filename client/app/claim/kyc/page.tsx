'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    FiArrowLeft,
    FiUpload,
    FiCheck,
    FiAlertCircle,
    FiLoader,
    FiShield,
    FiClock,
} from 'react-icons/fi';
import { api, BeneficiaryKYCStatus } from '@/lib/api';

export default function BeneficiaryKYCPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const email = searchParams.get('email') || '';
    const returnTo = searchParams.get('returnTo') || '/claim';

    const [kycStatus, setKycStatus] = useState<BeneficiaryKYCStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        email: email,
        fullName: '',
        dateOfBirth: '',
        nationality: '',
        idType: 'PASSPORT' as 'PASSPORT' | 'DRIVERS_LICENSE' | 'NATIONAL_ID' | 'OTHER',
        idNumber: '',
        idExpiryDate: '',
        address: '',
        city: '',
        country: '',
        postalCode: '',
    });
    const [idDocument, setIdDocument] = useState<File | null>(null);

    // Check existing KYC status
    useEffect(() => {
        const checkStatus = async () => {
            if (!email) {
                setIsLoading(false);
                return;
            }

            try {
                const { data } = await api.getBeneficiaryKYCStatus(email);
                if (data) {
                    setKycStatus(data);
                    if (data.fullName) {
                        setFormData((prev) => ({ ...prev, fullName: data.fullName || '' }));
                    }
                }
            } catch (err) {
                console.error('Error checking KYC status:', err);
            } finally {
                setIsLoading(false);
            }
        };

        checkStatus();
    }, [email]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            if (!idDocument) {
                throw new Error('Please upload your ID document');
            }

            const submitData = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                submitData.append(key, value);
            });
            submitData.append('idDocument', idDocument);

            const { data, error: submitError } = await api.submitBeneficiaryKYC(submitData);

            if (submitError) {
                throw new Error(submitError);
            }

            setSuccess(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit KYC');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="spinner mx-auto" />
                    <p className="mt-4 text-[var(--text-secondary)]">Checking KYC status...</p>
                </div>
            </div>
        );
    }

    // Already approved
    if (kycStatus?.status === 'APPROVED') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="card p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--accent-green)]/20 flex items-center justify-center">
                        <FiCheck className="text-[var(--accent-green)]" size={32} />
                    </div>
                    <h1 className="text-xl font-bold mb-2">KYC Already Approved</h1>
                    <p className="text-[var(--text-secondary)] mb-6">
                        Your identity has been verified. You can proceed with your claim.
                    </p>
                    <Link href={returnTo} className="btn btn-primary">
                        <FiArrowLeft size={16} />
                        Return to Claim
                    </Link>
                </div>
            </div>
        );
    }

    // Pending review
    if (kycStatus?.status === 'PENDING') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="card p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
                        <FiClock className="text-yellow-500" size={32} />
                    </div>
                    <h1 className="text-xl font-bold mb-2">KYC Under Review</h1>
                    <p className="text-[var(--text-secondary)] mb-6">
                        Your KYC submission is being reviewed by our team. This usually takes 1-2 business days.
                    </p>
                    <Link href={returnTo} className="btn btn-secondary">
                        <FiArrowLeft size={16} />
                        Return to Claim
                    </Link>
                </div>
            </div>
        );
    }

    // Submission success
    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="card p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--accent-green)]/20 flex items-center justify-center">
                        <FiCheck className="text-[var(--accent-green)]" size={32} />
                    </div>
                    <h1 className="text-xl font-bold mb-2">KYC Submitted Successfully</h1>
                    <p className="text-[var(--text-secondary)] mb-6">
                        Your documents are now under review. You will be notified once approved.
                    </p>
                    <Link href={returnTo} className="btn btn-primary">
                        <FiArrowLeft size={16} />
                        Return to Claim
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-deep)]">
            <nav className="border-b border-white/5 bg-[#0D1A1E]/20 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/" className="flex items-center gap-2">
                            <img src="/img/logo.svg" alt="InheritX" className="w-10 h-10" />
                            <span className="text-lg font-bold">InheritX</span>
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="max-w-2xl mx-auto p-4 py-8">
                <Link
                    href={returnTo}
                    className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--primary)] mb-6"
                >
                    <FiArrowLeft size={16} />
                    Back to Claim
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card p-6"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-[var(--primary-muted)] flex items-center justify-center">
                            <FiShield className="text-[var(--primary)]" size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">Identity Verification</h1>
                            <p className="text-[var(--text-secondary)]">
                                Complete KYC to claim your inheritance
                            </p>
                        </div>
                    </div>

                    {kycStatus?.status === 'REJECTED' && (
                        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg mb-6">
                            <div className="flex gap-2 items-center text-red-400">
                                <FiAlertCircle size={18} />
                                <span>Your previous submission was rejected</span>
                            </div>
                            {kycStatus.rejectionReason && (
                                <p className="mt-2 text-sm text-red-300">
                                    Reason: {kycStatus.rejectionReason}
                                </p>
                            )}
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg mb-6">
                            <div className="flex gap-2 items-center text-red-400">
                                <FiAlertCircle size={18} />
                                <span>{error}</span>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="input-group sm:col-span-2">
                                <label className="input-label">Email *</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="input"
                                    required
                                />
                            </div>

                            <div className="input-group sm:col-span-2">
                                <label className="input-label">Full Legal Name *</label>
                                <input
                                    type="text"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    className="input"
                                    placeholder="As shown on your ID"
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Date of Birth *</label>
                                <input
                                    type="date"
                                    value={formData.dateOfBirth}
                                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                    className="input"
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Nationality *</label>
                                <input
                                    type="text"
                                    value={formData.nationality}
                                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                                    className="input"
                                    placeholder="e.g., Nigerian"
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">ID Type *</label>
                                <select
                                    value={formData.idType}
                                    onChange={(e) => setFormData({ ...formData, idType: e.target.value as any })}
                                    className="input"
                                    required
                                >
                                    <option value="PASSPORT">Passport</option>
                                    <option value="NATIONAL_ID">National ID</option>
                                    <option value="DRIVERS_LICENSE">Driver&apos;s License</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>

                            <div className="input-group">
                                <label className="input-label">ID Number *</label>
                                <input
                                    type="text"
                                    value={formData.idNumber}
                                    onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                                    className="input"
                                    required
                                />
                            </div>

                            <div className="input-group sm:col-span-2">
                                <label className="input-label">ID Expiry Date *</label>
                                <input
                                    type="date"
                                    value={formData.idExpiryDate}
                                    onChange={(e) => setFormData({ ...formData, idExpiryDate: e.target.value })}
                                    className="input"
                                    required
                                />
                            </div>

                            <div className="input-group sm:col-span-2">
                                <label className="input-label">Address *</label>
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="input"
                                    placeholder="Street address"
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">City *</label>
                                <input
                                    type="text"
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    className="input"
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Country *</label>
                                <input
                                    type="text"
                                    value={formData.country}
                                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                    className="input"
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Postal Code *</label>
                                <input
                                    type="text"
                                    value={formData.postalCode}
                                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                                    className="input"
                                    required
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label className="input-label">ID Document *</label>
                            <div
                                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${idDocument
                                        ? 'border-[var(--accent-green)] bg-[var(--accent-green)]/5'
                                        : 'border-[var(--border-subtle)] hover:border-[var(--primary)]'
                                    }`}
                                onClick={() => document.getElementById('idDocument')?.click()}
                            >
                                <input
                                    id="idDocument"
                                    type="file"
                                    accept="image/jpeg,image/png,application/pdf"
                                    className="hidden"
                                    onChange={(e) => setIdDocument(e.target.files?.[0] || null)}
                                />
                                {idDocument ? (
                                    <div className="flex items-center justify-center gap-2 text-[var(--accent-green)]">
                                        <FiCheck size={20} />
                                        <span>{idDocument.name}</span>
                                    </div>
                                ) : (
                                    <>
                                        <FiUpload className="mx-auto mb-2 text-[var(--text-muted)]" size={24} />
                                        <p className="text-[var(--text-secondary)]">
                                            Click to upload ID document
                                        </p>
                                        <p className="text-xs text-[var(--text-muted)] mt-1">
                                            JPG, PNG, or PDF (max 5MB)
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="btn btn-primary w-full"
                        >
                            {isSubmitting ? (
                                <>
                                    <FiLoader className="animate-spin" size={18} />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <FiShield size={18} />
                                    Submit KYC
                                </>
                            )}
                        </button>
                    </form>
                </motion.div>
            </main>
        </div>
    );
}
