"use client";

/**
 * Graphiques du tableau de bord (SVG, sans dépendance).
 * Une seule série par graphique : couleur de marque (validée ≥ 3:1 sur fond blanc),
 * barres fines à bout arrondi, grille discrète, info-bulle au survol, tableau accessible.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import type { Order, OrderStatus } from "@/lib/server/db";
import { formatPrice } from "@/lib/products";

const SERIES = "#b4532a"; // terracotta de la marque
const GRID = "#ece8e1";
const AXIS_TEXT = "#6f6a62";

/** Largeur réelle du conteneur (pour un SVG net à toutes les tailles) */
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(600);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(260, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, w };
}

const parisDay = (iso: string | Date) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
const euroShort = (n: number) => (n >= 1000 ? `${(n / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} k€` : `${Math.round(n)} €`);

/** Graduations « rondes » de l'axe vertical */
function niceTicks(max: number, count = 4) {
  if (max <= 0) return [0];
  const raw = max / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const top = Math.ceil(max / step) * step;
  return Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
}

/* ------------------------------------------------------------------ */
/* Chiffre d'affaires par jour                                         */
/* ------------------------------------------------------------------ */

export function RevenueChart({ orders }: { orders: Order[] }) {
  const [range, setRange] = useState<7 | 30 | 90>(30);
  const [hover, setHover] = useState<number | null>(null);
  const { ref, w } = useWidth<HTMLDivElement>();

  const days = useMemo(() => {
    const valid = orders.filter((o) => o.status !== "annulée");
    const byDay = new Map<string, { total: number; count: number }>();
    for (const o of valid) {
      const k = parisDay(o.createdAt);
      const cur = byDay.get(k) ?? { total: 0, count: 0 };
      byDay.set(k, { total: cur.total + o.total, count: cur.count + 1 });
    }
    const out: { day: string; total: number; count: number }[] = [];
    const today = new Date();
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const k = parisDay(d);
      out.push({ day: k, ...(byDay.get(k) ?? { total: 0, count: 0 }) });
    }
    return out;
  }, [orders, range]);

  const total = days.reduce((s, d) => s + d.total, 0);
  const count = days.reduce((s, d) => s + d.count, 0);
  const H = 220;
  const pad = { l: 44, r: 8, t: 12, b: 26 };
  const ticks = niceTicks(Math.max(...days.map((d) => d.total), 1));
  const yMax = ticks[ticks.length - 1] || 1;
  const innerW = w - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const slot = innerW / days.length;
  const gap = 2; // espace de 2px entre barres
  const barW = Math.max(2, Math.min(28, slot - gap));
  const y = (v: number) => pad.t + innerH - (v / yMax) * innerH;
  const labelEvery = range === 7 ? 1 : range === 30 ? 5 : 15;
  const dLabel = (k: string, opts: Intl.DateTimeFormatOptions) => new Date(`${k}T12:00:00`).toLocaleDateString("fr-FR", opts);
  const h = hover !== null ? days[hover] : null;

  return (
    <figure className="rounded-2xl border border-line bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <figcaption>
          <p className="font-medium">Chiffre d&apos;affaires par jour</p>
          <p className="text-xs text-muted">Hors commandes annulées · heure de Paris</p>
        </figcaption>
        <div className="flex rounded-full border border-line p-0.5 text-xs" role="group" aria-label="Période">
          {([7, 30, 90] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              aria-pressed={range === r}
              className={`rounded-full px-3 py-1 ${range === r ? "bg-ink text-paper" : "text-muted hover:text-ink"}`}
            >
              {r} j
            </button>
          ))}
        </div>
      </div>
      <p className="mt-3 font-display text-3xl">{formatPrice(total)}</p>
      <p className="text-xs text-muted">
        {count} commande{count > 1 ? "s" : ""} sur {range} jours
      </p>

      <div ref={ref} className="relative mt-4" onMouseLeave={() => setHover(null)}>
        <svg width={w} height={H} role="img" aria-label={`Chiffre d'affaires par jour sur ${range} jours, total ${formatPrice(total)}`}>
          {/* grille et axe vertical */}
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.l} x2={w - pad.r} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
              <text x={pad.l - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize={11} fill={AXIS_TEXT}>
                {euroShort(t)}
              </text>
            </g>
          ))}
          {/* barres : bout arrondi de 4px, ancrées sur la ligne de base */}
          {days.map((d, i) => {
            const x = pad.l + i * slot + (slot - barW) / 2;
            const top = y(d.total);
            const hgt = pad.t + innerH - top;
            const r = Math.min(4, barW / 2, hgt);
            return (
              <g key={d.day}>
                {d.total > 0 && (
                  <path
                    d={`M${x},${pad.t + innerH} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${pad.t + innerH} Z`}
                    fill={SERIES}
                    opacity={hover === null || hover === i ? 1 : 0.45}
                  />
                )}
                {/* zone de survol plus large que la barre */}
                <rect x={pad.l + i * slot} y={pad.t} width={slot} height={innerH} fill="transparent" onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} tabIndex={-1} />
                {i % labelEvery === (range === 7 ? 0 : (days.length - 1) % labelEvery) && (
                  <text x={pad.l + i * slot + slot / 2} y={H - 8} textAnchor="middle" fontSize={11} fill={AXIS_TEXT}>
                    {dLabel(d.day, { day: "numeric", month: range === 7 ? "short" : "numeric" })}
                  </text>
                )}
              </g>
            );
          })}
          <line x1={pad.l} x2={w - pad.r} y1={pad.t + innerH} y2={pad.t + innerH} stroke="#cfc9bf" strokeWidth={1} />
        </svg>

        {h && hover !== null && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg border border-line bg-white px-3 py-2 text-xs shadow-lg"
            style={{ left: Math.min(Math.max(pad.l + hover * slot + slot / 2, 70), w - 70), top: Math.max(0, y(h.total) - 64) }}
          >
            <p className="font-medium first-letter:uppercase">{dLabel(h.day, { weekday: "long", day: "numeric", month: "long" })}</p>
            <p className="mt-0.5 flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-sm" style={{ background: SERIES }} />
              {formatPrice(h.total)} · {h.count} commande{h.count > 1 ? "s" : ""}
            </p>
          </div>
        )}
      </div>

      <table className="sr-only">
        <caption>Chiffre d&apos;affaires par jour</caption>
        <thead>
          <tr>
            <th>Jour</th>
            <th>Chiffre d&apos;affaires</th>
            <th>Commandes</th>
          </tr>
        </thead>
        <tbody>
          {days.map((d) => (
            <tr key={d.day}>
              <td>{d.day}</td>
              <td>{formatPrice(d.total)}</td>
              <td>{d.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* Barres horizontales (statuts, meilleurs produits)                    */
/* ------------------------------------------------------------------ */

function HBars({
  title,
  subtitle,
  rows,
  format,
  empty,
}: {
  title: string;
  subtitle?: string;
  rows: { label: string; value: number; hint?: string }[];
  format: (n: number) => string;
  empty: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <figure className="rounded-2xl border border-line bg-white p-5">
      <figcaption>
        <p className="font-medium">{title}</p>
        {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
      </figcaption>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted">{empty}</p>
      ) : (
        <ul className="mt-4 space-y-3" onMouseLeave={() => setHover(null)}>
          {rows.map((r, i) => (
            <li key={r.label} onMouseEnter={() => setHover(i)} className="group relative" title={r.hint}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate">{r.label}</span>
                <span className="shrink-0 tabular-nums text-ink">{format(r.value)}</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-mist">
                <div
                  className="h-2 rounded-full transition-[width,opacity] duration-500"
                  style={{ width: `${Math.max(2, (r.value / max) * 100)}%`, background: SERIES, opacity: hover === null || hover === i ? 1 : 0.45 }}
                />
              </div>
              {r.hint && hover === i && <p className="mt-1 text-xs text-muted">{r.hint}</p>}
            </li>
          ))}
        </ul>
      )}
      <table className="sr-only">
        <caption>{title}</caption>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label}>
              <th>{r.label}</th>
              <td>{format(r.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

const STATUS_ORDER: OrderStatus[] = ["nouvelle", "confirmée", "expédiée", "livrée", "annulée"];

export function StatusChart({ orders }: { orders: Order[] }) {
  const rows = STATUS_ORDER.map((s) => {
    const list = orders.filter((o) => o.status === s);
    return { label: s.charAt(0).toUpperCase() + s.slice(1), value: list.length, hint: formatPrice(list.reduce((t, o) => t + o.total, 0)) };
  });
  return (
    <HBars
      title="Commandes par statut"
      subtitle={`${orders.length} commande${orders.length > 1 ? "s" : ""} au total`}
      rows={rows}
      format={(n) => String(n)}
      empty="Aucune commande pour l'instant."
    />
  );
}

export function TopProductsChart({ orders }: { orders: Order[] }) {
  const map = new Map<string, { label: string; value: number; qty: number }>();
  for (const o of orders) {
    if (o.status === "annulée") continue;
    for (const i of o.items) {
      const cur = map.get(i.productId) ?? { label: i.name, value: 0, qty: 0 };
      map.set(i.productId, { label: cur.label, value: cur.value + i.lineTotal, qty: cur.qty + i.qty });
    }
  }
  const rows = [...map.values()]
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
    .map((r) => ({ label: r.label, value: r.value, hint: `${r.qty} article${r.qty > 1 ? "s" : ""} vendu${r.qty > 1 ? "s" : ""}` }));
  return <HBars title="Meilleures ventes" subtitle="Top 5 produits par chiffre d'affaires" rows={rows} format={formatPrice} empty="Pas encore de ventes." />;
}
