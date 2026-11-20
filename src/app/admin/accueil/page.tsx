"use client";

import { useEffect, useState } from "react";
import AdminShell, { useAdmin } from "@/components/admin/AdminShell";
import Field from "@/components/Field";
import ImageUpload from "@/components/admin/ImageUpload";
import { resetHome, saveHome } from "../actions";
import { SECTION_LABELS, type HomeSection, type Item, type QA, type SectionData } from "@/lib/home";
import type { Product } from "@/lib/products";
import type { Category } from "@/lib/categories";

export default function Page() {
  return (
    <AdminShell title="Page d'accueil">
      <HomeEditor />
    </AdminShell>
  );
}

function HomeEditor() {
  const { data, reload } = useAdmin();
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- copie de travail quand les données arrivent
    if (data && !dirty) setSections(structuredClone(data.home));
  }, [data, dirty]);

  // quitter la page avec des modifications non enregistrées : on prévient
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  if (!data) return null;
  const { products, categories } = data.catalog;

  const update = (next: HomeSection[]) => {
    setSections(next);
    setDirty(true);
    setMsg("");
  };
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= sections.length) return;
    const next = [...sections];
    [next[i], next[j]] = [next[j], next[i]];
    update(next);
  };
  const setData = (id: string, d: HomeSection["data"]) =>
    update(sections.map((s) => (s.id === id ? ({ ...s, data: d } as HomeSection) : s)));

  const save = async () => {
    setBusy(true);
    const r = await saveHome(sections);
    setBusy(false);
    if (!r.ok) return setMsg(r.error);
    setDirty(false);
    setMsg("Page d'accueil enregistrée : elle est en ligne.");
    await reload();
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4 pb-24">
      <p className="text-sm text-muted">
        Modifiez le contenu de chaque section, masquez-les ou changez leur ordre avec ▲▼, puis cliquez sur « Enregistrer ».
      </p>

      <ol className="space-y-3">
        {sections.map((s, i) => (
          <li key={s.id} className={`rounded-2xl border bg-white transition ${open === s.id ? "border-ink shadow-sm" : "border-line"} ${s.visible ? "" : "opacity-60"}`}>
            <div className="flex items-center gap-3 p-4">
              <div className="flex flex-col">
                <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="px-1 text-muted hover:text-ink disabled:opacity-20" aria-label={`Monter ${SECTION_LABELS[s.type]}`}>
                  ▲
                </button>
                <button type="button" disabled={i === sections.length - 1} onClick={() => move(i, 1)} className="px-1 text-muted hover:text-ink disabled:opacity-20" aria-label={`Descendre ${SECTION_LABELS[s.type]}`}>
                  ▼
                </button>
              </div>
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-mist text-xs font-medium">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{SECTION_LABELS[s.type]}</p>
                <p className="truncate text-xs text-muted">{summary(s)}</p>
              </div>
              <label className="flex items-center gap-2 text-xs" title={s.visible ? "Visible sur le site" : "Masquée"}>
                <span className="hidden sm:inline">{s.visible ? "Visible" : "Masquée"}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={s.visible}
                  aria-label={`Afficher ${SECTION_LABELS[s.type]}`}
                  onClick={() => update(sections.map((x) => (x.id === s.id ? { ...x, visible: !x.visible } : x)))}
                  className={`relative h-6 w-11 rounded-full transition ${s.visible ? "bg-ink" : "bg-line"}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${s.visible ? "left-[22px]" : "left-0.5"}`} />
                </button>
              </label>
              <button type="button" onClick={() => setOpen(open === s.id ? null : s.id)} className="rounded-lg border border-line px-3 py-1.5 text-sm hover:border-ink">
                {open === s.id ? "Fermer" : "Modifier"}
              </button>
            </div>
            {open === s.id && (
              <div className="border-t border-line p-5">
                <SectionForm s={s} products={products} categories={categories} onChange={(d) => setData(s.id, d)} />
              </div>
            )}
          </li>
        ))}
      </ol>

      {/* barre d'enregistrement */}
      <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-white/95 p-3 shadow-lg backdrop-blur">
        <p className="flex-1 text-sm">{msg || (dirty ? "Modifications non enregistrées" : "Tout est enregistré")}</p>
        <a href="/" target="_blank" className="rounded-full border border-line px-4 py-2 text-sm hover:border-ink">
          Voir la page ↗
        </a>
        <button
          type="button"
          onClick={async () => {
            if (!confirm("Revenir au contenu d'origine de la page d'accueil ? Vos textes et images seront remplacés.")) return;
            await resetHome();
            setDirty(false);
            await reload();
            setMsg("Contenu d'origine rétabli.");
          }}
          className="rounded-full px-4 py-2 text-sm text-clay hover:bg-clay/10"
        >
          Réinitialiser
        </button>
        <button type="button" onClick={save} disabled={busy || !dirty} className="rounded-full bg-ink px-5 py-2 text-sm font-medium text-paper disabled:opacity-40">
          {busy ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}

function summary(s: HomeSection) {
  const d = s.data as Record<string, unknown>;
  if (typeof d.title === "string") return d.title.replace(/\n/g, " ");
  if (s.type === "benefits") return s.data.items.map((i) => i.title).join(" · ");
  return "";
}

/* ---------------- formulaires par type ---------------- */

type FormProps<T> = { d: T; onChange: (d: T) => void; products: Product[]; categories: Category[] };

function SectionForm({ s, onChange, products, categories }: { s: HomeSection; onChange: (d: HomeSection["data"]) => void; products: Product[]; categories: Category[] }) {
  const common = { products, categories };
  switch (s.type) {
    case "hero":
      return <HeroForm d={s.data} onChange={onChange} {...common} />;
    case "categories":
      return <CategoriesForm d={s.data} onChange={onChange} {...common} />;
    case "promo":
      return <PromoForm d={s.data} onChange={onChange} {...common} />;
    case "benefits":
      return <ItemsEditor items={s.data.items} fixed onChange={(items) => onChange({ items })} />;
    case "steps":
      return (
        <div className="space-y-4">
          <Field label="Titre" value={s.data.title} onChange={(e) => onChange({ ...s.data, title: e.target.value })} />
          <ItemsEditor items={s.data.items} fixed onChange={(items) => onChange({ ...s.data, items })} />
        </div>
      );
    case "banner":
      return <BannerForm d={s.data} onChange={onChange} {...common} />;
    case "featured":
      return (
        <div className="space-y-4">
          <Field label="Titre" value={s.data.title} onChange={(e) => onChange({ ...s.data, title: e.target.value })} />
          <Field label="Texte" textarea value={s.data.text} onChange={(e) => onChange({ ...s.data, text: e.target.value })} />
          <ProductsPicker label="Produits affichés (8 max, dans l'ordre choisi)" ids={s.data.productIds} max={8} products={products} onChange={(productIds) => onChange({ ...s.data, productIds })} />
        </div>
      );
    case "collection":
      return <Field label="Titre" value={s.data.title} onChange={(e) => onChange({ title: e.target.value })} />;
    case "faq":
      return (
        <div className="space-y-4">
          <Field label="Titre" value={s.data.title} onChange={(e) => onChange({ ...s.data, title: e.target.value })} />
          <QAEditor items={s.data.items} onChange={(items) => onChange({ ...s.data, items })} />
        </div>
      );
  }
}

function HeroForm({ d, onChange, products }: FormProps<SectionData["hero"]>) {
  const set = <K extends keyof typeof d>(k: K, v: (typeof d)[K]) => onChange({ ...d, [k]: v });
  return (
    <div className="grid gap-4 md:grid-cols-[1fr_220px]">
      <div className="space-y-4">
        <Field label="Petit badge au-dessus du titre" value={d.badge} onChange={(e) => set("badge", e.target.value)} />
        <Field label="Titre (Entrée = retour à la ligne)" textarea value={d.title} onChange={(e) => set("title", e.target.value)} />
        <Field label="Mot mis en valeur (en couleur, à la fin du titre)" value={d.highlight} onChange={(e) => set("highlight", e.target.value)} />
        <Field label="Texte" textarea rows={3} value={d.text} onChange={(e) => set("text", e.target.value)} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Bouton principal (essayage)" value={d.ctaPrimary} onChange={(e) => set("ctaPrimary", e.target.value)} />
          <Field label="Bouton secondaire" value={d.ctaSecondary} onChange={(e) => set("ctaSecondary", e.target.value)} />
        </div>
        <ProductSelect label="Produit mis en avant" value={d.productId} products={products} onChange={(v) => set("productId", v)} />
      </div>
      <ImageUpload label="Image (optionnel)" hint="Sinon : photo du produit choisi." value={d.image} onChange={(v) => set("image", v)} />
    </div>
  );
}

function CategoriesForm({ d, onChange, categories }: FormProps<SectionData["categories"]>) {
  return (
    <div className="space-y-4">
      <Field label="Titre" value={d.title} onChange={(e) => onChange({ ...d, title: e.target.value })} />
      <div>
        <p className="mb-1.5 text-sm">Catégories en vignette (6 max, les 2 premières en grand)</p>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => {
            const i = d.slugs.indexOf(c.slug);
            return (
              <button
                key={c.slug}
                type="button"
                onClick={() => onChange({ ...d, slugs: i >= 0 ? d.slugs.filter((x) => x !== c.slug) : [...d.slugs, c.slug].slice(0, 6) })}
                className={`rounded-full border px-3 py-1.5 text-sm ${i >= 0 ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"}`}
              >
                {i >= 0 && <span className="mr-1 text-xs opacity-70">{i + 1}.</span>}
                {c.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PromoForm({ d, onChange, products }: FormProps<SectionData["promo"]>) {
  const set = <K extends keyof typeof d>(k: K, v: (typeof d)[K]) => onChange({ ...d, [k]: v });
  const past = d.endsAt && new Date(d.endsAt) < new Date();
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Étiquette" value={d.label} onChange={(e) => set("label", e.target.value)} />
        <Field label="Fin de l'offre (heure de Paris)" type="datetime-local" value={d.endsAt} onChange={(e) => set("endsAt", e.target.value)} />
      </div>
      {past && <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">Cette date est passée : le compte à rebours affichera « offre terminée ».</p>}
      <Field label="Titre" value={d.title} onChange={(e) => set("title", e.target.value)} />
      <Field label="Sous-titre" textarea value={d.subtitle} onChange={(e) => set("subtitle", e.target.value)} />
      <Field label="Texte du bouton" value={d.cta} onChange={(e) => set("cta", e.target.value)} />
      <ProductsPicker label="Produits affichés (3 max)" ids={d.productIds} max={3} products={products} onChange={(v) => set("productIds", v)} />
    </div>
  );
}

function BannerForm({ d, onChange, products }: FormProps<SectionData["banner"]>) {
  const set = <K extends keyof typeof d>(k: K, v: (typeof d)[K]) => onChange({ ...d, [k]: v });
  return (
    <div className="grid gap-4 md:grid-cols-[1fr_220px]">
      <div className="space-y-4">
        <Field label="Sur-titre" value={d.eyebrow} onChange={(e) => set("eyebrow", e.target.value)} />
        <Field label="Titre" value={d.title} onChange={(e) => set("title", e.target.value)} />
        <Field label="Texte" textarea rows={4} value={d.text} onChange={(e) => set("text", e.target.value)} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Texte du bouton" value={d.ctaLabel} onChange={(e) => set("ctaLabel", e.target.value)} />
          <Field label="Lien du bouton (ex : /categorie/cachemire)" value={d.ctaHref} onChange={(e) => set("ctaHref", e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-6 text-sm">
          <label className="flex items-center gap-2">
            Image à
            <select value={d.imageSide} onChange={(e) => set("imageSide", e.target.value as "left" | "right")} className="rounded-lg border border-line bg-white px-2 py-1.5">
              <option value="left">gauche</option>
              <option value="right">droite</option>
            </select>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={d.dark} onChange={(e) => set("dark", e.target.checked)} /> Fond sombre
          </label>
        </div>
        <ProductSelect label="Photo produit utilisée si aucune image n'est envoyée" value={d.productId} products={products} onChange={(v) => set("productId", v)} />
      </div>
      <ImageUpload label="Image" hint="Format carré ou portrait conseillé." aspect="aspect-square" value={d.image} onChange={(v) => set("image", v)} />
    </div>
  );
}

/* ---------------- champs réutilisables ---------------- */

function ProductSelect({ label, value, products, onChange }: { label: string; value: string; products: Product[]; onChange: (v: string) => void }) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-line bg-white px-3 py-2.5">
        {products.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function ProductsPicker({ label, ids, max, products, onChange }: { label: string; ids: string[]; max: number; products: Product[]; onChange: (v: string[]) => void }) {
  const [q, setQ] = useState("");
  const list = products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="text-sm">
      <p className="mb-1.5">{label}</p>
      {ids.length > 0 && (
        <ol className="mb-2 flex flex-wrap gap-2">
          {ids.map((id, i) => (
            <li key={id} className="flex items-center gap-1 rounded-full bg-ink py-1 pl-3 pr-1 text-xs text-paper">
              {i + 1}. {products.find((p) => p.id === id)?.name ?? id}
              <button type="button" onClick={() => onChange(ids.filter((x) => x !== id))} className="grid h-5 w-5 place-items-center rounded-full hover:bg-white/20" aria-label="Retirer">
                ✕
              </button>
            </li>
          ))}
        </ol>
      )}
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un produit à ajouter…" className="w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-ink" />
      <div className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-line">
        {list.map((p) => {
          const on = ids.includes(p.id);
          return (
            <button
              key={p.id}
              type="button"
              disabled={!on && ids.length >= max}
              onClick={() => onChange(on ? ids.filter((x) => x !== p.id) : [...ids, p.id])}
              className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-mist disabled:opacity-40"
            >
              <span>{p.name}</span>
              <span className="text-xs">{on ? "✓ ajouté" : "+"}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ItemsEditor({ items, onChange, fixed }: { items: Item[]; onChange: (v: Item[]) => void; fixed?: boolean }) {
  const set = (i: number, patch: Partial<Item>) => onChange(items.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {items.map((it, i) => (
        <div key={i} className="space-y-2 rounded-xl border border-line p-3">
          <p className="text-xs text-muted">Encart {i + 1}</p>
          <Field label="Titre" value={it.title} onChange={(e) => set(i, { title: e.target.value })} />
          <Field label="Texte" textarea value={it.text} onChange={(e) => set(i, { text: e.target.value })} />
          {!fixed && (
            <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-xs text-clay">
              Supprimer
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function QAEditor({ items, onChange }: { items: QA[]; onChange: (v: QA[]) => void }) {
  const set = (i: number, patch: Partial<QA>) => onChange(items.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div className="space-y-3">
      {items.map((it, i) => (
        <div key={i} className="flex gap-3 rounded-xl border border-line p-3">
          <div className="flex flex-col text-muted">
            <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="disabled:opacity-20" aria-label="Monter la question">
              ▲
            </button>
            <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} className="disabled:opacity-20" aria-label="Descendre la question">
              ▼
            </button>
          </div>
          <div className="flex-1 space-y-2">
            <Field label={`Question ${i + 1}`} value={it.q} onChange={(e) => set(i, { q: e.target.value })} />
            <Field label="Réponse" textarea value={it.a} onChange={(e) => set(i, { a: e.target.value })} />
          </div>
          <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="self-start text-sm text-clay" aria-label={`Supprimer la question ${i + 1}`}>
            ✕
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, { q: "Nouvelle question ?", a: "Réponse." }])} className="rounded-lg border border-dashed border-line px-4 py-2 text-sm hover:border-ink">
        + Ajouter une question
      </button>
    </div>
  );
}
