import type { Product } from "./products";
import { applyPromo, type PromoCode } from "./promos";

import { storeSettings } from "./settings";

/** Frais de livraison (Paramètres de la boutique) */
export const shippingFee = () => storeSettings().shippingFee;
/** Livraison offerte quand le montant (après remise) DÉPASSE ce seuil ; 0 = jamais */
export const freeShippingAbove = () => storeSettings().freeShippingAbove;

export type LineInput = { productId: string; variantId: string; size: string; qty: number };

export function shippingFor(amount: number) {
  if (amount <= 0) return 0;
  const free = freeShippingAbove();
  return free > 0 && amount > free ? 0 : shippingFee();
}

/**
 * Calcule les lignes et totaux à partir du catalogue (jamais à partir des prix envoyés par le client).
 * `promo` : code promo déjà retrouvé côté serveur (ou remise connue côté client pour l'affichage).
 */
export function priceLines(lines: LineInput[], catalog: Product[], promo?: PromoCode | null) {
  const items = lines.flatMap((l) => {
    const p = catalog.find((x) => x.id === l.productId);
    const v = p?.variants.find((x) => x.id === l.variantId);
    if (!p || !v || !p.sizes.includes(l.size)) return [];
    const qty = Math.max(1, Math.min(20, Math.floor(l.qty)));
    return [{ productId: p.id, variantId: v.id, name: p.name, variant: v.name, size: l.size, qty, unitPrice: p.price, lineTotal: p.price * qty }];
  });
  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  const promoResult = promo ? applyPromo(promo, subtotal) : { discount: 0 };
  const discount = promoResult.discount;
  const afterDiscount = Math.round((subtotal - discount) * 100) / 100;
  const shipping = shippingFor(afterDiscount);
  return {
    items,
    subtotal,
    discount,
    promoCode: discount > 0 && promo ? promo.code : undefined,
    promoError: promo ? promoResult.error : undefined,
    shipping,
    total: Math.round((afterDiscount + shipping) * 100) / 100,
  };
}

/** Totaux affichés côté client avec une remise déjà vérifiée par le serveur */
export function withDiscount(subtotal: number, discount: number) {
  const d = Math.min(Math.max(0, discount), subtotal);
  const shipping = shippingFor(subtotal - d);
  return { subtotal, discount: d, shipping, total: Math.round((subtotal - d + shipping) * 100) / 100 };
}

/** Combien il manque pour la livraison offerte (0 si déjà offerte) */
export function missingForFreeShipping(amount: number) {
  const free = freeShippingAbove();
  if (free <= 0) return Infinity;
  return amount > free ? 0 : Math.max(0, free - amount + 0.01);
}
