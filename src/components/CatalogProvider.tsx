"use client";

import { createContext, useContext, useMemo } from "react";
import type { Catalog } from "@/lib/categories";
import type { Product } from "@/lib/products";
import { applySettings, type StoreSettings } from "@/lib/settings";

type Ctx = Catalog & { settings: StoreSettings; getProduct: (id: string) => Product | undefined };

/** Catalogue (produits + catégories) fourni par le serveur à tous les composants client */
const CatalogCtx = createContext<Ctx>({ products: [], categories: [], settings: { currency: "EUR", whatsapp: "", shippingFee: 20, freeShippingAbove: 200 }, getProduct: () => undefined });

export function CatalogProvider({ catalog, settings, children }: { catalog: Catalog; settings: StoreSettings; children: React.ReactNode }) {
  // devise et livraison appliquées avant le rendu des prix côté navigateur
  applySettings(settings);
  const value = useMemo(
    () => ({ ...catalog, settings, getProduct: (id: string) => catalog.products.find((p) => p.id === id) }),
    [catalog, settings],
  );
  return <CatalogCtx.Provider value={value}>{children}</CatalogCtx.Provider>;
}

export function useCatalog() {
  return useContext(CatalogCtx);
}
