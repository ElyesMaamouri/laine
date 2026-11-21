"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { adminCheck, adminLogout, getAdminData } from "@/app/admin/actions";
import type { Catalog } from "@/lib/categories";
import type { Order, Review } from "@/lib/server/db";
import type { PromoCode } from "@/lib/promos";
import type { HomeSection } from "@/lib/home";
import { applySettings, type StoreSettings } from "@/lib/settings";

type AdminData = { catalog: Catalog; orders: Order[]; promos: PromoCode[]; home: HomeSection[]; settings: StoreSettings; reviews: Review[] };
const Ctx = createContext<{ data: AdminData | null; reload: () => Promise<void> }>({ data: null, reload: async () => {} });
export const useAdmin = () => useContext(Ctx);

const NAV = [
  ["/admin", "Tableau de bord", "▦"],
  ["/admin/produits", "Produits", "◫"],
  ["/admin/categories", "Catégories", "▤"],
  ["/admin/commandes", "Commandes", "☰"],
  ["/admin/promos", "Codes promo", "%"],
  ["/admin/accueil", "Page d'accueil", "⌂"],
  ["/admin/avis", "Avis clients", "★"],
  ["/admin/parametres", "Paramètres", "⚙"],
] as const;

/** Cadre du tableau de bord : vérifie la session admin, charge les données, affiche le menu */
export default function AdminShell({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const [data, setData] = useState<AdminData | null>(null);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [menu, setMenu] = useState(false);

  const reload = useCallback(async () => {
    try {
      const d = await getAdminData();
      applySettings(d.settings); // devise à jour dans l'admin juste après un changement
      setData(d);
    } catch {
      router.replace("/admin/connexion");
    }
  }, [router]);

  useEffect(() => {
    adminCheck().then((ok) => {
      setAllowed(ok);
      if (!ok) router.replace(`/admin/connexion?suite=${encodeURIComponent(path ?? "/admin")}`);
      else reload();
    });
  }, [router, path, reload]);

  // menu ouvert : Échap pour fermer, et la page derrière ne défile plus
  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [menu]);

  if (!allowed)
    return (
      <p data-admin-root className="p-10 text-center text-sm text-muted">
        Vérification de l&apos;accès…
      </p>
    );

  const newOrders = data?.orders.filter((o) => o.status === "nouvelle").length ?? 0;
  const pendingReviews = data?.reviews.filter((r) => r.status === "en attente").length ?? 0;

  return (
    <Ctx.Provider value={{ data, reload }}>
      <div data-admin-root className="min-h-screen bg-[#f3f1ec] lg:grid lg:grid-cols-[240px_1fr]">
        {/* fond sombre derrière le menu (mobile / tablette) */}
        <div
          onClick={() => setMenu(false)}
          aria-hidden
          className={`fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden ${
            menu ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        />

        {/* menu latéral : tiroir qui glisse depuis la gauche sur mobile, fixe sur grand écran */}
        <aside
          id="admin-menu"
          aria-label="Menu d'administration"
          className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-ink text-paper shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-auto lg:max-w-none lg:translate-x-0 lg:shadow-none ${
            menu ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-full flex-col overflow-y-auto p-5">
            <div className="flex items-center justify-between">
              <Link href="/admin" onClick={() => setMenu(false)} className="font-display text-2xl">
                Lainé<span className="text-clay">.</span> <span className="align-middle text-xs font-sans text-white/50">admin</span>
              </Link>
              <button
                onClick={() => setMenu(false)}
                className="grid h-9 w-9 place-items-center rounded-full text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
                aria-label="Fermer le menu"
              >
                ✕
              </button>
            </div>
            <nav className="mt-8 flex flex-col gap-1 text-sm">
              {NAV.map(([href, label, icon]) => {
                const on = href === "/admin" ? path === "/admin" : path?.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMenu(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition ${on ? "bg-white/15" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
                  >
                    <span aria-hidden>{icon}</span>
                    <span className="flex-1">{label}</span>
                    {href === "/admin/avis" && pendingReviews > 0 && <span className="rounded-full bg-clay px-2 text-xs">{pendingReviews}</span>}
                    {href === "/admin/commandes" && newOrders > 0 && (
                      <span className="rounded-full bg-clay px-2 text-xs">{newOrders}</span>
                    )}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-auto space-y-1 pt-8 text-sm">
              <Link href="/" target="_blank" className="block rounded-lg px-3 py-2 text-white/70 hover:bg-white/10 hover:text-white">
                ↗ Voir la boutique
              </Link>
              <button
                onClick={async () => {
                  await adminLogout();
                  router.replace("/admin/connexion");
                }}
                className="w-full rounded-lg px-3 py-2 text-left text-white/70 hover:bg-white/10 hover:text-white"
              >
                ⎋ Déconnexion
              </button>
            </div>
          </div>
        </aside>

        {/* contenu */}
        <div className="min-w-0">
          <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-[#f3f1ec]/90 px-4 py-4 backdrop-blur sm:px-8">
            <button
              className="group grid h-10 w-10 place-items-center rounded-xl border border-line bg-white hover:border-ink lg:hidden"
              onClick={() => setMenu(true)}
              aria-expanded={menu}
              aria-controls="admin-menu"
              aria-label="Ouvrir le menu"
            >
              <span className="flex w-5 flex-col gap-[5px]" aria-hidden>
                <span className="h-0.5 w-full rounded bg-ink" />
                <span className="h-0.5 w-3/4 rounded bg-ink transition-all group-hover:w-full" />
                <span className="h-0.5 w-full rounded bg-ink" />
              </span>
            </button>
            <h1 className="flex-1 font-display text-2xl sm:text-3xl">{title}</h1>
            {action}
          </header>
          <main className="px-4 py-6 sm:px-8">{data ? children : <p className="text-sm text-muted">Chargement…</p>}</main>
        </div>
      </div>
    </Ctx.Provider>
  );
}
