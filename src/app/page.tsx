import Link from "next/link";
import { formatPrice } from "@/lib/products";
import { coverOf, productsIn } from "@/lib/categories";
import { getCatalog } from "@/lib/server/catalog";
import ProductImage from "@/components/ProductImage";
import PromoSection from "@/components/PromoSection";
import CollectionFilter from "@/components/CollectionFilter";
import { FREE_SHIPPING_ABOVE, SHIPPING_FEE } from "@/lib/pricing";
import { CameraIcon } from "@/components/Icons";

const featured = ["femme", "homme", "grosse-maille", "col-rond", "col-v", "col-roule"];

const steps = [
  ["1", "Choisissez un pull", "Parcourez les catégories et sélectionnez votre coloris et votre taille."],
  ["2", "Essayez-le en direct", "Ouvrez la caméra : le pull s'affiche sur vous. Générez une photo réaliste par IA."],
  ["3", "Commandez en 1 minute", "Commande express sans compte, paiement à la livraison."],
];

const faq = [
  ["Combien coûte la livraison ?", `${formatPrice(SHIPPING_FEE)} par commande. Elle est offerte dès que le total dépasse ${formatPrice(FREE_SHIPPING_ABOVE)}.`],
  ["Comment payer ?", "Vous payez à la livraison, en espèces ou par carte auprès du livreur."],
  ["Faut-il créer un compte ?", "Non. La commande express et le panier fonctionnent sans compte. Un compte permet de retrouver vos commandes."],
  ["Comment fonctionne l'essayage virtuel ?", "Sur chaque fiche produit, cliquez sur « Essayer avec ma caméra ». L'aperçu en direct est indicatif ; le bouton « Rendu réaliste IA » génère une photo de vous portant le pull."],
  ["Comment choisir ma taille ?", "Prenez votre taille habituelle. Les modèles amples (col V côtelé) peuvent se prendre une taille en dessous pour un tombé plus près du corps."],
];

export default async function Home() {
  const { products, categories } = await getCatalog();
  const hero = products.find((p) => p.id === "col-v-cotele") ?? products[0];
  // vignettes : les catégories mises en avant qui existent encore, sinon les premières
  const tiles = [
    ...featured.flatMap((s) => categories.filter((c) => c.slug === s)),
    ...categories.filter((c) => !featured.includes(c.slug)),
  ].slice(0, 6);

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-14 pt-10 sm:px-6 md:grid-cols-2 md:pt-16">
        <div>
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-clay" /> Essayage virtuel en direct
          </p>
          <h1 className="font-display text-5xl leading-[1.02] tracking-tight sm:text-6xl">
            Choisissez un pull.
            <br />
            Voyez-le <em className="text-clay">sur vous</em>.
          </h1>
          <p className="mt-6 max-w-md text-muted">
            Ouvrez la caméra depuis la fiche produit : le pull s&apos;affiche sur vos épaules en temps réel. Changez de couleur sans
            bouger, puis générez une photo réaliste par IA.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/produit/${hero.id}?essayer=1`}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-sm font-medium text-paper hover:bg-black"
            >
              <CameraIcon /> Essayer maintenant
            </Link>
            <Link href="#categories" className="inline-flex h-12 items-center rounded-full border border-ink px-6 text-sm font-medium">
              Voir les catégories
            </Link>
          </div>
        </div>
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl">
          <ProductImage p={hero} v={hero.variants[0]} bg="#e6e0d4" pad={0.12} label={hero.name} />
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-xl bg-white/85 p-3 text-sm backdrop-blur">
            <div>
              <p className="font-medium">{hero.name}</p>
              <p className="text-muted">{formatPrice(hero.price)}</p>
            </div>
            <Link href={`/produit/${hero.id}`} className="rounded-full bg-ink px-4 py-2 text-xs text-paper">
              Voir
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- Catégories ---------- */}
      <section id="categories" className="mx-auto max-w-7xl scroll-mt-20 px-4 sm:px-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="font-display text-3xl">Explorer par catégorie</h2>
          <p className="hidden text-sm text-muted sm:block">{categories.length} catégories</p>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:grid-rows-2">
          {tiles.map((c, i) => {
            const cover = coverOf(c, products);
            if (!cover) return null;
            const { p, v } = cover;
            const n = productsIn(c, products).length;
            const big = i < 2;
            return (
              <Link
                key={c.slug}
                href={`/categorie/${c.slug}`}
                className={`group relative overflow-hidden rounded-2xl ${big ? "col-span-2 aspect-[4/3] md:col-span-1 md:row-span-2 md:aspect-auto" : "aspect-square"}`}
              >
                <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.04]">
                  {c.image ? (
                    // eslint-disable-next-line @next/next/no-img-element -- image locale envoyée par l'admin
                    <img src={c.image} alt={c.name} className="h-full w-full object-cover" />
                  ) : (
                    <ProductImage p={p} v={v} label={c.name} bg={big ? "#e2dbcf" : "#efeae2"} width={600} height={big ? 800 : 600} pad={0.14} />
                  )}
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-4 text-white">
                  <p className="font-display text-2xl">{c.name}</p>
                  <p className="text-xs text-white/80">
                    {n} modèle{n > 1 ? "s" : ""} →
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ---------- Promo + compte à rebours ---------- */}
      <div className="mt-16">
        <PromoSection />
      </div>

      {/* ---------- Avantages ---------- */}
      <section className="mx-auto mt-10 grid max-w-7xl gap-3 px-4 text-sm sm:grid-cols-3 sm:px-6">
        {[
          ["Livraison offerte", `Au-delà de ${formatPrice(FREE_SHIPPING_ABOVE)}, sinon ${formatPrice(SHIPPING_FEE)}`],
          ["Paiement à la livraison", "Vous payez en recevant votre colis"],
          ["Essayage virtuel", "Voyez le pull sur vous avant d'acheter"],
        ].map(([t, d]) => (
          <div key={t} className="rounded-xl border border-line bg-white p-4">
            <p className="font-medium">{t}</p>
            <p className="text-muted">{d}</p>
          </div>
        ))}
      </section>

      {/* ---------- Comment ça marche ---------- */}
      <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6">
        <h2 className="font-display text-3xl">Comment ça marche</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {steps.map(([n, t, d]) => (
            <li key={n} className="rounded-2xl bg-mist p-6">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-ink font-display text-lg text-paper">{n}</span>
              <p className="mt-4 text-lg font-medium">{t}</p>
              <p className="mt-1 text-sm text-muted">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------- Collection ---------- */}
      <section id="collection" className="mx-auto mt-20 max-w-7xl scroll-mt-20 px-4 sm:px-6">
        <CollectionFilter />
      </section>

      {/* ---------- FAQ ---------- */}
      <section id="faq" className="mx-auto mt-20 max-w-3xl scroll-mt-20 px-4 sm:px-6">
        <h2 className="font-display text-3xl">Questions fréquentes</h2>
        <div className="mt-6 divide-y divide-line rounded-2xl border border-line bg-white">
          {faq.map(([q, a]) => (
            <details key={q} className="group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                {q}
                <span className="text-xl transition group-open:rotate-45" aria-hidden>
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm text-muted">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
