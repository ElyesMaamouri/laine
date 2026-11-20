import Link from "next/link";
import type { Category } from "@/lib/categories";

/** Pastilles de navigation entre pages catégorie */
export default function CategoryChips({ categories, active }: { categories: Category[]; active?: string }) {
  return (
    <nav aria-label="Catégories" className="-mx-4 flex gap-2 overflow-x-auto px-4 py-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
      <Link
        href="/#collection"
        className={`shrink-0 rounded-full border px-4 py-2 text-sm ${!active ? "border-ink bg-ink text-paper" : "border-line bg-white hover:border-ink"}`}
      >
        Tout
      </Link>
      {categories.map((c) => (
        <Link
          key={c.slug}
          href={`/categorie/${c.slug}`}
          aria-current={active === c.slug ? "page" : undefined}
          className={`shrink-0 rounded-full border px-4 py-2 text-sm ${
            active === c.slug ? "border-ink bg-ink text-paper" : "border-line bg-white hover:border-ink"
          }`}
        >
          {c.name}
        </Link>
      ))}
    </nav>
  );
}
