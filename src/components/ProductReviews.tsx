"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";

type ReviewRow = { id: string; author: string; rating: number; text: string; createdAt: string };
type Data = { reviews: ReviewRow[]; average: number; count: number; canReview: boolean; reason: string };

export function Stars({ value, size = "h-4 w-4", label }: { value: number; size?: string; label?: string }) {
  return (
    <span className="inline-flex" role="img" aria-label={label ?? `${value} sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} viewBox="0 0 20 20" className={`${size} ${i <= Math.round(value) ? "text-clay" : "text-line"}`} fill="currentColor" aria-hidden>
          <path d="M10 1.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L10 14.8l-5.2 2.8 1-5.8L1.5 7.7l5.9-.8z" />
        </svg>
      ))}
    </span>
  );
}

/** Avis vérifiés d'un produit : liste publiée + formulaire pour les clients qui ont reçu le pull */
export default function ProductReviews({ productId }: { productId: string }) {
  const { user } = useAuth();
  const [data, setData] = useState<Data | null>(null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/reviews?productId=${encodeURIComponent(productId)}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, [productId]);
  useEffect(load, [load, user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const r = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, rating, text }),
    });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setMsg({ ok: false, text: d.error ?? "Envoi impossible." });
    setMsg({ ok: true, text: "Merci ! Votre avis sera publié après validation." });
    setText("");
    setRating(0);
    load();
  };

  if (!data) return null;
  return (
    <section id="avis" className="mt-16 scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-4 border-t border-line pt-10">
        <div>
          <h2 className="font-display text-3xl">Avis clients</h2>
          {data.count > 0 ? (
            <p className="mt-2 flex items-center gap-2 text-sm">
              <Stars value={data.average} /> <strong>{data.average.toLocaleString("fr-FR")}</strong>
              <span className="text-muted">
                / 5 · {data.count} avis vérifié{data.count > 1 ? "s" : ""}
              </span>
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted">Pas encore d&apos;avis sur ce pull.</p>
          )}
        </div>
        <p className="max-w-xs text-xs text-muted">Seuls les clients ayant reçu ce pull peuvent le noter. Chaque avis est relu avant publication.</p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <ul className="space-y-4">
          {data.reviews.map((r) => (
            <li key={r.id} className="rounded-2xl border border-line bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Stars value={r.rating} />
                <span className="text-xs text-muted">
                  {r.author} · {new Date(r.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })} ·{" "}
                  <span className="text-green-700">✓ Achat vérifié</span>
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed">{r.text}</p>
            </li>
          ))}
        </ul>

        <div className="h-fit rounded-2xl border border-line bg-white p-5">
          {data.canReview ? (
            <form onSubmit={submit} className="space-y-4" noValidate>
              <p className="font-medium">Donner mon avis</p>
              <div className="flex gap-1" role="radiogroup" aria-label="Note">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    type="button"
                    role="radio"
                    aria-checked={rating === i}
                    aria-label={`${i} étoile${i > 1 ? "s" : ""}`}
                    onClick={() => setRating(i)}
                    onMouseEnter={() => setHover(i)}
                    onMouseLeave={() => setHover(0)}
                    className="p-0.5"
                  >
                    <svg viewBox="0 0 20 20" className={`h-7 w-7 ${i <= (hover || rating) ? "text-clay" : "text-line"}`} fill="currentColor" aria-hidden>
                      <path d="M10 1.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L10 14.8l-5.2 2.8 1-5.8L1.5 7.7l5.9-.8z" />
                    </svg>
                  </button>
                ))}
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
                maxLength={1000}
                placeholder="Taille, confort, couleur… votre retour aide les autres clients."
                aria-label="Votre avis"
                className="w-full rounded-lg border border-line px-3.5 py-2.5 text-sm outline-none focus:border-ink"
              />
              <button disabled={busy || !rating || text.trim().length < 10} className="h-11 w-full rounded-full bg-ink text-sm font-medium text-paper disabled:opacity-40">
                {busy ? "Envoi…" : "Publier mon avis"}
              </button>
            </form>
          ) : (
            <div className="text-sm">
              <p className="text-muted">{data.reason}</p>
              {!user && (
                <Link href={`/connexion?suite=${encodeURIComponent(`/produit/${productId}#avis`)}`} className="mt-3 inline-block underline underline-offset-4">
                  Se connecter
                </Link>
              )}
            </div>
          )}
          {msg && <p className={`mt-3 text-sm ${msg.ok ? "text-green-700" : "text-clay"}`}>{msg.text}</p>}
        </div>
      </div>
    </section>
  );
}
