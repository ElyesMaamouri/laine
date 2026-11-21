"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import OrderDetail, { type PublicOrder as Order } from "./OrderDetail";

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

      <div className="mt-10">
        <OrderDetail order={order} />
      </div>
      <p className="mt-6 text-center text-sm text-muted">
        Retrouvez cette commande à tout moment sur{" "}
        <Link href="/suivi" className="text-ink underline underline-offset-4">
          Suivre ma commande
        </Link>{" "}
        avec son numéro et votre e-mail.
      </p>

      <div className="mt-8 text-center">
        <Link href="/#collection" className="inline-flex h-12 items-center rounded-full bg-ink px-6 text-sm font-medium text-paper">
          Continuer mes achats
        </Link>
      </div>
    </div>
  );
}
