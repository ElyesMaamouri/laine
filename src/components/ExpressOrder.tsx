"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import CustomerForm, { emptyCustomer, type CustomerInput } from "./CustomerForm";
import Totals from "./Totals";
import { formatPrice, type Product, type Variant } from "@/lib/products";
import { priceLines, withDiscount } from "@/lib/pricing";
import PromoInput, { type AppliedPromo } from "./PromoInput";
import { useCatalog } from "./CatalogProvider";

/** Formulaire de commande rapide, directement sur la fiche produit */
export default function ExpressOrder({ product, variant, size, onMissingSize }: { product: Product; variant: Variant; size: string | null; onMissingSize: () => void }) {
  const router = useRouter();
  const { user } = useAuth();
  const { products } = useCatalog();
  const [qty, setQty] = useState(1);
  const [customer, setCustomer] = useState<CustomerInput>(emptyCustomer);
  const [promo, setPromo] = useState<AppliedPromo>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- pré-remplissage unique quand la session arrive
    setCustomer((c) => ({ ...c, name: c.name || user.name, email: c.email || user.email }));
  }, [user]);

  const line = { productId: product.id, variantId: variant.id, size: size ?? product.sizes[0], qty };
  const priced = priceLines([line], products);
  const totals = withDiscount(priced.subtotal, promo?.discount ?? 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!size) {
      onMissingSize();
      setError("Choisissez d'abord une taille, plus haut.");
      return;
    }
    setBusy(true);
    setErrors({});
    setError("");
    try {
      const r = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer, items: [line], source: "express", promoCode: promo?.code }),
      });
      const d = await r.json();
      if (!r.ok) {
        setErrors(d.errors ?? {});
        if (d.errors?.promo) setPromo(null);
        setError(d.errors?.promo ?? "Vérifiez les champs en rouge.");
        return;
      }
      router.push(`/commande/confirmation?id=${d.id}`);
    } catch {
      setError("Impossible d'envoyer la commande, réessayez.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="commande-express" className="mt-8 scroll-mt-24 rounded-2xl border border-line bg-white p-5">
      <h2 className="font-display text-2xl">Commande express</h2>
      <p className="mt-1 text-sm text-muted">Sans compte, en 1 minute. Paiement à la livraison.</p>

      <form onSubmit={submit} noValidate className="mt-5 space-y-5">
        <div className="flex items-center justify-between rounded-xl bg-mist px-4 py-3 text-sm">
          <span>
            {variant.name} · Taille <strong>{size ?? "—"}</strong>
          </span>
          <div className="flex items-center rounded-full border border-line bg-white">
            <button type="button" className="h-8 w-8" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Diminuer la quantité">−</button>
            <span className="w-6 text-center" aria-live="polite">{qty}</span>
            <button type="button" className="h-8 w-8" onClick={() => setQty((q) => Math.min(20, q + 1))} aria-label="Augmenter la quantité">+</button>
          </div>
        </div>

        <CustomerForm value={customer} onChange={setCustomer} errors={errors} compact />
        <PromoInput lines={[line]} applied={promo} onChange={setPromo} />
        <Totals {...totals} promoCode={promo?.code} />
        {error && <p className="rounded-lg bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}
        <button disabled={busy} className="h-12 w-full rounded-full bg-clay text-sm font-medium text-white hover:brightness-95 disabled:opacity-50">
          {busy ? "Envoi…" : `Commander maintenant · ${formatPrice(totals.total)}`}
        </button>
      </form>
    </section>
  );
}
