"use client";

import { useEffect, useState } from "react";
import AdminShell, { useAdmin } from "@/components/admin/AdminShell";
import Field from "@/components/Field";
import { saveSettings } from "../actions";
import { CURRENCIES, whatsappLink, type Currency, type StoreSettings } from "@/lib/settings";

export default function Page() {
  return (
    <AdminShell title="Paramètres de la boutique">
      <Settings />
    </AdminShell>
  );
}

function Settings() {
  const { data, reload } = useAdmin();
  const [s, setS] = useState<StoreSettings | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- copie de travail quand les données arrivent
    if (data && !s) setS({ ...data.settings });
  }, [data, s]);
  if (!s) return null;

  const set = <K extends keyof StoreSettings>(k: K, v: StoreSettings[K]) => {
    setS({ ...s, [k]: v });
    setMsg("");
  };
  const sample = new Intl.NumberFormat("fr-FR", { style: "currency", currency: s.currency }).format(89);
  const wa = whatsappLink("Bonjour, ceci est un test du lien WhatsApp de la boutique.", s.whatsapp);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const r = await saveSettings(s);
    setBusy(false);
    if (!r.ok) return setMsg(r.error);
    setMsg("Paramètres enregistrés : ils s'appliquent tout de suite au site.");
    await reload();
  };

  return (
    <form onSubmit={save} className="mx-auto max-w-2xl space-y-6" noValidate>
      <section className="space-y-4 rounded-2xl border border-line bg-white p-5">
        <h2 className="font-medium">Devise</h2>
        <label className="block text-sm">
          <span className="mb-1.5 block">Devise d&apos;affichage des prix</span>
          <select value={s.currency} onChange={(e) => set("currency", e.target.value as Currency)} className="w-full rounded-lg border border-line bg-white px-3 py-2.5">
            {Object.entries(CURRENCIES).map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <p className="text-xs text-muted">
          Exemple : {sample}. Les montants ne sont pas convertis : changer la devise change le symbole, pensez à adapter vos prix.
        </p>
      </section>

      <section className="space-y-4 rounded-2xl border border-line bg-white p-5">
        <h2 className="font-medium">Livraison</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Frais de livraison" type="number" min={0} step="0.01" value={s.shippingFee} onChange={(e) => set("shippingFee", Number(e.target.value))} />
          <Field
            label="Offerte au-delà de (0 = jamais)"
            type="number"
            min={0}
            step="0.01"
            value={s.freeShippingAbove}
            onChange={(e) => set("freeShippingAbove", Number(e.target.value))}
          />
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-line bg-white p-5">
        <h2 className="font-medium">WhatsApp</h2>
        <Field
          label="Numéro WhatsApp de la boutique (indicatif pays + numéro)"
          placeholder="ex : 21612345678"
          inputMode="tel"
          value={s.whatsapp}
          onChange={(e) => set("whatsapp", e.target.value)}
        />
        <p className="text-xs text-muted">
          Affiche « Commander via WhatsApp » sur les fiches produit et « Une question ? » sur le suivi de commande. Laissez vide pour masquer ces boutons.
        </p>
        {wa && (
          <a href={wa} target="_blank" rel="noreferrer" className="inline-block text-sm underline underline-offset-4">
            Tester le lien WhatsApp ↗
          </a>
        )}
      </section>

      {msg && <p className={`rounded-lg px-3 py-2 text-sm ${msg.startsWith("Paramètres") ? "bg-green-50 text-green-800" : "bg-clay/10 text-clay"}`}>{msg}</p>}
      <button disabled={busy} className="h-12 w-full rounded-full bg-ink text-sm font-medium text-paper disabled:opacity-50">
        {busy ? "Enregistrement…" : "Enregistrer les paramètres"}
      </button>
    </form>
  );
}
