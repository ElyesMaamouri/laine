"use client";

import { useEffect, useRef, useState } from "react";
import type { LineInput } from "@/lib/pricing";

export type AppliedPromo = { code: string; label: string; discount: number } | null;

/**
 * Champ « Code promo » : vérifie le code auprès du serveur et le revalide
 * automatiquement quand le panier change (le minimum d'achat peut ne plus être atteint).
 */
export default function PromoInput({
  lines,
  applied,
  onChange,
}: {
  lines: LineInput[];
  applied: AppliedPromo;
  onChange: (p: AppliedPromo) => void;
}) {
  const [code, setCode] = useState(applied?.code ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const linesKey = JSON.stringify(lines);
  const appliedRef = useRef(applied);
  useEffect(() => {
    appliedRef.current = applied;
  }, [applied]);

  const check = async (value: string) => {
    const r = await fetch("/api/promo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: value, items: lines }),
    });
    return (await r.json().catch(() => ({ ok: false, error: "Vérification impossible, réessayez." }))) as
      | { ok: true; code: string; label: string; discount: number }
      | { ok: false; error: string };
  };

  const apply = async () => {
    const value = code.trim().toUpperCase();
    if (!value) return;
    setBusy(true);
    setError("");
    const r = await check(value);
    setBusy(false);
    if (r.ok) {
      onChange({ code: r.code, label: r.label, discount: r.discount });
      setCode(r.code);
    } else {
      onChange(null);
      setError(r.error);
    }
  };

  // panier modifié : on recalcule la remise du code déjà appliqué
  useEffect(() => {
    const current = appliedRef.current;
    if (!current) return;
    let alive = true;
    check(current.code).then((r) => {
      if (!alive) return;
      if (r.ok) onChange({ code: r.code, label: r.label, discount: r.discount });
      else {
        onChange(null);
        setError(r.error);
      }
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- on ne revalide que si le contenu du panier change
  }, [linesKey]);

  if (applied) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-clay/40 bg-clay/5 px-4 py-3 text-sm">
        <span>
          Code <strong>{applied.code}</strong> appliqué <span className="text-clay">({applied.label})</span>
        </span>
        <button
          type="button"
          onClick={() => {
            onChange(null);
            setCode("");
            setError("");
          }}
          className="text-xs underline underline-offset-2"
        >
          Retirer
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              apply();
            }
          }}
          placeholder="Code promo"
          aria-label="Code promo"
          className="min-w-0 flex-1 rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm uppercase outline-none focus:border-ink"
        />
        <button
          type="button"
          onClick={apply}
          disabled={busy || !code.trim()}
          className="rounded-lg border border-ink px-4 text-sm font-medium hover:bg-ink hover:text-paper disabled:opacity-40"
        >
          {busy ? "…" : "Appliquer"}
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-clay">{error}</p>}
    </div>
  );
}
