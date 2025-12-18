import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import FormData from "form-data";

const PINATA_JWT = process.env.PINATA_JWT;

function isDataUrl(v: string) {
  return typeof v === "string" && v.startsWith("data:");
}

function bufferFromDataUrl(dataUrl: string) {
  // data:image/png;base64,AAAA...
  const match = dataUrl.match(/^data:(.+?);base64,(.+)$/);
  if (!match) throw new Error("Invalid data URL format");

  const mime = match[1] || "image/png";
  const base64 = match[2];

  const buffer = Buffer.from(base64, "base64");
  return { buffer, mime };
}

export async function POST(req: NextRequest) {
  try {
    const { imageUrl, name, description, fid, attributes } = await req.json();

    if (!PINATA_JWT) {
      return NextResponse.json({ error: "PINATA_JWT mancante" }, { status: 500 });
    }

    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json({ error: "imageUrl mancante o non valido" }, { status: 400 });
    }

    // 1) ottieni buffer immagine (URL normale o data URL)
    let buffer: Buffer;
    let mime = "image/png";

    if (isDataUrl(imageUrl)) {
      const parsed = bufferFromDataUrl(imageUrl);
      buffer = parsed.buffer;
      mime = parsed.mime || "image/png";
    } else {
      const imageRes = await axios.get(imageUrl, { responseType: "arraybuffer" });
      buffer = Buffer.from(imageRes.data);
      mime = imageRes.headers?.["content-type"] || "image/png";
    }

    // 2) Carica immagine su Pinata (multipart robusto)
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

    // 3) Prepara attributi finali
    const finalAttributes = [
      ...(attributes || []),
      { trait_type: "Farcaster FID", value: String(fid ?? "") },
    ];

    // 4) Metadati JSON (OpenSea)
    const metadata = {
      name,
      description,
      image: `ipfs://${imageCid}`,
      external_url: `https://warpcast.com`,
      attributes: finalAttributes,
    };

    // 5) Carica JSON su Pinata
    const jsonRes = await axios.post("https://api.pinata.cloud/pinning/pinJSONToIPFS", metadata, {
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
        "Content-Type": "application/json",
      },
    });

    return NextResponse.json({ metadataUri: `ipfs://${jsonRes.data.IpfsHash}` });
  } catch (error: any) {
    console.error("Upload Error:", error?.response?.data || error?.message || error);
    return NextResponse.json(
      { error: error?.message ?? "Errore upload IPFS" },
      { status: 500 }
    );
  }
}