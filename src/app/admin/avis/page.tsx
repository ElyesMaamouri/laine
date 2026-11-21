"use client";

import { useState } from "react";
import AdminShell, { useAdmin } from "@/components/admin/AdminShell";
import Pagination, { usePaged } from "@/components/Pagination";
import { Stars } from "@/components/ProductReviews";
import { deleteReview, moderateReview } from "../actions";
import type { Review } from "@/lib/server/db";

const STYLE: Record<Review["status"], string> = {
  "en attente": "bg-amber-100 text-amber-800",
  "publié": "bg-green-100 text-green-800",
  "refusé": "bg-neutral-200 text-neutral-600",
};

export default function Page() {
  return (
    <AdminShell title="Avis clients">
      <Reviews />
    </AdminShell>
  );
}

function Reviews() {
  const { data, reload } = useAdmin();
  const [filter, setFilter] = useState<Review["status"] | "tous">("en attente");
  const reviews = data?.reviews ?? [];
  const list = reviews.filter((r) => filter === "tous" || r.status === filter);
  const paged = usePaged(list, 10, filter);
  if (!data) return null;
  const productName = (id: string) => data.catalog.products.find((p) => p.id === id)?.name ?? "Produit supprimé";

  const act = async (fn: () => Promise<unknown>) => {
    await fn();
    await reload();
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Seuls les clients connectés dont la commande contenant le pull est « livrée » peuvent laisser un avis. Rien n&apos;est publié sans votre
        validation.
      </p>
      <div className="flex flex-wrap gap-2">
        {(["en attente", "publié", "refusé", "tous"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full border px-3 py-1.5 text-sm capitalize ${filter === s ? "border-ink bg-ink text-paper" : "border-line bg-white hover:border-ink"}`}
          >
            {s} ({s === "tous" ? reviews.length : reviews.filter((r) => r.status === s).length})
          </button>
        ))}
      </div>

      <ul className="space-y-3">
        {paged.items.map((r) => (
          <li key={r.id} className="rounded-2xl border border-line bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Stars value={r.rating} />
                <span className="text-sm font-medium">{productName(r.productId)}</span>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STYLE[r.status]}`}>{r.status}</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed">{r.text}</p>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-muted">
                {r.author} · {new Date(r.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })} · achat vérifié
              </span>
              <div className="flex gap-2 text-sm">
                {r.status !== "publié" && (
                  <button onClick={() => act(() => moderateReview(r.id, "publié"))} className="rounded-lg bg-ink px-3 py-1.5 text-paper">
                    Publier
                  </button>
                )}
                {r.status !== "refusé" && (
                  <button onClick={() => act(() => moderateReview(r.id, "refusé"))} className="rounded-lg border border-line px-3 py-1.5 hover:border-ink">
                    Refuser
                  </button>
                )}
                <button
                  onClick={() => confirm("Supprimer définitivement cet avis ?") && act(() => deleteReview(r.id))}
                  className="rounded-lg px-3 py-1.5 text-clay hover:bg-clay/10"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </li>
        ))}
        {list.length === 0 && <li className="rounded-2xl border border-line bg-white p-8 text-center text-sm text-muted">Aucun avis {filter !== "tous" ? filter : ""}.</li>}
      </ul>
      <Pagination page={paged.page} pages={paged.pages} onChange={paged.setPage} total={paged.total} perPage={10} />
    </div>
  );
}
