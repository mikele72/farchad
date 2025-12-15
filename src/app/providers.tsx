'use client'

import { ReactNode, useEffect, useMemo, useState } from 'react'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { OnchainKitProvider } from '@coinbase/onchainkit'
import { coinbaseWallet, injected, metaMask } from 'wagmi/connectors'
import sdk from '@farcaster/miniapp-sdk'
import { farcasterMiniApp as miniAppConnector } from '@farcaster/miniapp-wagmi-connector'

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
          console.log('[debug] farcaster miniapp: ready OK')
        } else {
          console.log('[debug] not in farcaster miniapp')
        }
      } catch (e) {
        console.log('[debug] miniapp detect/ready failed (ok outside miniapp)', e)
        setIsMiniApp(false)
      }
    }
    boot()
  }, [])

  const wagmiConfig = useMemo(() => {
    // Finché non sappiamo dove siamo, non montiamo wagmi (evita casino/hydration)
    if (isMiniApp === null) return null

    // Se siamo dentro Farcaster: usa SOLO il connector Farcaster (wallet interno)
    if (isMiniApp) {
      return createConfig({
        chains: [baseSepolia],
        transports: { [baseSepolia.id]: http() },
        connectors: [miniAppConnector()],
      })
    }

    // Fuori da Farcaster: i tuoi connector “normali” (desktop/browser/Base ecc.)
    return createConfig({
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
  }, [isMiniApp])

  if (!wagmiConfig) return null

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
          chain={baseSepolia}
          config={{ appearance: { mode: 'auto', theme: 'base' } }}
          // IMPORTANT: OnchainKit miniKit lo teniamo SOLO fuori da Farcaster
          // dentro Farcaster vogliamo il wallet Farcaster, non quello Base
          miniKit={{ enabled: !isMiniApp, autoConnect: !isMiniApp }}
        >
          {children}
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
