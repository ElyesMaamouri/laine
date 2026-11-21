"use client";

import { useMemo, useState } from "react";
import AdminShell, { useAdmin } from "@/components/admin/AdminShell";
import StatusBadge from "@/components/admin/StatusBadge";
import Field from "@/components/Field";
import Pagination, { usePaged } from "@/components/Pagination";
import { WhatsAppIcon } from "@/components/OrderDetail";
import { deleteCustomer, saveCustomer, type CustomerInput } from "../actions";
import { formatPrice } from "@/lib/products";
import { toInternational } from "@/lib/settings";
import type { AdminUser, Order } from "@/lib/server/db";

/** Client affiché : compte enregistré, ou client sans compte regroupé par e-mail */
type Client = {
  key: string;
  account?: AdminUser;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zip: string;
  orders: Order[];
  spent: number;
  lastOrder?: string;
};

const PER_PAGE = 15;
const fr = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

export default function Page() {
  return (
    <AdminShell title="Clients">
      <Clients />
    </AdminShell>
  );
}

function buildClients(users: AdminUser[], orders: Order[]): Client[] {
  const spentOf = (list: Order[]) => list.filter((o) => o.status !== "annulée").reduce((s, o) => s + o.total, 0);
  const latest = (list: Order[]) => [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const accountEmails = new Set(users.map((u) => u.email));

  const accounts: Client[] = users.map((u) => {
    // vue admin : commandes rattachées au compte + commandes sans compte faites avec le même e-mail
    const list = orders.filter((o) => o.userId === u.id || (!o.userId && o.customer.email.toLowerCase() === u.email));
    const last = latest(list);
    return {
      key: u.id,
      account: u,
      name: u.name,
      email: u.email,
      phone: u.phone || last?.customer.phone || "",
      address: u.address || last?.customer.address || "",
      city: u.city || last?.customer.city || "",
      zip: u.zip || last?.customer.zip || "",
      orders: list,
      spent: spentOf(list),
      lastOrder: last?.createdAt,
    };
  });

  const guests = new Map<string, Order[]>();
  for (const o of orders) {
    const e = o.customer.email.toLowerCase();
    if (o.userId || accountEmails.has(e)) continue;
    guests.set(e, [...(guests.get(e) ?? []), o]);
  }
  const guestClients: Client[] = [...guests.entries()].map(([email, list]) => {
    const last = latest(list);
    return {
      key: `invite:${email}`,
      name: last.customer.name,
      email,
      phone: last.customer.phone,
      address: last.customer.address,
      city: last.customer.city,
      zip: last.customer.zip,
      orders: list,
      spent: spentOf(list),
      lastOrder: last.createdAt,
    };
  });
  return [...accounts, ...guestClients];
}

function Clients() {
  const { data, reload } = useAdmin();
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<"tous" | "compte" | "invite">("tous");
  const [sort, setSort] = useState<"recent" | "spent" | "name">("recent");
  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: string | null; c: CustomerInput } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const clients = useMemo(() => (data ? buildClients(data.users, data.orders) : []), [data]);
  const list = clients
    .filter((c) => (kind === "tous" ? true : kind === "compte" ? !!c.account : !c.account))
    .filter((c) => `${c.name} ${c.email} ${c.phone} ${c.city}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) =>
      sort === "spent" ? b.spent - a.spent : sort === "name" ? a.name.localeCompare(b.name, "fr") : (b.lastOrder ?? b.account?.createdAt ?? "").localeCompare(a.lastOrder ?? a.account?.createdAt ?? ""),
    );
  const paged = usePaged(list, PER_PAGE, `${q}|${kind}|${sort}`);
  if (!data) return null;
  const current = clients.find((c) => c.key === selected) ?? null;

  const startEdit = (c: Client | null) => {
    setError("");
    if (!c) return setEditing({ id: null, c: { name: "", email: "", phone: "", address: "", city: "", zip: "", note: "", password: "" } });
    setEditing({
      id: c.account?.id ?? null,
      c: { name: c.name, email: c.email, phone: c.phone, address: c.address, city: c.city, zip: c.zip, note: c.account?.note ?? "", password: "" },
    });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    setError("");
    const r = await saveCustomer(editing.c, editing.id);
    setBusy(false);
    if (!r.ok) return setError(r.error);
    setEditing(null);
    await reload();
    if (r.id) setSelected(r.id);
  };

  const set = (k: keyof CustomerInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    editing && setEditing({ ...editing, c: { ...editing.c, [k]: e.target.value } });

  const nAccounts = clients.filter((c) => c.account).length;

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
      {/* ---------- liste ---------- */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              ["tous", `Tous (${clients.length})`],
              ["compte", `Avec compte (${nAccounts})`],
              ["invite", `Sans compte (${clients.length - nAccounts})`],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={`rounded-full border px-3 py-1.5 text-sm ${kind === k ? "border-ink bg-ink text-paper" : "border-line bg-white hover:border-ink"}`}
            >
              {label}
            </button>
          ))}
          <button onClick={() => startEdit(null)} className="ml-auto rounded-full bg-ink px-4 py-2 text-sm text-paper hover:bg-black">
            + Nouveau client
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nom, e-mail, téléphone, ville…"
            className="min-w-0 flex-1 rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-ink"
          />
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="rounded-lg border border-line bg-white px-3 text-sm" aria-label="Trier">
            <option value="recent">Activité récente</option>
            <option value="spent">Total dépensé</option>
            <option value="name">Nom (A→Z)</option>
          </select>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="p-4">Client</th>
                <th className="p-4">Téléphone</th>
                <th className="p-4">Ville</th>
                <th className="p-4 text-right">Commandes</th>
                <th className="p-4 text-right">Total dépensé</th>
                <th className="p-4">Dernière commande</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {paged.items.map((c) => (
                <tr
                  key={c.key}
                  onClick={() => {
                    setSelected(c.key);
                    setEditing(null);
                  }}
                  className={`cursor-pointer hover:bg-mist/60 ${selected === c.key ? "bg-mist" : ""}`}
                >
                  <td className="p-4">
                    <p className="font-medium">
                      {c.name}{" "}
                      {c.account ? (
                        <span className="ml-1 whitespace-nowrap rounded-full bg-ink/10 px-2 py-0.5 text-[10px] font-medium uppercase">compte</span>
                      ) : (
                        <span className="ml-1 whitespace-nowrap rounded-full bg-mist px-2 py-0.5 text-[10px] uppercase text-muted">sans compte</span>
                      )}
                    </p>
                    <p className="text-xs text-muted">{c.email}</p>
                  </td>
                  <td className="p-4">{c.phone || "—"}</td>
                  <td className="p-4">{c.city || "—"}</td>
                  <td className="p-4 text-right">{c.orders.length}</td>
                  <td className="p-4 text-right font-medium">{formatPrice(c.spent)}</td>
                  <td className="p-4 text-xs text-muted">{c.lastOrder ? fr(c.lastOrder) : "—"}</td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted">
                    Aucun client.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={paged.page} pages={paged.pages} onChange={paged.setPage} total={paged.total} perPage={PER_PAGE} />
      </div>

      {/* ---------- fiche / formulaire ---------- */}
      <div>
        {editing ? (
          <form onSubmit={save} className="sticky top-24 space-y-3 rounded-2xl border border-line bg-white p-5" noValidate>
            <h2 className="font-medium">{editing.id ? "Modifier le client" : "Nouveau compte client"}</h2>
            <Field label="Nom complet" value={editing.c.name} onChange={set("name")} required />
            <Field label="E-mail" type="email" value={editing.c.email} onChange={set("email")} required />
            <Field label="Téléphone" type="tel" value={editing.c.phone ?? ""} onChange={set("phone")} />
            <Field label="Adresse" value={editing.c.address ?? ""} onChange={set("address")} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Ville" value={editing.c.city ?? ""} onChange={set("city")} />
              <Field label="Code postal" value={editing.c.zip ?? ""} onChange={set("zip")} />
            </div>
            <Field label="Note interne (visible seulement ici)" textarea value={editing.c.note ?? ""} onChange={set("note")} />
            <Field
              label={editing.id ? "Nouveau mot de passe (laisser vide pour ne pas changer)" : "Mot de passe provisoire (8 caractères min.)"}
              type="password"
              autoComplete="new-password"
              value={editing.c.password ?? ""}
              onChange={set("password")}
            />
            {!editing.id && <p className="text-xs text-muted">Transmettez ce mot de passe au client : il pourra se connecter et suivre ses commandes.</p>}
            {error && <p className="rounded-lg bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}
            <div className="flex gap-2">
              <button disabled={busy} className="h-11 flex-1 rounded-full bg-ink text-sm font-medium text-paper disabled:opacity-50">
                {busy ? "Enregistrement…" : "Enregistrer"}
              </button>
              <button type="button" onClick={() => setEditing(null)} className="h-11 rounded-full border border-line px-5 text-sm">
                Annuler
              </button>
            </div>
          </form>
        ) : current ? (
          <ClientCard
            c={current}
            onEdit={() => startEdit(current)}
            onDelete={async () => {
              if (!current.account) return;
              if (!confirm(`Supprimer le compte de ${current.name} ? Ses ${current.orders.length} commande(s) sont conservées (sans compte).`)) return;
              await deleteCustomer(current.account.id);
              setSelected(null);
              await reload();
            }}
          />
        ) : (
          <p className="rounded-2xl border border-dashed border-line p-6 text-sm text-muted">
            Cliquez sur un client pour voir sa fiche : coordonnées, commandes, total dépensé. Les clients « sans compte » sont regroupés à partir de
            leurs commandes.
          </p>
        )}
      </div>
    </div>
  );
}

function ClientCard({ c, onEdit, onDelete }: { c: Client; onEdit: () => void; onDelete: () => void }) {
  const valid = c.orders.filter((o) => o.status !== "annulée");
  const avg = valid.length ? c.spent / valid.length : 0;
  const wa = c.phone ? `https://wa.me/${toInternational(c.phone)}?text=${encodeURIComponent(`Bonjour ${c.name.split(" ")[0]}, c'est la boutique Lainé.`)}` : null;
  const orders = [...c.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <div className="sticky top-24 space-y-4 rounded-2xl border border-line bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">{c.name}</h2>
          <p className="text-xs text-muted">
            {c.account ? `Compte créé le ${fr(c.account.createdAt)}` : "Client sans compte (regroupé par e-mail)"}
          </p>
        </div>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-mist font-display text-lg">{c.name.charAt(0).toUpperCase()}</span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          ["Commandes", String(c.orders.length)],
          ["Dépensé", formatPrice(c.spent)],
          ["Panier moyen", formatPrice(avg)],
        ].map(([l, v]) => (
          <div key={l} className="rounded-xl bg-mist px-2 py-3">
            <p className="text-sm font-medium">{v}</p>
            <p className="text-[11px] text-muted">{l}</p>
          </div>
        ))}
      </div>

      <dl className="space-y-1.5 text-sm">
        <div className="flex gap-2">
          <dt className="w-20 shrink-0 text-muted">E-mail</dt>
          <dd className="min-w-0 break-all">
            <a href={`mailto:${c.email}`} className="underline underline-offset-2">
              {c.email}
            </a>
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-20 shrink-0 text-muted">Téléphone</dt>
          <dd>{c.phone ? <a href={`tel:${c.phone}`} className="underline underline-offset-2">{c.phone}</a> : "—"}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-20 shrink-0 text-muted">Adresse</dt>
          <dd>{c.address ? `${c.address}, ${c.zip} ${c.city}` : "—"}</dd>
        </div>
        {c.account?.note && (
          <div className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
            <strong>Note :</strong> {c.account.note}
          </div>
        )}
      </dl>

      <div className="flex flex-wrap gap-2">
        {wa && (
          <a href={wa} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-[#1f8f4e] px-3 py-2 text-xs font-medium text-white hover:brightness-95">
            <WhatsAppIcon /> WhatsApp
          </a>
        )}
        <button onClick={onEdit} className="rounded-full border border-line px-3 py-2 text-xs hover:border-ink">
          {c.account ? "Modifier" : "Créer un compte pour ce client"}
        </button>
        {c.account && (
          <button onClick={onDelete} className="rounded-full px-3 py-2 text-xs text-clay hover:bg-clay/10">
            Supprimer le compte
          </button>
        )}
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Historique des commandes</p>
        {orders.length === 0 ? (
          <p className="text-xs text-muted">Aucune commande.</p>
        ) : (
          <ul className="max-h-72 divide-y divide-line overflow-y-auto rounded-xl border border-line">
            {orders.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-2 px-3 py-2 text-xs">
                <span>
                  <span className="font-medium">{o.number}</span> · {fr(o.createdAt)}
                  {!o.userId && c.account && <span className="text-muted"> · passée sans compte</span>}
                </span>
                <span className="flex items-center gap-2">
                  <StatusBadge status={o.status} />
                  <span className="w-16 text-right font-medium">{formatPrice(o.total)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
