

import { ReactNode } from "react";
import './globals.css'; 
import { Providers } from './providers'; 
import { Metadata } from 'next';

// CONFIGURAZIONE METADATI (Il "Timbro" per Base)
export const metadata: Metadata = {
  title: 'Farchad',
  description: 'Create your Chad NFT',
  other: {
    // ⚠️ SOSTITUISCI LA STRINGA SOTTO CON IL TUO ID PRESO DA BASE DEVELOPERS
    // Esempio: 'base:app_id': '693850cd-....',
    'base:app_id': '693850cdff7c0880cb8b690f', 
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