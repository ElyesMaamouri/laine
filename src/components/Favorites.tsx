"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { HeartIcon } from "./Icons";

/** Favoris du visiteur, gardés dans son navigateur (pas besoin de compte) */
export type Fav = { productId: string; variantId: string };

type Ctx = { favs: Fav[]; has: (p: string, v?: string) => boolean; toggle: (f: Fav) => void; remove: (p: string) => void };
const FavCtx = createContext<Ctx>({ favs: [], has: () => false, toggle: () => {}, remove: () => {} });
const KEY = "laine-favoris";

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favs, setFavs] = useState<Fav[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture unique du stockage local au montage
      if (raw) setFavs(JSON.parse(raw));
    } catch {}
  }, []);

  const persist = (next: Fav[]) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
    return next;
  };

  // un produit n'apparaît qu'une fois ; on garde le dernier coloris choisi
  const toggle = useCallback(
    (f: Fav) =>
      setFavs((prev) => persist(prev.some((x) => x.productId === f.productId) ? prev.filter((x) => x.productId !== f.productId) : [f, ...prev])),
    [],
  );
  const remove = useCallback((p: string) => setFavs((prev) => persist(prev.filter((x) => x.productId !== p))), []);
  const value = useMemo(() => ({ favs, toggle, remove, has: (p: string) => favs.some((x) => x.productId === p) }), [favs, toggle, remove]);
  return <FavCtx.Provider value={value}>{children}</FavCtx.Provider>;
}

export const useFavorites = () => useContext(FavCtx);

/** Bouton cœur ; `overlay` = version ronde posée sur une image */
export function FavButton({ productId, variantId, name, overlay, className = "" }: Fav & { name: string; overlay?: boolean; className?: string }) {
  const { has, toggle } = useFavorites();
  const on = has(productId);
  return (
    <button
      type="button"
      onClick={(e) => {
        // la carte produit est un lien : on ne veut pas naviguer
        e.preventDefault();
        e.stopPropagation();
        toggle({ productId, variantId });
      }}
      aria-pressed={on}
      aria-label={on ? `Retirer ${name} des favoris` : `Ajouter ${name} aux favoris`}
      title={on ? "Retirer des favoris" : "Ajouter aux favoris"}
      className={`${overlay ? "grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow-sm backdrop-blur hover:bg-white" : ""} transition active:scale-90 ${className}`}
    >
      <HeartIcon className={`h-5 w-5 transition ${on ? "fill-clay text-clay" : ""}`} />
    </button>
  );
}
