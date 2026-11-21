import { formatPrice } from "@/lib/products";
import { freeShippingAbove, missingForFreeShipping, shippingFee } from "@/lib/pricing";

/** Sous-total, remise éventuelle, livraison (selon les Paramètres de la boutique) et total, avec barre de progression */
export default function Totals({
  subtotal,
  shipping,
  total,
  discount = 0,
  promoCode,
}: {
  subtotal: number;
  shipping: number;
  total: number;
  discount?: number;
  promoCode?: string;
}) {
  const base = subtotal - discount; // la livraison offerte se calcule après remise
  const missing = missingForFreeShipping(base);
  const free = freeShippingAbove();
  const pct = Math.min(100, (base / (free || 1)) * 100);
  return (
    <div className="space-y-2 text-sm">
      {subtotal > 0 && free > 0 && (
        <div className="mb-4 rounded-lg bg-mist p-3">
          <p className="text-xs">
            {missing > 0 ? (
              <>
                Plus que <strong>{formatPrice(Math.ceil(missing))}</strong> pour la livraison offerte
              </>
            ) : (
              <strong>Livraison offerte 🎉</strong>
            )}
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-ink transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}
      <div className="flex justify-between">
        <span className="text-muted">Sous-total</span>
        <span>{formatPrice(subtotal)}</span>
      </div>
      {discount > 0 && (
        <div className="flex justify-between text-clay">
          <span>Code promo{promoCode ? ` ${promoCode}` : ""}</span>
          <span>-{formatPrice(discount)}</span>
        </div>
      )}
      <div className="flex justify-between">
        <span className="text-muted">Livraison</span>
        <span>{shipping === 0 && subtotal > 0 ? "Offerte" : formatPrice(subtotal > 0 ? shipping : 0)}</span>
      </div>
      <div className="flex justify-between border-t border-line pt-2 text-base font-medium">
        <span>Total</span>
        <span>{formatPrice(total)}</span>
      </div>
      <p className="text-xs text-muted">
        Livraison {formatPrice(shippingFee())}
        {free > 0 ? `, offerte au-delà de ${formatPrice(free)}` : ""}. Paiement à la livraison.
      </p>
    </div>
  );
}
