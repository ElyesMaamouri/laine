import { read, write, type Order } from "@/lib/server/db";
import { currentUser } from "@/lib/server/auth";
import { priceLines, type LineInput } from "@/lib/pricing";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^[+\d][\d\s.-]{7,18}$/;

/** Passe une commande (panier ou commande express). Paiement à la livraison. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const c = body.customer ?? {};
  const str = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
  const customer = {
    name: str(c.name, 80),
    email: str(c.email, 120).toLowerCase(),
    phone: str(c.phone, 24),
    address: str(c.address, 200),
    city: str(c.city, 80),
    zip: str(c.zip, 12),
    note: str(c.note, 300) || undefined,
  };

  const errors: Record<string, string> = {};
  if (customer.name.length < 2) errors.name = "Indiquez votre nom complet.";
  if (!EMAIL.test(customer.email)) errors.email = "Adresse e-mail invalide.";
  if (!PHONE.test(customer.phone)) errors.phone = "Numéro de téléphone invalide.";
  if (customer.address.length < 5) errors.address = "Indiquez votre adresse.";
  if (customer.city.length < 2) errors.city = "Indiquez votre ville.";
  if (!/^[\w -]{3,10}$/.test(customer.zip)) errors.zip = "Code postal invalide.";

  const lines: LineInput[] = Array.isArray(body.items)
    ? body.items.slice(0, 50).map((i: Record<string, unknown>) => ({
        productId: String(i.productId ?? ""),
        variantId: String(i.variantId ?? ""),
        size: String(i.size ?? ""),
        qty: Number(i.qty ?? 1) || 1,
      }))
    : [];
  const catalogProducts = await read((d) => d.catalog.products);
  const priced = priceLines(lines, catalogProducts);
  if (priced.items.length === 0) errors.items = "Votre commande est vide.";
  if (Object.keys(errors).length) return Response.json({ errors }, { status: 400 });

  const user = await currentUser();
  const order = await write((d) => {
    const o: Order = {
      id: crypto.randomUUID(),
      number: `MA-${String(d.orders.length + 1001)}`,
      userId: user?.id ?? null,
      customer,
      ...priced,
      payment: "cod",
      status: "nouvelle",
      source: body.source === "express" ? "express" : "checkout",
      createdAt: new Date().toISOString(),
    };
    d.orders.push(o);
    return o;
  });
  return Response.json({ id: order.id, number: order.number });
}

/** Commandes de l'utilisateur connecté */
export async function GET() {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Non connecté" }, { status: 401 });
  const orders = await read((d) => d.orders.filter((o) => o.userId === user.id).reverse());
  return Response.json({ orders });
}
