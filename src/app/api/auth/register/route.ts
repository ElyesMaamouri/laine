import { write } from "@/lib/server/db";
import { hashPassword, publicUser, startSession } from "@/lib/server/auth";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim().slice(0, 80);
  const email = String(body.email ?? "").trim().toLowerCase().slice(0, 120);
  const password = String(body.password ?? "");

  const errors: Record<string, string> = {};
  if (name.length < 2) errors.name = "Indiquez votre nom.";
  if (!EMAIL.test(email)) errors.email = "Adresse e-mail invalide.";
  if (password.length < 8) errors.password = "8 caractères minimum.";
  if (Object.keys(errors).length) return Response.json({ errors }, { status: 400 });

  const passwordHash = await hashPassword(password);
  const user = await write((d) => {
    if (d.users.some((u) => u.email === email)) return null;
    const u = { id: crypto.randomUUID(), name, email, passwordHash, createdAt: new Date().toISOString() };
    d.users.push(u);
    return u;
  });
  if (!user) return Response.json({ errors: { email: "Un compte existe déjà avec cet e-mail." } }, { status: 409 });

  await startSession(user.id);
  return Response.json({ user: publicUser(user) });
}
