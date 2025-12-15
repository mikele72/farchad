import { NextRequest, NextResponse } from "next/server";

const FAL_API_KEY = process.env.FAL_API_KEY;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

// Base canonica (opzione A: public/)
const BASE_CANON_IMAGE_URL = `${APP_URL}/farchad.png`;

// --- CONFIGURAZIONE RARITÀ (VERSIONE MOSTRICIATTOLO) ---
const POOLS = {
  COMMON: [
    "no accessories",
    "simple collar",
    "slightly scratched fur",
    "neutral expression"
  ],
  UNCOMMON: [
    "leather strap",
    "bone necklace",
    "scarred eye",
    "confident grin"
  ],
  RARE: [
    "golden chain",
    "mechanical eye",
    "glowing markings on the body",
    "dark mysterious expression"
  ],
  LEGENDARY: [
    "crown of horns",
    "glowing eyes",
    "golden aura surrounding the body",
    "ancient mythical presence"
  ]
};

export async function POST(req: NextRequest) {
  try {
    const { fid } = await req.json();

    if (!FAL_API_KEY) {
      return NextResponse.json(
        { error: "FAL_API_KEY mancante" },
        { status: 500 }
      );
    }

    if (!APP_URL) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_APP_URL mancante" },
        { status: 500 }
      );
    }

    // --- 1. CALCOLO RARITÀ ---
    const isOG = fid && fid < 25000;
    const roll = Math.random() * 100;

    let tier: keyof typeof POOLS = "COMMON";
    let accessoryPool = POOLS.COMMON;

    if (isOG) {
      if (roll > 95) {
        tier = "LEGENDARY";
        accessoryPool = POOLS.LEGENDARY;
      } else if (roll > 70) {
        tier = "RARE";
        accessoryPool = POOLS.RARE;
      } else if (roll > 30) {
        tier = "UNCOMMON";
        accessoryPool = POOLS.UNCOMMON;
      }
    } else {
      if (roll > 99) {
        tier = "LEGENDARY";
        accessoryPool = POOLS.LEGENDARY;
      } else if (roll > 89) {
        tier = "RARE";
        accessoryPool = POOLS.RARE;
      } else if (roll > 59) {
        tier = "UNCOMMON";
        accessoryPool = POOLS.UNCOMMON;
      }
    }

    const randomAccessory =
      accessoryPool[Math.floor(Math.random() * accessoryPool.length)];

    // --- 2. PROMPT (ANCORATO ALLA BASE CANONICA) ---
    const prompt = `
subtle refinement of the existing character

anthropomorphic fantasy creature inspired by a tasmanian devil, original species

keep the same pose, same silhouette, same proportions, same face structure

do not change camera angle, do not change body shape, do not change head shape

apply the following variation: ${randomAccessory}

fantasy mascot style, clean stylized shapes, flat to semi-flat illustration

neutral standing pose, full body visible, centered composition

plain background, studio lighting
`;

    const negativePrompt = `
human anatomy, chad, bodybuilder, six pack abs
furry fandom style, sexualized anthropomorphic character
realistic animal, detailed fur, hair strands
anime, manga, chibi, cute
horror, demon, gore, scary
dynamic pose, action, movement
complex background, scenery, environment
cropped body, bust only
`;

    // --- 3. CHIAMATA FAL.AI (FLUX DEV IMAGE-TO-IMAGE) ---
    const response = await fetch(
      "https://fal.run/fal-ai/flux/dev/image-to-image",
      {
        method: "POST",
        headers: {
          Authorization: `Key ${FAL_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          image_url: BASE_CANON_IMAGE_URL,
          prompt,
          strength: 0.28, // micro-variazioni controllate
          num_inference_steps: 12,
          guidance_scale: 3.5,
          num_images: 1,
          output_format: "png",
          enable_safety_checker: true,
          sync_mode: true,
          seed: Math.floor(Math.random() * 1_000_000)
        })
      }
    );

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const data = await response.json();
    const imageUrl = data.images?.[0]?.url;

    if (!imageUrl) {
      throw new Error("Nessuna immagine generata");
    }

    // --- 4. RISPOSTA FINALE ---
    return NextResponse.json({
      imageUrl,
      attributes: [
        { trait_type: "Rarity Tier", value: tier },
        { trait_type: "Variation", value: randomAccessory },
        { trait_type: "Is OG", value: isOG ? "Yes" : "No" },
        {
          trait_type: "Base Character",
          value: "Tasmanian Fantasy Creature"
        }
      ]
    });
  } catch (error: any) {
    console.error("Transform Error:", error);
    return NextResponse.json(
      { error: error.message ?? "Errore sconosciuto" },
      { status: 500 }
    );
  }
}
