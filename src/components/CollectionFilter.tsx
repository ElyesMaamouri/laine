"use client";

import { useState } from "react";
import { useCatalog } from "./CatalogProvider";
import ProductCard from "./ProductCard";

/** nombre de produits affichés au départ, puis à chaque « Voir plus » */
const PAGE = 6;

/** Collection filtrée sur place (sans changer de page), avec animation */
export default function CollectionFilter({ title = "La collection pulls" }: { title?: string }) {
  const { products, categories } = useCatalog();
  const [active, setActive] = useState<string | null>(null);
  const [shown, setShown] = useState(PAGE);
  const cat = categories.find((c) => c.slug === active);
  const list = cat ? products.filter((p) => p.tags.includes(cat.slug)) : products;
  // une carte par coloris ; on alterne les modèles pour varier les 6 premières cartes
  const perProduct = list.map((p) => p.variants.map((v) => ({ p, v })));
  const cards = Array.from({ length: Math.max(0, ...perProduct.map((x) => x.length)) }, (_, i) =>
    perProduct.flatMap((x) => (x[i] ? [x[i]] : [])),
  ).flat();

  const chip = (slug: string | null, label: string) => {
    const on = active === slug;
    return (
      <button
        key={slug ?? "tout"}
        type="button"
        onClick={() => {
          setActive(slug);
          setShown(PAGE); // chaque filtre repart à 6 produits
        }}
        aria-pressed={on}
        className={`shrink-0 rounded-full border px-4 py-2 text-sm transition-all duration-300 ${
          on ? "scale-105 border-ink bg-ink text-paper shadow-md" : "border-line bg-white hover:-translate-y-0.5 hover:border-ink"
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <>
      <div className="mb-6 flex items-end justify-between">
        <h2 className="font-display text-3xl">{title}</h2>
        <p key={active ?? "tout"} className="animate-fade-up text-sm text-muted">
          {list.length} modèle{list.length > 1 ? "s" : ""} · {cards.length} coloris
        </p>
      </div>

      <div className="-mx-4 mb-8 flex gap-2 overflow-x-auto px-4 py-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Filtrer par catégorie">
        {chip(null, "Tout")}
        {categories.map((c) => chip(c.slug, c.name))}
      </div>

      {cat && (
        <p key={`desc-${cat.slug}`} className="animate-fade-up -mt-4 mb-8 text-sm text-muted">
          {cat.description}
        </p>
      )}

      {/* la clé change à chaque filtre : la grille se rejoue avec une entrée en cascade */}
      <div key={active ?? "tout"} className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-3" aria-live="polite">
        {cards.length === 0 && <p className="col-span-full text-muted">Aucun pull dans cette catégorie pour le moment.</p>}
        {cards.slice(0, shown).map(({ p, v }, i) => (
          // les cartes ajoutées par « Voir plus » s'animent en cascade à partir de 0
          <div key={`${p.id}-${v.id}`} className="animate-fade-up" style={{ animationDelay: `${(i % PAGE) * 60}ms` }}>
            <ProductCard p={p} v={v} />
          </div>
        ))}
      </div>

      {cards.length > shown && (
        <div className="mt-12 flex flex-col items-center gap-3">
          <p className="text-xs text-muted">
            {Math.min(shown, cards.length)} sur {cards.length} affichés
          </p>
          <div className="h-1 w-48 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-ink transition-all duration-500" style={{ width: `${(shown / cards.length) * 100}%` }} />
          </div>
          <button
            type="button"
            onClick={() => setShown((n) => n + PAGE)}
            className="mt-2 h-12 rounded-full border border-ink px-8 text-sm font-medium transition hover:bg-ink hover:text-paper"
          >
            Voir plus ({Math.min(PAGE, cards.length - shown)})
          </button>
        </div>
      )}
    </>
  );
}
