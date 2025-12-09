import { baseSepolia } from 'wagmi/chains';

// Ho rimosso l'importazione di 'MiniKitConfig' che causava l'errore.
// Ora esportiamo l'oggetto direttamente senza forzare il tipo.

export const minikitConfig = {
  miniapp: {
    name: 'Farchad',
    iconUrl: 'https://placehold.co/600x400/835fb3/ffffff/png?text=CHAD', 
  },
  chain: baseSepolia, 
  wallet: {
    appName: 'Farchad',
    appLogoUrl: 'https://placehold.co/600x400/835fb3/ffffff/png?text=CHAD',
    chains: [baseSepolia],
  },
};