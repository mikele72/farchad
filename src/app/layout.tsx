import { ReactNode } from 'react'
import './globals.css'
import { Providers } from './providers'

const APP_URL = 'https://farchad.vercel.app'

const MINIAPP_META = {
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
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* base app id */}
        <meta name="base:app_id" content="693850cdff7c0880cb8b690f" />

        {/* debug per verificare che stai vedendo questo layout */}
        <meta name="x-debug-deploy" content="layout-v3" />

        {/* miniapp embed metadata */}
        <meta name="fc:miniapp" content={JSON.stringify(MINIAPP_META)} />

        {/* opzionale ma utile */}
        <meta name="description" content="Create your Chad NFT" />
        <title>Farchad v3 test</title>

        {/* og tags */}
        <meta property="og:title" content="Farchad" />
        <meta property="og:description" content="Transform your PFP into a Chad" />
        <meta property="og:image" content={`${APP_URL}/image.png`} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
