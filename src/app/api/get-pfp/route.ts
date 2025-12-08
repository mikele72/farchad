import { NextRequest, NextResponse } from 'next/server';

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;

export async function GET(req: NextRequest) {
  const fid = req.nextUrl.searchParams.get('fid');

  if (!fid) return NextResponse.json({ error: 'FID mancante' }, { status: 400 });

  try {
    // Chiamata a Neynar per i dati utente
    const response = await fetch(`https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`, {
      headers: { 
        'accept': 'application/json',
        'api_key': NEYNAR_API_KEY || '' 
      },
      cache: 'no-store'
    });

    const data = await response.json();
    const user = data.users?.[0];
    
    // Restituisce l'URL del PFP o null
    return NextResponse.json({ pfpUrl: user?.pfp_url || null });

  } catch (error) {
    console.error("Errore Neynar:", error);
    return NextResponse.json({ error: 'Errore recupero PFP' }, { status: 500 });
  }
}