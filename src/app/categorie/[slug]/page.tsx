import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategory, productsIn } from "@/lib/categories";
import { getCatalog } from "@/lib/server/catalog";
import ProductCard from "@/components/ProductCard";
import CategoryChips from "@/components/CategoryChips";

export const instant = false;

export async function generateStaticParams() {
  const { categories } = await getCatalog();
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = getCategory((await getCatalog()).categories, slug);
  return { title: c ? `${c.name} — Lainé` : "Catégorie introuvable" };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { products, categories } = await getCatalog();
  const c = getCategory(categories, slug);
  if (!c) notFound();
  const list = productsIn(c, products);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
      <nav className="mb-6 text-xs text-muted">
        <Link href="/" className="hover:underline">Accueil</Link> / <span className="text-ink">{c.name}</span>
      </nav>
      <h1 className="font-display text-5xl">{c.name}</h1>
      <p className="mt-2 max-w-xl text-muted">{c.description}</p>
      <div className="mt-8">
        <CategoryChips categories={categories} active={c.slug} />
      </div>

      <p className="mt-8 mb-4 text-sm text-muted">
        {list.length} modèle{list.length > 1 ? "s" : ""}
      </p>
      {list.length === 0 ? (
        <p className="rounded-xl border border-line bg-white p-8 text-center text-muted">Aucun pull dans cette catégorie pour le moment.</p>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-3">
          {list.flatMap((p) => p.variants.map((v) => <ProductCard key={`${p.id}-${v.id}`} p={p} v={v} />))}
        </div>
      )}
    </div>
  );
}
