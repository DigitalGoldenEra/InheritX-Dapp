import type { Metadata } from 'next';
import { Inter, Syne } from 'next/font/google';
import { Providers } from './providers';
import NextTopLoader from 'nextjs-toploader';
import './globals.css';
import { Analytics } from '@vercel/analytics/next';


// Configure Inter font for body text
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

// Configure Syne font for headings
const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-syne',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'InheritX - Secure Digital Inheritance Platform',
  description: 'Create, manage, and automate your digital asset inheritance on Lisk blockchain. Secure, transparent, and trustless.',
  keywords: ['inheritance', 'blockchain', 'crypto', 'lisk', 'web3', 'digital assets', 'estate planning'],
  openGraph: {
    title: 'InheritX - Secure Digital Inheritance',
    description: 'The future of digital asset inheritance on blockchain',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${syne.variable}`}>
      <body className={inter.className}>
        <NextTopLoader
          color="#33C5E0"
          height={3}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #33C5E0,0 0 5px #33C5E0"
        />
        <Providers>{children}         <Analytics />

        </Providers>
      </body>
    </html>
  );
}
