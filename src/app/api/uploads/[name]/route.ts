import { readUpload } from "@/lib/server/uploads";

/** Sert une image envoyée depuis l'admin (nom aléatoire, contenu jamais modifié) */
export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const file = await readUpload(name);
  if (!file) return new Response("Introuvable", { status: 404 });
  return new Response(new Uint8Array(file.buf), {
    headers: {
      "Content-Type": file.type,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
