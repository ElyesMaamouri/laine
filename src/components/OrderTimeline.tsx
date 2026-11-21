/** Frise des étapes d'une commande, avec la date de chaque étape atteinte */
type Status = "nouvelle" | "confirmée" | "expédiée" | "livrée" | "annulée";

const STEPS: { status: Exclude<Status, "annulée">; label: string; hint: string }[] = [
  { status: "nouvelle", label: "Commande reçue", hint: "Nous allons vous appeler pour confirmer." },
  { status: "confirmée", label: "Confirmée", hint: "Votre commande est en préparation." },
  { status: "expédiée", label: "Expédiée", hint: "Votre colis est en route." },
  { status: "livrée", label: "Livrée", hint: "Bonne mise en maille !" },
];

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });

export default function OrderTimeline({
  status,
  createdAt,
  history,
  compact,
}: {
  status: Status;
  createdAt: string;
  history?: { status: Status; at: string }[];
  compact?: boolean;
}) {
  if (status === "annulée") {
    const at = history?.findLast((h) => h.status === "annulée")?.at;
    return (
      <p className="rounded-xl bg-neutral-100 px-4 py-3 text-sm">
        <strong>Commande annulée</strong>
        {at && <span className="text-muted"> · {fmt(at)}</span>}
      </p>
    );
  }
  const current = STEPS.findIndex((s) => s.status === status);
  // date de chaque étape : historique, sinon la date de commande pour la première
  const dateOf = (s: Status) => history?.findLast((h) => h.status === s)?.at ?? (s === "nouvelle" ? createdAt : undefined);

  return (
    <ol className={`grid ${compact ? "grid-cols-4 gap-1" : "gap-0 sm:grid-cols-4"}`} aria-label="Suivi de la commande">
      {STEPS.map((s, i) => {
        const done = i <= current;
        const at = done ? dateOf(s.status) : undefined;
        return (
          <li key={s.status} className={`relative flex ${compact ? "flex-col items-center text-center" : "gap-3 pb-6 sm:flex-col sm:items-center sm:pb-0 sm:text-center"}`}>
            {/* trait de liaison */}
            {i < STEPS.length - 1 && (
              <span
                aria-hidden
                className={`absolute ${compact ? "left-1/2 top-3 h-0.5 w-full" : "left-3 top-7 h-full w-0.5 sm:left-1/2 sm:top-3 sm:h-0.5 sm:w-full"} ${i < current ? "bg-ink" : "bg-line"}`}
              />
            )}
            <span
              className={`relative z-10 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs ${
                done ? "bg-ink text-paper" : "border-2 border-line bg-white text-muted"
              } ${i === current ? "ring-4 ring-clay/25" : ""}`}
            >
              {done ? "✓" : i + 1}
            </span>
            <span className={compact ? "mt-1.5" : "sm:mt-2"}>
              <span className={`block ${compact ? "text-[11px]" : "text-sm font-medium"} ${done ? "" : "text-muted"}`}>{s.label}</span>
              {!compact && at && <span className="block text-xs text-muted">{fmt(at)}</span>}
              {!compact && i === current && <span className="mt-0.5 block text-xs text-muted">{s.hint}</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
