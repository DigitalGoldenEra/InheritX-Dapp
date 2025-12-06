'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { FiMenu, FiBell, FiUser } from 'react-icons/fi';
import { useAuth } from '@/hooks/useAuth';
import { formatAddress } from '@/lib/contract';

interface HeaderProps {
  onMenuClick: () => void;
  title?: string;
}

export default function Header({ onMenuClick, title }: HeaderProps) {
  const { user, address } = useAuth();

  return (
    <header className="sticky top-0 z-20 bg-[var(--bg-void)]/80 backdrop-blur-xl border-b border-[var(--border-subtle)]">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-[var(--bg-surface)] rounded-lg transition-colors"
          >
            <FiMenu size={20} />
          </button>
          {title && (
            <h1 className="text-lg font-semibold hidden sm:block">{title}</h1>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Notifications */}
          <button className="btn btn-icon btn-ghost relative">
            <FiBell size={18} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--primary)] rounded-full" />
          </button>

          {/* User/Wallet */}
          <ConnectButton.Custom>
            {({ account, chain, openAccountModal, openChainModal, mounted }) => {
              const connected = mounted && account && chain;

              if (!connected) {
                return null;
              }

              return (
                <div className="flex items-center gap-2">
                  {chain.unsupported && (
                    <button
                      onClick={openChainModal}
                      className="btn btn-sm bg-[var(--accent-red)]/20 text-[var(--accent-red)] border border-[var(--accent-red)]/30"
                    >
                      Wrong network
                    </button>
                  )}

                  <button
                    onClick={openAccountModal}
                    className="flex items-center gap-2 px-3 py-2 border border-[var(--border-subtle)] rounded-xl hover:border-[var(--border-hover)] transition-colors"
                  >
                    <div className="hidden sm:block text-left">
                      <div className="text-sm font-medium">
                        {user?.name || formatAddress(account.address)}
                      </div>
                      <div className="text-xs text-[var(--text-muted)]">
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
  );
}
