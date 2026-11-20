"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Totals from "./Totals";
import { formatPrice } from "@/lib/products";

type Order = {
  number: string;
  createdAt: string;
  customer: { name: string; email: string; phone: string; address: string; city: string; zip: string };
  items: { productId: string; variantId: string; name: string; variant: string; size: string; qty: number; lineTotal: number }[];
  subtotal: number;
  discount?: number;
  promoCode?: string;
  shipping: number;
  total: number;
};

export default function ConfirmationView() {
  const [order, setOrder] = useState<Order | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- lien sans identifiant
      setMissing(true);
      return;
    }
    fetch(`/api/orders/${encodeURIComponent(id)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setOrder(d.order))
      .catch(() => setMissing(true));
  }, []);

  if (missing)
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl">Commande introuvable</h1>
        <Link href="/" className="mt-6 inline-block underline underline-offset-4">Retour à l&apos;accueil</Link>
      </div>
    );
  if (!order) return <p className="px-4 py-20 text-center text-sm text-muted">Chargement…</p>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <div className="text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-ink text-2xl text-paper">✓</div>
        <h1 className="mt-5 font-display text-4xl">Merci {order.customer.name.split(" ")[0]} !</h1>
        <p className="mt-2 text-muted">
          Commande <strong className="text-ink">{order.number}</strong> enregistrée. Nous vous appelons au {order.customer.phone} pour
          confirmer la livraison.
        </p>
      </div>

      <div className="mt-10 rounded-2xl border border-line bg-white p-6">
        <ul className="mb-5 space-y-2 text-sm">
          {order.items.map((i) => (
            <li key={`${i.productId}-${i.variantId}-${i.size}`} className="flex justify-between gap-3">
              <span>
                {i.qty} × {i.name} <span className="text-muted">· {i.variant} · {i.size}</span>
              </span>
              <span>{formatPrice(i.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <Totals subtotal={order.subtotal} discount={order.discount} promoCode={order.promoCode} shipping={order.shipping} total={order.total} />
        <div className="mt-6 border-t border-line pt-4 text-sm">
          <p className="font-medium">Livraison</p>
          <p className="text-muted">
            {order.customer.address}, {order.customer.zip} {order.customer.city}
          </p>
          <p className="mt-2 text-muted">Paiement à la livraison</p>
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link href="/#collection" className="inline-flex h-12 items-center rounded-full bg-ink px-6 text-sm font-medium text-paper">
          Continuer mes achats
        </Link>
      </div>
    </div>
  );
}
