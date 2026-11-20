import type { Product } from "./products";

/** Une catégorie regroupe les produits dont `tags` contient son slug */
export type Category = {
  slug: string;
  name: string;
  description: string;
  /** produit + coloris utilisés pour la vignette (optionnel) */
  cover?: { productId: string; variantId: string };
  /** image de vignette envoyée depuis l'admin (prioritaire sur `cover`) */
  image?: string;
};

export type Catalog = { products: Product[]; categories: Category[] };

/** Catégories de départ (modifiables ensuite dans /admin) */
export const seedCategories: Category[] = [
  { slug: "femme", name: "Femme", description: "Pulls doux et faciles à porter, du basique au col roulé.", cover: { productId: "essentiel-col-rond", variantId: "rose" } },
  { slug: "homme", name: "Homme", description: "Mailles épaisses et coupes amples pour l'hiver.", cover: { productId: "col-v-cotele", variantId: "vert" } },
  { slug: "col-rond", name: "Col rond", description: "L'indémodable, seul ou sur une chemise.", cover: { productId: "essentiel-col-rond", variantId: "camel" } },
  { slug: "col-v", name: "Col V", description: "Le col qui allonge la silhouette.", cover: { productId: "col-v-cotele", variantId: "bleu" } },
  { slug: "col-roule", name: "Col roulé", description: "Chaleur maximale, allure élégante.", cover: { productId: "col-roule-chine", variantId: "creme" } },
  { slug: "grosse-maille", name: "Grosse maille", description: "Tricots épais, côtes et chinés pour les grands froids.", cover: { productId: "col-roule-chine", variantId: "taupe" } },
  { slug: "basiques", name: "Basiques", description: "Les essentiels à avoir en plusieurs couleurs.", cover: { productId: "essentiel-col-rond", variantId: "blanc" } },
  { slug: "promotions", name: "Promotions", description: "Les pulls à prix réduit en ce moment.", cover: { productId: "col-roule-chine", variantId: "anthracite" } },
  { slug: "nouveautes", name: "Nouveautés", description: "Les derniers arrivés dans la boutique.", cover: { productId: "col-v-cotele", variantId: "prune" } },
];

export function getCategory(list: Category[], slug: string) {
  return list.find((c) => c.slug === slug);
}

export function productsIn(c: Category, products: Product[]) {
  return products.filter((p) => p.tags.includes(c.slug));
}

/** Vignette de catégorie : le coloris choisi, sinon le 1er produit de la catégorie */
export function coverOf(c: Category, products: Product[]) {
  const p =
    products.find((x) => x.id === c.cover?.productId) ?? productsIn(c, products)[0] ?? products[0];
  if (!p) return null;
  const v = p.variants.find((x) => x.id === c.cover?.variantId) ?? p.variants[0];
  return v ? { p, v } : null;
}
