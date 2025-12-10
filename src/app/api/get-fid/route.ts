import { NextRequest, NextResponse } from 'next/server';

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address');

  if (!address || !NEYNAR_API_KEY) {
      return NextResponse.json({ error: 'Indirizzo o API Key mancante' }, { status: 400 });
  }

  try {
    // Chiediamo a Neynar chi possiede questo indirizzo (Reverse Lookup)
    const response = await fetch(`https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${address}`, {
      headers: { 
        'accept': 'application/json',
        'api_key': NEYNAR_API_KEY 
      },
      cache: 'no-store'
    });

    const data = await response.json();
    
    // Neynar restituisce una mappa { "0x...": [user1, user2] }
    // L'indirizzo deve essere minuscolo per accedere alla chiave dell'oggetto
    const userKey = address.toLowerCase();
    const users = data[userKey];

    if (users && users.length > 0) {
        // Trovato! Restituiamo FID e dati base
        return NextResponse.json({ 
            fid: users[0].fid,
            username: users[0].username,
            pfpUrl: users[0].pfp_url 
        });
    }

    return NextResponse.json({ error: 'Nessun utente Farcaster trovato per questo indirizzo' }, { status: 404 });

  } catch (error) {
    console.error("Errore Neynar:", error);
    return NextResponse.json({ error: 'Errore recupero FID' }, { status: 500 });
  }
}