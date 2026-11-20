"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import { formatPrice } from "@/lib/products";

type OrderRow = { id: string; number: string; total: number; createdAt: string; status: string; items: { qty: number }[] };

export default function AccountView() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderRow[] | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/connexion?suite=/compte");
      return;
    }
    fetch("/api/orders")
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []))
      .catch(() => setOrders([]));
  }, [user, loading, router]);

  if (loading || !user) return <p className="px-4 py-20 text-center text-sm text-muted">Chargement…</p>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">Bonjour {user.name.split(" ")[0]}</h1>
          <p className="mt-1 text-sm text-muted">{user.email}</p>
        </div>
        <button
          onClick={async () => {
            await logout();
            router.push("/");
          }}
          className="rounded-full border border-line px-4 py-2 text-sm hover:border-ink"
        >
          Se déconnecter
        </button>
      </div>

      <h2 className="mt-12 mb-4 font-display text-2xl">Mes commandes</h2>
      {orders === null && <p className="text-sm text-muted">Chargement…</p>}
      {orders?.length === 0 && (
        <p className="text-sm text-muted">
          Aucune commande pour l&apos;instant. <Link href="/#collection" className="text-ink underline underline-offset-4">Voir la collection</Link>
        </p>
      )}
      <ul className="divide-y divide-line rounded-xl border border-line bg-white">
        {orders?.map((o) => (
          <li key={o.id}>
            <Link href={`/commande/confirmation?id=${o.id}`} className="flex items-center justify-between gap-4 p-4 hover:bg-mist">
              <div>
                <p className="font-medium">Commande {o.number}</p>
                <p className="text-xs text-muted">
                  {new Date(o.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })} ·{" "}
                  {o.items.reduce((s, i) => s + i.qty, 0)} article(s)
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">{formatPrice(o.total)}</p>
                <p className="text-xs capitalize text-muted">{o.status}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
