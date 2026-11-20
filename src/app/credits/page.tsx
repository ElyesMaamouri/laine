import { garments } from "@/lib/garments";

export const metadata = { title: "Crédits photos — Lainé" };

/** Attribution exigée par les licences Creative Commons des photos produits */
export default function Page() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <h1 className="font-display text-4xl">Crédits photos</h1>
      <p className="mt-3 text-sm text-muted">
        Les photos produits proviennent de Wikimedia Commons. Elles ont été détourées et recolorées pour la boutique.
      </p>
      <ul className="mt-8 space-y-3 text-sm">
        {Object.values(garments).map((g) => (
          <li key={g.src} className="rounded-xl border border-line bg-white p-4">
            {g.credit}
          </li>
        ))}
      </ul>
    </div>
  );
}
