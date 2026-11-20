/**
 * Mini base de données JSON (fichier data/db.json) — suffisante pour une démo.
 * En production : remplacer par une vraie base (Postgres, Supabase…).
 */
import "server-only";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { seedProducts } from "../products";
import { seedCategories, type Catalog } from "../categories";

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
  shipping: number;
  total: number;
  payment: "cod";
  status: OrderStatus;
  source: "checkout" | "express";
  createdAt: string;
};

export const ORDER_STATUSES = ["nouvelle", "confirmée", "expédiée", "livrée", "annulée"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

type Data = { users: User[]; orders: Order[]; catalog: Catalog };

const FILE = path.join(process.cwd(), "data", "db.json");
let queue: Promise<unknown> = Promise.resolve();

const seedCatalog = (): Catalog => structuredClone({ products: seedProducts, categories: seedCategories });

async function load(): Promise<Data> {
  let d: Partial<Data> = {};
  try {
    d = JSON.parse(await readFile(FILE, "utf8"));
  } catch {}
  // premier lancement : on recopie le catalogue de départ
  return { users: d.users ?? [], orders: d.orders ?? [], catalog: d.catalog ?? seedCatalog() };
}

async function save(data: Data) {
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
