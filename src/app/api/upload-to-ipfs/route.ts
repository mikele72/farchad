// src/app/api/upload-to-ipfs/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import FormData from "form-data";
import sharp from "sharp";

const PINATA_JWT = process.env.PINATA_JWT;

function isDataUrl(v: string) {
  return typeof v === "string" && v.startsWith("data:");
}

function bufferFromDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(.+?);base64,(.+)$/);
  if (!match) throw new Error("Invalid data URL format");

  const mime = match[1] || "image/png";
  const base64 = match[2];

  const buffer = Buffer.from(base64, "base64");
  return { buffer, mime };
}

async function fetchAsBuffer(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`failed to fetch asset: ${url}`);
  const arr = await res.arrayBuffer();
  return Buffer.from(arr);
}

async function composeFromPublicAssets(params: {
  origin: string;
  baseImagePath: string;
  layers: string[];
}) {
  const { origin, baseImagePath, layers } = params;

  const baseUrl = `${origin}${baseImagePath}`;
  const layerUrls = (layers || []).map((p) => `${origin}${p}`);

  const baseBuf = await fetchAsBuffer(baseUrl);

  // se non ci sono layer, ritorniamo solo la base
  if (!layerUrls.length) {
    const out = await sharp(baseBuf).png().toBuffer();
    return { buffer: out, mime: "image/png" };
  }

  const layerBufs = await Promise.all(layerUrls.map(fetchAsBuffer));

  const out = await sharp(baseBuf)
    .composite(layerBufs.map((b) => ({ input: b })))
    .png()
    .toBuffer();

  return { buffer: out, mime: "image/png" };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      // old flow:
      imageUrl,

      // new flow:
      baseImagePath,
      layers,

      // metadata:
      name,
      description,
      fid,
      attributes,
    } = body ?? {};

    if (!PINATA_JWT) {
      return NextResponse.json({ error: "PINATA_JWT mancante" }, { status: 500 });
    }

    // origin robusto (Vercel-friendly)
    const origin =
      req.headers.get("origin") ||
      process.env.APP_URL ||
      new URL(req.url).origin;

    // 1) build final image buffer
    let buffer: Buffer;
    let mime = "image/png";

    // NEW: compose from base + layers (preferred)
    if (typeof baseImagePath === "string" && baseImagePath.length > 0 && Array.isArray(layers)) {
      const composed = await composeFromPublicAssets({
        origin,
        baseImagePath,
        layers,
      });
      buffer = composed.buffer;
      mime = composed.mime;
    }
    // OLD: accept imageUrl
    else if (typeof imageUrl === "string" && imageUrl.length > 0) {
      if (isDataUrl(imageUrl)) {
        const parsed = bufferFromDataUrl(imageUrl);
        buffer = parsed.buffer;
        mime = parsed.mime || "image/png";
      } else {
        const imageRes = await axios.get(imageUrl, { responseType: "arraybuffer" });
        buffer = Buffer.from(imageRes.data);
        mime = imageRes.headers?.["content-type"] || "image/png";
      }
    } else {
      return NextResponse.json(
        { error: "missing imageUrl OR (baseImagePath + layers[])" },
        { status: 400 }
      );
    }

    // 2) upload image to pinata
    const form = new FormData();
    form.append("file", buffer, {
      filename: `farchad-${fid ?? "unknown"}.png`,
      contentType: mime,
    });

    const uploadRes = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", form, {
      maxBodyLength: Infinity,
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
        ...form.getHeaders(),
      },
    });

    const imageCid = uploadRes.data.IpfsHash;

    // 3) final attributes
    const finalAttributes = [
      ...(attributes || []),
      { trait_type: "Farcaster FID", value: String(fid ?? "") },
    ];

    // 4) metadata
    const metadata = {
      name,
      description,
      image: `ipfs://${imageCid}`,
      external_url: `https://warpcast.com`,
      attributes: finalAttributes,
    };

    // 5) upload metadata json
    const jsonRes = await axios.post("https://api.pinata.cloud/pinning/pinJSONToIPFS", metadata, {
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
        "Content-Type": "application/json",
      },
    });

    // gateway preview (per UI)
    const previewUrl = `https://gateway.pinata.cloud/ipfs/${imageCid}`;

    return NextResponse.json({
      metadataUri: `ipfs://${jsonRes.data.IpfsHash}`,
      imageCid,
      previewUrl,
    });
    
  } catch (error: any) {
    console.error("Upload Error:", error?.response?.data || error?.message || error);
    return NextResponse.json(
      { error: error?.message ?? "Errore upload IPFS" },
      { status: 500 }
    );
  }
}
