"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import { formatPrice } from "@/lib/products";
import OrderTimeline from "./OrderTimeline";
import Field from "./Field";

type Status = "nouvelle" | "confirmée" | "expédiée" | "livrée" | "annulée";
type OrderRow = {
  id: string;
  number: string;
  total: number;
  createdAt: string;
  status: Status;
  history?: { status: Status; at: string }[];
  items: { qty: number; name: string }[];
};

export default function AccountView() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderRow[] | null>(null);

  const load = useCallback(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []))
      .catch(() => setOrders([]));
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/connexion?suite=/compte");
      return;
    }
    load();
  }, [user, loading, router, load]);

  if (loading || !user) return <p className="px-4 py-20 text-center text-sm text-muted">Chargement…</p>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">Bonjour {user.name.split(" ")[0]}</h1>
          <p className="mt-1 text-sm text-muted">{user.email}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/favoris" className="rounded-full border border-line px-4 py-2 text-sm hover:border-ink">
            Mes favoris
          </Link>
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
      </div>

      <h2 className="mt-12 mb-4 font-display text-2xl">Mes commandes</h2>
      {orders === null && <p className="text-sm text-muted">Chargement…</p>}
      {orders?.length === 0 && (
        <p className="text-sm text-muted">
          Aucune commande sur ce compte pour l&apos;instant.{" "}
          <Link href="/#collection" className="text-ink underline underline-offset-4">
            Voir la collection
          </Link>
        </p>
      )}
      <ul className="space-y-3">
        {orders?.map((o) => (
          <li key={o.id} className="rounded-2xl border border-line bg-white">
            <Link href={`/commande/confirmation?id=${o.id}`} className="block p-5 hover:bg-mist/50">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div>
                  <p className="font-medium">Commande {o.number}</p>
                  <p className="text-xs text-muted">
                    {new Date(o.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })} ·{" "}
                    {o.items.map((i) => `${i.qty} × ${i.name}`).join(", ")}
                  </p>
                </div>
                <p className="font-medium">{formatPrice(o.total)}</p>
              </div>
              <div className="mt-4">
                <OrderTimeline status={o.status} createdAt={o.createdAt} history={o.history} compact />
              </div>
              <p className="mt-3 text-right text-xs text-muted">Voir le détail →</p>
            </Link>
          </li>
        ))}
      </ul>

      <ClaimOrder onDone={load} />
    </div>
  );
}

/** Rattacher une commande passée sans compte (numéro + téléphone) */
function ClaimOrder({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [number, setNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const r = await fetch("/api/orders/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ number, phone }),
    });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setMsg({ ok: false, text: d.error ?? "Rattachement impossible." });
    setMsg({ ok: true, text: `Commande ${number} ajoutée à votre compte.` });
    setNumber("");
    setPhone("");
    onDone();
  };

  return (
    <div className="mt-10 rounded-2xl border border-dashed border-line p-5">
      {!open ? (
        <button onClick={() => setOpen(true)} className="text-sm underline underline-offset-4">
          Vous avez commandé sans être connecté ? Ajoutez la commande à votre compte
        </button>
      ) : (
        <form onSubmit={submit} className="space-y-3" noValidate>
          <p className="text-sm">
            Saisissez le numéro de commande et le téléphone indiqué lors de la commande. L&apos;e-mail de la commande doit être celui de ce
            compte.
          </p>
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <Field label="N° de commande" placeholder="MA-1024" value={number} onChange={(e) => setNumber(e.target.value.toUpperCase())} />
            <Field label="Téléphone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <button disabled={busy || !number || !phone} className="h-11 rounded-full bg-ink px-5 text-sm font-medium text-paper disabled:opacity-40">
              {busy ? "…" : "Ajouter"}
            </button>
          </div>
        </form>
      )}
      {msg && <p className={`mt-3 text-sm ${msg.ok ? "text-green-700" : "text-clay"}`}>{msg.text}</p>}
    </div>
  );
}
