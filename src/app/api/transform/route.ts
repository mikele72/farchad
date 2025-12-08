import { NextRequest, NextResponse } from 'next/server';

const FAL_API_KEY = process.env.FAL_API_KEY;

// --- CONFIGURAZIONE RARITÀ ---
const POOLS = {
  COMMON: [
    'wearing black sunglasses', 
    'wearing a baseball cap', 
    'wearing a beanie',
    'wearing a t-shirt',
    '' // Clean
  ],
  UNCOMMON: [
    'smoking a cigar', 
    'wearing a hoodie', 
    'wearing 3D glasses',
    'wearing a leather jacket',
    'with a toothpick in mouth'
  ],
  RARE: [
    'wearing a black tuxedo', 
    'wearing a thick gold chain', 
    'wearing a monocle',
    'with a robotic eye'
  ],
  LEGENDARY: [
    'wearing a golden king crown', 
    'with glowing red laser eyes',
    'wearing a futuristic space suit',
    'surrounded by a golden aura'
  ]
};

export async function POST(req: NextRequest) {
  try {
    const { pfpUrl, fid } = await req.json();

    if (!FAL_API_KEY) return NextResponse.json({ error: 'FAL_API_KEY mancante' }, { status: 500 });

    // 1. Calcolo Rarità
    const isOG = fid && fid < 25000;
    const roll = Math.random() * 100; 

    let tier = 'COMMON';
    let accessoryPool = POOLS.COMMON;

    if (isOG) {
       if (roll > 95) { tier = 'LEGENDARY'; accessoryPool = POOLS.LEGENDARY; }
       else if (roll > 70) { tier = 'RARE'; accessoryPool = POOLS.RARE; }
       else if (roll > 30) { tier = 'UNCOMMON'; accessoryPool = POOLS.UNCOMMON; }
    } else {
       if (roll > 99) { tier = 'LEGENDARY'; accessoryPool = POOLS.LEGENDARY; }
       else if (roll > 89) { tier = 'RARE'; accessoryPool = POOLS.RARE; }
       else if (roll > 59) { tier = 'UNCOMMON'; accessoryPool = POOLS.UNCOMMON; }
    }

    const randomAccessory = accessoryPool[Math.floor(Math.random() * accessoryPool.length)];
    const accessoryTrait = randomAccessory ? randomAccessory.replace('wearing ', '').replace('with ', '') : 'None';

    const showBaseLogo = tier === 'LEGENDARY' || tier === 'RARE' || isOG;
    const baseLogoPrompt = showBaseLogo 
        ? " Wearing a round electric blue pin badge on the chest." 
        : "";

    // 2. Prompt OTTIMIZZATO PER LA SOMIGLIANZA
    const prompt = `
      Redraw the reference image as a "Vector Art Cartoon". 
      
      MANDATORY CONSTRAINTS:
      1. EXACT COLOR MATCH: You MUST use the exact hair color and skin tone from the reference image. If the reference is blonde, the output MUST be blonde.
      2. FACIAL FEATURES: Maintain the presence or absence of a beard exactly as shown in the reference. Do not add a beard if there is none.
      
      STYLE TRANSFORMATION:
      - Apply a "Giga Chad" facial structure (strong jawline, confident squint) BUT keep the original identity.
      - Art Style: 2D flat vector illustration, thick black outlines, cell shading, sticker art style. No photorealism.
      - Accessory: The character is ${randomAccessory || "wearing casual clothes"}.${baseLogoPrompt}
    `;

    // 3. Chiamata Fal.ai
    const response = await fetch("https://fal.run/fal-ai/flux/schnell", {
      method: "POST",
      headers: {
        "Authorization": `Key ${FAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: prompt,
        image_url: pfpUrl,
        sync_mode: true,
        // ABBASSIAMO LA STRENGTH
        // 0.55 significa: "Mantieni molto dell'originale (colori, forme) ma cambia lo stile"
        // Questo eviterà che i capelli biondi diventino castani.
        strength: 0.55, 
        seed: Math.floor(Math.random() * 1000000)
      }),
    });

    if (!response.ok) throw new Error(await response.text());
    
    const data = await response.json();
    const imageUrl = data.images?.[0]?.url;

    if (!imageUrl) throw new Error('Nessuna immagine generata');

    return NextResponse.json({ 
        imageUrl,
        attributes: [
            { trait_type: "Rarity Tier", value: tier }, 
            { trait_type: "Accessory", value: accessoryTrait },
            { trait_type: "Base Badge", value: showBaseLogo ? "Yes" : "No" },
            { trait_type: "Is OG", value: isOG ? "Yes" : "No" },
            { trait_type: "Style", value: "Vector Cartoon" }
        ]
    });

  } catch (error: any) {
    console.error("Transform Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}