import { jobs } from "@/lib/tryon-providers";

/** Statut d'un essayage IA : processing | completed | failed (FASHN : starting | in_queue | …) */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[\w-]{1,100}$/.test(id)) return Response.json({ status: "failed", error: "Identifiant invalide" }, { status: 400 });

  // tâche Hugging Face en mémoire
  const job = jobs.get(id);
  if (job) return Response.json({ status: job.status, output: job.output ?? null, error: job.error ?? null });

  const key = process.env.FASHN_API_KEY;
  if (!key) return Response.json({ status: "failed", error: "Tâche introuvable (serveur redémarré ?)" }, { status: 404 });

  const r = await fetch(`https://api.fashn.ai/v1/status/${id}`, {
    headers: { Authorization: `Bearer ${key}` },
    cache: "no-store",
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) return Response.json({ status: "failed", error: `Erreur FASHN (${r.status})` }, { status: 502 });

  const error = data.error ? (typeof data.error === "string" ? data.error : data.error.message ?? "Échec") : null;
  return Response.json({ status: data.status, output: data.output?.[0] ?? null, error });
}
