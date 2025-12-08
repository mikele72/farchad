'use client';

import { ReactNode, useState } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains'; // Usa baseSepolia per i test
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { coinbaseWallet, injected, metaMask } from 'wagmi/connectors';

// 1. Configura Wagmi (Il connettore alla Blockchain)
const config = createConfig({
  chains: [baseSepolia], // Usa Sepolia per lo sviluppo
  transports: {
    [baseSepolia.id]: http(),
  },
  connectors: [
    metaMask(), // Supporto esplicito per MetaMask
    injected(), // Supporto generico per wallet browser
    coinbaseWallet({
      appName: 'farchad',
      preference: 'smartWalletOnly', 
    }),
  ],
});

export function Providers({ children }: { children: ReactNode }) {
  // Utilizziamo useState per garantire che QueryClient sia creato solo una volta lato client
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
            enabled: true,
            autoConnect: true,
          }}
        >
          {children}
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}