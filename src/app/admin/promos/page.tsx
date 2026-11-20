"use client";

import { useState } from "react";
import AdminShell, { useAdmin } from "@/components/admin/AdminShell";
import Field from "@/components/Field";
import Pagination, { usePaged } from "@/components/Pagination";
import { deletePromo, savePromo, togglePromo } from "../actions";
import { checkPromoInput, parisToday, promoLabel, promoState, type PromoCode, type PromoState } from "@/lib/promos";
import { formatPrice } from "@/lib/products";

const STATE_STYLE: Record<PromoState, string> = {
  active: "bg-green-100 text-green-800",
  "planifié": "bg-blue-100 text-blue-800",
  "expiré": "bg-neutral-200 text-neutral-600",
  "désactivé": "bg-neutral-200 text-neutral-600",
  "épuisé": "bg-amber-100 text-amber-800",
};

const plusDays = (n: number) => {
  const d = new Date(`${parisToday()}T12:00:00`);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

const blank = (): PromoCode => ({
  code: "",
  type: "percent",
  value: 10,
  startsAt: parisToday(),
  endsAt: plusDays(30),
  uses: 0,
  active: true,
  createdAt: "",
});

const fr = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

export default function Page() {
  return (
    <AdminShell title="Codes promo">
      <Promos />
    </AdminShell>
  );
}

function Promos() {
  const { data, reload } = useAdmin();
  const [editing, setEditing] = useState<{ original: string | null; p: PromoCode } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<PromoState | "tous">("tous");
  const promos = data?.promos ?? [];
  const list = promos.filter((p) => filter === "tous" || promoState(p) === filter);
  const paged = usePaged(list, 10, filter);
  if (!data) return null;

  const set = <K extends keyof PromoCode>(k: K, v: PromoCode[K]) => editing && setEditing({ ...editing, p: { ...editing.p, [k]: v } });
  // validation immédiate pendant la saisie (dates, valeur…), le serveur revérifie à l'enregistrement
  const liveError = editing ? checkPromoInput({ ...editing.p, code: editing.p.code.toUpperCase() }) : null;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    setError("");
    const r = await savePromo(editing.p, editing.original);
    setBusy(false);
    if (!r.ok) return setError(r.error);
    setEditing(null);
    await reload();
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {(["tous", "active", "planifié", "expiré", "épuisé", "désactivé"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-full border px-3 py-1.5 text-sm capitalize ${filter === s ? "border-ink bg-ink text-paper" : "border-line bg-white hover:border-ink"}`}
            >
              {s} ({s === "tous" ? promos.length : promos.filter((p) => promoState(p) === s).length})
            </button>
          ))}
          <button
            onClick={() => {
              setEditing({ original: null, p: blank() });
              setError("");
            }}
            className="ml-auto rounded-full bg-ink px-4 py-2 text-sm text-paper hover:bg-black"
          >
            + Nouveau code
          </button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="p-4">Code</th>
                <th className="p-4">Remise</th>
                <th className="p-4">Validité</th>
                <th className="p-4">Utilisations</th>
                <th className="p-4">État</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {paged.items.map((p) => {
                const st = promoState(p);
                return (
                  <tr key={p.code}>
                    <td className="p-4 font-mono font-medium">{p.code}</td>
                    <td className="p-4">
                      {promoLabel(p)}
                      {p.minSubtotal ? <span className="block text-xs text-muted">dès {formatPrice(p.minSubtotal)}</span> : null}
                    </td>
                    <td className="p-4 text-xs">
                      du {fr(p.startsAt)}
                      <br />
                      au {fr(p.endsAt)}
                    </td>
                    <td className="p-4">
                      {p.uses}
                      {p.maxUses ? ` / ${p.maxUses}` : ""}
                    </td>
                    <td className="p-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATE_STYLE[st]}`}>{st}</span>
                    </td>
                    <td className="whitespace-nowrap p-4 text-right">
                      <button
                        onClick={() => {
                          setEditing({ original: p.code, p: structuredClone(p) });
                          setError("");
                        }}
                        className="rounded-lg border border-line px-3 py-1.5 hover:border-ink"
                      >
                        Modifier
                      </button>{" "}
                      <button
                        onClick={async () => {
                          await togglePromo(p.code);
                          await reload();
                        }}
                        className="rounded-lg px-3 py-1.5 hover:bg-mist"
                      >
                        {p.active ? "Désactiver" : "Activer"}
                      </button>{" "}
                      <button
                        onClick={async () => {
                          if (!confirm(`Supprimer le code ${p.code} ?`)) return;
                          await deletePromo(p.code);
                          await reload();
                        }}
                        className="rounded-lg px-3 py-1.5 text-clay hover:bg-clay/10"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                );
              })}
              {list.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted">
                    Aucun code promo. Créez-en un avec « + Nouveau code ».
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={paged.page} pages={paged.pages} onChange={paged.setPage} total={paged.total} perPage={10} />
      </div>

      {/* formulaire */}
      <div>
        {editing ? (
          <form onSubmit={save} className="sticky top-24 space-y-4 rounded-2xl border border-line bg-white p-5" noValidate>
            <h2 className="font-medium">{editing.original ? `Modifier ${editing.original}` : "Nouveau code promo"}</h2>
            <Field label="Code (ex : NOEL20)" value={editing.p.code} onChange={(e) => set("code", e.target.value.toUpperCase().replace(/\s/g, ""))} required />
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm">
                <span className="mb-1.5 block">Type de remise</span>
                <select value={editing.p.type} onChange={(e) => set("type", e.target.value as PromoCode["type"])} className="w-full rounded-lg border border-line bg-white px-3 py-2.5">
                  <option value="percent">Pourcentage (%)</option>
                  <option value="fixed">Montant fixe (€)</option>
                </select>
              </label>
              <Field
                label={editing.p.type === "percent" ? "Remise (%)" : "Remise (€)"}
                type="number"
                min={1}
                max={editing.p.type === "percent" ? 100 : undefined}
                step="0.01"
                value={editing.p.value}
                onChange={(e) => set("value", Number(e.target.value))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Début (inclus)" type="date" value={editing.p.startsAt} onChange={(e) => set("startsAt", e.target.value)} />
              <Field label="Fin (incluse)" type="date" min={editing.p.startsAt} value={editing.p.endsAt} onChange={(e) => set("endsAt", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Achat minimum (€, optionnel)"
                type="number"
                min={0}
                value={editing.p.minSubtotal ?? ""}
                onChange={(e) => set("minSubtotal", e.target.value ? Number(e.target.value) : undefined)}
              />
              <Field
                label="Utilisations max (optionnel)"
                type="number"
                min={1}
                value={editing.p.maxUses ?? ""}
                onChange={(e) => set("maxUses", e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={editing.p.active} onChange={(e) => set("active", e.target.checked)} /> Code actif
            </label>
            {editing.p.startsAt && editing.p.endsAt && !liveError && (
              <p className="rounded-lg bg-mist px-3 py-2 text-xs">
                Valable du <strong>{fr(editing.p.startsAt)}</strong> au <strong>{fr(editing.p.endsAt)}</strong> inclus (heure de Paris) ·{" "}
                {promoLabel(editing.p)}
                {editing.p.minSubtotal ? ` dès ${formatPrice(editing.p.minSubtotal)}` : ""}
              </p>
            )}
            {(error || liveError) && <p className="rounded-lg bg-clay/10 px-3 py-2 text-sm text-clay">{error || liveError}</p>}
            <div className="flex gap-2">
              <button disabled={busy || !!liveError} className="h-11 flex-1 rounded-full bg-ink text-sm font-medium text-paper disabled:opacity-40">
                {busy ? "Enregistrement…" : "Enregistrer"}
              </button>
              <button type="button" onClick={() => setEditing(null)} className="h-11 rounded-full border border-line px-5 text-sm">
                Annuler
              </button>
            </div>
          </form>
        ) : (
          <p className="rounded-2xl border border-dashed border-line p-6 text-sm text-muted">
            Les clients saisissent le code au moment de commander (panier ou commande express). Les dates, le minimum d&apos;achat et
            le nombre d&apos;utilisations sont vérifiés par le serveur.
          </p>
        )}
      </div>
    </div>
  );
}
