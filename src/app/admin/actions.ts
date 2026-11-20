"use server";
/**
 * Actions serveur du tableau de bord.
 * Chaque action vérifie la session admin, puis rafraîchit la boutique (updateTag) après modification.
 */
import { updateTag } from "next/cache";
import { read, write, ORDER_STATUSES, type Order, type OrderStatus } from "@/lib/server/db";
import { checkAdminCredentials, endAdminSession, isAdmin, startAdminSession } from "@/lib/server/auth";
import { CATALOG_TAG } from "@/lib/server/catalog";
import { garments, type GarmentId } from "@/lib/garments";
import type { Product, Variant } from "@/lib/products";
import type { Catalog, Category } from "@/lib/categories";
import { removeUpload, UPLOAD_URL } from "@/lib/server/uploads";

type Result = { ok: true } | { ok: false; error: string };

/** n'accepte que les images envoyées via /api/admin/upload */
const upload = (u: unknown) => (typeof u === "string" && UPLOAD_URL.test(u) ? u : undefined);

/** toutes les images envoyées encore utilisées par le catalogue */
function usedUploads(c: Catalog) {
  const s = new Set<string>();
  for (const p of c.products) {
    for (const u of p.photos ?? []) s.add(u);
    for (const v of p.variants) if (v.photo) s.add(v.photo);
  }
  for (const cat of c.categories) if (cat.image) s.add(cat.image);
  return s;
}

/** supprime du disque les images qui ne sont plus utilisées après une modification */
async function cleanUploads(before: Set<string>) {
  const after = await read((d) => usedUploads(d.catalog));
  await Promise.all([...before].filter((u) => !after.has(u)).map(removeUpload));
}

async function guard() {
  if (!(await isAdmin())) throw new Error("Session admin expirée, reconnectez-vous.");
}

export async function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

/* ---------------- session ---------------- */

export async function adminLogin(email: string, password: string): Promise<Result> {
  // petite pause pour ralentir les essais en série
  await new Promise((r) => setTimeout(r, 400));
  if (!checkAdminCredentials(String(email), String(password))) return { ok: false, error: "Identifiants incorrects." };
  await startAdminSession();
  return { ok: true };
}

export async function adminLogout() {
  await endAdminSession();
}

export async function adminCheck() {
  return isAdmin();
}

/* ---------------- lecture ---------------- */

export async function getAdminData(): Promise<{ catalog: Catalog; orders: Order[] }> {
  await guard();
  return read((d) => ({ catalog: d.catalog, orders: [...d.orders].reverse() }));
}

/* ---------------- produits ---------------- */

const HEX = /^#[0-9a-f]{6}$/i;
const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

function cleanVariant(v: Partial<Variant>, i: number): Variant {
  const name = String(v.name ?? "").trim().slice(0, 40) || `Coloris ${i + 1}`;
  return {
    // vide pour un nouveau coloris : l'identifiant sera tiré du nom
    id: String(v.id ?? "").trim(),
    name,
    swatch: HEX.test(String(v.swatch)) ? String(v.swatch) : "#cccccc",
    tint: v.tint && HEX.test(String(v.tint)) ? String(v.tint) : undefined,
    filter: v.filter ? String(v.filter).replace(/[^a-z0-9().%\s-]/gi, "").slice(0, 120) || undefined : undefined,
    photo: upload(v.photo),
  };
}

export async function saveProduct(input: Product, originalId: string | null): Promise<Result & { id?: string }> {
  await guard();
  const name = String(input.name ?? "").trim().slice(0, 80);
  const price = Number(input.price);
  const oldPrice = input.oldPrice ? Number(input.oldPrice) : undefined;
  if (name.length < 2) return { ok: false, error: "Le nom est obligatoire." };
  if (!(price > 0 && price < 10000)) return { ok: false, error: "Prix invalide." };
  if (oldPrice !== undefined && !(oldPrice > price)) return { ok: false, error: "Le prix barré doit être supérieur au prix." };
  if (!(input.garment in garments)) return { ok: false, error: "Photo de base invalide." };
  const variants = (input.variants ?? []).slice(0, 20).map(cleanVariant);
  if (variants.length === 0) return { ok: false, error: "Ajoutez au moins un coloris." };
  // identifiants de coloris uniques
  const seen = new Set<string>();
  for (const v of variants) {
    let id = (await slugify(v.id)) || (await slugify(v.name)) || "coloris";
    while (seen.has(id)) id += "-2";
    v.id = id;
    seen.add(id);
  }
  const sizes = (input.sizes ?? []).filter((s) => SIZES.includes(s));
  if (sizes.length === 0) return { ok: false, error: "Choisissez au moins une taille." };

  const photos = (input.photos ?? []).map(upload).filter((u): u is string => !!u).slice(0, 8);
  const before = await read((d) => usedUploads(d.catalog));

  const result = await write((d) => {
    const cats = new Set(d.catalog.categories.map((c) => c.slug));
    let id = originalId ?? "";
    if (!originalId) {
      const base = name
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 60) || "produit";
      id = base;
      let n = 2;
      while (d.catalog.products.some((p) => p.id === id)) id = `${base}-${n++}`;
    }
    const product: Product = {
      id,
      name,
      category: String(input.category ?? "").trim().slice(0, 60),
      tagline: String(input.tagline ?? "").trim().slice(0, 120),
      description: String(input.description ?? "").trim().slice(0, 1200),
      material: String(input.material ?? "").trim().slice(0, 120),
      price: Math.round(price * 100) / 100,
      oldPrice: oldPrice ? Math.round(oldPrice * 100) / 100 : undefined,
      badge: String(input.badge ?? "").trim().slice(0, 20) || undefined,
      tags: (input.tags ?? []).filter((t) => cats.has(t)),
      garment: input.garment as GarmentId,
      variants,
      sizes,
      photos: photos.length ? photos : undefined,
    };
    const i = d.catalog.products.findIndex((p) => p.id === originalId);
    if (originalId && i < 0) return null;
    if (i >= 0) d.catalog.products[i] = product;
    else d.catalog.products.push(product);
    return id;
  });
  if (!result) return { ok: false, error: "Produit introuvable." };
  await cleanUploads(before);
  updateTag(CATALOG_TAG);
  return { ok: true, id: result };
}

export async function deleteProduct(id: string): Promise<Result> {
  await guard();
  const before = await read((d) => usedUploads(d.catalog));
  await write((d) => {
    d.catalog.products = d.catalog.products.filter((p) => p.id !== id);
    for (const c of d.catalog.categories) if (c.cover?.productId === id) delete c.cover;
  });
  await cleanUploads(before);
  updateTag(CATALOG_TAG);
  return { ok: true };
}

/* ---------------- catégories ---------------- */

export async function saveCategory(input: Category, originalSlug: string | null): Promise<Result> {
  await guard();
  const name = String(input.name ?? "").trim().slice(0, 40);
  if (name.length < 2) return { ok: false, error: "Le nom est obligatoire." };
  const slug = (await slugify(String(input.slug || name))) || "categorie";
  const description = String(input.description ?? "").trim().slice(0, 200);
  const image = upload(input.image);
  const before = await read((d) => usedUploads(d.catalog));

  const res = await write((d) => {
    if (d.catalog.categories.some((c) => c.slug === slug && c.slug !== originalSlug)) return "Ce lien (slug) est déjà utilisé.";
    const cover =
      input.cover && d.catalog.products.some((p) => p.id === input.cover?.productId && p.variants.some((v) => v.id === input.cover?.variantId))
        ? { productId: input.cover.productId, variantId: input.cover.variantId }
        : undefined;
    const cat: Category = { slug, name, description, cover, image };
    const i = d.catalog.categories.findIndex((c) => c.slug === originalSlug);
    if (originalSlug && i < 0) return "Catégorie introuvable.";
    if (i >= 0) d.catalog.categories[i] = cat;
    else d.catalog.categories.push(cat);
    // slug renommé : on met à jour les produits qui l'utilisaient
    if (originalSlug && originalSlug !== slug) {
      for (const p of d.catalog.products) p.tags = p.tags.map((t) => (t === originalSlug ? slug : t));
    }
    return null;
  });
  if (res) return { ok: false, error: res };
  await cleanUploads(before);
  updateTag(CATALOG_TAG);
  return { ok: true };
}

export async function deleteCategory(slug: string): Promise<Result> {
  await guard();
  const before = await read((d) => usedUploads(d.catalog));
  await write((d) => {
    d.catalog.categories = d.catalog.categories.filter((c) => c.slug !== slug);
    for (const p of d.catalog.products) p.tags = p.tags.filter((t) => t !== slug);
  });
  await cleanUploads(before);
  updateTag(CATALOG_TAG);
  return { ok: true };
}

/** Change l'ordre d'affichage d'une catégorie (-1 = monter, +1 = descendre) */
export async function moveCategory(slug: string, dir: -1 | 1): Promise<Result> {
  await guard();
  await write((d) => {
    const list = d.catalog.categories;
    const i = list.findIndex((c) => c.slug === slug);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
  });
  updateTag(CATALOG_TAG);
  return { ok: true };
}

/* ---------------- commandes ---------------- */

export async function setOrderStatus(id: string, status: OrderStatus): Promise<Result> {
  await guard();
  if (!ORDER_STATUSES.includes(status)) return { ok: false, error: "Statut invalide." };
  const found = await write((d) => {
    const o = d.orders.find((x) => x.id === id);
    if (o) o.status = status;
    return !!o;
  });
  return found ? { ok: true } : { ok: false, error: "Commande introuvable." };
}
