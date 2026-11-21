"use client";

import OrderTimeline from "./OrderTimeline";
import Totals from "./Totals";
import { formatPrice } from "@/lib/products";
import { whatsappLink } from "@/lib/settings";
import { useCatalog } from "./CatalogProvider";

type Status = "nouvelle" | "confirmée" | "expédiée" | "livrée" | "annulée";

export type PublicOrder = {
  number: string;
  createdAt: string;
  status: Status;
  history?: { status: Status; at: string }[];
  customer: { name: string; email: string; phone: string; address: string; city: string; zip: string };
  items: { productId: string; variantId: string; name: string; variant: string; size: string; qty: number; lineTotal: number }[];
  subtotal: number;
  discount?: number;
  promoCode?: string;
  shipping: number;
  total: number;
};

/** Détail d'une commande : suivi, articles, totaux, livraison, contact WhatsApp */
export default function OrderDetail({ order }: { order: PublicOrder }) {
  useCatalog(); // garantit que la devise de la boutique est appliquée
  const wa = whatsappLink(`Bonjour, j'ai une question sur ma commande ${order.number}.`);
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-line bg-white p-6">
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-medium">Suivi de la commande {order.number}</h2>
          <span className="text-xs text-muted">
            Passée le {new Date(order.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
          </span>
        </div>
        <OrderTimeline status={order.status} createdAt={order.createdAt} history={order.history} />
      </section>

      <section className="rounded-2xl border border-line bg-white p-6">
        <ul className="mb-5 space-y-2 text-sm">
          {order.items.map((i) => (
            <li key={`${i.productId}-${i.variantId}-${i.size}`} className="flex justify-between gap-3">
              <span>
                {i.qty} × {i.name} <span className="text-muted">· {i.variant} · {i.size}</span>
              </span>
              <span>{formatPrice(i.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <Totals subtotal={order.subtotal} discount={order.discount} promoCode={order.promoCode} shipping={order.shipping} total={order.total} />
        <div className="mt-6 border-t border-line pt-4 text-sm">
          <p className="font-medium">Livraison</p>
          <p className="text-muted">
            {order.customer.name} · {order.customer.address}, {order.customer.zip} {order.customer.city}
          </p>
          <p className="mt-2 text-muted">Paiement à la livraison</p>
        </div>
        {wa && (
          <a
            href={wa}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-[#1f8f4e] px-5 text-sm font-medium text-white hover:brightness-95"
          >
            <WhatsAppIcon /> Une question ? Écrivez-nous sur WhatsApp
          </a>
        )}
      </section>
    </div>
  );
}

export function WhatsAppIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7a2.8 2.8 0 0 0 1.8-1.3 2.3 2.3 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3Z" />
    </svg>
  );
}
