import { read } from "@/lib/server/db";
import { publicUser, startSession, verifyPassword } from "@/lib/server/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  const user = await read((d) => d.users.find((u) => u.email === email) ?? null);
  // même message dans les deux cas pour ne pas révéler quels e-mails existent
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return Response.json({ error: "E-mail ou mot de passe incorrect." }, { status: 401 });
  }
  await startSession(user.id);
  return Response.json({ user: publicUser(user) });
}
