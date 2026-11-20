import { isAdmin } from "@/lib/server/auth";
import { cloudinaryMissing, detectImage, hasCloudinary, MAX_UPLOAD, onReadOnlyHost, saveUpload } from "@/lib/server/uploads";

/** Upload d'une image (admin uniquement) : JPG, PNG ou WebP, 4 Mo max */
export async function POST(req: Request) {
  if (!(await isAdmin())) return Response.json({ error: "Session admin expirée, reconnectez-vous." }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Aucun fichier reçu." }, { status: 400 });
  if (file.size > MAX_UPLOAD) return Response.json({ error: "Image trop lourde (4 Mo maximum)." }, { status: 413 });

  const buf = Buffer.from(await file.arrayBuffer());
  const ext = detectImage(buf);
  if (!ext) return Response.json({ error: "Format non pris en charge (JPG, PNG ou WebP)." }, { status: 415 });

  // en ligne sans Cloudinary : on le dit clairement plutôt que d'échouer sur le disque
  if (onReadOnlyHost() && !hasCloudinary()) {
    return Response.json(
      { error: `Cloudinary non configuré sur Vercel. Variable(s) manquante(s) : ${cloudinaryMissing().join(", ")}. Ajoutez-les puis redéployez.` },
      { status: 503 },
    );
  }

  try {
    return Response.json({ url: await saveUpload(buf, ext) });
  } catch (e) {
    console.warn("[upload]", e);
    const detail = e instanceof Error ? e.message : String(e);
    // message réservé à l'admin connecté : la cause exacte aide à corriger la configuration
    return Response.json({ error: `Échec de l'enregistrement de l'image — ${detail.slice(0, 200)}` }, { status: 502 });
  }
}
