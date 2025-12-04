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
  FiLock
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
  const { user, isLoading, isAuthenticated, login, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isConnected && !isAuthenticated && !isLoading && isClient) {
      login();
    }
  }, [isConnected, isAuthenticated, isLoading, login, isClient]);

  useEffect(() => {
    if (isClient && !isLoading && isAuthenticated && user) {
      if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        router.push('/dashboard');
      }
    }
  }, [isClient, isLoading, isAuthenticated, user, router]);

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
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
        <div style={{ background: '#12181E', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: 48, maxWidth: 400, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, margin: '0 auto 24px', borderRadius: '50%', background: 'rgba(51, 197, 224, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiLock size={28} color="#33C5E0" />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Admin Access Required</h1>
          <p style={{ color: '#A0AEC0', fontSize: 14, marginBottom: 24 }}>
            Connect your wallet to access the admin dashboard.
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

  if (user && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#0A0E12' }}>
        <div style={{ background: '#12181E', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: 48, maxWidth: 400, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, margin: '0 auto 24px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiLock size={28} color="#EF4444" />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Access Denied</h1>
          <p style={{ color: '#A0AEC0', fontSize: 14, marginBottom: 24 }}>
            You don't have permission to access the admin dashboard.
          </p>
          <Link href="/dashboard" className="btn btn-primary">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        .admin-container {
          min-height: 100vh;
          display: flex;
          background: #0A0E12;
        }
        .admin-sidebar {
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
        .admin-sidebar.open {
          transform: translateX(0);
        }
        .admin-main {
          flex: 1;
          margin-left: 0;
          min-width: 0;
        }
        .admin-mobile-menu-btn {
          display: block;
        }
        .admin-desktop-spacer {
          display: none;
        }
        @media (min-width: 1024px) {
          .admin-sidebar {
            transform: translateX(0);
          }
          .admin-main {
            margin-left: 280px;
          }
          .admin-mobile-menu-btn {
            display: none;
          }
          .admin-desktop-spacer {
            display: block;
          }
          .admin-mobile-close-btn {
            display: none;
          }
        }
      `}</style>

      <div className="admin-container">
        {/* Overlay */}
        {sidebarOpen && (
          <div 
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
          {/* Logo */}
          <div style={{ padding: 20, borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'white' }}>
              <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #33C5E0, #1A8A9E)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14 }}>IX</div>
              <div>
                <span style={{ fontWeight: 700, fontSize: 18 }}>InheritX</span>
                <span className="badge badge-purple" style={{ marginLeft: 8, fontSize: 10 }}>Admin</span>
              </div>
            </Link>
            <button 
              className="admin-mobile-close-btn"
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
                Administration
              </div>
              {adminNavItems.map((item) => (
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

            <div>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: '#64748B', padding: '8px 12px' }}>
                Quick Links
              </div>
              <Link
                href="/dashboard"
                onClick={() => setSidebarOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 12,
                  borderRadius: 10,
                  color: '#A0AEC0',
                  background: 'transparent',
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: 500,
                  marginBottom: 4
                }}
              >
                <FiArrowLeft size={18} />
                Back to Dashboard
              </Link>
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
            <div style={{ background: '#0A0E12', borderRadius: 12, padding: 12 }}>
              <div style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>Logged in as</div>
              <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 2 }}>{user?.name || 'Admin'}</div>
              <div style={{ fontSize: 12, color: '#33C5E0' }}>{user?.role}</div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="admin-main">
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
                className="admin-mobile-menu-btn"
                onClick={() => setSidebarOpen(true)}
                style={{ padding: 8, background: 'transparent', border: 'none', cursor: 'pointer', color: '#A0AEC0' }}
              >
                <FiMenu size={20} />
              </button>

              <div className="admin-desktop-spacer" />

              <ConnectButton />
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
