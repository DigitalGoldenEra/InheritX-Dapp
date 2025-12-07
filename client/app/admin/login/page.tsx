"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FiMail, FiLock, FiAlertCircle, FiLoader } from "react-icons/fi";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const { adminLogin, isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated as admin
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
        router.replace("/admin");
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await adminLogin(email, password);

      if (!result.success) {
        throw new Error(result.error || "Login failed");
      }

      // Auth state is now updated, redirect to admin
      router.replace("/admin");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Login failed. Please try again."
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#0A0E12]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#12181E] border border-white/6 rounded-[20px] p-8 max-w-[420px] w-full"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/img/logo.svg" className="mx-auto mb-5" />
          <h1 className="text-2xl font-bold mb-2">Admin Login</h1>
          <p className="text-[#A0AEC0] text-sm">
            Sign in to access the admin dashboard
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] rounded-xl flex items-start gap-3"
          >
            <FiAlertCircle
              className="text-[#EF4444] flex-shrink-0 mt-0.5"
              size={18}
            />
            <p className="text-sm text-[#EF4444]">{error}</p>
          </motion.div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-[#A0AEC0] mb-2"
            >
              Email Address
            </label>
            <div className="relative">
              <FiMail
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]"
                size={18}
              />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input pl-10! w-full"
                placeholder="admin@inheritx.com"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-[#A0AEC0] mb-2"
            >
              Password
            </label>
            <div className="relative">
              <FiLock
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]"
                size={18}
              />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="input pl-10! w-full"
                placeholder="Enter your password"
                disabled={isLoading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary w-full"
          >
            {isLoading ? (
              <>
                <FiLoader className="animate-spin" size={18} />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 pt-6 border-t border-white/6 text-center">
          <Link
            href="/"
            className="text-sm text-[#64748B] hover:text-[#33C5E0] transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
