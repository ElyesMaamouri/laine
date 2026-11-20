/**
 * Promotion affichée sur l'accueil.
 * La date de fin est RÉELLE et fixe : le compte à rebours ne redémarre jamais
 * (un faux minuteur serait une pratique commerciale trompeuse).
 */
export const PROMO = {
  title: "Black Friday Lainé",
  subtitle: "Jusqu'à -20% sur une sélection de pulls, livraison offerte au-delà de 200 €.",
  /** fin de l'offre (heure de Paris) */
  endsAt: "2026-11-30T23:59:59+01:00",
  /** produits mis en avant (ceux qui ont un prix barré réel) */
  productIds: ["col-roule-chine", "col-v-cotele", "essentiel-col-rond"],
};
