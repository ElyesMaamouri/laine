/**
 * Codes promo : modèle et règles de validation (utilisé côté serveur, qui fait foi).
 * Dates au format AAAA-MM-JJ, comparées en heure de Paris, bornes incluses.
 */
export type PromoCode = {
  code: string; // en MAJUSCULES, unique
  type: "percent" | "fixed";
  value: number; // % (1-100) ou montant en €
  startsAt: string; // AAAA-MM-JJ (inclus)
  endsAt: string; // AAAA-MM-JJ (inclus)
  minSubtotal?: number; // montant minimum du panier
  maxUses?: number; // nombre maximum d'utilisations
  uses: number;
  active: boolean;
  createdAt: string;
};

export const CODE_RE = /^[A-Z0-9-]{3,20}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Date du jour à Paris (AAAA-MM-JJ) */
export function parisToday(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export type PromoState = "active" | "planifié" | "expiré" | "désactivé" | "épuisé";

export function promoState(p: PromoCode, today = parisToday()): PromoState {
  if (!p.active) return "désactivé";
  if (p.maxUses && p.uses >= p.maxUses) return "épuisé";
  if (today < p.startsAt) return "planifié";
  if (today > p.endsAt) return "expiré";
  return "active";
}

/** Vérifie les champs saisis dans l'admin ; renvoie un message d'erreur ou null */
export function checkPromoInput(p: Partial<PromoCode>): string | null {
  if (!p.code || !CODE_RE.test(p.code)) return "Code : 3 à 20 caractères, lettres majuscules, chiffres ou tirets.";
  if (p.type !== "percent" && p.type !== "fixed") return "Type de remise invalide.";
  const v = Number(p.value);
  if (!(v > 0)) return "La remise doit être supérieure à 0.";
  if (p.type === "percent" && v > 100) return "Un pourcentage ne peut pas dépasser 100 %.";
  if (!p.startsAt || !DATE_RE.test(p.startsAt) || isNaN(Date.parse(p.startsAt))) return "Date de début invalide.";
  if (!p.endsAt || !DATE_RE.test(p.endsAt) || isNaN(Date.parse(p.endsAt))) return "Date de fin invalide.";
  if (p.endsAt < p.startsAt) return "La date de fin doit être après la date de début.";
  if (p.minSubtotal !== undefined && !(p.minSubtotal >= 0)) return "Montant minimum invalide.";
  if (p.maxUses !== undefined && !(Number.isInteger(p.maxUses) && p.maxUses > 0)) return "Nombre d'utilisations invalide.";
  return null;
}

/** Remise applicable à un sous-total, ou un message expliquant pourquoi le code est refusé */
export function applyPromo(p: PromoCode | undefined | null, subtotal: number, today = parisToday()): { discount: number; error?: string } {
  if (!p) return { discount: 0, error: "Ce code promo n'existe pas." };
  const fr = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  switch (promoState(p, today)) {
    case "désactivé":
      return { discount: 0, error: "Ce code promo n'est plus actif." };
    case "épuisé":
      return { discount: 0, error: "Ce code promo a atteint son nombre maximum d'utilisations." };
    case "planifié":
      return { discount: 0, error: `Ce code sera valable à partir du ${fr(p.startsAt)}.` };
    case "expiré":
      return { discount: 0, error: `Ce code a expiré le ${fr(p.endsAt)}.` };
  }
  if (p.minSubtotal && subtotal < p.minSubtotal) {
    return { discount: 0, error: `Ce code s'applique dès ${p.minSubtotal.toFixed(2).replace(".", ",")} € d'achat.` };
  }
  const raw = p.type === "percent" ? (subtotal * p.value) / 100 : p.value;
  return { discount: Math.round(Math.min(raw, subtotal) * 100) / 100 };
}

export const promoLabel = (p: Pick<PromoCode, "type" | "value">) =>
  p.type === "percent" ? `-${p.value} %` : `-${p.value.toFixed(2).replace(".", ",")} €`;
