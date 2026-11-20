import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Admin — Lainé",
  robots: { index: false, follow: false },
};

/**
 * L'admin est rendu côté navigateur (session, adresse de la page) :
 * Suspense permet à Next de ne pas bloquer le pré-rendu.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <p data-admin-root className="p-10 text-center text-sm text-muted">
          Chargement…
        </p>
      }
    >
      {children}
    </Suspense>
  );
}
