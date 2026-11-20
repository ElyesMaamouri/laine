"use client";

import { useState } from "react";
import AdminShell, { useAdmin } from "@/components/admin/AdminShell";
import Field from "@/components/Field";
import ProductImage from "@/components/ProductImage";
import { deleteCategory, moveCategory, saveCategory } from "../actions";
import ImageUpload from "@/components/admin/ImageUpload";
import { coverOf, productsIn, type Category } from "@/lib/categories";

const blank: Category = { slug: "", name: "", description: "" };

export default function Page() {
  return (
    <AdminShell title="Catégories">
      <Categories />
    </AdminShell>
  );
}

function Categories() {
  const { data, reload } = useAdmin();
  const [editing, setEditing] = useState<{ original: string | null; cat: Category } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (!data) return null;
  const { categories, products } = data.catalog;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    setError("");
    const r = await saveCategory(editing.cat, editing.original);
    setBusy(false);
    if (!r.ok) return setError(r.error);
    setEditing(null);
    await reload();
  };

  const remove = async (c: Category) => {
    const n = productsIn(c, products).length;
    if (!confirm(`Supprimer la catégorie « ${c.name} » ?${n ? ` Les ${n} produit(s) restent en boutique, seulement retirés de cette catégorie.` : ""}`)) return;
    await deleteCategory(c.slug);
    await reload();
  };

  const move = async (slug: string, dir: -1 | 1) => {
    await moveCategory(slug, dir);
    await reload();
  };

  const coverProduct = editing ? products.find((p) => p.id === editing.cat.cover?.productId) : undefined;

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted">{categories.length} catégories · l&apos;ordre est celui de la boutique</p>
          <button
            onClick={() => {
              setEditing({ original: null, cat: { ...blank } });
              setError("");
            }}
            className="rounded-full bg-ink px-4 py-2 text-sm text-paper hover:bg-black"
          >
            + Nouvelle catégorie
          </button>
        </div>
        <ul className="divide-y divide-line rounded-2xl border border-line bg-white">
          {categories.map((c, i) => {
            const cover = coverOf(c, products);
            const n = productsIn(c, products).length;
            return (
              <li key={c.slug} className={`flex items-center gap-4 p-4 ${editing?.original === c.slug ? "bg-mist" : ""}`}>
                <div className="flex flex-col">
                  <button disabled={i === 0} onClick={() => move(c.slug, -1)} className="px-1 text-muted hover:text-ink disabled:opacity-20" aria-label={`Monter ${c.name}`}>▲</button>
                  <button disabled={i === categories.length - 1} onClick={() => move(c.slug, 1)} className="px-1 text-muted hover:text-ink disabled:opacity-20" aria-label={`Descendre ${c.name}`}>▼</button>
                </div>
                <div className="h-14 w-12 shrink-0 overflow-hidden rounded-md bg-mist">
                  {c.image ? (
                    // eslint-disable-next-line @next/next/no-img-element -- image locale envoyée par l'admin
                    <img src={c.image} alt={c.name} className="h-full w-full object-cover" />
                  ) : cover && <ProductImage p={cover.p} v={cover.v} label={c.name} width={120} height={140} pad={0.06} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{c.name}</p>
                  <p className="truncate text-xs text-muted">/{c.slug} · {n} produit{n > 1 ? "s" : ""}</p>
                </div>
                <button
                  onClick={() => {
                    setEditing({ original: c.slug, cat: structuredClone(c) });
                    setError("");
                  }}
                  className="rounded-lg border border-line px-3 py-1.5 text-sm hover:border-ink"
                >
                  Modifier
                </button>
                <button onClick={() => remove(c)} className="rounded-lg px-3 py-1.5 text-sm text-clay hover:bg-clay/10">
                  Supprimer
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* formulaire */}
      <div>
        {editing ? (
          <form onSubmit={save} className="sticky top-24 space-y-4 rounded-2xl border border-line bg-white p-5">
            <h2 className="font-medium">{editing.original ? "Modifier la catégorie" : "Nouvelle catégorie"}</h2>
            <Field label="Nom" value={editing.cat.name} onChange={(e) => setEditing({ ...editing, cat: { ...editing.cat, name: e.target.value } })} required />
            <Field
              label="Lien (slug, optionnel)"
              placeholder="généré depuis le nom"
              value={editing.cat.slug}
              onChange={(e) => setEditing({ ...editing, cat: { ...editing.cat, slug: e.target.value } })}
            />
            <Field
              label="Description"
              textarea
              value={editing.cat.description}
              onChange={(e) => setEditing({ ...editing, cat: { ...editing.cat, description: e.target.value } })}
            />
            <ImageUpload
              label="Image de vignette (optionnel)"
              hint="Prioritaire sur le produit choisi ci-dessous. Format portrait conseillé."
              value={editing.cat.image}
              onChange={(image) => setEditing({ ...editing, cat: { ...editing.cat, image } })}
            />
            <label className="block text-sm">
              <span className="mb-1.5 block">{editing.cat.image ? "Sinon, vignette : produit" : "Vignette : produit"}</span>
              <select
                value={editing.cat.cover?.productId ?? ""}
                onChange={(e) => {
                  const p = products.find((x) => x.id === e.target.value);
                  setEditing({ ...editing, cat: { ...editing.cat, cover: p ? { productId: p.id, variantId: p.variants[0]?.id ?? "" } : undefined } });
                }}
                className="w-full rounded-lg border border-line bg-white px-3 py-2.5"
              >
                <option value="">Automatique (1er produit)</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </label>
            {coverProduct && (
              <label className="block text-sm">
                <span className="mb-1.5 block">Vignette : coloris</span>
                <select
                  value={editing.cat.cover?.variantId}
                  onChange={(e) => setEditing({ ...editing, cat: { ...editing.cat, cover: { productId: coverProduct.id, variantId: e.target.value } } })}
                  className="w-full rounded-lg border border-line bg-white px-3 py-2.5"
                >
                  {coverProduct.variants.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </label>
            )}
            <p className="text-xs text-muted">Pour ranger des produits dans cette catégorie, cochez-la dans la fiche du produit.</p>
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
        ) : (
          <p className="rounded-2xl border border-dashed border-line p-6 text-sm text-muted">
            Choisissez une catégorie à modifier, ou créez-en une nouvelle.
          </p>
        )}
      </div>
    </div>
  );
}
