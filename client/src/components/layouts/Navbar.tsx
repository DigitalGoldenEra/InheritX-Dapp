import type { JSX } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';

type NavItem = {
  label: string;
  href: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '#hero' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'FAQs', href: '#benefits' },
  { label: 'Contact', href: '#footer' },
];

export function Navbar(): JSX.Element {
  return (
    <header className="flex items-center justify-between gap-8">
      <Link href="#hero" className="flex items-center gap-3 transition-opacity hover:opacity-90">
        <Image src="/img/logo.svg" alt="InheritX logo" width={48} height={48} priority />
      </Link>

      <nav className="hidden items-center gap-5 text-sm uppercase tracking-[0.3em] text-slate-300 md:flex">
        {NAV_ITEMS.map((link) => (
          <Link key={link.label} href={link.href} className="transition-colors underline-offset-0">
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-4">
        <ConnectButton />
      </div>
    </header>
  );
}

export default Navbar;
