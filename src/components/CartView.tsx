"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";
import ProductImage from "./ProductImage";
import Totals from "./Totals";
import { formatPrice } from "@/lib/products";
import { useCatalog } from "./CatalogProvider";
import { priceLines } from "@/lib/pricing";

export default function CartView() {
  const { items, setQty } = useCart();
  const { products, getProduct } = useCatalog();
  const priced = priceLines(items, products);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-4xl">Panier</h1>

      {items.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-line bg-white p-10 text-center">
          <p className="text-muted">Votre panier est vide.</p>
          <Link href="/#collection" className="mt-6 inline-flex h-12 items-center rounded-full bg-ink px-6 text-sm font-medium text-paper">
            Découvrir les pulls
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
          <ul className="divide-y divide-line border-y border-line">
            {items.map((it, i) => {
              const p = getProduct(it.productId);
              const v = p?.variants.find((x) => x.id === it.variantId);
              if (!p || !v) return null;
              return (
                <li key={`${it.productId}-${it.variantId}-${it.size}`} className="flex gap-4 py-5">
                  <Link href={`/produit/${p.id}?couleur=${v.id}`} className="h-32 w-26 shrink-0 overflow-hidden rounded-lg">
                    <ProductImage p={p} v={v} width={260} height={320} />
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <div className="flex justify-between gap-4">
                      <div>
                        <Link href={`/produit/${p.id}?couleur=${v.id}`} className="font-medium hover:underline">
                          {p.name}
                        </Link>
                        <p className="text-sm text-muted">
                          {v.name} · Taille {it.size}
                        </p>
                        <p className="mt-1 text-sm">{formatPrice(p.price)}</p>
                      </div>
                      <p className="font-medium">{formatPrice(p.price * it.qty)}</p>
                    </div>
                    <div className="mt-auto flex items-center gap-4 pt-3">
                      <div className="flex items-center rounded-full border border-line">
                        <button className="h-9 w-9" onClick={() => setQty(i, it.qty - 1)} aria-label="Retirer un">−</button>
                        <span className="w-6 text-center text-sm">{it.qty}</span>
                        <button className="h-9 w-9" onClick={() => setQty(i, it.qty + 1)} aria-label="Ajouter un">+</button>
                      </div>
                      <button onClick={() => setQty(i, 0)} className="text-sm text-muted underline underline-offset-4 hover:text-ink">
                        Supprimer
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <aside className="h-fit rounded-2xl border border-line bg-white p-6 lg:sticky lg:top-24">
            <h2 className="mb-4 font-medium">Récapitulatif</h2>
            <Totals subtotal={priced.subtotal} shipping={priced.shipping} total={priced.total} />
            <Link href="/commande" className="mt-6 flex h-12 items-center justify-center rounded-full bg-ink text-sm font-medium text-paper hover:bg-black">
              Passer commande
            </Link>
            <Link href="/#collection" className="mt-3 block text-center text-sm text-muted underline underline-offset-4">
              Continuer mes achats
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
