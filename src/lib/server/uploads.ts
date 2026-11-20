/** Images envoyées depuis l'admin, stockées en local dans data/uploads */
import "server-only";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

export const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");
export const MAX_UPLOAD = 5 * 1024 * 1024; // 5 Mo
export const UPLOAD_URL = /^\/api\/uploads\/([0-9a-f-]{36}\.(?:jpg|png|webp))$/;

const TYPES = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" } as const;
export type Ext = keyof typeof TYPES;

/** Reconnaît le format réel à partir des premiers octets (pas de confiance dans le nom du fichier) */
export function detectImage(buf: Buffer): Ext | null {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buf.length > 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "webp";
  return null;
}

export async function saveUpload(buf: Buffer, ext: Ext) {
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

/** Supprime un fichier envoyé (ignore les URL qui ne sont pas des uploads) */
export async function removeUpload(url: string | undefined) {
  const m = url?.match(UPLOAD_URL);
  if (!m) return;
  await unlink(path.join(UPLOAD_DIR, m[1])).catch(() => {});
}
