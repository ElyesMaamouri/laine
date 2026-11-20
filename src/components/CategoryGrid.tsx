"use client";

import ProductCard from "./ProductCard";
import Pagination, { usePaged } from "./Pagination";
import type { Product } from "@/lib/products";

const PER_PAGE = 12;

/** Grille d'une page catégorie : une carte par coloris, 12 par page */
export default function CategoryGrid({ products }: { products: Product[] }) {
  const cards = products.flatMap((p) => p.variants.map((v) => ({ p, v })));
  const paged = usePaged(cards, PER_PAGE);
  return (
    <div id="grille" className="scroll-mt-24">
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-3">
        {paged.items.map(({ p, v }, i) => (
          <div key={`${p.id}-${v.id}-${paged.page}`} className="animate-fade-up" style={{ animationDelay: `${(i % 6) * 50}ms` }}>
            <ProductCard p={p} v={v} />
          </div>
        ))}
      </div>
      <Pagination page={paged.page} pages={paged.pages} onChange={paged.setPage} total={paged.total} perPage={PER_PAGE} scrollTo="grille" />
    </div>
  );
}
