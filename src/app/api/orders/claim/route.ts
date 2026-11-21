import { write } from "@/lib/server/db";
import { currentUser } from "@/lib/server/auth";

/**
 * Rattache à son compte une commande passée sans compte.
 * Preuve demandée : numéro de commande + téléphone, et l'e-mail de la commande doit être celui du compte
 * (les e-mails ne sont pas vérifiés à l'inscription : l'e-mail seul ne suffit pas).
 */
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Connectez-vous d'abord." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const number = String(body.number ?? "").trim().toUpperCase().slice(0, 20);
  const phone = String(body.phone ?? "").replace(/\D/g, "").slice(-9);
  await new Promise((r) => setTimeout(r, 400));
  if (!number || phone.length < 8) return Response.json({ error: "Indiquez le numéro de commande et votre téléphone." }, { status: 400 });

  const res = await write((d) => {
    const o = d.orders.find((x) => x.number === number);
    const same = o && o.customer.email.toLowerCase() === user.email && o.customer.phone.replace(/\D/g, "").slice(-9) === phone;
    if (!o || !same) return "Aucune commande ne correspond (numéro, téléphone et e-mail du compte doivent correspondre).";
    if (o.userId && o.userId !== user.id) return "Cette commande est déjà rattachée à un autre compte.";
    o.userId = user.id;
    return null;
  });
  if (res) return Response.json({ error: res }, { status: 404 });
  return Response.json({ ok: true });
}
