import Link from "next/link";
import Countdown from "./Countdown";
import ProductImage from "./ProductImage";
import { PROMO } from "@/lib/promo";
import { formatPrice } from "@/lib/products";
import { getCatalog } from "@/lib/server/catalog";

const endLabel = new Date(PROMO.endsAt).toLocaleDateString("fr-FR", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Paris",
});

export default async function PromoSection() {
  const { products } = await getCatalog();
  // produits de la catégorie « promotions » (gérée dans /admin), complétés par la sélection par défaut
  const picked = [
    ...products.filter((p) => p.tags.includes("promotions")),
    ...PROMO.productIds.flatMap((id) => products.filter((p) => p.id === id)),
  ];
  const items = picked.filter((p, i) => picked.indexOf(p) === i && p.variants.length > 0).slice(0, 3);
  return (
    <section className="mx-auto mt-4 max-w-7xl px-4 sm:px-6" aria-labelledby="promo-title">
      <div className="overflow-hidden rounded-3xl bg-ink text-paper">
        <div className="grid gap-10 p-6 sm:p-10 lg:grid-cols-[1fr_1.3fr] lg:items-center">
          <div>
            <p className="inline-flex rounded-full bg-clay px-3 py-1 text-xs font-medium">Offre limitée</p>
            <h2 id="promo-title" className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
              {PROMO.title}
            </h2>
            <p className="mt-3 max-w-md text-white/70">{PROMO.subtitle}</p>
            <div className="mt-7">
              <Countdown endsAt={PROMO.endsAt} />
              <p className="mt-3 text-xs text-white/50">Fin de l&apos;offre le {endLabel} (heure de Paris).</p>
            </div>
            <Link
              href="/#collection"
              className="mt-8 inline-flex h-12 items-center rounded-full bg-paper px-6 text-sm font-medium text-ink hover:bg-white"
            >
              J&apos;en profite
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {items.map((p) => {
              const v = p.variants[0];
              const pct = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
              return (
                <Link key={p.id} href={`/produit/${p.id}`} className="group">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-white/5">
                    <ProductImage p={p} v={v} label={p.name} width={400} height={500} bg="#2a2826" pad={0.08} />
                    {pct > 0 && (
                      <span className="absolute left-2 top-2 rounded-full bg-clay px-2 py-0.5 text-[11px] font-medium">-{pct}%</span>
                    )}
                  </div>
                  <p className="mt-2 text-sm leading-tight group-hover:underline">{p.name}</p>
                  <p className="text-sm">
                    {formatPrice(p.price)}{" "}
                    {p.oldPrice && <span className="text-xs text-white/50 line-through">{formatPrice(p.oldPrice)}</span>}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
