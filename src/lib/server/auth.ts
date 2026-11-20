/** Mots de passe (scrypt) et session par cookie signé (HMAC) */
import "server-only";
import { createHmac, randomBytes, scrypt as _scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { read, type User } from "./db";

const scrypt = promisify(_scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;
const COOKIE = "maille_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 jours

function secret() {
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 32) return s;
  // secours en dev : secret aléatoire (les sessions sautent au redémarrage)
  const g = globalThis as unknown as { __authSecret?: string };
  return (g.__authSecret ??= randomBytes(32).toString("hex"));
}

export async function hashPassword(pw: string) {
  const salt = randomBytes(16);
  const key = await scrypt(pw, salt, 64);
  return `${salt.toString("hex")}:${key.toString("hex")}`;
}

export async function verifyPassword(pw: string, stored: string) {
  const [saltHex, keyHex] = stored.split(":");
  if (!saltHex || !keyHex) return false;
  const key = await scrypt(pw, Buffer.from(saltHex, "hex"), 64);
  const expected = Buffer.from(keyHex, "hex");
  return expected.length === key.length && timingSafeEqual(expected, key);
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export async function startSession(userId: string) {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  const payload = `${userId}.${exp}`;
  (await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

/** Utilisateur connecté (ou null) */
export async function currentUser(): Promise<User | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const parts = raw.split(".");
  if (parts.length !== 3) return null;
  const [id, exp, sig] = parts;
  const good = sign(`${id}.${exp}`);
  if (sig.length !== good.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return null;
  if (Number(exp) < Date.now() / 1000) return null;
  return read((d) => d.users.find((u) => u.id === id) ?? null);
}

export const publicUser = (u: User) => ({ id: u.id, name: u.name, email: u.email });

/* ------------------------------------------------------------------ */
/* Administration : un seul compte, défini dans .env.local            */
/* ------------------------------------------------------------------ */
const ADMIN_COOKIE = "maille_admin";
const ADMIN_MAX_AGE = 60 * 60 * 8; // 8 h

function sameText(a: string, b: string) {
  const ha = createHmac("sha256", "cmp").update(a).digest();
  const hb = createHmac("sha256", "cmp").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/** valeur d'environnement nettoyée (espaces et guillemets collés par erreur dans Vercel) */
const envValue = (v: string | undefined) => v?.trim().replace(/^["']|["']$/g, "").trim() || undefined;

/** Ce qui manque pour que l'admin fonctionne (vide = tout est configuré) */
export function adminConfigProblems() {
  const missing: string[] = [];
  if (!envValue(process.env.ADMIN_EMAIL)) missing.push("ADMIN_EMAIL");
  if (!envValue(process.env.ADMIN_PASSWORD)) missing.push("ADMIN_PASSWORD");
  // en ligne, sans secret fixe, chaque serveur signe les sessions avec une clé différente
  if (process.env.NODE_ENV === "production" && (process.env.AUTH_SECRET ?? "").length < 32) missing.push("AUTH_SECRET");
  return missing;
}

/** Vérifie les identifiants admin (comparaison à temps constant) */
export function checkAdminCredentials(email: string, password: string) {
  const e = envValue(process.env.ADMIN_EMAIL);
  const p = envValue(process.env.ADMIN_PASSWORD);
  if (!e || !p) return false;
  // les deux comparaisons sont toujours faites
  const okEmail = sameText(email.trim().toLowerCase(), e.toLowerCase());
  const okPass = sameText(password.trim(), p);
  return okEmail && okPass;
}

export async function startAdminSession() {
  const exp = Math.floor(Date.now() / 1000) + ADMIN_MAX_AGE;
  const payload = `admin.${exp}`;
  (await cookies()).set(ADMIN_COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_MAX_AGE,
  });
}

export async function endAdminSession() {
  (await cookies()).delete(ADMIN_COOKIE);
}

export async function isAdmin() {
  const raw = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!raw) return false;
  const [who, exp, sig] = raw.split(".");
  if (who !== "admin" || !exp || !sig) return false;
  const good = sign(`${who}.${exp}`);
  if (sig.length !== good.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return false;
  return Number(exp) > Date.now() / 1000;
}
