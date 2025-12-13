'use client';

import { ReactNode, useState } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { baseSepolia } from 'wagmi/chains'; // Usa Sepolia per i test
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { coinbaseWallet, injected, metaMask } from 'wagmi/connectors';

// Configurazione Wagmi per Base Sepolia
const config = createConfig({
  chains: [baseSepolia],
  transports: { [baseSepolia.id]: http() },
  connectors: [
    metaMask({
      dappMetadata: {
        name: 'Farchad',
        url: 'https://farchad.vercel.app',
        iconUrl: 'https://farchad.vercel.app/icon.png',
      },
    }),
    injected(),
    coinbaseWallet({
      appName: 'farchad',
      preference: 'smartWalletOnly',
    }),
  ],
})

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
          chain={baseSepolia}
          config={{
             appearance: { mode: "auto", theme: "base" },
          }}
          miniKit={{
            enabled: true, // Questo è essenziale per Farcaster
            autoConnect: true,
          }}
        >
          {children}
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}