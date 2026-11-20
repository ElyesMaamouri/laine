"use client";

import { useRef, useState } from "react";

/** Envoie une image à /api/admin/upload et renvoie son URL */
export async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const r = await fetch("/api/admin/upload", { method: "POST", body: fd });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || !d.url) throw new Error(d.error ?? "Échec de l'envoi.");
  return d.url;
}

/**
 * Zone d'upload d'une image : clic ou glisser-déposer, aperçu, bouton « Retirer ».
 * `aspect` = format de l'aperçu (ex : "aspect-[4/5]").
 */
export default function ImageUpload({
  value,
  onChange,
  label = "Image",
  hint,
  aspect = "aspect-[4/5]",
  compact,
}: {
  value?: string;
  onChange: (url: string | undefined) => void;
  label?: string;
  hint?: string;
  aspect?: string;
  compact?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [over, setOver] = useState(false);

  const send = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      onChange(await uploadFile(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l'envoi.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div className="text-sm">
      {!compact && <span className="mb-1.5 block">{label}</span>}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          send(e.dataTransfer.files[0]);
        }}
        className={`relative overflow-hidden rounded-xl border-2 border-dashed transition ${aspect} ${
          over ? "border-ink bg-mist" : "border-line bg-[#faf9f6]"
        }`}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element -- image locale envoyée par l'admin
          <img src={value} alt={label} className="h-full w-full object-cover" />
        ) : (
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="flex h-full w-full flex-col items-center justify-center gap-1 p-2 text-center text-muted hover:text-ink"
          >
            <span className="text-2xl" aria-hidden>
              ⇪
            </span>
            {!compact && <span>Cliquer ou glisser une image</span>}
            {!compact && <span className="text-[11px]">JPG, PNG, WebP · 5 Mo max</span>}
          </button>
        )}
        {busy && <div className="absolute inset-0 grid place-items-center bg-white/70 text-xs">Envoi…</div>}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => send(e.target.files?.[0])}
        aria-label={label}
      />
      {value && (
        <div className="mt-1.5 flex gap-3 text-xs">
          <button type="button" onClick={() => input.current?.click()} className="underline underline-offset-2">
            Changer
          </button>
          <button type="button" onClick={() => onChange(undefined)} className="text-clay underline underline-offset-2">
            Retirer
          </button>
        </div>
      )}
      {hint && !compact && <p className="mt-1 text-xs text-muted">{hint}</p>}
      {error && <p className="mt-1 text-xs text-clay">{error}</p>}
    </div>
  );
}
