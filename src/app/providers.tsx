'use client'

import { ReactNode, useEffect, useMemo, useState } from 'react'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { OnchainKitProvider } from '@coinbase/onchainkit'
import { coinbaseWallet, injected } from 'wagmi/connectors'
import sdk from '@farcaster/miniapp-sdk'
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector'

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  const [isMiniApp, setIsMiniApp] = useState<boolean | null>(null)

  useEffect(() => {
    const boot = async () => {
      try {
        const inside = await sdk.isInMiniApp()
        setIsMiniApp(inside)

        if (inside) {
          await sdk.actions.ready()
          console.log('[farcaster] miniapp ready')
        } else {
          console.log('[app] running outside farcaster')
        }
      } catch (err) {
        console.log('[farcaster] detect failed (normal outside)', err)
        setIsMiniApp(false)
      }
    }

    boot()
  }, [])

  const wagmiConfig = useMemo(() => {
    // aspettiamo di sapere dove siamo
    if (isMiniApp === null) return null

    // 🔵 DENTRO FARCASTER → SOLO wallet Farcaster
    if (isMiniApp) {
      return createConfig({
        chains: [baseSepolia],
        transports: { [baseSepolia.id]: http() },
        connectors: [farcasterMiniApp()],
      })
    }

    // 🟣 FUORI FARCASTER → Base Wallet / browser
    return createConfig({
      chains: [baseSepolia],
      transports: { [baseSepolia.id]: http() },
      connectors: [
        coinbaseWallet({
          appName: 'Farchad',
          preference: 'smartWalletOnly',
        }),
        injected(), // fallback browser
      ],
    })
  }, [isMiniApp])

  if (!wagmiConfig) return null

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
          chain={baseSepolia}
          config={{ appearance: { mode: 'auto', theme: 'base' } }}
          // ❗ miniKit SOLO fuori da Farcaster
          miniKit={{
            enabled: !isMiniApp,
            autoConnect: !isMiniApp,
          }}
        >
          {children}
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}