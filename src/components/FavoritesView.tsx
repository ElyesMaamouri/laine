"use client";

import Link from "next/link";
import { useCatalog } from "./CatalogProvider";
import { useFavorites } from "./Favorites";
import ProductCard from "./ProductCard";

export default function FavoritesView() {
  const { favs } = useFavorites();
  const { getProduct } = useCatalog();
  // produits encore en vente (un produit supprimé de la boutique disparaît des favoris affichés)
  const items = favs.flatMap((f) => {
    const p = getProduct(f.productId);
    const v = p?.variants.find((x) => x.id === f.variantId) ?? p?.variants[0];
    return p && v ? [{ p, v }] : [];
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-4xl">Mes favoris</h1>
      <p className="mt-2 text-sm text-muted">
        {items.length ? `${items.length} pull${items.length > 1 ? "s" : ""} gardé${items.length > 1 ? "s" : ""} sur cet appareil.` : "Enregistrés sur cet appareil, sans compte."}
      </p>
      {items.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-line bg-white p-10 text-center">
          <p className="text-muted">Touchez le ♥ d&apos;un pull pour le retrouver ici.</p>
          <Link href="/#collection" className="mt-6 inline-flex h-12 items-center rounded-full bg-ink px-6 text-sm font-medium text-paper">
            Découvrir les pulls
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
          {items.map(({ p, v }) => (
            <div key={p.id} className="animate-fade-up">
              <ProductCard p={p} v={v} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
