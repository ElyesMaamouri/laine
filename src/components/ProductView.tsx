"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatPrice, type Product } from "@/lib/products";
import ProductImage from "./ProductImage";
import ExpressOrder from "./ExpressOrder";
import { freeShippingAbove, shippingFee } from "@/lib/pricing";
import { useCart } from "./CartProvider";
import { CameraIcon } from "./Icons";
import { FavButton } from "./Favorites";
import ProductReviews from "./ProductReviews";
import { WhatsAppIcon } from "./OrderDetail";
import { useCatalog } from "./CatalogProvider";
import { whatsappLink } from "@/lib/settings";

const TryOnModal = dynamic(() => import("./TryOnModal"), { ssr: false });

export default function ProductView({ product }: { product: Product }) {
  const [variantId, setVariantId] = useState(product.variants[0].id);
  const [size, setSize] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState(false);
  const [tryOn, setTryOn] = useState(false);
  const { add } = useCart();
  const { settings } = useCatalog();
  const v = product.variants.find((x) => x.id === variantId) ?? product.variants[0];

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const couleur = q.get("couleur");
    /* eslint-disable react-hooks/set-state-in-effect -- lecture unique de l'URL au montage */
    if (couleur && product.variants.some((x) => x.id === couleur)) setVariantId(couleur);
    if (q.get("essayer") === "1") setTryOn(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [product.variants]);

  const addToCart = () => {
    if (!size) {
      setSizeError(true);
      return;
    }
    add({ productId: product.id, variantId: v.id, size });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
      <nav className="mb-6 text-xs text-muted">
        <Link href="/" className="hover:underline">Accueil</Link> / <Link href="/#collection" className="hover:underline">Pulls</Link> /{" "}
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid gap-10 md:grid-cols-[1.25fr_1fr]">
        {/* Visuels */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="relative aspect-[4/5] overflow-hidden rounded-xl sm:col-span-2">
            <ProductImage p={product} v={v} bg="#ebe6dd" />
            <button
              onClick={() => setTryOn(true)}
              className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium shadow-sm hover:bg-paper"
            >
              <CameraIcon className="h-4 w-4" /> Try-on
            </button>
          </div>
          {product.variants
            .filter((x) => x.id !== v.id)
            .slice(0, 2)
            .map((x) => (
              <button
                key={x.id}
                onClick={() => setVariantId(x.id)}
                className="aspect-square overflow-hidden rounded-xl"
                aria-label={`Voir le coloris ${x.name}`}
              >
                <ProductImage p={product} v={x} width={600} height={600} bg="#f1ede6" />
              </button>
            ))}
          {/* galerie envoyée depuis l'admin (porté, détails…) */}
          {(product.photos ?? []).map((url, i) => (
            <div key={url} className="aspect-square overflow-hidden rounded-xl bg-mist">
              {/* eslint-disable-next-line @next/next/no-img-element -- image locale envoyée par l'admin */}
              <img src={url} alt={`${product.name} — photo ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
            </div>
          ))}
        </div>

        {/* Infos */}
        <div className="md:sticky md:top-24 md:self-start">
          <p className="text-xs uppercase tracking-widest text-muted">{product.category}</p>
          <h1 className="mt-2 font-display text-4xl leading-tight">{product.name}</h1>
          <p className="mt-1 text-muted">{product.tagline}</p>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-2xl">{formatPrice(product.price)}</span>
            {product.oldPrice && <span className="text-muted line-through">{formatPrice(product.oldPrice)}</span>}
          </div>

          <div className="mt-8">
            <p className="mb-3 text-sm">
              Couleur : <span className="font-medium">{v.name}</span>
            </p>
            <div className="flex flex-wrap gap-3">
              {product.variants.map((x) => (
                <button
                  key={x.id}
                  onClick={() => setVariantId(x.id)}
                  aria-label={x.name}
                  aria-pressed={x.id === v.id}
                  title={x.name}
                  className={`h-10 w-10 rounded-full border-2 p-0.5 transition ${x.id === v.id ? "border-ink" : "border-transparent hover:border-line"}`}
                >
                  <span className="block h-full w-full rounded-full border border-black/10" style={{ background: x.swatch }} />
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <div className="mb-3 flex justify-between text-sm">
              <span>Taille</span>
              <span className="text-muted underline underline-offset-4">Guide des tailles</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setSize(s);
                    setSizeError(false);
                  }}
                  aria-pressed={size === s}
                  className={`h-11 rounded-lg border text-sm transition ${size === s ? "border-ink bg-ink text-paper" : "border-line bg-white hover:border-ink"}`}
                >
                  {s}
                </button>
              ))}
            </div>
            {sizeError && <p className="mt-2 text-sm text-clay">Choisissez une taille.</p>}
          </div>

          {/* Bloc essayage, mis en avant comme dans l'exemple */}
          <button
            onClick={() => setTryOn(true)}
            className="group mt-8 flex w-full items-center gap-4 rounded-2xl border border-ink/80 bg-white p-4 text-left transition hover:bg-mist"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ink text-paper">
              <CameraIcon />
            </span>
            <span className="flex-1">
              <span className="block font-medium">Essayer avec ma caméra</span>
              <span className="block text-sm text-muted">Voyez ce pull sur vous, en direct, en {v.name.toLowerCase()}</span>
            </span>
            <span aria-hidden className="text-xl transition group-hover:translate-x-1">→</span>
          </button>

          <div className="mt-3 flex gap-2">
            <button onClick={addToCart} className="h-12 flex-1 rounded-full bg-ink text-sm font-medium text-paper hover:bg-black">
              Ajouter au panier
            </button>
            <FavButton productId={product.id} variantId={v.id} name={product.name} className="grid h-12 w-12 place-items-center rounded-full border border-line bg-white hover:border-ink" />
          </div>
          <a href="#commande-express" className="mt-3 block text-center text-sm underline underline-offset-4">
            Acheter sans panier → commande express
          </a>
          {settings.whatsapp && (
            <button
              type="button"
              onClick={() => {
                const msg = `Bonjour, je souhaite commander :
• ${product.name}
• Couleur : ${v.name}
• Taille : ${size ?? "à préciser"}
• Prix : ${formatPrice(product.price)}
${window.location.origin}/produit/${product.id}?couleur=${v.id}`;
                const link = whatsappLink(msg);
                if (link) window.open(link, "_blank", "noopener");
              }}
              className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#1f8f4e] text-sm font-medium text-white hover:brightness-95"
            >
              <WhatsAppIcon className="h-5 w-5" /> Commander via WhatsApp
            </button>
          )}

          <ExpressOrder product={product} variant={v} size={size} onMissingSize={() => setSizeError(true)} />

          <div className="mt-10 space-y-4 border-t border-line pt-6 text-sm">
            <p>{product.description}</p>
            <p className="text-muted">Composition : {product.material}</p>
            <p className="text-muted">
              Livraison {formatPrice(shippingFee())}
              {freeShippingAbove() > 0 ? `, offerte au-delà de ${formatPrice(freeShippingAbove())}` : ""} · Paiement à la livraison
            </p>
          </div>
        </div>
      </div>

      <ProductReviews productId={product.id} />

      {tryOn && <TryOnModal product={product} variantId={v.id} onVariant={setVariantId} onClose={() => setTryOn(false)} />}
    </div>
  );
}
