"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";
import { BagIcon, CloseIcon, UserIcon } from "./Icons";
import { formatPrice } from "@/lib/products";
import { useCatalog } from "./CatalogProvider";
import { FREE_SHIPPING_ABOVE, shippingFor } from "@/lib/pricing";
import ProductImage from "./ProductImage";
import Totals from "./Totals";
import { useAuth } from "./AuthProvider";

export default function Header() {
  const { count, setOpen } = useCart();
  const { user } = useAuth();
  return (
    <>
      <div className="bg-ink px-4 py-2 text-center text-[12px] tracking-wide text-paper">
        Livraison offerte au-delà de {formatPrice(FREE_SHIPPING_ABOVE)} · Essayez nos pulls en direct avec votre caméra
      </div>
      <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <nav className="hidden gap-6 text-sm sm:flex">
            <Link href="/categorie/femme" className="hover:underline underline-offset-4">Femme</Link>
            <Link href="/categorie/homme" className="hover:underline underline-offset-4">Homme</Link>
            <Link href="/#categories" className="hover:underline underline-offset-4">Catégories</Link>
            <Link href="/categorie/promotions" className="text-clay hover:underline underline-offset-4">Promos</Link>
          </nav>
          <Link href="/" className="font-display text-2xl tracking-tight">
            Lainé<span className="text-clay">.</span>
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href={user ? "/compte" : "/connexion"}
              className="flex items-center gap-2 rounded-full p-2 text-sm hover:bg-mist"
              aria-label={user ? "Mon compte" : "Se connecter"}
            >
              <UserIcon />
              <span className="hidden md:inline">{user ? user.name.split(" ")[0] : "Connexion"}</span>
            </Link>
            <button
              onClick={() => setOpen(true)}
              className="relative rounded-full p-2 hover:bg-mist"
              aria-label={`Panier (${count} articles)`}
            >
              <BagIcon />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-clay px-1 text-[11px] font-medium text-white">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>
      <CartDrawer />
    </>
  );
}

function CartDrawer() {
  const { items, open, setOpen, total, setQty } = useCart();
  const { getProduct } = useCatalog();
  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div
        onClick={() => setOpen(false)}
        className={`absolute inset-0 bg-black/30 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
      />
      <aside
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-paper shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-line p-5">
          <h2 className="font-display text-xl">Votre panier</h2>
          <button onClick={() => setOpen(false)} aria-label="Fermer le panier" className="rounded-full p-2 hover:bg-mist">
            <CloseIcon />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {items.length === 0 && <p className="text-sm text-muted">Votre panier est vide.</p>}
          <ul className="space-y-5">
            {items.map((it, i) => {
              const p = getProduct(it.productId);
              const v = p?.variants.find((x) => x.id === it.variantId);
              if (!p || !v) return null;
              return (
                <li key={`${it.productId}-${it.variantId}-${it.size}`} className="flex gap-4">
                  <div className="h-24 w-20 shrink-0 overflow-hidden rounded-md">
                    <ProductImage p={p} v={v} width={240} height={300} />
                  </div>
                  <div className="flex-1 text-sm">
                    <p className="font-medium">{p.name}</p>
                    <p className="text-muted">
                      {v.name} · Taille {it.size}
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                      <button className="h-7 w-7 rounded border border-line" onClick={() => setQty(i, it.qty - 1)} aria-label="Retirer un">
                        −
                      </button>
                      <span>{it.qty}</span>
                      <button className="h-7 w-7 rounded border border-line" onClick={() => setQty(i, it.qty + 1)} aria-label="Ajouter un">
                        +
                      </button>
                    </div>
                  </div>
                  <p className="text-sm font-medium">{formatPrice(p.price * it.qty)}</p>
                </li>
              );
            })}
          </ul>
        </div>
        {items.length > 0 && (
          <div className="border-t border-line p-5">
            <Totals subtotal={total} shipping={shippingFor(total)} total={total + shippingFor(total)} />
            <Link
              href="/commande"
              onClick={() => setOpen(false)}
              className="mt-4 flex h-12 w-full items-center justify-center rounded-full bg-ink text-sm font-medium text-paper hover:bg-black"
            >
              Passer commande
            </Link>
            <Link href="/panier" onClick={() => setOpen(false)} className="mt-3 block text-center text-sm underline underline-offset-4">
              Voir le panier
            </Link>
          </div>
        )}
      </aside>
    </div>
  );
}
