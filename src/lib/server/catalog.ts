/**
 * Lecture du catalogue (produits + catégories), mise en cache.
 * Les actions de l'admin appellent updateTag(CATALOG_TAG) pour rafraîchir la boutique.
 */
import "server-only";
import { cacheTag } from "next/cache";
import { read } from "./db";
import type { Catalog } from "../categories";

export const CATALOG_TAG = "catalog";

export async function getCatalog(): Promise<Catalog> {
  "use cache";
  cacheTag(CATALOG_TAG);
  return read((d) => d.catalog);
}

/** Sections de la page d'accueil (même étiquette de cache : rafraîchies avec l'admin) */
export async function getHome() {
  "use cache";
  cacheTag(CATALOG_TAG);
  return read((d) => d.home);
}
