import { isAdmin } from "@/lib/server/auth";
import { detectImage, MAX_UPLOAD, saveUpload } from "@/lib/server/uploads";

/** Upload d'une image (admin uniquement) : JPG, PNG ou WebP, 5 Mo max */
export async function POST(req: Request) {
  if (!(await isAdmin())) return Response.json({ error: "Session admin expirée, reconnectez-vous." }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Aucun fichier reçu." }, { status: 400 });
  if (file.size > MAX_UPLOAD) return Response.json({ error: "Image trop lourde (5 Mo maximum)." }, { status: 413 });

  const buf = Buffer.from(await file.arrayBuffer());
  const ext = detectImage(buf);
  if (!ext) return Response.json({ error: "Format non pris en charge (JPG, PNG ou WebP)." }, { status: 415 });

  return Response.json({ url: await saveUpload(buf, ext) });
}
