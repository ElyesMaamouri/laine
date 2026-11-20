"use client";

import Link from "next/link";
import AdminShell, { useAdmin } from "@/components/admin/AdminShell";
import StatusBadge from "@/components/admin/StatusBadge";
import { formatPrice } from "@/lib/products";
import { useState } from "react";
import { loadDemoData } from "./actions";

/** Bouton qui ajoute produits, catégories et commandes de démo (sans rien écraser) */
function DemoLoader() {
  const { reload } = useAdmin();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const run = async (orders: number) => {
    const what = orders ? `et ~${orders} commandes ` : "";
    if (!confirm(`Ajouter les produits, catégories, codes promo ${what}de démo ? Rien d'existant ne sera modifié.`)) return;
    setBusy(true);
    setMsg("");
    try {
      const r = await loadDemoData(orders);
      if (!r.ok) setMsg(r.error);
      else {
        const a = r.added!;
        setMsg(`Ajouté : ${a.products} produit(s), ${a.categories} catégorie(s), ${a.promos} code(s) promo, ${a.orders} commande(s).`);
        await reload();
      }
    } catch {
      setMsg("Échec, rechargez la page et réessayez.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="mt-6 border-t border-line pt-4">
      <p className="text-sm font-medium">Données de démonstration</p>
      <p className="mt-1 text-xs text-muted">
        Ajoute jusqu&apos;à 38 produits, 12 catégories, 5 codes promo et des commandes fictives, sans toucher à l&apos;existant.
      </p>
      <button
        onClick={() => run(20)}
        disabled={busy}
        className="mt-3 w-full rounded-lg border border-dashed border-ink/40 px-4 py-3 text-sm hover:border-ink disabled:opacity-50"
      >
        {busy ? "Chargement…" : "Charger les données de démo"}
      </button>
      <button onClick={() => run(0)} disabled={busy} className="mt-2 w-full text-xs text-muted underline underline-offset-2 hover:text-ink disabled:opacity-50">
        Catalogue et codes promo seulement (sans commandes)
      </button>
      {msg && <p className="mt-2 text-xs text-muted">{msg}</p>}
    </div>
  );
}

export default function AdminHome() {
  return (
    <AdminShell title="Tableau de bord">
      <Dashboard />
    </AdminShell>
  );
}

function Dashboard() {
  const { data } = useAdmin();
  if (!data) return null;
  const { orders, catalog } = data;
  const valid = orders.filter((o) => o.status !== "annulée");
  const revenue = valid.reduce((s, o) => s + o.total, 0);
  const stats = [
    ["Commandes", String(orders.length), `${orders.filter((o) => o.status === "nouvelle").length} à traiter`],
    ["Chiffre d'affaires", formatPrice(revenue), "hors commandes annulées"],
    ["Panier moyen", formatPrice(valid.length ? revenue / valid.length : 0), `${valid.length} commande(s)`],
    ["Catalogue", `${catalog.products.length} produits`, `${catalog.categories.length} catégories`],
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([label, value, sub]) => (
          <div key={label} className="rounded-2xl border border-line bg-white p-5">
            <p className="text-sm text-muted">{label}</p>
            <p className="mt-2 font-display text-3xl">{value}</p>
            <p className="mt-1 text-xs text-muted">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <section className="rounded-2xl border border-line bg-white">
          <div className="flex items-center justify-between border-b border-line p-5">
            <h2 className="font-medium">Dernières commandes</h2>
            <Link href="/admin/commandes" className="text-sm underline underline-offset-4">Tout voir</Link>
          </div>
          {orders.length === 0 ? (
            <p className="p-5 text-sm text-muted">Aucune commande pour l&apos;instant.</p>
          ) : (
            <ul className="divide-y divide-line">
              {orders.slice(0, 6).map((o) => (
                <li key={o.id} className="flex items-center gap-4 px-5 py-3 text-sm">
                  <span className="w-20 font-medium">{o.number}</span>
                  <span className="flex-1 truncate">{o.customer.name}</span>
                  <StatusBadge status={o.status} />
                  <span className="w-24 text-right">{formatPrice(o.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-line bg-white p-5">
          <h2 className="font-medium">Raccourcis</h2>
          <div className="mt-4 grid gap-2 text-sm">
            <Link href="/admin/produits/nouveau" className="rounded-lg bg-ink px-4 py-3 text-paper hover:bg-black">+ Ajouter un produit</Link>
            <Link href="/admin/categories" className="rounded-lg border border-line px-4 py-3 hover:border-ink">Gérer les catégories</Link>
            <Link href="/admin/commandes" className="rounded-lg border border-line px-4 py-3 hover:border-ink">Traiter les commandes</Link>
          </div>
          <DemoLoader />
        </section>
      </div>
    </div>
  );
}
