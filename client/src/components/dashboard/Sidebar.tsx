'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FiHome,
  FiFileText,
  FiShield,
  FiActivity,
  FiSettings,
  FiLogOut,
  FiX,
  FiGift,
} from 'react-icons/fi';
import { useAuth } from '@/hooks/useAuth';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { href: '/dashboard', icon: FiHome, label: 'Overview' },
  { href: '/dashboard/plans', icon: FiFileText, label: 'My Plans' },
  { href: '/dashboard/kyc', icon: FiShield, label: 'KYC Verification' },
  { href: '/dashboard/activity', icon: FiActivity, label: 'Activity' },
];

const secondaryItems = [{ href: '/dashboard/settings', icon: FiSettings, label: 'Settings' }];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={onClose} />}

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="url(#sidebar-logo)" />
              <path d="M10 22V10H14V22H10Z" fill="#05080A" />
              <path d="M18 22V10H22V22H18Z" fill="#05080A" />
              <path d="M10 14H22V18H10V14Z" fill="#05080A" />
              <defs>
                <linearGradient id="sidebar-logo" x1="0" y1="0" x2="32" y2="32">
                  <stop stopColor="#33C5E0" />
                  <stop offset="1" stopColor="#2098AB" />
                </linearGradient>
              </defs>
            </svg>
            <span className="font-bold text-lg">InheritX</span>
          </Link>
          <button
            className="lg:hidden p-2 hover:bg-[var(--bg-surface)] rounded-lg"
            onClick={onClose}
          >
            <FiX size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section">
            <div className="sidebar-section-title">Main Menu</div>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${isActive(item.href) ? 'active' : ''}`}
                onClick={onClose}
              >
                <item.icon className="sidebar-link-icon" size={20} />
                {item.label}
              </Link>
            ))}
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-title">Beneficiary</div>
            <Link
              href="/claim"
              className={`sidebar-link ${pathname.startsWith('/claim') ? 'active' : ''}`}
              onClick={onClose}
            >
              <FiGift className="sidebar-link-icon" size={20} />
              Claim Inheritance
            </Link>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-title">Account</div>
            {secondaryItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${isActive(item.href) ? 'active' : ''}`}
                onClick={onClose}
              >
                <item.icon className="sidebar-link-icon" size={20} />
                {item.label}
              </Link>
            ))}
            <button
              onClick={logout}
              className="sidebar-link w-full text-left text-[var(--accent-red)] hover:bg-red-500/10"
            >
              <FiLogOut className="sidebar-link-icon" size={20} />
              Disconnect
            </button>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="card p-4">
            <div className="text-xs text-[var(--text-muted)] mb-1">KYC Status</div>
            <div
              className={`badge ${
                user?.kycStatus === 'APPROVED'
                  ? 'badge-success'
                  : user?.kycStatus === 'PENDING'
                    ? 'badge-purple'
                    : 'badge-warning'
              }`}
            >
              {user?.kycStatus || 'Not Submitted'}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
