"use client"
import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig, RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { lisk, liskSepolia } from "wagmi/chains";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

const config = getDefaultConfig({
  appName: "InheritX",
  projectId: "93392c1b1fdd1f4987f02543117520bf",
  chains: [lisk, liskSepolia],
  ssr: true,
});

const queryClient = new QueryClient();

const customTheme = darkTheme({
  accentColor: "#33C5E0",
  accentColorForeground: "#0D1A1E",
  borderRadius: "large",
  fontStack: "system",
  overlayBlur: "small",
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={customTheme}>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
