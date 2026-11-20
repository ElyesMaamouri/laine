/**
 * Mini base de données : un seul document JSON.
 *  - en local : fichier data/db.json
 *  - en ligne (Vercel) : clé Redis Upstash, dès que KV_REST_API_URL / KV_REST_API_TOKEN existent
 * Pour une vraie production : passer à une base relationnelle (Postgres, Supabase…).
 */
import "server-only";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { seedProducts } from "../products";
import { seedCategories, type Catalog } from "../categories";
import { hasRedis, redis } from "./redis";
import type { PromoCode } from "../promos";
import { withDefaults, type HomeSection } from "../home";

export type User = { id: string; name: string; email: string; passwordHash: string; createdAt: string };

export type OrderItem = {
  productId: string;
  variantId: string;
  name: string;
  variant: string;
  size: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
};

export type Customer = { name: string; email: string; phone: string; address: string; city: string; zip: string; note?: string };

export type Order = {
  id: string;
  number: string;
  userId: string | null;
  customer: Customer;
  items: OrderItem[];
  subtotal: number;
  /** remise du code promo (0 sans code) */
  discount?: number;
  promoCode?: string;
  shipping: number;
  total: number;
  payment: "cod";
  status: OrderStatus;
  source: "checkout" | "express";
  createdAt: string;
};

export const ORDER_STATUSES = ["nouvelle", "confirmée", "expédiée", "livrée", "annulée"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type Data = { users: User[]; orders: Order[]; catalog: Catalog; promos: PromoCode[]; home: HomeSection[] };

const FILE = path.join(process.cwd(), "data", "db.json");
let queue: Promise<unknown> = Promise.resolve();

const seedCatalog = (): Catalog => structuredClone({ products: seedProducts, categories: seedCategories });

export const REDIS_KEY = "laine:db";

async function load(): Promise<Data> {
  let d: Partial<Data> = {};
  try {
    const raw = hasRedis() ? await redis<string | null>(["GET", REDIS_KEY]) : await readFile(FILE, "utf8");
    if (raw) d = JSON.parse(raw);
  } catch (e) {
    // en ligne, une erreur Redis doit se voir ; en local, fichier absent = premier lancement
    if (hasRedis()) throw e;
  }
  // premier lancement : on recopie le catalogue de départ
  return {
    users: d.users ?? [],
    orders: d.orders ?? [],
    catalog: d.catalog ?? seedCatalog(),
    promos: d.promos ?? [],
    home: withDefaults(d.home),
  };
}

async function save(data: Data) {
  if (hasRedis()) {
    await redis(["SET", REDIS_KEY, JSON.stringify(data)]);
    return;
  }
  await mkdir(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.tmp`;
  await writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await rename(tmp, FILE);
}

/** Lecture seule */
export async function read<T>(fn: (d: Data) => T): Promise<T> {
  await queue;
  return fn(await load());
}

/** Lecture + écriture, sérialisées pour éviter les écrasements */
export function write<T>(fn: (d: Data) => T): Promise<T> {
  const run = queue.then(async () => {
    const d = await load();
    const out = fn(d);
    await save(d);
    return out;
  });
  queue = run.catch(() => {});
  return run;
}
