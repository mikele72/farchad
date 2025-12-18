// src/app/api/transform/route.ts
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

const BASE_CANON_IMAGE_PATH = "/farchad2.png";

// overlays in /public/traits
const LAYERS = {
  shoes: ["/traits/scarpe1.png", "/traits/scarpe2.png"] as const,
  pants: ["/traits/pant1.png", "/traits/pant2.png"] as const,
  hoodie: ["/traits/felpa1.png", "/traits/felpa2.png"] as const,
  cap: ["/traits/cap1.png", "/traits/cap2.png"] as const,
} as const;

type LayerKey = keyof typeof LAYERS;

function hashSeed(input: string) {
  // deterministic 32-bit hash -> 0..999999
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 1_000_000;
}

function pickDeterministic<T>(arr: readonly T[], seed: number, salt: string): T {
  const s = hashSeed(`${seed}:${salt}`);
  return arr[s % arr.length];
}

async function fetchAsBuffer(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`failed to fetch asset: ${url}`);
  const arr = await res.arrayBuffer();
  return Buffer.from(arr);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const fid = typeof body?.fid === "number" ? body.fid : 0;
    const pfpUrl = typeof body?.pfpUrl === "string" ? body.pfpUrl : "";

    // origin needed to fetch from /public
    const origin = req.headers.get("origin") ?? process.env.APP_URL;
    if (!origin) {
      return NextResponse.json({ error: "missing origin/APP_URL" }, { status: 500 });
    }

    const seedBase = fid > 0 ? fid : hashSeed(pfpUrl || "fallback");

    // choose variant per layer (1/2) deterministically
    const shoes = pickDeterministic(LAYERS.shoes, seedBase, "shoes");
    const pants = pickDeterministic(LAYERS.pants, seedBase, "pants");
    const hoodie = pickDeterministic(LAYERS.hoodie, seedBase, "hoodie");
    const cap = pickDeterministic(LAYERS.cap, seedBase, "cap");

    const baseUrl = `${origin}${BASE_CANON_IMAGE_PATH}`;
    const shoesUrl = `${origin}${shoes}`;
    const pantsUrl = `${origin}${pants}`;
    const hoodieUrl = `${origin}${hoodie}`;
    const capUrl = `${origin}${cap}`;

    // load buffers
    const [baseBuf, shoesBuf, pantsBuf, hoodieBuf, capBuf] = await Promise.all([
      fetchAsBuffer(baseUrl),
      fetchAsBuffer(shoesUrl),
      fetchAsBuffer(pantsUrl),
      fetchAsBuffer(hoodieUrl),
      fetchAsBuffer(capUrl),
    ]);

    // IMPORTANT: order matters (bottom -> top)
    // shoes under pants, pants under hoodie, cap on top
    const out = await sharp(baseBuf)
      .composite([
        { input: shoesBuf },  // bottom
        { input: pantsBuf },
        { input: hoodieBuf },
        { input: capBuf },    // top
      ])
      .png()
      .toBuffer();

    const dataUrl = `data:image/png;base64,${out.toString("base64")}`;

    return NextResponse.json({
      imageUrl: dataUrl,
      attributes: [
        { trait_type: "Base", value: "Farchad Canon" },
        { trait_type: "Shoes", value: shoes.includes("1") ? "scarpe1" : "scarpe2" },
        { trait_type: "Pants", value: pants.includes("1") ? "pant1" : "pant2" },
        { trait_type: "Hoodie", value: hoodie.includes("1") ? "felpa1" : "felpa2" },
        { trait_type: "Cap", value: cap.includes("1") ? "cap1" : "cap2" },
      ],
      debug: {
        seedBase,
        used: { shoes, pants, hoodie, cap },
      },
    });
  } catch (error: any) {
    console.error("Transform Error:", error);
    return NextResponse.json({ error: error?.message ?? "Unknown error" }, { status: 500 });
  }
}
