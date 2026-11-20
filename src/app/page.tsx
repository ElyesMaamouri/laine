import { getCatalog, getHome } from "@/lib/server/catalog";
import { HomeSectionView } from "@/components/home/Sections";

/** Page d'accueil : sections dans l'ordre et avec le contenu définis dans /admin/accueil */
export default async function Home() {
  const [{ products, categories }, sections] = await Promise.all([getCatalog(), getHome()]);
  return (
    <>
      {sections
        .filter((s) => s.visible)
        .map((s) => (
          <HomeSectionView key={s.id} s={s} products={products} categories={categories} />
        ))}
    </>
  );
}
