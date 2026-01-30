'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { liskSepolia, lisk, sepolia, mainnet } from 'wagmi/chains';
import { RainbowKitProvider, getDefaultConfig, darkTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { useState, useEffect } from 'react';
import { AuthProvider } from '@/context/AuthContext';

const config = getDefaultConfig({
  appName: 'InheritX',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo',
  chains: [lisk],
  transports: {
    [lisk.id]: http(),
  },
  ssr: true,
});

const queryClient = new QueryClient();

// Custom theme extending RainbowKit's dark theme
const customTheme = darkTheme({
  accentColor: '#33C5E0',
  accentColorForeground: '#05080A',
  borderRadius: 'medium',
  fontStack: 'system',
  overlayBlur: 'small',
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={{
            ...customTheme,
            colors: {
              ...customTheme.colors,
              modalBackground: '#0A0E12',
              modalBorder: 'rgba(51, 197, 224, 0.15)',
            },
          }}
          modalSize="compact"
        >
          {mounted ? (
            <AuthProvider>{children}</AuthProvider>
          ) : (
            <div className="page-loader">
              <div className="spinner" />
            </div>
          )}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
