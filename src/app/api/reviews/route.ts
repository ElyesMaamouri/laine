import { read, write, type Data, type Review } from "@/lib/server/db";
import { currentUser } from "@/lib/server/auth";

/** Le client a-t-il reçu ce produit ? (commande livrée rattachée à son compte) */
function hasReceived(d: Data, userId: string, productId: string) {
  return d.orders.some((o) => o.userId === userId && o.status === "livrée" && o.items.some((i) => i.productId === productId));
}

/**
 * GET ?productId=… : avis publiés, note moyenne, et si l'utilisateur connecté peut donner son avis.
 */
export async function GET(req: Request) {
  const productId = new URL(req.url).searchParams.get("productId") ?? "";
  const user = await currentUser();
  const res = await read((d) => {
    const published = d.reviews.filter((r) => r.productId === productId && r.status === "publié");
    const mine = user ? d.reviews.find((r) => r.productId === productId && r.userId === user.id) : undefined;
    let canReview = false;
    let reason = "Connectez-vous pour donner votre avis.";
    if (user) {
      if (mine) reason = mine.status === "en attente" ? "Merci ! Votre avis est en cours de validation." : "Vous avez déjà donné votre avis sur ce pull.";
      else if (!hasReceived(d, user.id, productId)) reason = "Les avis sont réservés aux clients qui ont reçu ce pull.";
      else {
        canReview = true;
        reason = "";
      }
    }
    return {
      reviews: published
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map(({ id, author, rating, text, createdAt }) => ({ id, author, rating, text, createdAt })),
      average: published.length ? Math.round((published.reduce((s, r) => s + r.rating, 0) / published.length) * 10) / 10 : 0,
      count: published.length,
      canReview,
      reason,
    };
  });
  return Response.json(res);
}

/** POST : dépôt d'un avis (achat vérifié), mis en attente de validation */
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Connectez-vous pour donner votre avis." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const productId = String(body.productId ?? "");
  const rating = Math.round(Number(body.rating));
  const text = String(body.text ?? "").trim().slice(0, 1000);
  if (!(rating >= 1 && rating <= 5)) return Response.json({ error: "Choisissez une note de 1 à 5 étoiles." }, { status: 400 });
  if (text.length < 10) return Response.json({ error: "Votre avis doit faire au moins 10 caractères." }, { status: 400 });

  const [first, last] = user.name.trim().split(/\s+/);
  const author = `${first}${last ? ` ${last[0].toUpperCase()}.` : ""}`;
  const err = await write((d) => {
    if (!d.catalog.products.some((p) => p.id === productId)) return "Produit introuvable.";
    if (!hasReceived(d, user.id, productId)) return "Les avis sont réservés aux clients qui ont reçu ce pull.";
    if (d.reviews.some((r) => r.productId === productId && r.userId === user.id)) return "Vous avez déjà donné votre avis sur ce pull.";
    const r: Review = { id: crypto.randomUUID(), productId, userId: user.id, author, rating, text, status: "en attente", createdAt: new Date().toISOString() };
    d.reviews.push(r);
    return null;
  });
  if (err) return Response.json({ error: err }, { status: 403 });
  return Response.json({ ok: true });
}
