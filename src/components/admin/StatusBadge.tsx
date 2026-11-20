const colors: Record<string, string> = {
  nouvelle: "bg-clay/15 text-clay",
  "confirmée": "bg-blue-100 text-blue-800",
  "expédiée": "bg-amber-100 text-amber-800",
  "livrée": "bg-green-100 text-green-800",
  "annulée": "bg-neutral-200 text-neutral-600",
};

export default function StatusBadge({ status }: { status: string }) {
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${colors[status] ?? "bg-mist"}`}>{status}</span>;
}
