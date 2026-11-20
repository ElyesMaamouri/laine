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

/* ---------------- pack 2 : 30 produits, 7 catégories, codes promo ---------------- */

export const demoCategories2: Category[] = [
  { slug: "hiver", name: "Spécial hiver", description: "Mailles épaisses et cols montants pour affronter le froid." },
  { slug: "mi-saison", name: "Mi-saison", description: "Mailles légères pour le printemps et l'automne." },
  { slug: "best-sellers", name: "Best-sellers", description: "Les pulls préférés de nos clients." },
  { slug: "tons-neutres", name: "Tons neutres", description: "Écru, gris, camel et noir : les couleurs qui vont avec tout." },
  { slug: "couleurs-vives", name: "Couleurs vives", description: "Des teintes franches pour réveiller l'hiver." },
  { slug: "coton", name: "Coton", description: "Coton doux et respirant, facile à entretenir." },
  { slug: "grandes-tailles", name: "Grandes tailles", description: "Modèles disponibles jusqu'au XXL." },
];

type V = Product["variants"][number];
const T = (id: string, name: string, swatch: string, tint = swatch): V => ({ id, name, swatch, tint });
const F = (id: string, name: string, swatch: string, filter: string, tint?: string): V => ({ id, name, swatch, filter, ...(tint ? { tint } : {}) });

/** Palettes réutilisables (recoloration des 3 photos de base) */
const P = {
  neutresRond: [T("ecru", "Écru", "#ece1c8", "#f2e6cc"), T("gris-clair", "Gris clair", "#c4c2bf", "#cfccc8"), T("camel", "Camel", "#b98656", "#c8915a"), T("noir", "Noir", "#2b2b2d", "#3a3a3d")],
  vivesRond: [T("rouge", "Rouge", "#c0392b", "#d0473a"), T("jaune", "Jaune soleil", "#e3b23c", "#eec04a"), T("bleu-roi", "Bleu roi", "#2f55b0", "#3b63c2"), T("vert-gazon", "Vert gazon", "#4f9a4a", "#5eab57")],
  pastelsRond: [T("rose", "Rose poudré", "#e2aea8", "#eeb0a8"), T("lilas", "Lilas", "#b3a1cc", "#bfaedb"), T("bleu-ciel", "Bleu ciel", "#93bde3", "#a2c8ec"), T("menthe", "Menthe", "#9fd0bd", "#acdcc9")],
  terreRond: [T("terracotta", "Terracotta", "#c27450", "#d0825d"), T("kaki", "Kaki", "#7d7d52", "#8f8f5e"), T("rouille", "Rouille", "#a5532f", "#b6603a"), T("sable", "Sable", "#d8c29b", "#e2cba3")],
  colV: [F("vert", "Vert anglais", "#2f6b45", "brightness(1)"), F("marine", "Marine", "#263759", "hue-rotate(95deg) saturate(1.1) brightness(0.7)"), F("bordeaux", "Bordeaux", "#6b2433", "hue-rotate(-140deg) saturate(1.1) brightness(0.8)"), F("gris", "Gris chiné", "#8b8c8f", "grayscale(1) brightness(1.15)")],
  colVClair: [F("craie", "Craie", "#dedbd2", "grayscale(1) brightness(2.1) contrast(0.8)"), F("bleu-ciel", "Bleu ciel", "#8fb3d9", "hue-rotate(95deg) saturate(0.7) brightness(1.6)"), F("sauge", "Sauge", "#9fb08f", "saturate(0.5) brightness(1.5)")],
  colRoule: [F("taupe", "Taupe", "#857c6c", "brightness(1)"), F("noir", "Noir", "#232325", "grayscale(1) brightness(0.45)"), F("creme", "Crème", "#d9d0bd", "brightness(1.55) saturate(0.7)"), F("marine", "Marine", "#2d3550", "grayscale(1) brightness(1.1)", "#55608c")],
  colRouleCouleur: [F("bordeaux", "Bordeaux", "#6e2632", "grayscale(1) brightness(1.3)", "#94404d"), F("moutarde", "Moutarde", "#b8892e", "grayscale(1) brightness(1.5)", "#d6a443"), F("vert-foret", "Vert forêt", "#3f5a3f", "grayscale(1) brightness(1.2)", "#5e7a5a")],
};

type Spec = [id: string, name: string, cat: string, price: number, garment: Product["garment"], palette: V[], tags: string[], material: string, extra?: Partial<Product>];

const SPECS: Spec[] = [
  ["pull-col-rond-merinos", "Pull col rond Mérinos", "Mixte · Mérinos", 75, "blanc", P.neutresRond, ["femme", "homme", "col-rond", "tons-neutres", "mi-saison"], "100% laine mérinos"],
  ["pull-col-rond-cotele", "Pull col rond côtelé", "Femme · Laine", 69, "blanc", P.pastelsRond, ["femme", "col-rond", "mi-saison"], "70% laine, 30% coton"],
  ["pull-col-rond-alpaga", "Pull col rond Alpaga", "Mixte · Alpaga", 115, "blanc", P.neutresRond, ["femme", "homme", "col-rond", "hiver", "tons-neutres"], "60% alpaga, 40% laine", { badge: "Premium" }],
  ["pull-couleur-vive", "Pull Couleur vive", "Mixte · Coton", 59, "blanc", P.vivesRond, ["femme", "homme", "col-rond", "couleurs-vives", "coton", "petits-prix"], "100% coton peigné", { badge: "Nouveau" }],
  ["pull-pastel-douceur", "Pull Pastel douceur", "Femme · Coton", 55, "blanc", P.pastelsRond, ["femme", "col-rond", "coton", "petits-prix", "mi-saison"], "100% coton bio"],
  ["pull-terre-cuite", "Pull Terre cuite", "Mixte · Laine", 79, "blanc", P.terreRond, ["femme", "homme", "col-rond", "tons-neutres"], "80% laine, 20% nylon recyclé"],
  ["pull-oversize-douillet", "Pull oversize douillet", "Femme · Laine", 85, "blanc", P.terreRond, ["femme", "col-rond", "oversize", "hiver"], "70% laine, 30% alpaga", { oldPrice: 105, badge: "-19%" }],
  ["pull-col-rond-grandes-tailles", "Pull col rond Confort", "Mixte · Coton", 62, "blanc", P.neutresRond, ["femme", "homme", "col-rond", "grandes-tailles", "coton"], "100% coton", { sizes: ["M", "L", "XL", "XXL"] }],
  ["pull-enfant-couleurs", "Pull enfant Arc-en-ciel", "Enfant · Coton", 35, "blanc", P.vivesRond, ["enfant", "col-rond", "couleurs-vives", "petits-prix"], "100% coton bio", { sizes: ["XS", "S", "M"] }],
  ["pull-enfant-pastel", "Pull enfant Pastel", "Enfant · Coton", 35, "blanc", P.pastelsRond, ["enfant", "col-rond", "petits-prix"], "100% coton bio", { sizes: ["XS", "S", "M"] }],
  ["pull-cachemire-fin", "Pull Cachemire fin", "Femme · Cachemire", 149, "blanc", P.pastelsRond, ["femme", "col-rond", "cachemire"], "100% cachemire", { badge: "Premium" }],
  ["pull-cachemire-homme", "Pull Cachemire homme", "Homme · Cachemire", 159, "blanc", P.neutresRond, ["homme", "col-rond", "cachemire", "tons-neutres"], "100% cachemire"],
  ["pull-best-seller-rond", "Pull Iconique", "Mixte · Laine", 69, "blanc", P.neutresRond, ["femme", "homme", "col-rond", "best-sellers", "basiques"], "70% laine, 30% coton", { badge: "Best-seller" }],
  ["pull-col-v-classique", "Pull col V Classique", "Homme · Laine", 72, "colV", P.colV, ["homme", "col-v", "basiques", "best-sellers"], "100% laine d'agneau", { badge: "Best-seller" }],
  ["pull-col-v-cachemire", "Pull col V Cachemire", "Homme · Cachemire", 139, "colV", P.colV, ["homme", "col-v", "cachemire"], "100% cachemire", { badge: "Premium" }],
  ["pull-col-v-coton", "Pull col V Coton", "Mixte · Coton", 58, "colV", P.colVClair, ["homme", "femme", "col-v", "coton", "petits-prix", "mi-saison"], "100% coton"],
  ["pull-col-v-ample", "Pull col V Ample", "Femme · Laine", 82, "colV", P.colVClair, ["femme", "col-v", "oversize"], "70% laine, 30% coton"],
  ["pull-col-v-grandes-tailles", "Pull col V Confort", "Homme · Laine", 76, "colV", P.colV, ["homme", "col-v", "grandes-tailles"], "100% laine", { sizes: ["L", "XL", "XXL"] }],
  ["pull-col-v-promo", "Pull col V Essentiel", "Mixte · Laine", 49, "colV", P.colV, ["homme", "femme", "col-v", "promotions", "petits-prix"], "80% laine, 20% polyamide", { oldPrice: 69, badge: "-29%" }],
  ["pull-col-v-merinos-femme", "Pull col V Mérinos femme", "Femme · Mérinos", 79, "colV", P.colVClair, ["femme", "col-v", "mi-saison"], "100% laine mérinos", { badge: "Nouveau" }],
  ["col-roule-classique", "Col roulé Classique", "Mixte · Laine", 89, "colRoule", P.colRoule, ["femme", "homme", "col-roule", "hiver", "tons-neutres", "best-sellers"], "80% laine, 20% alpaga", { badge: "Best-seller" }],
  ["col-roule-couleur", "Col roulé Couleur", "Femme · Laine", 92, "colRoule", P.colRouleCouleur, ["femme", "col-roule", "couleurs-vives", "hiver"], "80% laine, 20% alpaga"],
  ["col-roule-cachemire", "Col roulé Cachemire", "Mixte · Cachemire", 169, "colRoule", P.colRoule, ["femme", "homme", "col-roule", "cachemire", "hiver"], "100% cachemire", { badge: "Premium" }],
  ["col-roule-montagne", "Col roulé Montagne", "Homme · Laine épaisse", 119, "colRoule", P.colRouleCouleur, ["homme", "col-roule", "grosse-maille", "hiver"], "70% laine, 30% alpaga"],
  ["col-roule-leger", "Col roulé Léger", "Femme · Mérinos", 79, "colRoule", P.colRoule, ["femme", "col-roule", "mi-saison"], "100% laine mérinos"],
  ["col-roule-oversize", "Col roulé Oversize", "Femme · Laine", 99, "colRoule", P.colRouleCouleur, ["femme", "col-roule", "oversize", "hiver"], "70% laine, 30% mohair", { oldPrice: 125, badge: "-21%" }],
  ["col-roule-grandes-tailles", "Col roulé Confort", "Homme · Laine", 95, "colRoule", P.colRoule, ["homme", "col-roule", "grandes-tailles", "hiver"], "80% laine, 20% alpaga", { sizes: ["L", "XL", "XXL"] }],
  ["col-roule-enfant", "Col roulé enfant", "Enfant · Laine", 45, "colRoule", P.colRouleCouleur, ["enfant", "col-roule", "hiver", "petits-prix"], "100% laine douce", { sizes: ["XS", "S", "M"] }],
  ["col-roule-eco", "Col roulé Éco", "Mixte · Laine recyclée", 85, "colRoule", P.colRoule, ["femme", "homme", "col-roule", "eco-responsable", "tons-neutres"], "100% laine recyclée", { badge: "Éco" }],
  ["col-roule-chine-promo", "Col roulé chiné Promo", "Mixte · Laine", 69, "colRoule", P.colRoule, ["femme", "homme", "col-roule", "promotions", "grosse-maille"], "70% laine, 30% alpaga", { oldPrice: 99, badge: "-30%" }],
];

const DESC: Record<Product["garment"], string> = {
  blanc: "Maille douce et régulière, col rond côtelé, bas et poignets bord-côte. Une coupe droite et confortable, facile à porter tous les jours.",
  colV: "Tricot côtelé souple et grand col V, épaules légèrement tombantes. Se porte aussi bien sur un t-shirt que sur une chemise.",
  colRoule: "Col roulé généreux et maille chaude, bords côtes. Un indispensable de la saison froide, sobre et élégant.",
};

export const demoProducts2: Product[] = SPECS.map(([id, name, category, price, garment, palette, tags, material, extra]) => ({
  id,
  name,
  category,
  tagline: material,
  description: DESC[garment],
  material,
  price,
  tags,
  garment,
  variants: structuredClone(palette),
  sizes: ["XS", "S", "M", "L", "XL"],
  ...extra,
}));

/** Codes promo d'exemple (dates relatives à aujourd'hui) */
export function demoPromos(today: string) {
  const add = (n: number) => {
    const d = new Date(`${today}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  };
  const now = new Date().toISOString();
  return [
    { code: "BIENVENUE10", type: "percent", value: 10, startsAt: add(-30), endsAt: add(335), uses: 0, active: true, createdAt: now },
    { code: "LAINE15", type: "fixed", value: 15, startsAt: add(-5), endsAt: add(25), minSubtotal: 120, uses: 0, active: true, createdAt: now },
    { code: "HIVER20", type: "percent", value: 20, startsAt: add(10), endsAt: add(40), uses: 0, active: true, createdAt: now },
    { code: "ETE2026", type: "percent", value: 15, startsAt: add(-150), endsAt: add(-60), uses: 0, active: true, createdAt: now },
    { code: "VIP50", type: "fixed", value: 50, startsAt: add(-10), endsAt: add(50), minSubtotal: 250, maxUses: 20, uses: 0, active: true, createdAt: now },
  ] as const;
}
