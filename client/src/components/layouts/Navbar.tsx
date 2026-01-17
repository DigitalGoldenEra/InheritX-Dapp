'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { FiArrowRight, FiMenu, FiX } from 'react-icons/fi';

export default function Navbar() {
  const { isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isHome = pathname === '/';

  const getLinkHref = (hash: string) => {
    return isHome ? hash : `/${hash}`;
  };

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Security', href: '#security' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[rgba(5,6,8,0.9)] backdrop-blur-[20px]">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between border border-white/6 rounded-[15px] mt-5">
        <Link
          href="/"
          className="flex items-center gap-1 no-underline text-white font-['Syne',sans-serif] font-bold text-xl"
        >
          <Image src="/img/logo.svg" alt="InheritX logo" width={36} height={36} />
          InheritX
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-10">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={getLinkHref(link.href)}
              className="text-[#94A3B8] no-underline text-sm font-medium hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {mounted &&
            (isConnected ? (
              <Link href="/dashboard" className="btn btn-primary btn-sm">
                Dashboard <FiArrowRight size={14} />
              </Link>
            ) : (
              <ConnectButton.Custom>
                {({ openConnectModal }) => (
                  <button onClick={openConnectModal} className="btn btn-primary">
                    Connect
                  </button>
                )}
              </ConnectButton.Custom>
            ))}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 bg-transparent border-none cursor-pointer text-[#94A3B8]"
          >
            {mobileMenuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-[#0A0D10] border-t border-white/10 p-4 flex flex-col gap-4 shadow-xl">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={getLinkHref(link.href)}
              className="text-[#94A3B8] text-sm font-medium py-2 hover:text-white transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
