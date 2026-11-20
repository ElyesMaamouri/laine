"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type PublicUser = { id: string; name: string; email: string };

type AuthCtx = {
  user: PublicUser | null;
  loading: boolean;
  setUser: (u: PublicUser | null) => void;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  }, []);

  return <Ctx.Provider value={{ user, loading, setUser, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth doit être utilisé dans AuthProvider");
  return c;
}
