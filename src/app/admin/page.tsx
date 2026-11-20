"use client";

import Link from "next/link";
import AdminShell, { useAdmin } from "@/components/admin/AdminShell";
import StatusBadge from "@/components/admin/StatusBadge";
import { formatPrice } from "@/lib/products";

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
        </section>
      </div>
    </div>
  );
}
