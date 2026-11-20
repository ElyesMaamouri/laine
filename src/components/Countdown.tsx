"use client";

import { useEffect, useState } from "react";

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { j: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), min: Math.floor((s % 3600) / 60), s: s % 60 };
}

/** Compte à rebours vers une date FIXE (identique pour tous les visiteurs) */
export default function Countdown({ endsAt }: { endsAt: string }) {
  const end = new Date(endsAt).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  if (now !== null && now >= end) {
    return <p className="text-sm font-medium">Cette offre est terminée.</p>;
  }
  const p = now === null ? null : parts(end - now);
  const cells: [string, number | undefined][] = [
    ["jours", p?.j],
    ["heures", p?.h],
    ["min", p?.min],
    ["sec", p?.s],
  ];
  return (
    <div className="flex gap-2 sm:gap-3" role="timer" aria-label="Temps restant avant la fin de l'offre">
      {cells.map(([label, n]) => (
        <div key={label} className="w-16 rounded-xl bg-white/10 py-3 text-center sm:w-20">
          <span className="block font-display text-3xl tabular-nums sm:text-4xl">{n === undefined ? "--" : String(n).padStart(2, "0")}</span>
          <span className="text-[11px] uppercase tracking-wider text-white/60">{label}</span>
        </div>
      ))}
    </div>
  );
}
