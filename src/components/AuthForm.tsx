"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Field from "./Field";
import { useAuth } from "./AuthProvider";

/** Formulaire commun connexion / inscription */
export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const { setUser } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isLogin = mode === "login";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    setError("");
    try {
      const r = await fetch(`/api/auth/${isLogin ? "login" : "register"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok) {
        if (d.errors) setErrors(d.errors);
        setError(d.error ?? "");
        return;
      }
      setUser(d.user);
      const next = new URLSearchParams(window.location.search).get("suite");
      router.push(next && next.startsWith("/") && !next.startsWith("//") ? next : "/compte");
    } catch {
      setError("Connexion impossible, réessayez.");
    } finally {
      setBusy(false);
    }
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <h1 className="font-display text-4xl">{isLogin ? "Connexion" : "Créer un compte"}</h1>
      <p className="mt-2 text-sm text-muted">
        {isLogin ? "Retrouvez vos commandes et commandez plus vite." : "Vos coordonnées seront pré-remplies à chaque commande."}
      </p>
      <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
        {!isLogin && <Field label="Nom complet" autoComplete="name" value={form.name} onChange={set("name")} error={errors.name} required />}
        <Field label="E-mail" type="email" autoComplete="email" value={form.email} onChange={set("email")} error={errors.email} required />
        <Field
          label="Mot de passe"
          type="password"
          autoComplete={isLogin ? "current-password" : "new-password"}
          value={form.password}
          onChange={set("password")}
          error={errors.password}
          required
          minLength={isLogin ? undefined : 8}
        />
        {!isLogin && <p className="-mt-2 text-xs text-muted">8 caractères minimum.</p>}
        {error && <p className="rounded-lg bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}
        <button disabled={busy} className="h-12 w-full rounded-full bg-ink text-sm font-medium text-paper hover:bg-black disabled:opacity-50">
          {busy ? "Un instant…" : isLogin ? "Se connecter" : "Créer mon compte"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        {isLogin ? (
          <>
            Pas encore de compte ? <Link href="/inscription" className="text-ink underline underline-offset-4">Créer un compte</Link>
          </>
        ) : (
          <>
            Déjà inscrit ? <Link href="/connexion" className="text-ink underline underline-offset-4">Se connecter</Link>
          </>
        )}
      </p>
    </div>
  );
}
