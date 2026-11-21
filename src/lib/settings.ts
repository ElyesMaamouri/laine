/**
 * Paramètres de la boutique (modifiables dans /admin/parametres).
 * Un seul jeu de réglages pour tout le site : il est appliqué au chargement des données
 * côté serveur, et par le CatalogProvider côté navigateur.
 */
export const CURRENCIES = {
  EUR: "Euro (€)",
  TND: "Dinar tunisien (DT)",
  USD: "Dollar américain ($)",
  MAD: "Dirham marocain (MAD)",
  DZD: "Dinar algérien (DA)",
  CAD: "Dollar canadien ($ CA)",
  CHF: "Franc suisse (CHF)",
  GBP: "Livre sterling (£)",
} as const;
export type Currency = keyof typeof CURRENCIES;

export type StoreSettings = {
  currency: Currency;
  /** numéro WhatsApp au format international, chiffres seulement (ex : 21612345678) */
  whatsapp: string;
  shippingFee: number;
  /** livraison offerte quand le montant (après remise) DÉPASSE ce seuil ; 0 = jamais offerte */
  freeShippingAbove: number;
};

export const defaultSettings: StoreSettings = { currency: "EUR", whatsapp: "", shippingFee: 20, freeShippingAbove: 200 };

let current: StoreSettings = { ...defaultSettings };

export function applySettings(s: Partial<StoreSettings> | undefined | null) {
  current = { ...defaultSettings, ...(s ?? {}) };
}

export const storeSettings = () => current;

/** Lien WhatsApp (wa.me) avec un message pré-rempli ; null si aucun numéro configuré */
export function whatsappLink(message: string, phone = current.whatsapp) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/**
 * Numéro client → format international pour WhatsApp.
 * Un numéro local (ex : 97 779 797 en Tunisie, 06 12… en France) reçoit l'indicatif du numéro de la boutique.
 */
export function toInternational(phone: string, storePhone = current.whatsapp) {
  let d = phone.replace(/\D/g, "");
  if (phone.trim().startsWith("+") || d.startsWith("00")) return d.replace(/^00/, "");
  const cc = ["216", "212", "213", "33", "32", "41", "1", "44"].find((c) => storePhone.replace(/\D/g, "").startsWith(c)) ?? "";
  if (d.startsWith("0")) d = d.slice(1);
  return d.length <= 10 && cc && !d.startsWith(cc) ? cc + d : d;
}
