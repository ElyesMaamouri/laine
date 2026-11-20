/**
 * Mini client Upstash Redis (API REST, sans dépendance).
 * Activé automatiquement quand les variables existent :
 *  - KV_REST_API_URL / KV_REST_API_TOKEN (intégration Upstash de Vercel)
 *  - ou UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
 */
import "server-only";

const url = () => process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = () => process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

export const hasRedis = () => !!(url() && token());

/** Exécute une commande Redis, ex : redis(["GET", "clé"]) */
export async function redis<T = unknown>(command: (string | number)[]): Promise<T> {
  const r = await fetch(url()!, {
    method: "POST",
    headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });
  const data = (await r.json().catch(() => ({}))) as { result?: T; error?: string };
  if (!r.ok || data.error) throw new Error(`Redis : ${data.error ?? r.status}`);
  return data.result as T;
}
