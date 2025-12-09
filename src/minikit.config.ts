import { baseSepolia } from 'wagmi/chains';

export const minikitConfig = {
  miniapp: {
    name: 'farchad',
    iconUrl: 'https://placehold.co/600x400/835fb3/ffffff/png?text=FARCHAD',
  },
  chain: baseSepolia,
  wallet: {
    appName: 'farchad',
    appLogoUrl: 'https://placehold.co/600x400/835fb3/ffffff/png?text=FARCHAD',
    chains: [baseSepolia],
  },
};