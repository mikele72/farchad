'use client'

import { ReactNode, useState, useEffect } from 'react'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { OnchainKitProvider } from '@coinbase/onchainkit'
import { coinbaseWallet, injected, metaMask } from 'wagmi/connectors'
import sdk from '@farcaster/miniapp-sdk'

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
  const [queryClient] = useState(() => new QueryClient())

  useEffect(() => {
    const notifyReady = async () => {
      try {
        await sdk.actions.ready()
        console.log('[Farcaster] sdk.actions.ready() called')
      } catch (err) {
        // fuori da Farcaster (browser normale, localhost, ecc.) è NORMALE
        console.log('[Farcaster] sdk.actions.ready() skipped', err)
      }
    }

    notifyReady()
  }, [])

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
          chain={baseSepolia}
          config={{
            appearance: { mode: 'auto', theme: 'base' },
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
  )
}
