import { read } from "@/lib/server/db";
import { currentUser } from "@/lib/server/auth";

/**
 * Détail d'une commande. L'identifiant est un UUID aléatoire (non devinable),
 * transmis uniquement à la personne qui a passé la commande. Si la commande
 * appartient à un compte, il faut être connecté à ce compte.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return Response.json({ error: "Introuvable" }, { status: 404 });
  const order = await read((d) => d.orders.find((o) => o.id === id) ?? null);
  if (!order) return Response.json({ error: "Introuvable" }, { status: 404 });
  if (order.userId) {
    const user = await currentUser();
    if (user?.id !== order.userId) return Response.json({ error: "Introuvable" }, { status: 404 });
  }
  return Response.json({ order });
}
