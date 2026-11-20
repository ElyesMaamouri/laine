"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Field from "@/components/Field";
import { adminLogin } from "../actions";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const r = await adminLogin(email, password);
    setBusy(false);
    if (!r.ok) return setError(r.error);
    const next = new URLSearchParams(window.location.search).get("suite");
    router.replace(next && next.startsWith("/admin") ? next : "/admin");
  };

  return (
    <div data-admin-root className="grid min-h-screen place-items-center bg-ink px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl bg-paper p-8 shadow-2xl">
        <p className="font-display text-3xl">
          Lainé<span className="text-clay">.</span>
        </p>
        <h1 className="mt-1 text-sm text-muted">Espace administrateur</h1>
        <div className="mt-8 space-y-4">
          <Field label="E-mail" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Field label="Mot de passe" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <p className="mt-4 rounded-lg bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}
        <button disabled={busy} className="mt-6 h-12 w-full rounded-full bg-ink text-sm font-medium text-paper hover:bg-black disabled:opacity-50">
          {busy ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </div>
  );
}
