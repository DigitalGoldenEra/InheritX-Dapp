import type { Metadata } from 'next';
import { Providers } from './providers';
import './globals.css';

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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Syne:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
