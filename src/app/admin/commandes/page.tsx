"use client";

import { useState } from "react";
import AdminShell, { useAdmin } from "@/components/admin/AdminShell";
import StatusBadge from "@/components/admin/StatusBadge";
import { setOrderStatus } from "../actions";
import { formatPrice } from "@/lib/products";
import type { OrderStatus } from "@/lib/server/db";
import Pagination, { usePaged } from "@/components/Pagination";

const STATUSES: OrderStatus[] = ["nouvelle", "confirmée", "expédiée", "livrée", "annulée"];

export default function Page() {
  return (
    <AdminShell title="Commandes">
      <Orders />
    </AdminShell>
  );
}

function Orders() {
  const { data, reload } = useAdmin();
  const [filter, setFilter] = useState<OrderStatus | "toutes">("toutes");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const list = (data?.orders ?? []).filter(
    (o) =>
      (filter === "toutes" || o.status === filter) &&
      `${o.number} ${o.customer.name} ${o.customer.phone} ${o.customer.city} ${o.promoCode ?? ""}`.toLowerCase().includes(q.toLowerCase()),
  );
  const paged = usePaged(list, 15, `${filter}|${q}`);
  if (!data) return null;
  const count = (s: OrderStatus) => data.orders.filter((o) => o.status === s).length;

  const change = async (id: string, status: OrderStatus) => {
    await setOrderStatus(id, status);
    await reload();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(["toutes", ...STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full border px-3 py-1.5 text-sm capitalize ${filter === s ? "border-ink bg-ink text-paper" : "border-line bg-white hover:border-ink"}`}
          >
            {s} ({s === "toutes" ? data.orders.length : count(s)})
          </button>
        ))}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="N°, client, téléphone, ville…"
          className="ml-auto w-full rounded-lg border border-line bg-white px-3.5 py-2 text-sm outline-none focus:border-ink sm:w-64"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="p-4">N°</th>
              <th className="p-4">Date</th>
              <th className="p-4">Client</th>
              <th className="p-4">Articles</th>
              <th className="p-4">Total</th>
              <th className="p-4">Origine</th>
              <th className="p-4">Statut</th>
            </tr>
          </thead>
          <tbody>
            {paged.items.map((o) => (
              <FragmentRow key={o.id}>
                <tr className="cursor-pointer border-t border-line hover:bg-mist/60" onClick={() => setOpen(open === o.id ? null : o.id)}>
                  <td className="p-4 font-medium">{o.number}</td>
                  <td className="p-4 text-muted">
                    {new Date(o.createdAt).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="p-4">
                    {o.customer.name}
                    <span className="block text-xs text-muted">{o.customer.phone}</span>
                  </td>
                  <td className="p-4">{o.items.reduce((s, i) => s + i.qty, 0)}</td>
                  <td className="p-4 font-medium">{formatPrice(o.total)}</td>
                  <td className="p-4 text-xs text-muted">{o.source === "express" ? "Express" : "Panier"}</td>
                  <td className="p-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={o.status} />
                      <select
                        value={o.status}
                        onChange={(e) => change(o.id, e.target.value as OrderStatus)}
                        className="rounded-md border border-line bg-white px-2 py-1 text-xs"
                        aria-label={`Statut de la commande ${o.number}`}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
                {open === o.id && (
                  <tr className="bg-mist/50">
                    <td colSpan={7} className="p-5">
                      <div className="grid gap-6 md:grid-cols-2">
                        <div>
                          <p className="mb-2 font-medium">Articles</p>
                          <ul className="space-y-1">
                            {o.items.map((i) => (
                              <li key={`${i.productId}-${i.variantId}-${i.size}`} className="flex justify-between gap-3">
                                <span>{i.qty} × {i.name} · {i.variant} · {i.size}</span>
                                <span>{formatPrice(i.lineTotal)}</span>
                              </li>
                            ))}
                          </ul>
                          <p className="mt-3 border-t border-line pt-2 text-muted">
                            Sous-total {formatPrice(o.subtotal)}{o.discount ? ` · Code ${o.promoCode} -${formatPrice(o.discount)}` : ""} · Livraison {o.shipping ? formatPrice(o.shipping) : "offerte"} · <strong className="text-ink">Total {formatPrice(o.total)}</strong>
                          </p>
                        </div>
                        <div>
                          <p className="mb-2 font-medium">Livraison</p>
                          <p>{o.customer.name}</p>
                          <p>{o.customer.address}</p>
                          <p>{o.customer.zip} {o.customer.city}</p>
                          <p className="mt-2">
                            <a href={`tel:${o.customer.phone}`} className="underline">{o.customer.phone}</a> ·{" "}
                            <a href={`mailto:${o.customer.email}`} className="underline">{o.customer.email}</a>
                          </p>
                          {o.customer.note && <p className="mt-2 text-muted">Note : {o.customer.note}</p>}
                          <p className="mt-2 text-xs text-muted">Paiement à la livraison · {o.userId ? "client avec compte" : "sans compte"}</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </FragmentRow>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted">Aucune commande.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={paged.page} pages={paged.pages} onChange={paged.setPage} total={paged.total} perPage={15} />
    </div>
  );
}

function FragmentRow({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
