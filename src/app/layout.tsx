import type { Metadata } from "next";
import { Fraunces, Geist } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/CartProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { FavoritesProvider } from "@/components/Favorites";
import Header from "@/components/Header";
import Link from "next/link";
import { getCatalog, getSettings } from "@/lib/server/catalog";
import { applySettings } from "@/lib/settings";
import { CatalogProvider } from "@/components/CatalogProvider";
import { formatPrice } from "@/lib/products";
import { freeShippingAbove, shippingFee } from "@/lib/pricing";

const body = Geist({ variable: "--font-body", subsets: ["latin"] });
const display = Fraunces({ variable: "--font-display", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Lainé — Pulls à essayer en direct",
  description: "Boutique de pulls avec essayage virtuel par caméra.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [catalog, settings] = await Promise.all([getCatalog(), getSettings()]);
  applySettings(settings);
  const { categories } = catalog;
  return (
    // data-scroll-behavior : Next garde le défilement fluide sans l'appliquer aux changements de page
    <html lang="fr" data-scroll-behavior="smooth" className={`${body.variable} ${display.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <CatalogProvider catalog={catalog} settings={settings}>
        <AuthProvider>
        <FavoritesProvider>
        <CartProvider>
          <div className="shop-chrome contents">
            <Header />
          </div>
          <main className="flex-1">{children}</main>
          <footer className="shop-chrome mt-24 border-t border-line bg-white">
            <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 text-sm sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
              <div>
                <p className="font-display text-2xl">
                  Lainé<span className="text-clay">.</span>
                </p>
                <p className="mt-2 text-muted">Des pulls à essayer en direct avec votre caméra avant d&apos;acheter.</p>
              </div>
              <div>
                <p className="mb-3 font-medium">Catégories</p>
                <ul className="space-y-2 text-muted">
                  {categories.slice(0, 6).map((c) => (
                    <li key={c.slug}>
                      <Link href={`/categorie/${c.slug}`} className="hover:text-ink">{c.name}</Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-3 font-medium">Mon compte</p>
                <ul className="space-y-2 text-muted">
                  <li><Link href="/connexion" className="hover:text-ink">Connexion</Link></li>
                  <li><Link href="/inscription" className="hover:text-ink">Créer un compte</Link></li>
                  <li><Link href="/compte" className="hover:text-ink">Mes commandes</Link></li>
                  <li><Link href="/panier" className="hover:text-ink">Panier</Link></li>
                  <li><Link href="/suivi" className="hover:text-ink">Suivre ma commande</Link></li>
                  <li><Link href="/favoris" className="hover:text-ink">Mes favoris</Link></li>
                </ul>
              </div>
              <div>
                <p className="mb-3 font-medium">Infos</p>
                <ul className="space-y-2 text-muted">
                  <li>Livraison {formatPrice(shippingFee())}, offerte au-delà de {formatPrice(freeShippingAbove())}</li>
                  <li>Paiement à la livraison</li>
                  <li><Link href="/#faq" className="hover:text-ink">Questions fréquentes</Link></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-line px-4 py-5 text-center text-xs text-muted">
              Lainé · Boutique de démonstration · <Link href="/credits" className="hover:text-ink">Crédits photos</Link>
            </div>
          </footer>
        </CartProvider>
        </FavoritesProvider>
        </AuthProvider>
        </CatalogProvider>
      </body>
    </html>
  );
}
