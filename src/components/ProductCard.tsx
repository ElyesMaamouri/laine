import Link from "next/link";
import ProductImage from "./ProductImage";
import { CameraIcon } from "./Icons";
import { FavButton } from "./Favorites";
import { formatPrice, type Product, type Variant } from "@/lib/products";

export default function ProductCard({ p, v }: { p: Product; v: Variant }) {
  return (
    <Link href={`/produit/${p.id}?couleur=${v.id}`} className="group">
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-mist">
        <div className="h-full w-full transition-transform duration-500 group-hover:scale-[1.03]">
          <ProductImage p={p} v={v} width={600} height={750} />
        </div>
        {p.badge && <span className="absolute left-3 top-3 rounded-full bg-white px-2.5 py-1 text-[11px] font-medium">{p.badge}</span>}
        <FavButton productId={p.id} variantId={v.id} name={p.name} overlay className="absolute right-3 top-3" />
        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-ink/85 px-3 py-1.5 text-[11px] text-paper opacity-0 transition-opacity group-hover:opacity-100 max-md:opacity-100">
          <CameraIcon className="h-3.5 w-3.5" /> Essayer
        </span>
      </div>
      <div className="mt-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium">{p.name}</p>
          <p className="text-xs text-muted">
            {v.name} · {p.variants.length} coloris
          </p>
        </div>
        <div className="text-right text-sm">
          <p>{formatPrice(p.price)}</p>
          {p.oldPrice && <p className="text-xs text-muted line-through">{formatPrice(p.oldPrice)}</p>}
        </div>
      </div>
      <div className="mt-2 flex gap-1.5">
        {p.variants.map((x) => (
          <span
            key={x.id}
            title={x.name}
            className={`h-3.5 w-3.5 rounded-full border ${x.id === v.id ? "border-ink" : "border-black/10"}`}
            style={{ background: x.swatch }}
          />
        ))}
      </div>
    </Link>
  );
}
