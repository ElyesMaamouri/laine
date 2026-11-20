import { formatPrice } from "@/lib/products";
import { FREE_SHIPPING_ABOVE, missingForFreeShipping, SHIPPING_FEE } from "@/lib/pricing";

/** Sous-total, livraison (20 €, offerte au-delà de 200 €) et total, avec barre de progression */
export default function Totals({ subtotal, shipping, total }: { subtotal: number; shipping: number; total: number }) {
  const missing = missingForFreeShipping(subtotal);
  const pct = Math.min(100, (subtotal / FREE_SHIPPING_ABOVE) * 100);
  return (
    <div className="space-y-2 text-sm">
      {subtotal > 0 && (
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
      <div className="flex justify-between">
        <span className="text-muted">Livraison</span>
        <span>{shipping === 0 && subtotal > 0 ? "Offerte" : formatPrice(subtotal > 0 ? shipping : 0)}</span>
      </div>
      <div className="flex justify-between border-t border-line pt-2 text-base font-medium">
        <span>Total</span>
        <span>{formatPrice(total)}</span>
      </div>
      <p className="text-xs text-muted">
        Livraison {formatPrice(SHIPPING_FEE)}, offerte au-delà de {formatPrice(FREE_SHIPPING_ABOVE)}. Paiement à la livraison.
      </p>
    </div>
  );
}
