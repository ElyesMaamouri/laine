"use client";

import { useEffect, useState } from "react";

/** Découpe une liste en pages ; revient à la page 1 quand la liste change (filtre, recherche) */
export function usePaged<T>(list: T[], perPage: number, resetKey: string = "") {
  const pages = Math.max(1, Math.ceil(list.length / perPage));
  const [page, setPage] = useState(1);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- retour à la page 1 quand le filtre change
    setPage(1);
  }, [resetKey]);
  const current = Math.min(page, pages);
  return { page: current, pages, setPage, items: list.slice((current - 1) * perPage, current * perPage), total: list.length };
}

/** Numéros de page avec « … », précédent / suivant */
export default function Pagination({
  page,
  pages,
  onChange,
  total,
  perPage,
  scrollTo,
}: {
  page: number;
  pages: number;
  onChange: (p: number) => void;
  total?: number;
  perPage?: number;
  /** id d'un élément à remonter à l'écran après changement de page */
  scrollTo?: string;
}) {
  if (pages <= 1) return null;
  const go = (p: number) => {
    onChange(Math.min(pages, Math.max(1, p)));
    if (scrollTo) document.getElementById(scrollTo)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const nums: (number | "…")[] = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 1) nums.push(i);
    else if (nums[nums.length - 1] !== "…") nums.push("…");
  }
  const btn = "grid h-9 min-w-9 place-items-center rounded-lg border px-2 text-sm transition";
  return (
    <nav className="mt-6 flex flex-wrap items-center justify-center gap-1.5" aria-label="Pagination">
      <button type="button" onClick={() => go(page - 1)} disabled={page === 1} className={`${btn} border-line bg-white hover:border-ink disabled:opacity-30`} aria-label="Page précédente">
        ‹
      </button>
      {nums.map((n, i) =>
        n === "…" ? (
          <span key={`e${i}`} className="px-1 text-muted">
            …
          </span>
        ) : (
          <button
            key={n}
            type="button"
            onClick={() => go(n)}
            aria-current={n === page ? "page" : undefined}
            className={`${btn} ${n === page ? "border-ink bg-ink text-paper" : "border-line bg-white hover:border-ink"}`}
          >
            {n}
          </button>
        ),
      )}
      <button type="button" onClick={() => go(page + 1)} disabled={page === pages} className={`${btn} border-line bg-white hover:border-ink disabled:opacity-30`} aria-label="Page suivante">
        ›
      </button>
      {total !== undefined && perPage && (
        <span className="ml-2 text-xs text-muted">
          {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} sur {total}
        </span>
      )}
    </nav>
  );
}
