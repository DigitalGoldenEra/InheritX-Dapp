'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  FiHome,
  FiFileText,
  FiShield,
  FiActivity,
  FiSettings,
  FiLogOut,
  FiX,
  FiGift,
  FiMenu,
  FiLock,
  FiBell,
  FiUser,
} from 'react-icons/fi';
import { formatAddress } from '@/lib/contract';

const navItems = [
  { href: '/dashboard', icon: FiHome, label: 'Overview' },
  { href: '/dashboard/plans', icon: FiFileText, label: 'My Plans' },
  { href: '/dashboard/kyc', icon: FiShield, label: 'KYC Verification' },
  { href: '/dashboard/activity', icon: FiActivity, label: 'Activity' },
  { href: '/dashboard/settings', icon: FiSettings, label: 'Settings' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isConnected } = useAccount();
  const { isLoading, isAuthenticated, login, logout, user, address } = useAuth();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isConnected && !isAuthenticated && !isLoading && isClient) {
      login();
    }
  }, [isConnected, isAuthenticated, isLoading, login, isClient]);

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  if (!isClient) {
    return (
      <div className="page-loader">
        <div className="spinner" />
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#0A0E12]">
        <div className="bg-[#12181E] border border-white/6 rounded-[20px] p-12 max-w-[400px] text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[rgba(51,197,224,0.1)] flex items-center justify-center">
            <FiLock size={28} color="#33C5E0" />
          </div>
          <h1 className="text-xl font-bold mb-2">Connect Your Wallet</h1>
          <p className="text-[#A0AEC0] text-sm mb-6">
            Connect your Web3 wallet to access the dashboard.
          </p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="page-loader">
        <div className="spinner" />
        <p className="mt-4 text-[#A0AEC0]">Authenticating...</p>
      </div>
    );
  }

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
        <aside
          className={`fixed left-0 top-0 bottom-0 w-[280px] bg-[#12181E] border-r border-white/6 flex flex-col z-50 transition-transform duration-300 lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Logo */}
          <div className="p-5 border-b border-white/6 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 no-underline text-white">
              <img src="/img/logo.svg" alt="InheritX logo" width={36} height={36} />
              <span className="font-bold text-lg">InheritX</span>
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
                Main Menu
              </div>
              {navItems.map((item) => (
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

            <div className="mb-6">
              <div className="text-[11px] font-semibold uppercase tracking-[1px] text-[#64748B] px-3 py-2">
                Beneficiary
              </div>
              <Link
                href="/claim"
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 p-3 rounded-[10px] no-underline text-sm font-medium ${
                  pathname.startsWith('/claim')
                    ? 'text-[#33C5E0] bg-[rgba(51,197,224,0.1)]'
                    : 'text-[#A0AEC0] bg-transparent'
                }`}
              >
                <FiGift size={18} />
                Claim Inheritance
              </Link>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[1px] text-[#64748B] px-3 py-2">
                Account
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-3 p-3 rounded-[10px] text-[#EF4444] bg-transparent border-none cursor-pointer text-sm font-medium w-full text-left"
              >
                <FiLogOut size={18} />
                Disconnect
              </button>
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-white/6">
            <div className="bg-[#0A0E12] rounded-xl p-4">
              <div className="text-xs text-[#64748B] mb-2">KYC Status</div>
              <span
                className={`badge ${
                  user?.kycStatus === 'APPROVED'
                    ? 'badge-success'
                    : user?.kycStatus === 'PENDING'
                      ? 'badge-purple'
                      : 'badge-warning'
                }`}
              >
                {user?.kycStatus || 'Not Submitted'}
              </span>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 ml-0 min-w-0 lg:ml-[280px]">
          {/* Header */}
          <header className="sticky top-0 z-30 bg-[#12181E] backdrop-blur-[20px] border-b border-white/6">
            <div className="flex items-center justify-between h-[77px] px-6">
              <button
                className="lg:hidden p-2 bg-transparent border-none cursor-pointer text-[#A0AEC0]"
                onClick={() => setSidebarOpen(true)}
              >
                <FiMenu size={20} />
              </button>

              <div className="hidden lg:block" />

              <div className="flex items-center gap-3">
                <button className="w-10 h-10 rounded-[10px] bg-[#12181E] border border-white/6 cursor-pointer flex items-center justify-center text-[#A0AEC0] relative">
                  <FiBell size={18} />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-[#33C5E0] rounded-full" />
                </button>

                <ConnectButton.Custom>
                  {({ account, chain, openAccountModal, openChainModal, mounted }) => {
                    const connected = mounted && account && chain;
                    if (!connected) return null;

                    return (
                      <div className="flex items-center gap-2">
                        {chain.unsupported && (
                          <button
                            onClick={openChainModal}
                            className="btn btn-sm bg-[rgba(239,68,68,0.1)] text-[#EF4444] border border-[rgba(239,68,68,0.2)]"
                          >
                            Wrong network
                          </button>
                        )}
                        <button
                          onClick={openAccountModal}
                          className="flex items-center gap-2.5 px-3 py-2 bg-[#12181E] border border-white/6 rounded-xl cursor-pointer text-white"
                        >
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                            <FiUser size={12} color="black" />
                          </div>
                          <div className="text-left text-xs">
                            <div className="text-[10px] font-medium">
                              {user?.name || formatAddress(account.address)}
                            </div>
                            <div className="text-[10px] text-[#64748B]">
                              {account.displayBalance}
                            </div>
                          </div>
                        </button>
                      </div>
                    );
                  }}
                </ConnectButton.Custom>
              </div>
            </div>
          </header>

          <main className="p-6 min-h-[calc(100vh-64px)] py-10">{children}</main>
        </div>
      </div>
    </>
  );
}
