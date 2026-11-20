import { read } from "@/lib/server/db";
import { priceLines, type LineInput } from "@/lib/pricing";
import { promoLabel } from "@/lib/promos";

/**
 * Vérifie un code promo pour un panier : renvoie la remise ou la raison du refus.
 * La commande revérifie toujours le code au moment de l'enregistrement.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const code = String(body.code ?? "").trim().toUpperCase().slice(0, 20);
  if (!code) return Response.json({ ok: false, error: "Saisissez un code promo." }, { status: 400 });

  const lines: LineInput[] = Array.isArray(body.items)
    ? body.items.slice(0, 50).map((i: Record<string, unknown>) => ({
        productId: String(i.productId ?? ""),
        variantId: String(i.variantId ?? ""),
        size: String(i.size ?? ""),
        qty: Number(i.qty ?? 1) || 1,
      }))
    : [];

  const { promo, products } = await read((d) => ({ promo: d.promos.find((p) => p.code === code), products: d.catalog.products }));
  if (!promo) return Response.json({ ok: false, error: "Ce code promo n'existe pas." });
  const priced = priceLines(lines, products, promo ?? null);
  if (!priced.promoCode) {
    return Response.json({ ok: false, error: priced.items.length ? priced.promoError ?? "Ce code n'est pas valable." : "Votre panier est vide." });
  }
  return Response.json({ ok: true, code: priced.promoCode, label: promoLabel(promo!), discount: priced.discount });
}
