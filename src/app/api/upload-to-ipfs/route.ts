import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const PINATA_JWT = process.env.PINATA_JWT;

export async function POST(req: NextRequest) {
  try {
    // Accettiamo anche 'attributes' dal frontend
    const { imageUrl, name, description, fid, attributes } = await req.json();

    if (!PINATA_JWT) return NextResponse.json({ error: 'PINATA_JWT mancante' }, { status: 500 });

    // 1. Scarica l'immagine generata da Fal.ai
    const imageRes = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(imageRes.data);
    
    // 2. Carica Immagine su Pinata
    const formData = new FormData();
    const blob = new Blob([buffer], { type: 'image/png' });
    formData.append('file', blob, `chad-${fid}.png`);

    const uploadRes = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
      maxBodyLength: Infinity,
      headers: { 'Authorization': `Bearer ${PINATA_JWT}` }
    });
    const imageCid = uploadRes.data.IpfsHash;

    // 3. Prepara gli attributi finali (aggiunge il FID)
    const finalAttributes = [
        ...(attributes || []), 
        { trait_type: "Farcaster FID", value: fid.toString() }
    ];

    // 4. Crea Metadati JSON (Standard OpenSea)
    const metadata = {
      name: name,
      description: description,
      image: `ipfs://${imageCid}`,
      external_url: `https://warpcast.com`, 
      attributes: finalAttributes // Qui salviamo le rarità!
    };

    // 5. Carica JSON su Pinata
    const jsonRes = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', metadata, {
      headers: { 
        'Authorization': `Bearer ${PINATA_JWT}`,
        'Content-Type': 'application/json'
      }
    });

    return NextResponse.json({ metadataUri: `ipfs://${jsonRes.data.IpfsHash}` });

  } catch (error: any) {
    console.error("Upload Error:", error.message);
    return NextResponse.json({ error: 'Errore upload IPFS' }, { status: 500 });
  }
}