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
  FiUser
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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#0A0E12' }}>
        <div style={{ background: '#12181E', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: 48, maxWidth: 400, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 64, height: 64, margin: '0 auto 24px', borderRadius: '50%', background: 'rgba(51, 197, 224, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiLock size={28} color="#33C5E0" />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Connect Your Wallet</h1>
          <p style={{ color: '#A0AEC0', fontSize: 14, marginBottom: 24 }}>
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
        <p style={{ marginTop: 16, color: '#A0AEC0' }}>Authenticating...</p>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        .dashboard-container {
          min-height: 100vh;
          display: flex;
          background: #0A0E12;
        }
        .dashboard-sidebar {
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          width: 280px;
          background: #12181E;
          border-right: 1px solid rgba(255,255,255,0.06);
          display: flex;
          flex-direction: column;
          z-index: 50;
          transform: translateX(-100%);
          transition: transform 0.3s ease;
        }
        .dashboard-sidebar.open {
          transform: translateX(0);
        }
        .dashboard-main {
          flex: 1;
          margin-left: 0;
          min-width: 0;
        }
        .mobile-menu-btn {
          display: block;
        }
        .desktop-spacer {
          display: none;
        }
        @media (min-width: 1024px) {
          .dashboard-sidebar {
            transform: translateX(0);
          }
          .dashboard-main {
            margin-left: 280px;
          }
          .mobile-menu-btn {
            display: none;
          }
          .desktop-spacer {
            display: block;
          }
          .mobile-close-btn {
            display: none;
          }
        }
      `}</style>

      <div className="dashboard-container">
        {/* Overlay */}
        {sidebarOpen && (
          <div 
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : ''}`}>
          {/* Logo */}
          <div style={{ padding: 20, borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'white' }}>
              <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #33C5E0, #1A8A9E)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14 }}>IX</div>
              <span style={{ fontWeight: 700, fontSize: 18 }}>InheritX</span>
            </Link>
            <button 
              className="mobile-close-btn"
              onClick={() => setSidebarOpen(false)}
              style={{ padding: 8, background: 'transparent', border: 'none', cursor: 'pointer', color: '#A0AEC0' }}
            >
              <FiX size={20} />
            </button>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: '#64748B', padding: '8px 12px' }}>
                Main Menu
              </div>
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: 12,
                    borderRadius: 10,
                    color: isActive(item.href) ? '#33C5E0' : '#A0AEC0',
                    background: isActive(item.href) ? 'rgba(51, 197, 224, 0.1)' : 'transparent',
                    textDecoration: 'none',
                    fontSize: 14,
                    fontWeight: 500,
                    marginBottom: 4
                  }}
                >
                  <item.icon size={18} />
                  {item.label}
                </Link>
              ))}
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: '#64748B', padding: '8px 12px' }}>
                Beneficiary
              </div>
              <Link
                href="/claim"
                onClick={() => setSidebarOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 12,
                  borderRadius: 10,
                  color: pathname.startsWith('/claim') ? '#33C5E0' : '#A0AEC0',
                  background: pathname.startsWith('/claim') ? 'rgba(51, 197, 224, 0.1)' : 'transparent',
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: 500
                }}
              >
                <FiGift size={18} />
                Claim Inheritance
              </Link>
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: '#64748B', padding: '8px 12px' }}>
                Account
              </div>
              <button
                onClick={logout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 12,
                  borderRadius: 10,
                  color: '#EF4444',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 500,
                  width: '100%',
                  textAlign: 'left'
                }}
              >
                <FiLogOut size={18} />
                Disconnect
              </button>
            </div>
          </nav>

          {/* Footer */}
          <div style={{ padding: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ background: '#0A0E12', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 12, color: '#64748B', marginBottom: 8 }}>KYC Status</div>
              <span className={`badge ${
                user?.kycStatus === 'APPROVED' ? 'badge-success' :
                user?.kycStatus === 'PENDING' ? 'badge-purple' : 'badge-warning'
              }`}>
                {user?.kycStatus || 'Not Submitted'}
              </span>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="dashboard-main">
          {/* Header */}
          <header style={{
            position: 'sticky',
            top: 0,
            zIndex: 30,
            background: 'rgba(10, 14, 18, 0.9)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.06)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64, padding: '0 24px' }}>
              <button
                className="mobile-menu-btn"
                onClick={() => setSidebarOpen(true)}
                style={{ padding: 8, background: 'transparent', border: 'none', cursor: 'pointer', color: '#A0AEC0' }}
              >
                <FiMenu size={20} />
              </button>

              <div className="desktop-spacer" />

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button style={{ width: 40, height: 40, borderRadius: 10, background: '#12181E', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A0AEC0', position: 'relative' }}>
                  <FiBell size={18} />
                  <span style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, background: '#33C5E0', borderRadius: '50%' }} />
                </button>

                <ConnectButton.Custom>
                  {({ account, chain, openAccountModal, openChainModal, mounted }) => {
                    const connected = mounted && account && chain;
                    if (!connected) return null;

                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {chain.unsupported && (
                          <button onClick={openChainModal} className="btn btn-sm" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                            Wrong network
                          </button>
                        )}
                        <button
                          onClick={openAccountModal}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '8px 12px',
                            background: '#12181E',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 12,
                            cursor: 'pointer',
                            color: 'white'
                          }}
                        >
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #33C5E0, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FiUser size={14} />
                          </div>
                          <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: 13, fontWeight: 500 }}>{user?.name || formatAddress(account.address)}</div>
                            <div style={{ fontSize: 11, color: '#64748B' }}>{account.displayBalance}</div>
                          </div>
                        </button>
                      </div>
                    );
                  }}
                </ConnectButton.Custom>
              </div>
            </div>
          </header>

          <main style={{ padding: 24, minHeight: 'calc(100vh - 64px)' }}>
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
