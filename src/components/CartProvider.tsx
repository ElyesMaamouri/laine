"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useCatalog } from "./CatalogProvider";

export type CartItem = { productId: string; variantId: string; size: string; qty: number };

type CartCtx = {
  items: CartItem[];
  count: number;
  total: number;
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (item: Omit<CartItem, "qty">) => void;
  setQty: (index: number, qty: number) => void;
  clear: () => void;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "maille-cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { getProduct } = useCatalog();
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture unique du stockage local au montage
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  const persist = (next: CartItem[]) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
    return next;
  };

  const add = useCallback((item: Omit<CartItem, "qty">) => {
    setItems((prev) => {
      const i = prev.findIndex(
        (p) => p.productId === item.productId && p.variantId === item.variantId && p.size === item.size,
      );
      const next = i >= 0 ? prev.map((p, j) => (j === i ? { ...p, qty: p.qty + 1 } : p)) : [...prev, { ...item, qty: 1 }];
      return persist(next);
    });
    setOpen(true);
  }, []);

  const setQty = useCallback((index: number, qty: number) => {
    setItems((prev) => persist(qty <= 0 ? prev.filter((_, j) => j !== index) : prev.map((p, j) => (j === index ? { ...p, qty } : p))));
  }, []);

  const clear = useCallback(() => setItems(persist([])), []);

  const value = useMemo(() => {
    const count = items.reduce((s, i) => s + i.qty, 0);
    const total = items.reduce((s, i) => s + (getProduct(i.productId)?.price ?? 0) * i.qty, 0);
    return { items, count, total, open, setOpen, add, setQty, clear };
  }, [items, open, add, setQty, clear, getProduct]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart doit être utilisé dans CartProvider");
  return c;
}
