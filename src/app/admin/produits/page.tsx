"use client";

import Link from "next/link";
import { useState } from "react";
import AdminShell, { useAdmin } from "@/components/admin/AdminShell";
import ProductImage from "@/components/ProductImage";
import { deleteProduct } from "../actions";
import { formatPrice } from "@/lib/products";
import Pagination, { usePaged } from "@/components/Pagination";

export default function Page() {
  return (
    <AdminShell
      title="Produits"
      action={
        <Link href="/admin/produits/nouveau" className="rounded-full bg-ink px-4 py-2 text-sm text-paper hover:bg-black">
          + Nouveau produit
        </Link>
      }
    >
      <ProductList />
    </AdminShell>
  );
}

function ProductList() {
  const { data, reload } = useAdmin();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const products = data?.catalog.products ?? [];
  const categories = data?.catalog.categories ?? [];
  const list = products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
  const paged = usePaged(list, 15, q);
  if (!data) return null;
  const catName = (s: string) => categories.find((c) => c.slug === s)?.name ?? s;

  const remove = async (id: string, name: string) => {
    if (!confirm(`Supprimer « ${name} » ? Il disparaîtra de la boutique.`)) return;
    setBusy(id);
    await deleteProduct(id);
    await reload();
    setBusy(null);
  };

  return (
    <div className="space-y-4">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Rechercher un produit…"
        className="w-full max-w-sm rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-ink"
      />
      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="p-4">Produit</th>
              <th className="p-4">Prix</th>
              <th className="p-4">Coloris</th>
              <th className="p-4">Catégories</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {paged.items.map((p) => (
              <tr key={p.id} className={busy === p.id ? "opacity-40" : ""}>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-12 shrink-0 overflow-hidden rounded-md">
                      {p.variants[0] && <ProductImage p={p} v={p.variants[0]} label={p.name} width={120} height={140} pad={0.06} />}
                    </div>
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-muted">{p.badge ? `${p.badge} · ` : ""}{p.id}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  {formatPrice(p.price)}
                  {p.oldPrice && <span className="ml-2 text-xs text-muted line-through">{formatPrice(p.oldPrice)}</span>}
                </td>
                <td className="p-4">
                  <div className="flex gap-1">
                    {p.variants.map((v) => (
                      <span key={v.id} title={v.name} className="h-4 w-4 rounded-full border border-black/10" style={{ background: v.swatch }} />
                    ))}
                  </div>
                </td>
                <td className="p-4 text-xs text-muted">{p.tags.map(catName).join(", ") || "—"}</td>
                <td className="p-4 text-right">
                  <Link href={`/admin/produits/${p.id}`} className="rounded-lg border border-line px-3 py-1.5 hover:border-ink">Modifier</Link>{" "}
                  <button onClick={() => remove(p.id, p.name)} className="rounded-lg px-3 py-1.5 text-clay hover:bg-clay/10">Supprimer</button>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted">Aucun produit.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={paged.page} pages={paged.pages} onChange={paged.setPage} total={paged.total} perPage={15} />
    </div>
  );
}
