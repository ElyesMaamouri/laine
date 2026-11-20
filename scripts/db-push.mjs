/**
 * Envoie la base locale (data/db.json) vers Upstash Redis, pour la retrouver sur Vercel.
 * Les images locales (/api/uploads/...) sont d'abord envoyées sur Cloudinary et leurs URL remplacées.
 *
 * Usage : npm run db:push            (demande confirmation si la base en ligne n'est pas vide)
 *         npm run db:push -- --force (écrase sans demander)
 * Variables lues dans .env.local : KV_REST_API_URL / KV_REST_API_TOKEN (ou UPSTASH_REDIS_REST_*),
 * CLOUDINARY_URL (ou CLOUDINARY_CLOUD_NAME / _API_KEY / _API_SECRET).
 */
import { createHash, randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline/promises";

const root = process.cwd();
const KEY = "laine:db";

// --- lecture de .env.local (sans dépendance)
const env = { ...process.env };
const envFile = path.join(root, ".env.local");
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !line.trim().startsWith("#")) env[m[1]] ??= m[2].replace(/^["']|["']$/g, "");
  }
}

const redisUrl = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL;
const redisToken = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;
if (!redisUrl || !redisToken) {
  console.error("✗ Variables Redis absentes : ajoutez KV_REST_API_URL et KV_REST_API_TOKEN dans .env.local");
  process.exit(1);
}

async function redis(cmd) {
  const r = await fetch(redisUrl, { method: "POST", headers: { Authorization: `Bearer ${redisToken}` }, body: JSON.stringify(cmd) });
  const d = await r.json();
  if (!r.ok || d.error) throw new Error(d.error ?? `HTTP ${r.status}`);
  return d.result;
}

// --- Cloudinary
let cloud = null;
const cu = env.CLOUDINARY_URL?.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
if (cu) cloud = { key: cu[1], secret: cu[2], name: cu[3] };
else if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET)
  cloud = { name: env.CLOUDINARY_CLOUD_NAME, key: env.CLOUDINARY_API_KEY, secret: env.CLOUDINARY_API_SECRET };

async function toCloudinary(file) {
  const params = { folder: "laine", public_id: randomUUID(), timestamp: Math.floor(Date.now() / 1000) };
  const signature = createHash("sha1")
    .update(Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join("&") + cloud.secret)
    .digest("hex");
  const fd = new FormData();
  fd.append("file", new Blob([readFileSync(file)]));
  for (const [k, v] of Object.entries(params)) fd.append(k, String(v));
  fd.append("api_key", cloud.key);
  fd.append("signature", signature);
  const r = await fetch(`https://api.cloudinary.com/v1_1/${cloud.name}/image/upload`, { method: "POST", body: fd });
  const d = await r.json();
  if (!r.ok || !d.secure_url) throw new Error(d.error?.message ?? `HTTP ${r.status}`);
  return d.secure_url;
}

// --- main
const dbFile = path.join(root, "data", "db.json");
if (!existsSync(dbFile)) {
  console.error("✗ data/db.json introuvable : lancez d'abord le site en local.");
  process.exit(1);
}
let json = readFileSync(dbFile, "utf8");
const data = JSON.parse(json);
console.log(`Base locale : ${data.catalog.products.length} produits, ${data.catalog.categories.length} catégories, ${data.orders.length} commandes, ${data.users.length} comptes`);

// images locales → Cloudinary
const local = [...new Set(json.match(/\/api\/uploads\/[0-9a-f-]{36}\.(?:jpg|png|webp)/g) ?? [])];
if (local.length) {
  if (!cloud) {
    console.error(`✗ ${local.length} image(s) locale(s) à envoyer, mais Cloudinary n'est pas configuré (CLOUDINARY_URL).`);
    process.exit(1);
  }
  for (const u of local) {
    const file = path.join(root, "data", "uploads", path.basename(u));
    if (!existsSync(file)) {
      console.warn(`  ! fichier manquant, ignoré : ${u}`);
      continue;
    }
    const remote = await toCloudinary(file);
    json = json.split(u).join(remote);
    console.log(`  ✓ ${path.basename(u)} → Cloudinary`);
  }
}

// confirmation si la base en ligne existe déjà
const existing = await redis(["GET", KEY]);
if (existing && !process.argv.includes("--force")) {
  const cur = JSON.parse(existing);
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const ans = await rl.question(
    `La base en ligne contient déjà ${cur.catalog?.products?.length ?? 0} produits et ${cur.orders?.length ?? 0} commandes. L'écraser ? (oui/non) `,
  );
  rl.close();
  if (!/^o(ui)?$/i.test(ans.trim())) {
    console.log("Annulé, rien n'a été modifié.");
    process.exit(0);
  }
}

await redis(["SET", KEY, json]);
console.log("✓ Base envoyée sur Upstash Redis. Redéployez ou attendez ~15 min pour que le cache du catalogue se rafraîchisse.");
