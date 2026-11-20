/**
 * Page d'accueil composée de sections modifiables dans /admin/accueil :
 * textes, images, boutons, produits choisis, visibilité et ordre.
 */

export type Item = { title: string; text: string };
export type QA = { q: string; a: string };

export type SectionData = {
  hero: { badge: string; title: string; highlight: string; text: string; ctaPrimary: string; ctaSecondary: string; productId: string; image?: string };
  categories: { title: string; slugs: string[] };
  promo: { label: string; title: string; subtitle: string; endsAt: string; cta: string; productIds: string[] };
  benefits: { items: Item[] };
  steps: { title: string; items: Item[] };
  banner: { eyebrow: string; title: string; text: string; image?: string; productId: string; ctaLabel: string; ctaHref: string; imageSide: "left" | "right"; dark: boolean };
  featured: { title: string; text: string; productIds: string[] };
  collection: { title: string };
  faq: { title: string; items: QA[] };
};

export type SectionType = keyof SectionData;
export type HomeSection = { [T in SectionType]: { id: string; type: T; visible: boolean; data: SectionData[T] } }[SectionType];

export const SECTION_LABELS: Record<SectionType, string> = {
  hero: "Bandeau principal",
  categories: "Explorer par catégorie",
  promo: "Promotion + compte à rebours",
  benefits: "Avantages (3 encarts)",
  steps: "Comment ça marche",
  banner: "Bannière éditoriale (image + texte)",
  featured: "Sélection du moment (produits choisis)",
  collection: "La collection (filtres)",
  faq: "Questions fréquentes",
};

export const defaultHome: HomeSection[] = [
  {
    id: "hero",
    type: "hero",
    visible: true,
    data: {
      badge: "Essayage virtuel en direct",
      title: "Choisissez un pull.\nVoyez-le",
      highlight: "sur vous",
      text: "Ouvrez la caméra depuis la fiche produit : le pull s'affiche sur vos épaules en temps réel. Changez de couleur sans bouger, puis générez une photo réaliste par IA.",
      ctaPrimary: "Essayer maintenant",
      ctaSecondary: "Voir les catégories",
      productId: "col-v-cotele",
    },
  },
  { id: "categories", type: "categories", visible: true, data: { title: "Explorer par catégorie", slugs: ["femme", "homme", "grosse-maille", "col-rond", "col-v", "col-roule"] } },
  {
    id: "promo",
    type: "promo",
    visible: true,
    data: {
      label: "Offre limitée",
      title: "Black Friday Lainé",
      subtitle: "Jusqu'à -20% sur une sélection de pulls, livraison offerte au-delà de 200 €.",
      endsAt: "2026-11-30T23:59",
      cta: "J'en profite",
      productIds: ["col-roule-chine", "col-v-cotele", "essentiel-col-rond"],
    },
  },
  {
    id: "benefits",
    type: "benefits",
    visible: true,
    data: {
      items: [
        { title: "Livraison offerte", text: "Au-delà de 200 €, sinon 20 €" },
        { title: "Paiement à la livraison", text: "Vous payez en recevant votre colis" },
        { title: "Essayage virtuel", text: "Voyez le pull sur vous avant d'acheter" },
      ],
    },
  },
  {
    id: "banner",
    type: "banner",
    visible: true,
    data: {
      eyebrow: "L'atelier Lainé",
      title: "Des mailles choisies pour durer",
      text: "Laines tracées, cachemire de Mongolie et coton biologique : nous sélectionnons des fibres douces et résistantes, tricotées en Europe, pour des pulls qui se gardent des années.",
      productId: "pull-cachemire-col-rond",
      ctaLabel: "Découvrir le cachemire",
      ctaHref: "/categorie/cachemire",
      imageSide: "left",
      dark: false,
    },
  },
  {
    id: "steps",
    type: "steps",
    visible: true,
    data: {
      title: "Comment ça marche",
      items: [
        { title: "Choisissez un pull", text: "Parcourez les catégories et sélectionnez votre coloris et votre taille." },
        { title: "Essayez-le en direct", text: "Ouvrez la caméra : le pull s'affiche sur vous. Générez une photo réaliste par IA." },
        { title: "Commandez en 1 minute", text: "Commande express sans compte, paiement à la livraison." },
      ],
    },
  },
  {
    id: "featured",
    type: "featured",
    visible: true,
    data: {
      title: "La sélection du moment",
      text: "Nos coups de cœur de la saison, à essayer en direct avec votre caméra.",
      productIds: ["col-roule-grosse-maille", "pull-col-v-tennis", "sweat-maille-oversize", "pull-coton-bio-leger"],
    },
  },
  { id: "collection", type: "collection", visible: true, data: { title: "La collection pulls" } },
  {
    id: "faq",
    type: "faq",
    visible: true,
    data: {
      title: "Questions fréquentes",
      items: [
        { q: "Combien coûte la livraison ?", a: "20 € par commande. Elle est offerte dès que le total dépasse 200 €." },
        { q: "Comment payer ?", a: "Vous payez à la livraison, en espèces ou par carte auprès du livreur." },
        { q: "Faut-il créer un compte ?", a: "Non. La commande express et le panier fonctionnent sans compte. Un compte permet de retrouver vos commandes." },
        { q: "Puis-je utiliser un code promo ?", a: "Oui : saisissez-le au moment de la commande, la remise est calculée immédiatement." },
        {
          q: "Comment fonctionne l'essayage virtuel ?",
          a: "Sur chaque fiche produit, cliquez sur « Essayer avec ma caméra ». L'aperçu en direct est indicatif ; le bouton « Rendu réaliste IA » génère une photo de vous portant le pull.",
        },
      ],
    },
  },
];

/** Complète une liste enregistrée avec les sections par défaut manquantes (nouvelles versions du site) */
export function withDefaults(saved: HomeSection[] | undefined): HomeSection[] {
  if (!saved?.length) return structuredClone(defaultHome);
  const out = [...saved];
  for (const d of defaultHome) if (!out.some((s) => s.id === d.id)) out.push(structuredClone(d));
  return out;
}
