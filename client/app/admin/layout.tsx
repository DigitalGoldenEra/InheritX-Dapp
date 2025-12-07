'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { 
  FiHome, 
  FiUsers, 
  FiShield, 
  FiFileText, 
  FiActivity,
  FiMenu,
  FiX,
  FiLogOut,
  FiArrowLeft,
  FiLock,
  FiAlertTriangle
} from 'react-icons/fi';
import { useAuth } from '@/hooks/useAuth';

const adminNavItems = [
  { href: '/admin', icon: FiHome, label: 'Dashboard' },
  { href: '/admin/kyc', icon: FiShield, label: 'KYC Management' },
  { href: '/admin/users', icon: FiUsers, label: 'Users' },
  { href: '/admin/plans', icon: FiFileText, label: 'All Plans' },
  { href: '/admin/activity', icon: FiActivity, label: 'Activity Log' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isConnected } = useAccount();
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  // If on login page, render children directly without layout checks
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Show loading state while checking auth
  if (!mounted || isLoading) {
    return (
      <div className="page-loader">
        <div className="spinner" />
        <p className="mt-4 text-[#A0AEC0]">Loading...</p>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    // Use effect for redirect to avoid render-time navigation
    return (
      <RedirectToLogin />
    );
  }

  // Check admin role - if not admin, redirect to user dashboard
  if (user && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#0A0E12]">
        <div className="bg-[#12181E] border border-white/6 rounded-[20px] p-12 max-w-[400px] text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[rgba(239,68,68,0.1)] flex items-center justify-center">
            <FiLock size={28} color="#EF4444" />
          </div>
          <h1 className="text-xl font-bold mb-2">Access Denied</h1>
          <p className="text-[#A0AEC0] text-sm mb-6">
            You don&apos;t have permission to access the admin dashboard.
          </p>
          <Link href="/dashboard" className="btn btn-primary">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Wallet is optional for viewing - show banner if not connected

  return (
    <>
      <div className="min-h-screen flex bg-[#0A0E12]">
        {/* Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`fixed left-0 top-0 bottom-0 w-[280px] bg-[#12181E] border-r border-white/6 flex flex-col z-50 transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          {/* Logo */}
          <div className="p-5 border-b border-white/6 flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-2.5 no-underline text-white">
              <img src="/img/logo.svg" alt="InheritX logo" width={36} height={36} />
              <div>
                <span className="font-bold text-lg">InheritX</span>
                <span className="badge badge-purple ml-2 text-[10px]">Admin</span>
              </div>
            </Link>
            <button 
              className="lg:hidden p-2 bg-transparent border-none cursor-pointer text-[#A0AEC0]"
              onClick={() => setSidebarOpen(false)}
            >
              <FiX size={20} />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 py-4 px-3 overflow-y-auto">
            <div className="mb-6">
              <div className="text-[11px] font-semibold uppercase tracking-[1px] text-[#64748B] px-3 py-2">
                Administration
              </div>
              {adminNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 p-3 rounded-[10px] no-underline text-sm font-medium mb-1 ${
                    isActive(item.href) 
                      ? 'text-[#33C5E0] bg-[rgba(51,197,224,0.1)]' 
                      : 'text-[#A0AEC0] bg-transparent'
                  }`}
                >
                  <item.icon size={18} />
                  {item.label}
                </Link>
              ))}
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[1px] text-[#64748B] px-3 py-2">
                Quick Links
              </div>
              <Link
                href="/dashboard"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 p-3 rounded-[10px] text-[#A0AEC0] bg-transparent no-underline text-sm font-medium mb-1"
              >
                <FiArrowLeft size={18} />
                Back to Dashboard
              </Link>
              <button
                onClick={logout}
                className="flex items-center gap-3 p-3 rounded-[10px] text-[#EF4444] bg-transparent border-none cursor-pointer text-sm font-medium w-full text-left"
              >
                <FiLogOut size={18} />
                Sign Out
              </button>
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-white/6">
            <div className="bg-[#0A0E12] rounded-xl p-3">
              <div className="text-xs text-[#64748B] mb-1">Logged in as</div>
              <div className="font-medium text-sm mb-0.5">{user?.name || 'Admin'}</div>
              <div className="text-xs text-[#33C5E0]">{user?.role}</div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 ml-0 min-w-0 lg:ml-[280px]">
          {/* Header */}
          <header className="sticky top-0 z-30 bg-[rgba(10,14,18,0.9)] backdrop-blur-[20px] border-b border-white/6">
            <div className="flex items-center justify-between h-16 px-6">
              <button
                className="lg:hidden p-2 bg-transparent border-none cursor-pointer text-[#A0AEC0]"
                onClick={() => setSidebarOpen(true)}
              >
                <FiMenu size={20} />
              </button>

              <div className="hidden lg:block" />

              <ConnectButton />
            </div>
          </header>

          {/* Wallet connection banner - shown when wallet not connected */}
          {!isConnected && (
            <div className="mx-6 mt-4 p-4 bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.3)] rounded-xl flex items-center gap-3">
              <FiAlertTriangle className="text-[#F59E0B] flex-shrink-0" size={20} />
              <div className="flex-1">
                <p className="text-sm text-[#F59E0B] font-medium">Wallet not connected</p>
                <p className="text-xs text-[#A0AEC0]">Connect your wallet to perform blockchain operations like KYC approval.</p>
              </div>
              <ConnectButton />
            </div>
          )}

          <main className="p-6 min-h-[calc(100vh-64px)]">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}

/**
 * Component to handle redirect to login page
 * Separated to avoid render-time navigation issues
 */
function RedirectToLogin() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/login');
  }, [router]);

  return (
    <div className="page-loader">
      <div className="spinner" />
      <p className="mt-4 text-[#A0AEC0]">Redirecting to login...</p>
    </div>
  );
}
