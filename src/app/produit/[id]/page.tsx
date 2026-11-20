import { notFound } from "next/navigation";
import { findProduct } from "@/lib/products";
import { getCatalog } from "@/lib/server/catalog";
import ProductView from "@/components/ProductView";

// la page peut bloquer sur le serveur sans squelette instantané
export const instant = false;

export async function generateStaticParams() {
  const { products } = await getCatalog();
  return products.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = findProduct((await getCatalog()).products, id);
  return { title: p ? `${p.name} — Lainé` : "Produit introuvable" };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = findProduct((await getCatalog()).products, id);
  if (!product) notFound();
  return <ProductView product={product} />;
}
