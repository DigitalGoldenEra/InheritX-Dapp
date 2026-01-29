'use client';

import { useState, useEffect } from 'react';
import { api, User } from '@/lib/api';
import { FiShield, FiCheckCircle, FiAlertTriangle, FiLock } from 'react-icons/fi';
import { motion } from 'framer-motion';

export default function SecurityPage() {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [setupData, setSetupData] = useState<{ secret: string; qrCode: string } | null>(null);
    const [verificationCode, setVerificationCode] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        fetchUser();
    }, []);

    const fetchUser = async () => {
        try {
            const { data } = await api.getMe();
            if (data) setUser(data);
        } catch (err) {
            console.error('Error fetching user:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const start2FASetup = async () => {
        setError(null);
        try {
            const { data, error } = await api.setup2FA();
            if (error) {
                setError(error);
                return;
            }
            if (data) {
                setSetupData(data);
            }
        } catch (err) {
            setError('Failed to start 2FA setup');
        }
    };

    const verify2FA = async () => {
        setError(null);
        setSuccess(null);
        setIsVerifying(true);

        try {
            const { data, error } = await api.verify2FA(verificationCode);
            if (error) {
                setError(error);
            } else if (data?.success) {
                setSuccess('2FA enabled successfully!');
                setSetupData(null);
                setVerificationCode('');
                fetchUser(); // Refresh user data to update UI
            }
        } catch (err) {
            setError('Failed to verify code');
        } finally {
            setIsVerifying(false);
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center">Loading security settings...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold mb-2">Security Settings</h1>
                <p className="text-[var(--text-secondary)]">Manage your account security and 2-step verification.</p>
            </div>

            <div className="card p-6">
                <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                        <div>
                            <h2 className="text-lg font-semibold mb-1">Two-Factor Authentication (2FA)</h2>
                            <p className="text-[var(--text-secondary)] max-w-xl">
                                Protect your account by requiring an authentication code in addition to your wallet signature.
                                2FA is required to create inheritance plans.
                            </p>
                        </div>
                    </div>

                    {user?.twoFactorEnabled && (
                        <div className="badge badge-success flex items-center gap-2 px-3 py-1">
                            <FiCheckCircle /> Enabled
                        </div>
                    )}
                </div>

                {!user?.twoFactorEnabled && !setupData && (
                    <div className="mt-6">
                        <button
                            onClick={start2FASetup}
                            className="btn btn-primary"
                        >
                            <FiLock className="mr-2" />
                            Setup 2FA
                        </button>
                    </div>
                )}

                {/* Setup Flow */}
                {setupData && !user?.twoFactorEnabled && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-8 pl-16 border-t border-[var(--border-color)] pt-6"
                    >
                        <h3 className="font-medium mb-4">Step 1: Scan QR Code</h3>
                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            <div className="bg-white p-2 rounded-lg">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={setupData.qrCode} alt="2FA QR Code" className="w-48 h-48" />
                            </div>
                            <div className="flex-1 space-y-4">
                                <p className="text-sm text-[var(--text-secondary)]">
                                    Open your authenticator app (Google Authenticator, Authy, etc.) and scan this QR code.
                                    If you can't scan, manually enter this secret key:
                                </p>
                                <div className="p-3 bg-[var(--bg-elevated)] rounded border border-[var(--border-color)] font-mono text-sm break-all">
                                    {setupData.secret}
                                </div>

                                <div className="pt-4">
                                    <h3 className="font-medium mb-2">Step 2: Enter Verification Code</h3>
                                    <div className="flex gap-2 max-w-xs">
                                        <input
                                            type="text"
                                            className="input"
                                            placeholder="000000"
                                            maxLength={6}
                                            value={verificationCode}
                                            onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                                        />
                                        <button
                                            onClick={verify2FA}
                                            disabled={isVerifying || verificationCode.length !== 6}
                                            className="btn btn-primary"
                                        >
                                            {isVerifying ? 'Verifying...' : 'Verify'}
                                        </button>
                                    </div>
                                    {error && (
                                        <div className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                            <FiAlertTriangle size={14} /> {error}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {success && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-4 pl-16 text-green-500 flex items-center gap-2"
                    >
                        <FiCheckCircle /> {success}
                    </motion.div>
                )}
            </div>
        </div>
    );
}
