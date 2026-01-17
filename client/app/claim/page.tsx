'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiSearch, FiArrowRight, FiGift, FiArrowLeft } from 'react-icons/fi';

export default function ClaimLandingPage() {
  const router = useRouter();
  const [planId, setPlanId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!planId || isNaN(parseInt(planId))) {
      setError('Please enter a valid plan ID');
      return;
    }

    router.push(`/claim/${planId}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <nav className="border-b border-white/5 bg-[#0D1A1E]/20 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 group">
              <img src="/img/logo.svg" alt="InheritX" className="w-10 h-10" />
              <span className="text-lg font-bold text-[#E2E8F0]">InheritX</span>
            </Link>

            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 rounded-lg transition-colors"
            >
              <FiArrowLeft size={16} />
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--primary-muted)] flex items-center justify-center">
              <FiGift className="text-[var(--primary)]" size={40} />
            </div>
            <h1 className="text-2xl font-bold mb-2">Claim Your Inheritance</h1>
            <p className="text-[var(--text-secondary)]">
              Enter your plan ID to access your inheritance claim.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="card p-6 space-y-4">
            <div className="input-group">
              <label className="input-label">Plan ID</label>
              <div className="relative">
                <input
                  type="text"
                  value={planId}
                  onChange={(e) => setPlanId(e.target.value)}
                  className={`input pl-10! ${error ? 'input-error' : ''}`}
                  placeholder="Enter plan ID (e.g., 1)"
                />
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              </div>
              {error && <p className="text-sm text-[var(--accent-red)] mt-1">{error}</p>}
            </div>

            <button type="submit" className="btn btn-primary w-full">
              Continue
              <FiArrowRight size={16} />
            </button>
          </form>

          <p className="text-center text-sm text-[var(--text-muted)] mt-6">
            Don&apos;t have a plan ID? Check your email from the plan creator for claim
            instructions.
          </p>
        </motion.div>
      </main>
    </div>
  );
}
