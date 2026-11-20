/**
 * Images envoyées depuis l'admin.
 *  - en local : dossier data/uploads, servi par /api/uploads/<nom>
 *  - en ligne : Cloudinary, dès que CLOUDINARY_URL (ou CLOUDINARY_CLOUD_NAME / _API_KEY / _API_SECRET) existe
 */
import "server-only";
import { createHash } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

export const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");
/** 4 Mo : Vercel refuse les requêtes de plus de 4,5 Mo */
export const MAX_UPLOAD = 4 * 1024 * 1024;
const LOCAL_URL = /^\/api\/uploads\/([0-9a-f-]{36}\.(?:jpg|png|webp))$/;
export const FOLDER = "laine";

const TYPES = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" } as const;
export type Ext = keyof typeof TYPES;

/* ---------------- Cloudinary ---------------- */

/** valeur nettoyée : espaces, guillemets ou « NOM= » collés par erreur dans Vercel */
const clean = (v: string | undefined, name: string) =>
  v?.trim().replace(new RegExp(`^${name}=`), "").replace(/^["']|["']$/g, "").trim() || undefined;

function cloudinary() {
  const url = clean(process.env.CLOUDINARY_URL, "CLOUDINARY_URL");
  const u = url?.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
  if (u) return { key: u[1], secret: u[2], cloud: u[3].toLowerCase() };
  const cloud = clean(process.env.CLOUDINARY_CLOUD_NAME, "CLOUDINARY_CLOUD_NAME")?.toLowerCase();
  const key = clean(process.env.CLOUDINARY_API_KEY, "CLOUDINARY_API_KEY");
  const secret = clean(process.env.CLOUDINARY_API_SECRET, "CLOUDINARY_API_SECRET");
  return cloud && key && secret ? { cloud, key, secret } : null;
}

/** Variables Cloudinary présentes mais incomplètes (pour un message clair) */
export function cloudinaryMissing() {
  if (cloudinary()) return [];
  if (clean(process.env.CLOUDINARY_URL, "CLOUDINARY_URL")) return ["CLOUDINARY_URL (format attendu : cloudinary://clé:secret@cloud)"];
  return ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"].filter(
    (n) => !clean(process.env[n], n),
  );
}

/** Sur Vercel, le disque est en lecture seule : Cloudinary est obligatoire */
export const onReadOnlyHost = () => !!process.env.VERCEL;
export const hasCloudinary = () => !!cloudinary();

/** Signature Cloudinary : sha1 des paramètres triés + secret */
function sign(params: Record<string, string | number>, secret: string) {
  const s = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha1").update(s + secret).digest("hex");
}

function cloudinaryUrlRe(cloud: string) {
  const c = cloud.replace(/[^\w-]/g, "");
  return new RegExp(`^https://res\\.cloudinary\\.com/${c}/image/upload/(?:v\\d+/)?(${FOLDER}/[\\w-]+/?[\\w-]*)\\.(?:jpg|jpeg|png|webp)$`);
}

/** Envoie une image sur Cloudinary et renvoie son URL https */
export async function uploadToCloudinary(buf: Buffer, ext: Ext, sub = "") {
  const c = cloudinary()!;
  const params = { folder: sub ? `${FOLDER}/${sub}` : FOLDER, public_id: crypto.randomUUID(), timestamp: Math.floor(Date.now() / 1000) };
  const fd = new FormData();
  fd.append("file", new Blob([new Uint8Array(buf)], { type: TYPES[ext] }));
  for (const [k, v] of Object.entries(params)) fd.append(k, String(v));
  fd.append("api_key", c.key);
  fd.append("signature", sign(params, c.secret));
  const r = await fetch(`https://api.cloudinary.com/v1_1/${c.cloud}/image/upload`, { method: "POST", body: fd });
  const d = (await r.json().catch(() => ({}))) as { secure_url?: string; error?: { message?: string } };
  if (!r.ok || !d.secure_url) throw new Error(`Cloudinary : ${d.error?.message ?? r.status}`);
  return d.secure_url;
}

/* ---------------- commun ---------------- */

/** Vrai si l'URL vient d'un upload de la boutique (local ou Cloudinary) */
export function isUploadUrl(u: unknown): u is string {
  if (typeof u !== "string") return false;
  if (LOCAL_URL.test(u)) return true;
  const c = cloudinary();
  return !!c && cloudinaryUrlRe(c.cloud).test(u);
}

/** Reconnaît le format réel à partir des premiers octets (pas de confiance dans le nom du fichier) */
export function detectImage(buf: Buffer): Ext | null {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buf.length > 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "webp";
  return null;
}

export async function saveUpload(buf: Buffer, ext: Ext) {
  if (hasCloudinary()) return uploadToCloudinary(buf, ext);
  await mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${crypto.randomUUID()}.${ext}`;
  await writeFile(path.join(UPLOAD_DIR, name), buf);
  return `/api/uploads/${name}`;
}

export async function readUpload(name: string) {
  if (!/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(name)) return null;
  try {
    const buf = await readFile(path.join(UPLOAD_DIR, name));
    return { buf, type: TYPES[name.split(".").pop() as Ext] };
  } catch {
    return null;
  }
}

/** Supprime une image envoyée (disque ou Cloudinary) ; ignore les autres URL */
export async function removeUpload(url: string | undefined) {
  if (!url) return;
  const local = url.match(LOCAL_URL);
  if (local) {
    await unlink(path.join(UPLOAD_DIR, local[1])).catch(() => {});
    return;
  }
  const c = cloudinary();
  const m = c && url.match(cloudinaryUrlRe(c.cloud));
  if (!c || !m) return;
  // invalidate : vide aussi le cache du CDN, sinon l'image reste visible un moment
  const params = { invalidate: "true", public_id: m[1], timestamp: Math.floor(Date.now() / 1000) };
  const fd = new FormData();
  for (const [k, v] of Object.entries(params)) fd.append(k, String(v));
  fd.append("api_key", c.key);
  fd.append("signature", sign(params, c.secret));
  try {
    const r = await fetch(`https://api.cloudinary.com/v1_1/${c.cloud}/image/destroy`, { method: "POST", body: fd });
    const d = (await r.json().catch(() => ({}))) as { result?: string; error?: { message?: string } };
    // « not found » = déjà supprimée : pas une erreur
    if (!r.ok || (d.result !== "ok" && d.result !== "not found")) {
      console.warn("[upload] suppression Cloudinary échouée", m[1], d.error?.message ?? d.result ?? r.status);
    }
  } catch (e) {
    console.warn("[upload] suppression Cloudinary échouée", m[1], e);
  }
}
