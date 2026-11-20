/**
 * Fournisseurs d'essayage IA (côté serveur uniquement).
 *  - huggingface : gratuit, pour tester (Space IDM-VTON, file d'attente, quota limité)
 *  - fashn       : payant, pour la production (FASHN_API_KEY)
 * Choix : TRYON_PROVIDER, sinon fashn si une clé existe, sinon huggingface.
 */
import { Client, handle_file } from "@gradio/client";

export type Provider = "huggingface" | "fashn";
export type Job = { status: "processing" | "completed" | "failed"; output?: string; error?: string; createdAt: number };

export function currentProvider(): Provider {
  const p = process.env.TRYON_PROVIDER;
  if (p === "huggingface" || p === "fashn") return p;
  return process.env.FASHN_API_KEY ? "fashn" : "huggingface";
}

// tâches Hugging Face en mémoire (suffisant pour un serveur de test)
const g = globalThis as unknown as { __tryonJobs?: Map<string, Job> };
export const jobs = (g.__tryonJobs ??= new Map<string, Job>());

function cleanup() {
  const limit = Date.now() - 30 * 60_000;
  for (const [id, j] of jobs) if (j.createdAt < limit) jobs.delete(id);
}

async function dataUrlToBlob(dataUrl: string) {
  return (await fetch(dataUrl)).blob();
}

function friendly(e: unknown) {
  const msg = e instanceof Error ? e.message : typeof e === "object" && e && "message" in e ? String((e as { message: unknown }).message) : String(e);
  if (/quota|ZeroGPU|exceeded/i.test(msg))
    return "Quota gratuit Hugging Face atteint. Réessayez plus tard, ou ajoutez HF_TOKEN (compte gratuit) dans .env.local pour plus d'essais.";
  if (/queue|busy|too many/i.test(msg)) return "Le service gratuit est saturé, réessayez dans quelques minutes.";
  if (/sleep|paused|building|runtime/i.test(msg)) return "Le modèle gratuit est en veille ou en redémarrage, réessayez dans 1 à 2 minutes.";
  return `Hugging Face : ${msg.slice(0, 200)}`;
}

/** Lance un essayage sur le Space IDM-VTON, renvoie l'identifiant de la tâche */
export function startHuggingFace(modelImage: string, garmentImage: string, description: string) {
  cleanup();
  const id = crypto.randomUUID();
  jobs.set(id, { status: "processing", createdAt: Date.now() });

  (async () => {
    try {
      const token = process.env.HF_TOKEN as `hf_${string}` | undefined;
      const client = await Client.connect(process.env.HF_SPACE ?? "yisol/IDM-VTON", token ? { token } : {});
      const [person, garment] = await Promise.all([dataUrlToBlob(modelImage), dataUrlToBlob(garmentImage)]);
      const res = await client.predict("/tryon", {
        dict: { background: handle_file(person), layers: [], composite: null },
        garm_img: handle_file(garment),
        garment_des: description,
        is_checked: true, // masque automatique du haut du corps
        is_checked_crop: true, // recadre la photo webcam (paysage) au format portrait attendu
        denoise_steps: 30,
        seed: 42,
      });
      const out = (res.data as Array<{ url?: string } | null>)[0];
      if (!out?.url) throw new Error("aucune image renvoyée");
      // on rapatrie l'image (les liens Hugging Face sont temporaires)
      const img = await fetch(out.url, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
      if (!img.ok) throw new Error(`téléchargement du résultat (${img.status})`);
      const type = img.headers.get("content-type") ?? "image/webp";
      const b64 = Buffer.from(await img.arrayBuffer()).toString("base64");
      jobs.set(id, { status: "completed", output: `data:${type};base64,${b64}`, createdAt: Date.now() });
    } catch (e) {
      console.warn("[tryon] huggingface", e);
      jobs.set(id, { status: "failed", error: friendly(e), createdAt: Date.now() });
    }
  })();

  return id;
}
