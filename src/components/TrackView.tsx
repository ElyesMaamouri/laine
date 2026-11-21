"use client";

import Link from "next/link";
import { useState } from "react";
import Field from "./Field";
import OrderDetail, { type PublicOrder } from "./OrderDetail";
import { useAuth } from "./AuthProvider";

/** Suivi d'une commande sans compte : numéro + e-mail */
export default function TrackView() {
  const { user } = useAuth();
  const [number, setNumber] = useState("");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setOrder(null);
    try {
      const r = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number, email }),
      });
      const d = await r.json();
      if (!r.ok) setError(d.error ?? "Commande introuvable.");
      else setOrder(d.order);
    } catch {
      setError("Vérification impossible, réessayez.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-4xl">Suivre ma commande</h1>
      <p className="mt-2 text-sm text-muted">
        Saisissez le numéro reçu après votre commande (ex : MA-1024) et l&apos;e-mail utilisé.
        {user ? (
          <>
            {" "}
            Vos commandes sont aussi dans{" "}
            <Link href="/compte" className="text-ink underline underline-offset-4">
              Mon compte
            </Link>
            .
          </>
        ) : (
          <>
            {" "}
            Avec un{" "}
            <Link href="/inscription" className="text-ink underline underline-offset-4">
              compte
            </Link>
            , vous les retrouvez toutes au même endroit.
          </>
        )}
      </p>

      <form onSubmit={submit} className="mt-8 grid gap-3 rounded-2xl border border-line bg-white p-5 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end" noValidate>
        <Field label="N° de commande" placeholder="MA-1024" value={number} onChange={(e) => setNumber(e.target.value.toUpperCase())} required />
        <Field label="E-mail" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <button disabled={busy || !number || !email} className="h-11 rounded-full bg-ink px-6 text-sm font-medium text-paper disabled:opacity-40">
          {busy ? "Recherche…" : "Suivre"}
        </button>
        {error && <p className="text-sm text-clay sm:col-span-3">{error}</p>}
      </form>

      {order && (
        <div className="mt-8 animate-fade-up">
          <OrderDetail order={order} />
        </div>
      )}
    </div>
  );
}
