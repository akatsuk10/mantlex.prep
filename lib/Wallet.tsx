"use client";

import '@rainbow-me/rainbowkit/styles.css';
import {
  RainbowKitProvider,
  getDefaultWallets,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider, createConfig } from 'wagmi';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http } from 'wagmi';
import { mantleSepoliaTestnet } from 'wagmi/chains';
import { metaMask, walletConnect } from 'wagmi/connectors';

const queryClient = new QueryClient();

const projectId = 'b4426ed43149e131c0cb4d12e11a0081';

const config = createConfig({
  chains: [mantleSepoliaTestnet],
  transports: {
    [mantleSepoliaTestnet.id]: http('https://rpc.sepolia.mantle.xyz'),
  },
  connectors: [
    walletConnect({ projectId }),
  ],
});

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
