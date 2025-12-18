// src/app/api/transform/route.ts
import { NextRequest, NextResponse } from "next/server";

const BASE_CANON_IMAGE_PATH = "/farchad2.png";

// overlays in /public/traits
const LAYERS = {
  shoes: ["/traits/scarpe1.png", "/traits/scarpe2.png"] as const,
  pants: ["/traits/pant1.png", "/traits/pant2.png"] as const,
  hoodie: ["/traits/felpa1.png", "/traits/felpa2.png"] as const,
  cap: ["/traits/cap1.png", "/traits/cap2.png"] as const,
} as const;

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

function layerNameFromPath(p: string) {
  // "/traits/felpa1.png" -> "felpa1"
  const file = p.split("/").pop() ?? p;
  return file.replace(".png", "");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const fid = typeof body?.fid === "number" ? body.fid : 0;
    const pfpUrl = typeof body?.pfpUrl === "string" ? body.pfpUrl : "";

    // deterministic base seed (same fid => same outfit)
    const seedBase = fid > 0 ? fid : hashSeed(pfpUrl || "fallback");

    // choose variant per layer deterministically
    const shoes = pickDeterministic(LAYERS.shoes, seedBase, "shoes");
    const pants = pickDeterministic(LAYERS.pants, seedBase, "pants");
    const hoodie = pickDeterministic(LAYERS.hoodie, seedBase, "hoodie");
    const cap = pickDeterministic(LAYERS.cap, seedBase, "cap");

    // IMPORTANT: order matters (bottom -> top)
    const layersOrdered = [shoes, pants, hoodie, cap];

    return NextResponse.json({
      // non generiamo immagine qui: solo "ricetta"
      baseImagePath: BASE_CANON_IMAGE_PATH,
      layers: layersOrdered,
      attributes: [
        { trait_type: "Base", value: "Farchad Canon" },
        { trait_type: "Shoes", value: layerNameFromPath(shoes) },
        { trait_type: "Pants", value: layerNameFromPath(pants) },
        { trait_type: "Hoodie", value: layerNameFromPath(hoodie) },
        { trait_type: "Cap", value: layerNameFromPath(cap) },
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
