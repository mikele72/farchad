'use client';

import { ReactNode, useState } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { baseSepolia } from 'wagmi/chains'; // Usiamo Sepolia per il test
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { coinbaseWallet, injected, metaMask } from 'wagmi/connectors';

// NESSUN IMPORT DI STILE QUI

const config = createConfig({
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(),
  },
  connectors: [
    coinbaseWallet({
      appName: 'farchad',
      preference: 'smartWalletOnly', 
    }),
    metaMask(),
    injected(),
  ],
});

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
          // Se togliere lo stile rompe MiniKit, puoi provare a rimuovere 'miniKit' da qui
          // Ma per ora lasciamolo per vedere se la build passa senza CSS.
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