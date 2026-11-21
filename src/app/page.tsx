import { getCatalog, getHome, getSettings } from "@/lib/server/catalog";
import { applySettings } from "@/lib/settings";
import { HomeSectionView } from "@/components/home/Sections";

/** Page d'accueil : sections dans l'ordre et avec le contenu définis dans /admin/accueil */
export default async function Home() {
  const [{ products, categories }, sections, settings] = await Promise.all([getCatalog(), getHome(), getSettings()]);
  applySettings(settings);
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
