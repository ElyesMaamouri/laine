/**
 * Données de démonstration chargées depuis le tableau de bord (« Charger les données de démo »).
 * Les clients des commandes sont fictifs (adresses @example.com).
 */
import type { Category } from "./categories";
import type { Product } from "./products";

const S = ["XS", "S", "M", "L", "XL"];
const GRAY = "grayscale(1)";

export const demoCategories: Category[] = [
  { slug: "cachemire", name: "Cachemire", description: "La douceur absolue, à garder des années.", cover: { productId: "pull-cachemire-col-rond", variantId: "ivoire" } },
  { slug: "oversize", name: "Oversize", description: "Coupes amples et confortables, épaules tombantes.", cover: { productId: "sweat-maille-oversize", variantId: "sable" } },
  { slug: "enfant", name: "Enfant", description: "Des pulls doux et colorés pour les 4-12 ans.", cover: { productId: "pull-enfant-col-rond", variantId: "moutarde" } },
  { slug: "eco-responsable", name: "Éco-responsable", description: "Coton bio et laines tracées, fabriqués en Europe.", cover: { productId: "pull-coton-bio-leger", variantId: "terracotta" } },
  { slug: "petits-prix", name: "Petits prix", description: "Nos pulls à moins de 60 €.", cover: { productId: "pull-enfant-col-rond", variantId: "bleu-ciel" } },
];

export const demoProducts: Product[] = [
  {
    id: "pull-cachemire-col-rond", name: "Pull Cachemire col rond", category: "Mixte · Cachemire",
    tagline: "100% cachemire, toucher incomparable",
    description: "Cachemire de Mongolie tricoté en jauge fine. Léger, chaud et d'une douceur rare, il se patine joliment avec le temps.",
    material: "100% cachemire", price: 129, badge: "Premium",
    tags: ["femme", "homme", "col-rond", "cachemire"], garment: "blanc", sizes: S,
    variants: [
      { id: "ivoire", name: "Ivoire", swatch: "#f3ead6", tint: "#f8efdc" },
      { id: "gris-perle", name: "Gris perle", swatch: "#bdbab6", tint: "#c9c6c2" },
      { id: "bleu-nuit", name: "Bleu nuit", swatch: "#253252", tint: "#2f3d62" },
      { id: "vieux-rose", name: "Vieux rose", swatch: "#cf9893", tint: "#dca29d" },
    ],
  },
  {
    id: "sweat-maille-oversize", name: "Sweat maille oversize", category: "Femme · Coton",
    tagline: "Le confort d'un sweat, l'allure d'un pull",
    description: "Maille gaufrée épaisse, coupe ample et épaules tombantes. À porter avec un jean droit ou un pantalon large.",
    material: "80% coton, 20% laine recyclée", price: 65, oldPrice: 79, badge: "-18%",
    tags: ["femme", "col-rond", "oversize", "promotions"], garment: "blanc", sizes: S,
    variants: [
      { id: "sable", name: "Sable", swatch: "#d8c29b", tint: "#e2cba3" },
      { id: "kaki", name: "Kaki", swatch: "#7d7d52", tint: "#8f8f5e" },
      { id: "lilas", name: "Lilas", swatch: "#b3a1cc", tint: "#bfaedb" },
      { id: "noir", name: "Noir", swatch: "#2b2b2d", tint: "#3a3a3d" },
    ],
  },
  {
    id: "pull-enfant-col-rond", name: "Pull enfant col rond", category: "Enfant · Coton",
    tagline: "Doux, résistant, lavable en machine",
    description: "Un pull qui suit les enfants partout : coton doux qui ne gratte pas, coutures renforcées, lavage à 30°.",
    material: "100% coton bio", price: 39,
    tags: ["enfant", "col-rond", "basiques", "petits-prix", "eco-responsable"], garment: "blanc", sizes: ["XS", "S", "M"],
    variants: [
      { id: "moutarde", name: "Moutarde", swatch: "#d9a93f", tint: "#e6b448" },
      { id: "bleu-ciel", name: "Bleu ciel", swatch: "#93bde3", tint: "#a2c8ec" },
      { id: "rouge", name: "Rouge", swatch: "#c0392b", tint: "#d0473a" },
      { id: "vert-pomme", name: "Vert pomme", swatch: "#93bf5f", tint: "#a3cc6e" },
    ],
  },
  {
    id: "pull-coton-bio-leger", name: "Pull coton bio léger", category: "Mixte · Coton bio",
    tagline: "Pour la mi-saison",
    description: "Maille légère en coton biologique certifié, idéale au printemps et à l'automne. Fabriqué au Portugal.",
    material: "100% coton biologique", price: 55, badge: "Éco",
    tags: ["femme", "homme", "col-rond", "eco-responsable", "petits-prix"], garment: "blanc", sizes: S,
    variants: [
      { id: "ecru", name: "Écru", swatch: "#ece1c8", tint: "#f2e6cc" },
      { id: "terracotta", name: "Terracotta", swatch: "#c27450", tint: "#d0825d" },
      { id: "sauge", name: "Sauge", swatch: "#a1af93", tint: "#aebca0" },
    ],
  },
  {
    id: "pull-col-v-merinos", name: "Pull col V Mérinos", category: "Homme · Mérinos",
    tagline: "Fin, chaud, ne gratte pas",
    description: "Laine mérinos extra-fine et grand col V côtelé. Thermorégulant, il se porte aussi bien sur une chemise que sur un t-shirt.",
    material: "100% laine mérinos", price: 79,
    tags: ["homme", "col-v", "eco-responsable"], garment: "colV", sizes: [...S, "XXL"],
    variants: [
      { id: "vert-bouteille", name: "Vert bouteille", swatch: "#244d34", filter: "brightness(0.75)" },
      { id: "marine", name: "Marine", swatch: "#263759", filter: "hue-rotate(95deg) saturate(1.1) brightness(0.7)" },
      { id: "gris-chine", name: "Gris chiné", swatch: "#8b8c8f", filter: `${GRAY} brightness(1.15)` },
    ],
  },
  {
    id: "pull-col-v-tennis", name: "Pull col V Tennis", category: "Mixte · Coton",
    tagline: "L'esprit club, version moderne",
    description: "Maille côtelée épaisse et col V profond, inspiré des pulls de tennis. Coupe légèrement ample.",
    material: "70% coton, 30% laine", price: 85, badge: "Nouveau",
    tags: ["homme", "femme", "col-v", "nouveautes", "oversize"], garment: "colV", sizes: S,
    variants: [
      { id: "craie", name: "Craie", swatch: "#dedbd2", filter: `${GRAY} brightness(2.1) contrast(0.8)` },
      { id: "bleu-roi", name: "Bleu roi", swatch: "#2f4f8f", filter: "hue-rotate(95deg) saturate(1.15)" },
      { id: "prune", name: "Prune", swatch: "#5e2d4f", filter: "hue-rotate(170deg) saturate(0.8) brightness(0.9)" },
    ],
  },
  {
    id: "col-roule-merinos-fin", name: "Col roulé Mérinos fin", category: "Mixte · Mérinos",
    tagline: "Le col roulé de tous les jours",
    description: "Jauge fine et col roulé souple qui ne serre pas. Se glisse facilement sous une veste ou un manteau.",
    material: "100% laine mérinos", price: 89,
    tags: ["femme", "homme", "col-roule", "eco-responsable"], garment: "colRoule", sizes: S,
    variants: [
      { id: "noir", name: "Noir", swatch: "#232325", filter: `${GRAY} brightness(0.45)` },
      { id: "camel", name: "Camel", swatch: "#b98c5f", filter: `${GRAY} brightness(1.5)`, tint: "#d4a473" },
      { id: "bordeaux", name: "Bordeaux", swatch: "#6e2632", filter: `${GRAY} brightness(1.3)`, tint: "#94404d" },
    ],
  },
  {
    id: "col-roule-grosse-maille", name: "Col roulé grosse maille", category: "Homme · Laine épaisse",
    tagline: "Pour les grands froids",
    description: "Grosse maille chinée et col roulé double épaisseur. Le pull de montagne par excellence.",
    material: "70% laine, 30% alpaga", price: 109, oldPrice: 139, badge: "-22%",
    tags: ["homme", "col-roule", "grosse-maille", "promotions"], garment: "colRoule", sizes: ["S", "M", "L", "XL", "XXL"],
    variants: [
      { id: "gris-chine", name: "Gris chiné", swatch: "#7d7e81", filter: GRAY },
      { id: "bleu-marine", name: "Bleu marine", swatch: "#2d3550", filter: `${GRAY} brightness(1.1)`, tint: "#55608c" },
      { id: "vert-foret", name: "Vert forêt", swatch: "#3f5a3f", filter: `${GRAY} brightness(1.2)`, tint: "#5e7a5a" },
    ],
  },
];

/* ---------------- commandes fictives ---------------- */

const FIRST = ["Camille", "Lucas", "Léa", "Hugo", "Chloé", "Nathan", "Manon", "Louis", "Inès", "Gabriel", "Sarah", "Jules", "Emma", "Adam", "Lina", "Thomas", "Jade", "Yanis", "Clara", "Rayan"];
const LAST = ["Martin", "Bernard", "Dubois", "Petit", "Durand", "Leroy", "Moreau", "Simon", "Laurent", "Lefebvre", "Michel", "Garcia", "Roux", "Fournier", "Girard"];
const CITIES: [string, string][] = [["Paris", "75011"], ["Lyon", "69003"], ["Marseille", "13006"], ["Toulouse", "31000"], ["Nantes", "44000"], ["Bordeaux", "33000"], ["Lille", "59000"], ["Strasbourg", "67000"], ["Nice", "06000"], ["Rennes", "35000"], ["Montpellier", "34000"]];
const STREETS = ["rue de la République", "avenue Jean Jaurès", "rue Victor Hugo", "boulevard Pasteur", "rue des Lilas", "place du Marché", "rue Nationale", "allée des Tilleuls"];

/** Générateur pseudo-aléatoire reproductible */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

export type DemoOrderDraft = {
  lines: { productId: string; variantId: string; size: string; qty: number }[];
  customer: { name: string; email: string; phone: string; address: string; city: string; zip: string };
  status: "nouvelle" | "confirmée" | "expédiée" | "livrée" | "annulée";
  source: "checkout" | "express";
  createdAt: string;
};

/** Brouillons de commandes répartis sur les `days` derniers jours, cohérents avec l'ancienneté */
export function demoOrderDrafts(products: Product[], count = 20, days = 21, seed = Date.now()): DemoOrderDraft[] {
  const r = rng(seed);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  const now = Date.now();
  const list: DemoOrderDraft[] = [];
  for (let k = 0; k < count; k++) {
    const ago = ((count - k) / count) * days + r();
    const status =
      ago > 12 ? pick(["livrée", "livrée", "livrée", "livrée", "annulée"] as const)
      : ago > 6 ? pick(["expédiée", "expédiée", "livrée"] as const)
      : ago > 2 ? pick(["confirmée", "expédiée"] as const)
      : pick(["nouvelle", "nouvelle", "confirmée"] as const);
    const lines = Array.from({ length: pick([1, 1, 1, 2, 2, 3]) }, () => {
      const p = pick(products);
      return { productId: p.id, variantId: pick(p.variants).id, size: pick(p.sizes), qty: pick([1, 1, 1, 2]) };
    });
    const fn = pick(FIRST);
    const ln = pick(LAST);
    const [city, zip] = pick(CITIES);
    const slug = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    const n = () => String(10 + Math.floor(r() * 90));
    list.push({
      lines,
      customer: {
        name: `${fn} ${ln}`,
        email: `${slug(fn)}.${slug(ln)}@example.com`,
        phone: `06 ${n()} ${n()} ${n()} ${n()}`,
        address: `${1 + Math.floor(r() * 120)} ${pick(STREETS)}`,
        city,
        zip,
      },
      status,
      source: pick(["checkout", "express", "express"] as const),
      createdAt: new Date(now - ago * 86400000 - Math.floor(r() * 36000000)).toISOString(),
    });
  }
  return list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
