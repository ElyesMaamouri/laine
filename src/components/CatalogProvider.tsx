"use client";

import { createContext, useContext, useMemo } from "react";
import type { Catalog } from "@/lib/categories";
import type { Product } from "@/lib/products";

type Ctx = Catalog & { getProduct: (id: string) => Product | undefined };

/** Catalogue (produits + catégories) fourni par le serveur à tous les composants client */
const CatalogCtx = createContext<Ctx>({ products: [], categories: [], getProduct: () => undefined });

export function CatalogProvider({ catalog, children }: { catalog: Catalog; children: React.ReactNode }) {
  const value = useMemo(
    () => ({ ...catalog, getProduct: (id: string) => catalog.products.find((p) => p.id === id) }),
    [catalog],
  );
  return <CatalogCtx.Provider value={value}>{children}</CatalogCtx.Provider>;
}

export function useCatalog() {
  return useContext(CatalogCtx);
}
