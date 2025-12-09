import { NextResponse } from 'next/server';

export async function GET() {
  // Costruiamo manualmente il JSON per essere sicuri al 100% che sia corretto
  const config = {
  "accountAssociation": {
    "header": "eyJmaWQiOjIyNzMxLCJ0eXBlIjoiY3VzdG9keSIsImtleSI6IjB4NGZFNDAxRDAwN0YyODhmQ0M2NzhGMUU5MWVhQmQxRDk3RDM1ZDNEYyJ9",
    "payload": "eyJkb21haW4iOiJmYXJjaGFkLnZlcmNlbC5hcHAifQ",
    "signature": "EWU/tKJu3EIwEnTkA+zFa4OBBhj+iwVFXY1p3sICWahExfgedmw8/nPIG/9i2yIEauvMjqE529XJ/2lPRKrl4xw="
  },
    frame: {
      version: "1",
      name: "Farchad",
      iconUrl: "https://placehold.co/600x400/835fb3/ffffff/png?text=FARCHAD",
      homeUrl: "https://farchad.vercel.app", // Assicurati che questo sia il tuo URL Vercel corretto
      imageUrl: "https://placehold.co/600x400/835fb3/ffffff/png?text=FARCHAD",
      buttonTitle: "Launch App",
      splashImageUrl: "https://placehold.co/600x400/835fb3/ffffff/png?text=FARCHAD",
      splashBackgroundColor: "#1a1025",
      webhookUrl: "https://farchad.vercel.app/api/webhook"
    }
  };

  return NextResponse.json(config);
}
