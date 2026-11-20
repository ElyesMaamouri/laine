"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "./CartProvider";
import { useAuth } from "./AuthProvider";
import CustomerForm, { emptyCustomer, type CustomerInput } from "./CustomerForm";
import Totals from "./Totals";
import { formatPrice } from "@/lib/products";
import { priceLines, withDiscount } from "@/lib/pricing";
import PromoInput, { type AppliedPromo } from "./PromoInput";
import { useCatalog } from "./CatalogProvider";

export default function CheckoutView() {
  const router = useRouter();
  const { items, clear } = useCart();
  const { user, loading } = useAuth();
  const [customer, setCustomer] = useState<CustomerInput>(emptyCustomer);
  const [promo, setPromo] = useState<AppliedPromo>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // commande enregistrée : on garde un écran d'attente pendant la redirection (le panier est vidé juste après)
  const [placed, setPlaced] = useState(false);
  const { products } = useCatalog();
  const priced = priceLines(items, products);
  const totals = withDiscount(priced.subtotal, promo?.discount ?? 0);

  // pré-remplit nom et e-mail du compte connecté
  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- pré-remplissage unique quand la session arrive
    setCustomer((c) => ({ ...c, name: c.name || user.name, email: c.email || user.email }));
  }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    setError("");
    try {
      const r = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer, items, source: "checkout", promoCode: promo?.code }),
      });
      const d = await r.json();
      if (!r.ok) {
        setErrors(d.errors ?? {});
        if (d.errors?.promo) setPromo(null);
        setError(d.errors?.promo ?? d.errors?.items ?? "Vérifiez les champs en rouge.");
        return;
      }
      setPlaced(true);
      router.push(`/commande/confirmation?id=${d.id}`);
      clear();
    } catch {
      setError("Impossible d'envoyer la commande, réessayez.");
    } finally {
      setBusy(false);
    }
  };

  if (placed) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center" role="status">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-ink text-2xl text-paper">✓</div>
        <h1 className="mt-5 font-display text-3xl">Commande enregistrée</h1>
        <p className="mt-2 text-muted">Ouverture du récapitulatif…</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl">Votre panier est vide</h1>
        <Link href="/#collection" className="mt-6 inline-flex h-12 items-center rounded-full bg-ink px-6 text-sm font-medium text-paper">
          Découvrir les pulls
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-4xl">Commande</h1>
      <form onSubmit={submit} noValidate className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="space-y-10">
          {!loading && !user && (
            <p className="rounded-xl border border-line bg-white p-4 text-sm">
              Déjà client ?{" "}
              <Link href="/connexion?suite=/commande" className="underline underline-offset-4">Connectez-vous</Link> pour retrouver vos
              commandes. Vous pouvez aussi commander sans compte.
            </p>
          )}
          <section>
            <h2 className="mb-4 text-lg font-medium">1. Livraison</h2>
            <CustomerForm value={customer} onChange={setCustomer} errors={errors} />
          </section>
          <section>
            <h2 className="mb-4 text-lg font-medium">2. Paiement</h2>
            <label className="flex items-start gap-3 rounded-xl border border-ink bg-white p-4">
              <input type="radio" checked readOnly className="mt-1 accent-ink" />
              <span>
                <span className="block font-medium">Paiement à la livraison</span>
                <span className="block text-sm text-muted">Vous payez en espèces ou par carte au livreur.</span>
              </span>
            </label>
          </section>
        </div>

        <aside className="h-fit rounded-2xl border border-line bg-white p-6 lg:sticky lg:top-24">
          <h2 className="mb-4 font-medium">Votre commande</h2>
          <ul className="mb-5 space-y-2 text-sm">
            {priced.items.map((i) => (
              <li key={`${i.productId}-${i.variantId}-${i.size}`} className="flex justify-between gap-3">
                <span>
                  {i.qty} × {i.name} <span className="text-muted">· {i.variant} · {i.size}</span>
                </span>
                <span className="shrink-0">{formatPrice(i.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <div className="mb-4">
            <PromoInput lines={items} applied={promo} onChange={setPromo} />
          </div>
          <Totals {...totals} promoCode={promo?.code} />
          {error && <p className="mt-4 rounded-lg bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}
          <button disabled={busy} className="mt-6 h-12 w-full rounded-full bg-ink text-sm font-medium text-paper hover:bg-black disabled:opacity-50">
            {busy ? "Envoi…" : `Confirmer la commande · ${formatPrice(totals.total)}`}
          </button>
        </aside>
      </form>
    </div>
  );
}
