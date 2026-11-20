/** Rendu des sections de la page d'accueil (contenu modifiable dans /admin/accueil) */
import Link from "next/link";
import { formatPrice, type Product } from "@/lib/products";
import { coverOf, productsIn, type Category } from "@/lib/categories";
import type { HomeSection, SectionData } from "@/lib/home";
import ProductImage from "@/components/ProductImage";
import ProductCard from "@/components/ProductCard";
import CollectionFilter from "@/components/CollectionFilter";
import Countdown from "@/components/Countdown";
import { CameraIcon } from "@/components/Icons";

type Ctx = { products: Product[]; categories: Category[] };

/** « 2026-11-30T23:59 » saisi en heure de Paris → instant ISO (gère l'heure d'été) */
export function parisToIso(local: string) {
  const m = local.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return local;
  const [, y, mo, d, h, mi] = m.map(Number);
  const asUtc = Date.UTC(y, mo - 1, d, h, mi);
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Paris", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
    .formatToParts(new Date(asUtc))
    .reduce<Record<string, string>>((a, p) => ((a[p.type] = p.value), a), {});
  const shown = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute);
  return new Date(asUtc - (shown - asUtc)).toISOString();
}

const byId = (products: Product[], ids: string[]) =>
  ids.flatMap((id) => products.filter((p) => p.id === id && p.variants.length > 0));

/* eslint-disable @next/next/no-img-element -- images envoyées par l'admin (Cloudinary ou disque local) */

function Hero({ d, products }: { d: SectionData["hero"] } & Ctx) {
  const hero = products.find((p) => p.id === d.productId) ?? products[0];
  const lines = d.title.split("\n");
  return (
    <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-14 pt-10 sm:px-6 md:grid-cols-2 md:pt-16">
      <div>
        {d.badge && (
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-clay" /> {d.badge}
          </p>
        )}
        <h1 className="font-display text-5xl leading-[1.02] tracking-tight sm:text-6xl">
          {lines.map((l, i) => (
            <span key={i}>
              {l}
              {i < lines.length - 1 && <br />}
            </span>
          ))}
          {d.highlight && (
            <>
              {" "}
              <em className="text-clay">{d.highlight}</em>.
            </>
          )}
        </h1>
        {d.text && <p className="mt-6 max-w-md text-muted">{d.text}</p>}
        <div className="mt-8 flex flex-wrap gap-3">
          {hero && d.ctaPrimary && (
            <Link href={`/produit/${hero.id}?essayer=1`} className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-sm font-medium text-paper hover:bg-black">
              <CameraIcon /> {d.ctaPrimary}
            </Link>
          )}
          {d.ctaSecondary && (
            <Link href="#categories" className="inline-flex h-12 items-center rounded-full border border-ink px-6 text-sm font-medium">
              {d.ctaSecondary}
            </Link>
          )}
        </div>
      </div>
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#e6e0d4]">
        {d.image ? (
          <img src={d.image} alt={hero?.name ?? ""} className="h-full w-full object-cover" />
        ) : (
          hero && <ProductImage p={hero} v={hero.variants[0]} bg="#e6e0d4" pad={0.12} label={hero.name} />
        )}
        {hero && (
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-xl bg-white/85 p-3 text-sm backdrop-blur">
            <div>
              <p className="font-medium">{hero.name}</p>
              <p className="text-muted">{formatPrice(hero.price)}</p>
            </div>
            <Link href={`/produit/${hero.id}`} className="rounded-full bg-ink px-4 py-2 text-xs text-paper">
              Voir
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

function Categories({ d, products, categories }: { d: SectionData["categories"] } & Ctx) {
  const tiles = [...d.slugs.flatMap((s) => categories.filter((c) => c.slug === s)), ...categories.filter((c) => !d.slugs.includes(c.slug))].slice(0, 6);
  return (
    <section id="categories" className="mx-auto mt-4 max-w-7xl scroll-mt-20 px-4 sm:px-6">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 className="font-display text-3xl">{d.title}</h2>
        <p className="hidden text-sm text-muted sm:block">{categories.length} catégories</p>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:grid-rows-2">
        {tiles.map((c, i) => {
          const cover = coverOf(c, products);
          if (!cover && !c.image) return null;
          const n = productsIn(c, products).length;
          const big = i < 2;
          return (
            <Link
              key={c.slug}
              href={`/categorie/${c.slug}`}
              className={`group relative overflow-hidden rounded-2xl ${big ? "col-span-2 aspect-[4/3] md:col-span-1 md:row-span-2 md:aspect-auto" : "aspect-square"}`}
            >
              <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.04]">
                {c.image ? (
                  <img src={c.image} alt={c.name} className="h-full w-full object-cover" />
                ) : (
                  cover && <ProductImage p={cover.p} v={cover.v} label={c.name} bg={big ? "#e2dbcf" : "#efeae2"} width={600} height={big ? 800 : 600} pad={0.14} />
                )}
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-4 text-white">
                <p className="font-display text-2xl">{c.name}</p>
                <p className="text-xs text-white/80">
                  {n} modèle{n > 1 ? "s" : ""} →
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function Promo({ d, products }: { d: SectionData["promo"] } & Ctx) {
  const endsAt = parisToIso(d.endsAt);
  const endLabel = new Date(endsAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
  const items = byId(products, d.productIds).slice(0, 3);
  return (
    <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6" aria-labelledby="promo-title">
      <div className="overflow-hidden rounded-3xl bg-ink text-paper">
        <div className="grid gap-10 p-6 sm:p-10 lg:grid-cols-[1fr_1.3fr] lg:items-center">
          <div>
            {d.label && <p className="inline-flex rounded-full bg-clay px-3 py-1 text-xs font-medium">{d.label}</p>}
            <h2 id="promo-title" className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
              {d.title}
            </h2>
            {d.subtitle && <p className="mt-3 max-w-md text-white/70">{d.subtitle}</p>}
            <div className="mt-7">
              <Countdown endsAt={endsAt} />
              <p className="mt-3 text-xs text-white/50">Fin de l&apos;offre le {endLabel} (heure de Paris).</p>
            </div>
            {d.cta && (
              <Link href="/categorie/promotions" className="mt-8 inline-flex h-12 items-center rounded-full bg-paper px-6 text-sm font-medium text-ink hover:bg-white">
                {d.cta}
              </Link>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {items.map((p) => {
              const pct = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
              return (
                <Link key={p.id} href={`/produit/${p.id}`} className="group">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-white/5">
                    <ProductImage p={p} v={p.variants[0]} label={p.name} width={400} height={500} bg="#2a2826" pad={0.08} />
                    {pct > 0 && <span className="absolute left-2 top-2 rounded-full bg-clay px-2 py-0.5 text-[11px] font-medium">-{pct}%</span>}
                  </div>
                  <p className="mt-2 text-sm leading-tight group-hover:underline">{p.name}</p>
                  <p className="text-sm">
                    {formatPrice(p.price)} {p.oldPrice && <span className="text-xs text-white/50 line-through">{formatPrice(p.oldPrice)}</span>}
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

function Benefits({ d }: { d: SectionData["benefits"] }) {
  return (
    <section className="mx-auto mt-10 grid max-w-7xl gap-3 px-4 text-sm sm:grid-cols-3 sm:px-6">
      {d.items.map((it, i) => (
        <div key={i} className="rounded-xl border border-line bg-white p-4">
          <p className="font-medium">{it.title}</p>
          <p className="text-muted">{it.text}</p>
        </div>
      ))}
    </section>
  );
}

function Steps({ d }: { d: SectionData["steps"] }) {
  return (
    <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6">
      <h2 className="font-display text-3xl">{d.title}</h2>
      <ol className="mt-6 grid gap-4 md:grid-cols-3">
        {d.items.map((it, i) => (
          <li key={i} className="rounded-2xl bg-mist p-6">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-ink font-display text-lg text-paper">{i + 1}</span>
            <p className="mt-4 text-lg font-medium">{it.title}</p>
            <p className="mt-1 text-sm text-muted">{it.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Nouvelle section : bannière éditoriale image + texte */
function Banner({ d, products }: { d: SectionData["banner"] } & Ctx) {
  const p = products.find((x) => x.id === d.productId) ?? products[0];
  const img = d.image ? (
    <img src={d.image} alt={d.title} className="h-full w-full object-cover" />
  ) : (
    p && <ProductImage p={p} v={p.variants[0]} label={d.title} width={900} height={900} bg={d.dark ? "#2a2826" : "#e9e3d8"} pad={0.12} />
  );
  return (
    <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6">
      <div className={`grid overflow-hidden rounded-3xl md:grid-cols-2 ${d.dark ? "bg-ink text-paper" : "bg-[#efe9df]"}`}>
        <div className={`relative aspect-square md:aspect-auto md:min-h-[440px] ${d.imageSide === "right" ? "md:order-2" : ""}`}>{img}</div>
        <div className="flex flex-col justify-center p-8 sm:p-12">
          {d.eyebrow && <p className={`text-xs uppercase tracking-[0.2em] ${d.dark ? "text-white/60" : "text-clay"}`}>{d.eyebrow}</p>}
          <h2 className="mt-3 font-display text-4xl leading-tight">{d.title}</h2>
          {d.text && <p className={`mt-4 max-w-md ${d.dark ? "text-white/70" : "text-muted"}`}>{d.text}</p>}
          {d.ctaLabel && d.ctaHref && (
            <Link
              href={d.ctaHref}
              className={`mt-8 inline-flex h-12 w-fit items-center rounded-full px-6 text-sm font-medium ${d.dark ? "bg-paper text-ink hover:bg-white" : "bg-ink text-paper hover:bg-black"}`}
            >
              {d.ctaLabel}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

/** Nouvelle section : sélection de produits choisis dans l'admin */
function Featured({ d, products }: { d: SectionData["featured"] } & Ctx) {
  const items = byId(products, d.productIds).slice(0, 8);
  if (!items.length) return null;
  return (
    <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6">
      <div className="mb-6 max-w-2xl">
        <h2 className="font-display text-3xl">{d.title}</h2>
        {d.text && <p className="mt-2 text-muted">{d.text}</p>}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
        {items.map((p) => (
          <ProductCard key={p.id} p={p} v={p.variants[0]} />
        ))}
      </div>
    </section>
  );
}

function Collection({ d }: { d: SectionData["collection"] }) {
  return (
    <section id="collection" className="mx-auto mt-20 max-w-7xl scroll-mt-20 px-4 sm:px-6">
      <CollectionFilter title={d.title} />
    </section>
  );
}

function Faq({ d }: { d: SectionData["faq"] }) {
  return (
    <section id="faq" className="mx-auto mt-20 max-w-3xl scroll-mt-20 px-4 sm:px-6">
      <h2 className="font-display text-3xl">{d.title}</h2>
      <div className="mt-6 divide-y divide-line rounded-2xl border border-line bg-white">
        {d.items.map((it, i) => (
          <details key={i} className="group p-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
              {it.q}
              <span className="text-xl transition group-open:rotate-45" aria-hidden>
                +
              </span>
            </summary>
            <p className="mt-3 text-sm text-muted">{it.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

/** Affiche une section selon son type */
export function HomeSectionView({ s, ...ctx }: { s: HomeSection } & Ctx) {
  switch (s.type) {
    case "hero":
      return <Hero d={s.data} {...ctx} />;
    case "categories":
      return <Categories d={s.data} {...ctx} />;
    case "promo":
      return <Promo d={s.data} {...ctx} />;
    case "benefits":
      return <Benefits d={s.data} />;
    case "steps":
      return <Steps d={s.data} />;
    case "banner":
      return <Banner d={s.data} {...ctx} />;
    case "featured":
      return <Featured d={s.data} {...ctx} />;
    case "collection":
      return <Collection d={s.data} />;
    case "faq":
      return <Faq d={s.data} />;
  }
}
