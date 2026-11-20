"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAdmin } from "./AdminShell";
import Field from "@/components/Field";
import { saveProduct } from "@/app/admin/actions";
import ImageUpload, { uploadFile } from "./ImageUpload";
import ProductImage from "@/components/ProductImage";
import { garments, type GarmentId } from "@/lib/garments";
import type { Product, Variant } from "@/lib/products";

const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const GARMENT_LABEL: Record<GarmentId, string> = { blanc: "Pull col rond (blanc)", colV: "Pull col V (vert)", colRoule: "Col roulé (taupe)" };

const empty: Product = {
  id: "",
  name: "",
  category: "",
  tagline: "",
  description: "",
  material: "",
  price: 59,
  tags: [],
  garment: "blanc",
  variants: [{ id: "blanc", name: "Blanc", swatch: "#ecebef" }],
  sizes: ["XS", "S", "M", "L", "XL"],
};

/** Création / modification d'un produit */
export default function ProductForm({ id }: { id: string | null }) {
  const { data, reload } = useAdmin();
  const router = useRouter();
  const existing = id ? data?.catalog.products.find((p) => p.id === id) : null;
  const [p, setP] = useState<Product>(() => structuredClone(existing ?? empty));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(0);
  const [galleryBusy, setGalleryBusy] = useState(false);

  if (id && !existing) return <p className="text-sm text-muted">Produit introuvable. <Link href="/admin/produits" className="underline">Retour</Link></p>;
  const categories = data?.catalog.categories ?? [];

  const set = <K extends keyof Product>(k: K, v: Product[K]) => setP((x) => ({ ...x, [k]: v }));
  const setVariant = (i: number, patch: Partial<Variant>) =>
    setP((x) => ({ ...x, variants: x.variants.map((v, j) => (j === i ? { ...v, ...patch } : v)) }));
  const text = (k: "name" | "category" | "tagline" | "material" | "badge") => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    set(k, e.target.value);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const r = await saveProduct(p, id);
    setBusy(false);
    if (!r.ok) return setError(r.error);
    await reload();
    router.push("/admin/produits");
  };

  const pv = p.variants[Math.min(preview, p.variants.length - 1)];

  return (
    <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        {/* infos */}
        <section className="space-y-4 rounded-2xl border border-line bg-white p-5">
          <h2 className="font-medium">Informations</h2>
          <Field label="Nom du produit" value={p.name} onChange={text("name")} required />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Sous-titre (ex : Mixte · Laine)" value={p.category} onChange={text("category")} />
            <Field label="Accroche" value={p.tagline} onChange={text("tagline")} />
          </div>
          <Field label="Description" textarea rows={4} value={p.description} onChange={(e) => set("description", e.target.value)} />
          <Field label="Composition" value={p.material} onChange={text("material")} />
        </section>

        {/* prix */}
        <section className="grid gap-4 rounded-2xl border border-line bg-white p-5 sm:grid-cols-3">
          <h2 className="font-medium sm:col-span-3">Prix</h2>
          <Field label="Prix (€)" type="number" min={1} step="0.01" value={p.price} onChange={(e) => set("price", Number(e.target.value))} required />
          <Field
            label="Prix barré (€, optionnel)"
            type="number"
            min={0}
            step="0.01"
            value={p.oldPrice ?? ""}
            onChange={(e) => set("oldPrice", e.target.value ? Number(e.target.value) : undefined)}
          />
          <Field label="Badge (ex : Nouveau, -20%)" value={p.badge ?? ""} onChange={text("badge")} />
        </section>

        {/* coloris */}
        <section className="rounded-2xl border border-line bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Coloris ({p.variants.length})</h2>
            <button
              type="button"
              onClick={() => {
                setP((x) => ({ ...x, variants: [...x.variants, { id: "", name: "Nouveau coloris", swatch: "#8a6d5a", tint: "#a88468" }] }));
                setPreview(p.variants.length);
              }}
              className="rounded-lg border border-line px-3 py-1.5 text-sm hover:border-ink"
            >
              + Ajouter un coloris
            </button>
          </div>
          <p className="mt-1 text-xs text-muted">
            Petite case de gauche : <strong>vraie photo du coloris</strong> (optionnel, remplace le visuel recoloré). Sinon, « Teinte »
            recolore la photo de base en gardant la maille. « Filtre » est un réglage avancé (ex : hue-rotate(90deg)).
          </p>
          <ul className="mt-4 space-y-3">
            {p.variants.map((v, i) => (
              <li
                key={i}
                onClick={() => setPreview(i)}
                className={`grid grid-cols-[auto_1fr] items-end gap-3 rounded-xl border p-3 sm:grid-cols-[auto_1.4fr_auto_auto_1fr_auto] ${preview === i ? "border-ink" : "border-line"}`}
              >
                <div className="w-14" onClick={(e) => e.stopPropagation()}>
                  <ImageUpload compact aspect="aspect-[4/5]" label={`Photo du coloris ${v.name}`} value={v.photo} onChange={(photo) => setVariant(i, { photo })} />
                </div>
                <Field label="Nom" value={v.name} onChange={(e) => setVariant(i, { name: e.target.value })} />
                <label className="text-sm">
                  <span className="mb-1.5 block">Pastille</span>
                  <input type="color" value={v.swatch} onChange={(e) => setVariant(i, { swatch: e.target.value })} className="h-10 w-14 cursor-pointer rounded border border-line" />
                </label>
                <label className="text-sm">
                  <span className="mb-1.5 flex items-center gap-1.5">
                    <input type="checkbox" checked={!!v.tint} onChange={(e) => setVariant(i, { tint: e.target.checked ? v.swatch : undefined })} />
                    Teinte
                  </span>
                  <input
                    type="color"
                    disabled={!v.tint}
                    value={v.tint ?? "#ffffff"}
                    onChange={(e) => setVariant(i, { tint: e.target.value })}
                    className="h-10 w-14 cursor-pointer rounded border border-line disabled:opacity-30"
                  />
                </label>
                <Field label="Filtre (optionnel)" value={v.filter ?? ""} onChange={(e) => setVariant(i, { filter: e.target.value || undefined })} />
                <button
                  type="button"
                  disabled={p.variants.length === 1}
                  onClick={(e) => {
                    e.stopPropagation();
                    setP((x) => ({ ...x, variants: x.variants.filter((_, j) => j !== i) }));
                    setPreview(0);
                  }}
                  className="h-10 rounded-lg px-3 text-sm text-clay hover:bg-clay/10 disabled:opacity-30"
                  aria-label={`Supprimer le coloris ${v.name}`}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* colonne droite */}
      <div className="space-y-6">
        <section className="rounded-2xl border border-line bg-white p-5">
          <h2 className="font-medium">Aperçu</h2>
          <div className="mt-3 aspect-[4/5] overflow-hidden rounded-xl">
            {pv && <ProductImage p={p} v={pv} width={500} height={620} label="Aperçu" />}
          </div>
          <label className="mt-4 block text-sm">
            <span className="mb-1.5 block">Photo de base (essayage caméra en direct + coloris sans photo)</span>
            <select
              value={p.garment}
              onChange={(e) => set("garment", e.target.value as GarmentId)}
              className="w-full rounded-lg border border-line bg-white px-3 py-2.5"
            >
              {(Object.keys(garments) as GarmentId[]).map((g) => (
                <option key={g} value={g}>
                  {GARMENT_LABEL[g]}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section className="rounded-2xl border border-line bg-white p-5">
          <h2 className="font-medium">Galerie photos ({(p.photos ?? []).length}/8)</h2>
          <p className="mt-1 text-xs text-muted">Photos en plus sur la fiche produit : porté, détails de la maille, ambiance…</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {(p.photos ?? []).map((url, i) => (
              <div key={url} className="group relative aspect-square overflow-hidden rounded-lg">
                {/* eslint-disable-next-line @next/next/no-img-element -- image locale envoyée par l'admin */}
                <img src={url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => set("photos", (p.photos ?? []).filter((u) => u !== url))}
                  className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-xs text-white"
                  aria-label={`Retirer la photo ${i + 1}`}
                >
                  ✕
                </button>
              </div>
            ))}
            {(p.photos ?? []).length < 8 && (
              <label className="grid aspect-square cursor-pointer place-items-center rounded-lg border-2 border-dashed border-line text-center text-xs text-muted hover:border-ink hover:text-ink">
                <span>
                  <span className="block text-xl" aria-hidden>+</span>
                  {galleryBusy ? "Envoi…" : "Ajouter"}
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={async (e) => {
                    const files = [...(e.target.files ?? [])].slice(0, 8 - (p.photos ?? []).length);
                    e.target.value = "";
                    setGalleryBusy(true);
                    setError("");
                    try {
                      const urls: string[] = [];
                      for (const f of files) urls.push(await uploadFile(f));
                      setP((x) => ({ ...x, photos: [...(x.photos ?? []), ...urls] }));
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Échec de l'envoi.");
                    } finally {
                      setGalleryBusy(false);
                    }
                  }}
                />
              </label>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-white p-5">
          <h2 className="font-medium">Catégories</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {categories.map((c) => {
              const on = p.tags.includes(c.slug);
              return (
                <button
                  key={c.slug}
                  type="button"
                  aria-pressed={on}
                  onClick={() => set("tags", on ? p.tags.filter((t) => t !== c.slug) : [...p.tags, c.slug])}
                  className={`rounded-full border px-3 py-1.5 text-sm ${on ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"}`}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-white p-5">
          <h2 className="font-medium">Tailles</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {ALL_SIZES.map((s) => {
              const on = p.sizes.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={on}
                  onClick={() => set("sizes", on ? p.sizes.filter((x) => x !== s) : ALL_SIZES.filter((x) => x === s || p.sizes.includes(x)))}
                  className={`h-10 w-12 rounded-lg border text-sm ${on ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"}`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </section>

        {error && <p className="rounded-lg bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}
        <div className="flex gap-2">
          <button disabled={busy} className="h-12 flex-1 rounded-full bg-ink text-sm font-medium text-paper hover:bg-black disabled:opacity-50">
            {busy ? "Enregistrement…" : id ? "Enregistrer" : "Créer le produit"}
          </button>
          <Link href="/admin/produits" className="grid h-12 place-items-center rounded-full border border-line px-5 text-sm hover:border-ink">
            Annuler
          </Link>
        </div>
      </div>
    </form>
  );
}
