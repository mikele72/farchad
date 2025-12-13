'use client'

import { ReactNode, useEffect, useState } from 'react'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { OnchainKitProvider } from '@coinbase/onchainkit'
import { coinbaseWallet, injected, metaMask } from 'wagmi/connectors'
import { sdk, isInMiniApp } from '@farcaster/miniapp-sdk'

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
    const run = async () => {
      try {
        if (!isInMiniApp()) return
        await sdk.actions.ready()
        console.log('[miniapp] ready chiamato')
      } catch (e) {
        console.log('[miniapp] ready fallito', e)
      }
    }
    run()
  }, [])

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
          chain={baseSepolia}
          config={{ appearance: { mode: 'auto', theme: 'base' } }}
          miniKit={{ enabled: true, autoConnect: true }}
        >
          {children}
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
