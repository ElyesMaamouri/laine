import { read } from "@/lib/server/db";

/**
 * Suivi d'une commande sans compte : numéro + e-mail utilisé lors de la commande.
 * Réponse identique si la commande n'existe pas ou si l'e-mail ne correspond pas.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const number = String(body.number ?? "").trim().toUpperCase().slice(0, 20);
  const email = String(body.email ?? "").trim().toLowerCase().slice(0, 120);
  // petite pause : rend les essais en série inutilement lents
  await new Promise((r) => setTimeout(r, 400));
  if (!number || !email) return Response.json({ error: "Indiquez le numéro de commande et l'e-mail." }, { status: 400 });
  const order = await read((d) => d.orders.find((o) => o.number === number && o.customer.email.toLowerCase() === email) ?? null);
  if (!order) return Response.json({ error: "Aucune commande ne correspond à ce numéro et à cet e-mail." }, { status: 404 });
  return Response.json({ order: { ...order, userId: undefined } });
}
