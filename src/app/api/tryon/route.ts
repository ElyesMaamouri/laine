/**
 * Démarre un essayage IA réaliste.
 * Fournisseur : Hugging Face (gratuit, test) ou FASHN (payant) — voir src/lib/tryon-providers.ts
 */
import { currentProvider, startHuggingFace } from "@/lib/tryon-providers";

const FASHN_URL = "https://api.fashn.ai/v1";
const MAX_LEN = 8_000_000; // ~6 Mo par image en base64

export async function POST(req: Request) {
  let body: { modelImage?: unknown; garmentImage?: unknown; description?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ message: "Requête invalide" }, { status: 400 });
  }
  const { modelImage, garmentImage } = body;
  const valid = (s: unknown): s is string => typeof s === "string" && s.startsWith("data:image/") && s.length < MAX_LEN;
  if (!valid(modelImage) || !valid(garmentImage)) {
    return Response.json({ message: "Images invalides" }, { status: 400 });
  }
  const description =
    typeof body.description === "string" && body.description.length < 200 ? body.description : "knitted wool sweater";

  if (currentProvider() === "huggingface") {
    return Response.json({ id: startHuggingFace(modelImage, garmentImage, description), provider: "huggingface" });
  }

  const key = process.env.FASHN_API_KEY;
  if (!key) {
    return Response.json({ message: "TRYON_PROVIDER=fashn mais FASHN_API_KEY est absente de .env.local." }, { status: 501 });
  }
  const r = await fetch(`${FASHN_URL}/run`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model_name: process.env.FASHN_MODEL ?? "tryon-v1.6",
      inputs: { model_image: modelImage, garment_image: garmentImage, category: "tops", mode: "balanced" },
    }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || !data.id) {
    const msg = typeof data.error === "string" ? data.error : data.error?.message ?? data.message ?? `Erreur FASHN (${r.status})`;
    return Response.json({ message: msg }, { status: 502 });
  }
  return Response.json({ id: data.id, provider: "fashn" });
}
