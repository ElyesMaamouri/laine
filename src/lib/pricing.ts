import type { Product } from "./products";

/** Frais de livraison fixes */
export const SHIPPING_FEE = 20;
/** Livraison offerte quand le sous-total DÉPASSE ce montant */
export const FREE_SHIPPING_ABOVE = 200;

export type LineInput = { productId: string; variantId: string; size: string; qty: number };

export function shippingFor(subtotal: number) {
  if (subtotal <= 0) return 0;
  return subtotal > FREE_SHIPPING_ABOVE ? 0 : SHIPPING_FEE;
}

/** Calcule les lignes et totaux à partir du catalogue (jamais à partir des prix envoyés par le client) */
export function priceLines(lines: LineInput[], catalog: Product[]) {
  const items = lines.flatMap((l) => {
    const p = catalog.find((x) => x.id === l.productId);
    const v = p?.variants.find((x) => x.id === l.variantId);
    if (!p || !v || !p.sizes.includes(l.size)) return [];
    const qty = Math.max(1, Math.min(20, Math.floor(l.qty)));
    return [{ productId: p.id, variantId: v.id, name: p.name, variant: v.name, size: l.size, qty, unitPrice: p.price, lineTotal: p.price * qty }];
  });
  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  const shipping = shippingFor(subtotal);
  return { items, subtotal, shipping, total: subtotal + shipping };
}

/** Combien il manque pour la livraison offerte (0 si déjà offerte) */
export function missingForFreeShipping(subtotal: number) {
  return subtotal > FREE_SHIPPING_ABOVE ? 0 : Math.max(0, FREE_SHIPPING_ABOVE - subtotal + 0.01);
}
