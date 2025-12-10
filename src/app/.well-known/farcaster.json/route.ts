import { NextResponse } from 'next/server';

export async function GET() {
  // Costruiamo manualmente il JSON per essere sicuri al 100% che sia corretto
  const config = {
  "accountAssociation": {
    "header": "eyJmaWQiOjIyNzMxLCJ0eXBlIjoiY3VzdG9keSIsImtleSI6IjB4NGZFNDAxRDAwN0YyODhmQ0M2NzhGMUU5MWVhQmQxRDk3RDM1ZDNEYyJ9",
    "payload": "eyJkb21haW4iOiJmYXJjaGFkLnZlcmNlbC5hcHAifQ",
    "signature": "EWU/tKJu3EIwEnTkA+zFa4OBBhj+iwVFXY1p3sICWahExfgedmw8/nPIG/9i2yIEauvMjqE529XJ/2lPRKrl4xw="
  },
 "frame": {
    "name": "Farchad",
    "version": "1",
    "iconUrl": "https://farchad.vercel.app/icon.png",
    "homeUrl": "https://farchad.vercel.app",
    "imageUrl": "https://farchad.vercel.app/image.png",
    "splashImageUrl": "https://farchad.vercel.app/splash.png",
    "splashBackgroundColor": "#1a1025",
    "webhookUrl": "https://farchad.vercel.app/api/webhook",
    "subtitle": "Mint and Share",
    "description": "Turn your Farcaster PFP into a Chad",
    "primaryCategory": "art-creativity",
    "tags": [
      "nft",
      "art"
    ],
    "ogTitle": "Transform your PFP into a Chad"
  },
  };

  return NextResponse.json(config);
}
