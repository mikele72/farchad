import { ReactNode } from 'react'
import './globals.css'
import { Providers } from './providers'
import type { Metadata } from 'next'

const APP_URL = 'https://farchad.vercel.app'

export const metadata: Metadata = {
  title: 'Farchad v2 Test',
  description: 'Create your Chad NFT',
  openGraph: {
    title: 'Farchad',
    description: 'Transform your PFP into a Chad',
    images: [`${APP_URL}/image.png`],
  },
  other: {
    // Base App id (ok)
    'base:app_id': '693850cdff7c0880cb8b690f',

    // Mini App embed metadata (questo è quello che l’Embed Tool vuole)
    'fc:miniapp': JSON.stringify({
      version: 'next',
      imageUrl: `${APP_URL}/image.png`,
      button: {
        title: 'Launch Farchad',
        action: {
          type: 'launch_miniapp',
          name: 'Farchad',
          url: APP_URL,
          splashImageUrl: `${APP_URL}/splash.png`,
          splashBackgroundColor: '#1a1025',
        },
      },
    }),
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
