import { ReactNode } from "react";
import './globals.css'; 
// Assicurati che NON ci sia: import '@coinbase/onchainkit/styles.css';

import { Providers } from './providers'; 

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