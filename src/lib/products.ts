import type { GarmentId } from "./garments";

export type Variant = {
  id: string;
  name: string;
  /** couleur de la pastille */
  swatch: string;
  /** couleur multipliée sur la photo (recoloration réaliste, garde la maille) */
  tint?: string;
  /** filtre CSS appliqué à la photo (teinte, luminosité…) */
  filter?: string;
  /** vraie photo du coloris envoyée depuis l'admin (remplace le visuel recoloré) */
  photo?: string;
};

export type Product = {
  id: string;
  name: string;
  category: string;
  tagline: string;
  description: string;
  material: string;
  price: number;
  oldPrice?: number;
  badge?: string;
  /** catégories auxquelles appartient le produit (slugs, voir categories.ts) */
  tags: string[];
  /** photo réelle détourée utilisée pour la fiche ET l'essayage */
  garment: GarmentId;
  variants: Variant[];
  sizes: string[];
  /** photos supplémentaires de la fiche produit (porté, détails…) */
  photos?: string[];
};

const SIZES = ["XS", "S", "M", "L", "XL"];

/** Catalogue de départ : recopié dans data/db.json au premier lancement, puis modifiable dans /admin */
export const seedProducts: Product[] = [
  {
    id: "essentiel-col-rond",
    name: "Pull Essentiel col rond",
    category: "Mixte · Laine & coton",
    tagline: "Maille gaufrée, le basique de tous les jours",
    description:
      "Maille gaufrée douce et régulière, col rond côtelé, bas et poignets bord-côte. Une coupe droite et confortable, à porter seul ou sur une chemise.",
    material: "70% laine, 30% coton bio",
    price: 69,
    badge: "Best-seller",
    tags: ["femme", "homme", "col-rond", "basiques"],
    garment: "blanc",
    variants: [
      { id: "blanc", name: "Blanc cassé", swatch: "#ecebef" },
      { id: "ecru", name: "Écru", swatch: "#eadcbc", tint: "#f4e3bf" },
      { id: "camel", name: "Camel", swatch: "#b98656", tint: "#c8915a" },
      { id: "rose", name: "Rose poudré", swatch: "#e2aea8", tint: "#eeb0a8" },
      { id: "marine", name: "Marine", swatch: "#2f3d63", tint: "#3a4b7c" },
      { id: "bordeaux", name: "Bordeaux", swatch: "#7a2b38", tint: "#923848" },
    ],
    sizes: SIZES,
  },
  {
    id: "col-v-cotele",
    name: "Pull col V côtelé",
    category: "Homme · Laine",
    tagline: "Côtes anglaises, coupe ample",
    description:
      "Tricot côtes anglaises épais et souple, grand col V, épaules tombantes. Un pull au caractère vintage qui se porte sur un t-shirt ou une chemise.",
    material: "100% laine d'agneau",
    price: 89,
    badge: "Nouveau",
    tags: ["homme", "col-v", "grosse-maille", "nouveautes"],
    garment: "colV",
    variants: [
      { id: "vert", name: "Vert anglais", swatch: "#2f6b45" },
      { id: "bleu", name: "Bleu roi", swatch: "#2f4f8f", filter: "hue-rotate(95deg) saturate(1.15)" },
      { id: "prune", name: "Prune", swatch: "#5e2d4f", filter: "hue-rotate(170deg) saturate(0.8) brightness(0.9)" },
      { id: "anthracite", name: "Anthracite", swatch: "#3b3d40", filter: "grayscale(1) brightness(0.75)" },
    ],
    sizes: SIZES,
  },
  {
    id: "col-roule-chine",
    name: "Col roulé chiné",
    category: "Mixte · Laine épaisse",
    tagline: "Maille chinée, col roulé généreux",
    description:
      "Grosse maille chinée chaude et moelleuse, col roulé double épaisseur, bords côtes. Le pull des grands froids, sobre et élégant.",
    material: "80% laine, 20% alpaga",
    price: 95,
    oldPrice: 119,
    badge: "-20%",
    tags: ["femme", "homme", "col-roule", "grosse-maille", "promotions"],
    garment: "colRoule",
    variants: [
      { id: "taupe", name: "Taupe chiné", swatch: "#857c6c" },
      { id: "anthracite", name: "Anthracite", swatch: "#45464a", filter: "grayscale(0.8) brightness(0.6)" },
      { id: "creme", name: "Crème", swatch: "#d9d0bd", filter: "brightness(1.55) saturate(0.7)" },
      { id: "olive", name: "Olive", swatch: "#5d6340", tint: "#a7b07a" },
      { id: "marine", name: "Marine", swatch: "#2d3550", filter: "grayscale(1) brightness(1.1)", tint: "#55608c" },
    ],
    sizes: SIZES,
  },
];

export const SIZES_DEFAULT = SIZES;

export function findProduct(list: Product[], id: string) {
  return list.find((p) => p.id === id);
}

export function formatPrice(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}
