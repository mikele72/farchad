import { ReactNode } from "react";
import './globals.css'; 
import { Providers } from './providers'; 
import { Metadata } from 'next';

// Configurazione Metadati per la verifica su Base
export const metadata: Metadata = {
  title: 'Farchad',
  description: 'Create your Chad NFT',
  other: {
    // SOSTITUISCI "IL_TUO_APP_ID" CON L'ID VERO DAL PORTALE BASE
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