import { baseSepolia } from 'wagmi/chains';
import { type MiniKitConfig } from '@coinbase/onchainkit/minikit';

export const minikitConfig: MiniKitConfig = {
  miniapp: {
    name: 'Chad Maker NFT',
    iconUrl: 'https://placehold.co/600x400/835fb3/ffffff/png?text=CHAD', 
  },
  // Imposta la chain su Base Sepolia per i test
  chain: baseSepolia, 
  wallet: {
    appName: 'Chad Maker NFT',
    appLogoUrl: 'https://placehold.co/600x400/835fb3/ffffff/png?text=CHAD',
    chains: [baseSepolia],
  },
};