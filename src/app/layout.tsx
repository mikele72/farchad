import { ReactNode } from "react";
import './globals.css'; 
import { Providers } from './providers'; 
import { Metadata } from 'next';

// Sostituisci questo con il tuo dominio Vercel REALE (senza slash finale)
const APP_URL = 'https://farchad.vercel.app'; 

export const metadata: Metadata = {
  title: 'Farchad',
  description: 'Create your Chad NFT',
  openGraph: {
    title: 'Farchad',
    description: 'Transform your PFP into a Chad',
    images: [`${APP_URL}/api/og`], // O un'immagine statica
  },
  other: {
    // 1. Timbro Base (già presente)
    'base:app_id': '693850cdff7c0880cb8b690f', 

    // 2. METADATI FARCASTER FRAME (Quelli che mancavano!)
    'fc:frame': 'vNext',
    'fc:frame:image': 'https://placehold.co/600x400/835fb3/ffffff/png?text=LAUNCH+FARCHAD',
    'fc:frame:button:1': 'Launch App',
    'fc:frame:button:1:action': 'link',
    'fc:frame:button:1:target': APP_URL, // Apre la tua app
    'fc:frame:post_url': `${APP_URL}/api/frame-post`, // Opzionale
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}