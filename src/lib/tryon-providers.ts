/**
 * Fournisseurs d'essayage IA (côté serveur uniquement).
 *  - huggingface : gratuit, pour tester (Space IDM-VTON, file d'attente, quota limité)
 *  - fashn       : payant, pour la production (FASHN_API_KEY)
 * Choix : TRYON_PROVIDER, sinon fashn si une clé existe, sinon huggingface.
 *
 * Suivi des tâches : Redis si configuré (indispensable sur Vercel, où chaque requête
 * peut arriver sur un serveur différent), sinon mémoire du serveur (local).
 */
import { Client, handle_file } from "@gradio/client";
import { hasRedis, redis } from "./server/redis";
import { hasCloudinary, uploadToCloudinary, detectImage } from "./server/uploads";

export type Provider = "huggingface" | "fashn";
export type Job = { status: "processing" | "completed" | "failed"; output?: string; error?: string; createdAt: number };

export function currentProvider(): Provider {
  const p = process.env.TRYON_PROVIDER;
  if (p === "huggingface" || p === "fashn") return p;
  return process.env.FASHN_API_KEY ? "fashn" : "huggingface";
}

/* ---------------- stockage des tâches ---------------- */

const TTL = 30 * 60; // 30 min
const g = globalThis as unknown as { __tryonJobs?: Map<string, Job> };
const memory = (g.__tryonJobs ??= new Map<string, Job>());

export async function setJob(id: string, job: Job) {
  if (hasRedis()) {
    await redis(["SET", `laine:tryon:${id}`, JSON.stringify(job), "EX", TTL]);
    return;
  }
  const limit = Date.now() - TTL * 1000;
  for (const [k, j] of memory) if (j.createdAt < limit) memory.delete(k);
  memory.set(id, job);
}

export async function getJob(id: string): Promise<Job | null> {
  if (hasRedis()) {
    const raw = await redis<string | null>(["GET", `laine:tryon:${id}`]);
    return raw ? (JSON.parse(raw) as Job) : null;
  }
  return memory.get(id) ?? null;
}

/* ---------------- Hugging Face ---------------- */

async function dataUrlToBlob(dataUrl: string) {
  return (await fetch(dataUrl)).blob();
}

function friendly(e: unknown) {
  const msg = e instanceof Error ? e.message : typeof e === "object" && e && "message" in e ? String((e as { message: unknown }).message) : String(e);
  if (/quota|ZeroGPU|exceeded/i.test(msg))
    return "Quota gratuit Hugging Face atteint. Réessayez plus tard, ou ajoutez HF_TOKEN (compte gratuit) pour plus d'essais.";
  if (/queue|busy|too many/i.test(msg)) return "Le service gratuit est saturé, réessayez dans quelques minutes.";
  if (/sleep|paused|building|runtime/i.test(msg)) return "Le modèle gratuit est en veille ou en redémarrage, réessayez dans 1 à 2 minutes.";
  return `Hugging Face : ${msg.slice(0, 200)}`;
}

/**
 * Prépare un essayage sur le Space IDM-VTON.
 * Renvoie l'identifiant et la fonction de travail, à lancer avec after() dans la route.
 */
export async function prepareHuggingFace(modelImage: string, garmentImage: string, description: string) {
  const id = crypto.randomUUID();
  await setJob(id, { status: "processing", createdAt: Date.now() });

  const work = async () => {
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
      const buf = Buffer.from(await img.arrayBuffer());

      let output: string;
      const ext = detectImage(buf);
      if (hasCloudinary() && ext) {
        output = await uploadToCloudinary(buf, ext, "essayages"); // en ligne : URL durable et légère
      } else if (hasRedis()) {
        output = out.url; // Redis sans Cloudinary : lien Hugging Face (temporaire mais suffisant pour l'afficher)
      } else {
        output = `data:${img.headers.get("content-type") ?? "image/webp"};base64,${buf.toString("base64")}`; // local
      }
      await setJob(id, { status: "completed", output, createdAt: Date.now() });
    } catch (e) {
      console.warn("[tryon] huggingface", e);
      await setJob(id, { status: "failed", error: friendly(e), createdAt: Date.now() }).catch(() => {});
    }
  };

  return { id, work };
}
