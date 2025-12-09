import { baseSepolia } from 'wagmi/chains';

// Ho rimosso l'importazione di 'MiniKitConfig' che causava l'errore.
// Ora esportiamo l'oggetto direttamente senza forzare il tipo.
{
  "accountAssociation": {
    "header": "eyJmaWQiOjIyNzMxLCJ0eXBlIjoiY3VzdG9keSIsImtleSI6IjB4NGZFNDAxRDAwN0YyODhmQ0M2NzhGMUU5MWVhQmQxRDk3RDM1ZDNEYyJ9",
    "payload": "eyJkb21haW4iOiJmYXJjaGFkLnZlcmNlbC5hcHAifQ",
    "signature": "EWU/tKJu3EIwEnTkA+zFa4OBBhj+iwVFXY1p3sICWahExfgedmw8/nPIG/9i2yIEauvMjqE529XJ/2lPRKrl4xw="
  }
}
export const minikitConfig = {
  miniapp: {
    name: 'farchad',
    iconUrl: 'https://placehold.co/600x400/835fb3/ffffff/png?text=CHAD', 
  },
  chain: baseSepolia, 
  wallet: {
    appName: 'farchad',
    appLogoUrl: 'https://placehold.co/600x400/835fb3/ffffff/png?text=CHAD',
    chains: [baseSepolia],
  },
};