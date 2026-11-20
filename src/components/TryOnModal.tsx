"use client";

import { useEffect, useRef, useState } from "react";
import type { PoseLandmarker } from "@mediapipe/tasks-vision";
import type { Product } from "@/lib/products";
import { dist, lerp, type Body, type P } from "@/lib/sweater";
import { garments } from "@/lib/garments";
import { drawGarment, drawProductPhoto, loadImage, tinted } from "@/lib/warp";
import { CloseIcon, DownloadIcon, ShutterIcon, SparkIcon } from "./Icons";

const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

const CAM_KEY = "maille-camera";
/** Webcams virtuelles qui affichent souvent une image d'attente au lieu de la personne */
const VIRTUAL_CAM =
  /virtual|droidcam|iriun|camo\b|epoccam|obs|ndi|snap camera|xsplit|manycam|ivcam|mmhmm|broadcast|phone|e2esoft|splitcam/i;

function saveCam(id: string | null) {
  try {
    if (id) localStorage.setItem(CAM_KEY, id);
    else localStorage.removeItem(CAM_KEY);
  } catch {}
}

type Phase ="loading" | "live" | "denied" | "busy" | "nocam" | "insecure" | "error";
type Detector = "loading" | "ready" | "error";
type AiState =
  | { state: "idle" }
  | { state: "running"; step: string }
  | { state: "done"; image: string }
  | { state: "error"; message: string };

type Lm = { x: number; y: number; visibility?: number };

/** Convertit les points MediaPipe (image miroir) en squelette utilisable par le dessin */
function toBody(pose: Lm[], W: number, H: number): { body: Body; ok: boolean; hint: string } {
  const L = (i: number) => ({ x: (1 - pose[i].x) * W, y: pose[i].y * H, v: pose[i].visibility ?? 1 });
  const nose = L(0);
  let s = [L(11), L(13), L(15), L(23)];
  let t = [L(12), L(14), L(16), L(24)];
  if (s[0].x > t[0].x) [s, t] = [t, s];

  const sw = dist(s[0], t[0]);
  const side = { x: (t[0].x - s[0].x) / (sw || 1), y: (t[0].y - s[0].y) / (sw || 1) };
  const down = { x: -side.y, y: side.x };
  const at = (o: P, a: number, d: number): P => ({ x: o.x + side.x * a + down.x * d, y: o.y + side.y * a + down.y * d });

  const fix = (arr: typeof s, sign: number) => {
    const [sh, el0, wr0, hip0] = arr;
    const el = el0.v > 0.5 ? el0 : at(sh, sign * 0.15 * sw, 0.78 * sw);
    const wr = wr0.v > 0.5 && el0.v > 0.5 ? wr0 : { x: el.x + down.x * 0.68 * sw, y: el.y + down.y * 0.68 * sw };
    const hip = hip0.v > 0.6 ? hip0 : at(sh, -sign * 0.05 * sw, 1.32 * sw);
    return { sh: { x: sh.x, y: sh.y }, el: { x: el.x, y: el.y }, wr: { x: wr.x, y: wr.y }, hip: { x: hip.x, y: hip.y } };
  };

  const shouldersSeen = s[0].v > 0.6 && t[0].v > 0.6;
  const inFrame = [s[0], t[0]].every((p) => p.x > W * 0.02 && p.x < W * 0.98 && p.y < H * 0.96 && p.y > 0);
  const ratio = sw / W;
  let hint = "";
  if (!shouldersSeen || !inFrame) hint = "Reculez un peu : vos épaules doivent être visibles";
  else if (ratio > 0.72) hint = "Trop près — reculez d'un pas";
  else if (ratio < 0.1) hint = "Approchez-vous un peu";
  else if (nose.v < 0.5) hint = "Placez votre visage dans le cadre";

  // menton estimé à partir du nez et de la bouche (le col ne doit jamais couvrir le visage)
  const m1 = L(9);
  const m2 = L(10);
  let chin: P | undefined;
  if (nose.v > 0.5 && m1.v > 0.5 && m2.v > 0.5) {
    const m = { x: (m1.x + m2.x) / 2, y: (m1.y + m2.y) / 2 };
    chin = { x: m.x + (m.x - nose.x) * 1.5, y: m.y + (m.y - nose.y) * 1.5 };
  }

  return { body: { a: fix(s, -1), b: fix(t, 1), chin }, ok: hint === "", hint };
}

function smooth(prev: Body | null, next: Body, k = 0.5): Body {
  if (!prev) return next;
  const sd = (p: Body["a"], n: Body["a"]) => ({
    sh: lerp(p.sh, n.sh, k),
    el: lerp(p.el, n.el, k),
    wr: lerp(p.wr, n.wr, k),
    hip: lerp(p.hip, n.hip, k),
  });
  const chin = next.chin && prev.chin ? lerp(prev.chin, next.chin, k) : next.chin;
  return { a: sd(prev.a, next.a), b: sd(prev.b, next.b), chin };
}

export default function TryOnModal({
  product,
  variantId,
  onVariant,
  onClose,
}: {
  product: Product;
  variantId: string;
  onVariant: (id: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  /** photo du pull recolorée pour la variante en cours */
  const garmentRef = useRef<HTMLCanvasElement | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [detector, setDetector] = useState<Detector>("loading");
  const [errorDetail, setErrorDetail] = useState("");
  const [hint, setHint] = useState("Démarrage de la caméra…");
  const [tracking, setTracking] = useState(false);
  const [ai, setAi] = useState<AiState>({ state: "idle" });
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentLabel, setCurrentLabel] = useState("");
  const [deviceId, setDeviceId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(CAM_KEY);
    } catch {
      return null;
    }
  });

  const v = product.variants.find((x) => x.id === variantId) ?? product.variants[0];
  const { tint, filter } = v;

  useEffect(() => {
    let alive = true;
    loadImage(garments[product.garment].src).then((img) => {
      if (alive) garmentRef.current = tinted(img, { tint, filter });
    });
    return () => {
      alive = false;
    };
  }, [product.garment, tint, filter]);

  // Échap pour fermer
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Caméra + détection du corps + boucle de rendu
  useEffect(() => {
    let cancelled = false;
    let raf = 0;
    let stream: MediaStream | null = null;
    let landmarker: PoseLandmarker | null = null;
    let body: Body | null = null;
    let okFrames = 0;
    let lostFrames = 0;
    let alpha = 0;
    let lastTime = -1;
    let lastHint = "";
    let lastTracking = false;

    const start = async () => {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        setPhase("insecure");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: deviceId
            ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
            : { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
      } catch (e) {
        if (cancelled) return;
        const name = e instanceof DOMException ? e.name : "";
        // caméra mémorisée débranchée : on repasse en automatique
        if (deviceId && (name === "OverconstrainedError" || name === "NotFoundError")) {
          saveCam(null);
          setDeviceId(null);
          return;
        }
        console.warn("[essayage] getUserMedia", e);
        setErrorDetail(e instanceof Error ? `${e.name}: ${e.message}` : String(e));
        if (name === "NotAllowedError" || name === "SecurityError") setPhase("denied");
        else if (name === "NotReadableError" || name === "AbortError") setPhase("busy");
        else if (name === "NotFoundError" || name === "OverconstrainedError") setPhase("nocam");
        else setPhase("error");
        return;
      }
      if (cancelled) return stream.getTracks().forEach((t) => t.stop());

      // liste des caméras (les noms ne sont disponibles qu'après autorisation)
      const cams = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === "videoinput");
      if (cancelled) return stream.getTracks().forEach((t) => t.stop());
      setDevices(cams);
      const label = stream.getVideoTracks()[0]?.label ?? "";
      setCurrentLabel(label);
      // caméra virtuelle choisie par défaut (DroidCam, Iriun, OBS…) : on prend une vraie webcam si possible
      if (!deviceId && VIRTUAL_CAM.test(label)) {
        const real = cams.find((d) => d.deviceId && !VIRTUAL_CAM.test(d.label));
        if (real) {
          setDeviceId(real.deviceId);
          return; // l'effet redémarre avec la bonne caméra
        }
      }

      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play().catch((e) => console.warn("[essayage] video.play", e));
      // la caméra s'affiche tout de suite, la détection se charge ensuite
      setPhase("live");
      setHint("Chargement de la détection du corps…");
      loop();

      try {
        const { FilesetResolver, PoseLandmarker } = await import("@mediapipe/tasks-vision");
        const fileset = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
        const opts = (delegate: "GPU" | "CPU") => ({
          baseOptions: { modelAssetPath: MODEL_URL, delegate },
          runningMode: "VIDEO" as const,
          numPoses: 1,
        });
        try {
          landmarker = await PoseLandmarker.createFromOptions(fileset, opts("GPU"));
        } catch {
          landmarker = await PoseLandmarker.createFromOptions(fileset, opts("CPU"));
        }
      } catch (e) {
        console.warn("[essayage] MediaPipe", e);
        if (!cancelled) {
          setDetector("error");
          setHint("");
        }
        return;
      }
      if (cancelled) return landmarker.close();
      setDetector("ready");
      setHint("Placez-vous face à la caméra");
    };

    const loop = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;
      if (video.readyState >= 2 && video.videoWidth) {
        if (canvas.width !== video.videoWidth) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }
        const W = canvas.width;
        const H = canvas.height;
        // la vidéo est affichée directement ; le canvas transparent ne porte que le pull
        const ctx = canvas.getContext("2d")!;
        ctx.clearRect(0, 0, W, H);

        if (landmarker && video.currentTime !== lastTime) {
          lastTime = video.currentTime;
          const res = landmarker.detectForVideo(video, performance.now());
          const pose = res.landmarks?.[0];
          if (pose) {
            const r = toBody(pose, W, H);
            if (r.ok) {
              okFrames++;
              lostFrames = 0;
              body = smooth(body, r.body, 0.55);
            } else {
              okFrames = 0;
              lostFrames++;
            }
            if (r.hint !== lastHint) {
              lastHint = r.hint;
              setHint(r.hint);
            }
          } else {
            okFrames = 0;
            lostFrames++;
            if (lastHint !== "none") {
              lastHint = "none";
              setHint("Placez-vous face à la caméra");
            }
          }
        }

        const show = okFrames > 4 || (body !== null && lostFrames < 8 && alpha > 0);
        alpha = Math.max(0, Math.min(1, alpha + (show ? 0.12 : -0.15)));
        if (lostFrames > 30) body = null;
        const isTracking = alpha > 0.5;
        if (isTracking !== lastTracking) {
          lastTracking = isTracking;
          setTracking(isTracking);
        }
        if (body && alpha > 0 && garmentRef.current) {
          ctx.globalAlpha = alpha;
          drawGarment(ctx, body, product.garment, garmentRef.current, 1.42);
          ctx.globalAlpha = 1;
        }
      }
      raf = requestAnimationFrame(loop);
    };

    start();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      landmarker?.close();
    };
  }, [deviceId, product.garment]);

  const chooseCam = (id: string) => {
    saveCam(id);
    setPhase("loading");
    setDetector("loading");
    setTracking(false);
    setHint("Démarrage de la caméra…");
    setDeviceId(id);
  };

  const snapshot = () => {
    const c = canvasRef.current;
    const video = videoRef.current;
    if (!c || !video?.videoWidth) return;
    const out = document.createElement("canvas");
    out.width = c.width;
    out.height = c.height;
    const o = out.getContext("2d")!;
    o.save();
    o.translate(out.width, 0);
    o.scale(-1, 1);
    o.drawImage(video, 0, 0, out.width, out.height);
    o.restore();
    o.drawImage(c, 0, 0);
    const a = document.createElement("a");
    a.href = out.toDataURL("image/jpeg", 0.92);
    a.download = `essayage-${product.id}-${v.id}.jpg`;
    a.click();
  };

  /** Envoie une capture (sans le pull dessiné) + l'image du pull à l'API d'essayage IA */
  const runAi = async () => {
    const video = videoRef.current;
    if (!video?.videoWidth) return;
    setAi({ state: "running", step: "Capture de la photo…" });

    const max = 1024;
    const k = Math.min(1, max / Math.max(video.videoWidth, video.videoHeight));
    const cap = document.createElement("canvas");
    cap.width = Math.round(video.videoWidth * k);
    cap.height = Math.round(video.videoHeight * k);
    const cctx = cap.getContext("2d")!;
    cctx.translate(cap.width, 0);
    cctx.scale(-1, 1);
    cctx.drawImage(video, 0, 0, cap.width, cap.height);
    const modelImage = cap.toDataURL("image/jpeg", 0.9);

    // vraie photo du pull (dans la couleur choisie) sur fond blanc
    const g = document.createElement("canvas");
    g.width = 768;
    g.height = 1024;
    // la vraie photo du coloris (envoyée dans l'admin) donne un meilleur rendu IA que la photo recolorée
    const photo = v.photo ? await loadImage(v.photo) : tinted(await loadImage(garments[product.garment].src), { tint, filter });
    drawProductPhoto(g.getContext("2d")!, 768, 1024, photo, "#ffffff", 0.06);
    const garmentImage = g.toDataURL("image/jpeg", 0.92);

    try {
      setAi({ state: "running", step: "Envoi à l'IA…" });
      const r = await fetch("/api/tryon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelImage, garmentImage, description: garments[product.garment].description }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message ?? "Erreur de l'API");

      // le service gratuit peut avoir une file d'attente : on patiente jusqu'à ~4 min
      for (let i = 0; i < 120; i++) {
        setAi({ state: "running", step: "L'IA habille votre photo…" });
        await new Promise((res) => setTimeout(res, 2000));
        const s = await (await fetch(`/api/tryon/${data.id}`)).json();
        if (s.status === "completed" && s.output) return setAi({ state: "done", image: s.output });
        if (s.status === "failed" || s.error) throw new Error(s.error ?? "La génération a échoué");
      }
      throw new Error("Délai dépassé, réessayez.");
    } catch (e) {
      setAi({ state: "error", message: e instanceof Error ? e.message : "Erreur inconnue" });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-0 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-label="Essayage virtuel">
      <div className="flex h-full w-full max-w-3xl flex-col overflow-hidden bg-[#111] text-white shadow-2xl sm:h-auto sm:rounded-2xl">
        {/* barre de titre */}
        <div className="flex items-center justify-between bg-gradient-to-b from-[#f4f4f4] to-[#dcdcdc] px-4 py-2 text-ink">
          <span className="w-8" />
          <p className="text-sm tracking-wide">
            Try-On <span className="text-clay">✦</span> Lainé
          </p>
          <button onClick={onClose} aria-label="Fermer l'essayage" className="rounded-full p-1.5 hover:bg-black/10">
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        {/* scène caméra */}
        <div className="relative aspect-[4/3] w-full flex-1 bg-black sm:flex-none">
          <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 h-full w-full -scale-x-100 object-cover" />
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full object-cover" />

          {phase === "live" && (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded bg-black/60 px-2 py-1 text-[11px]">
              <span className={`h-1.5 w-1.5 rounded-full ${tracking ? "bg-red-500" : "bg-white/50"}`} /> LIVE
            </span>
          )}

          {/* silhouette « Reculez » comme dans l'exemple */}
          {(phase === "loading" || (phase === "live" && !tracking && detector !== "error")) && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-black/30">
              <svg viewBox="0 0 200 220" className="h-3/4 opacity-90" fill="none" stroke="white" strokeWidth="1.5" aria-hidden>
                <path d="M100 18c-19 0-33 15-33 34 0 15 8 27 19 32v10c-30 4-62 16-72 44-4 12-6 40-6 82h184c0-42-2-70-6-82-10-28-42-40-72-44V84c11-5 19-17 19-32 0-19-14-34-33-34Z" />
              </svg>
              <p className="absolute bottom-6 px-6 text-center text-sm font-medium">{hint}</p>
            </div>
          )}

          {phase === "denied" && (
            <Overlay title="Accès à la caméra refusé" detail={errorDetail}>
              Cliquez sur l&apos;icône à gauche de l&apos;adresse, mettez « Caméra » sur Autoriser, puis rechargez la page (F5).
            </Overlay>
          )}
          {phase === "busy" && (
            <Overlay title="Caméra déjà utilisée" detail={errorDetail}>
              Fermez les autres onglets ou applications qui utilisent la caméra (Zoom, Teams, Meet, autre onglet…), puis réessayez.
            </Overlay>
          )}
          {phase === "nocam" && (
            <Overlay title="Aucune caméra trouvée" detail={errorDetail}>
              Branchez ou activez une webcam, puis réessayez.
            </Overlay>
          )}
          {phase === "insecure" && (
            <Overlay title="Connexion non sécurisée">
              La caméra ne fonctionne qu&apos;en HTTPS ou sur http://localhost. Ouvrez le site via http://localhost:3100.
            </Overlay>
          )}
          {phase === "error" && (
            <Overlay title="Impossible d'ouvrir la caméra" detail={errorDetail}>
              Réessayez dans Chrome ou Edge, à jour.
            </Overlay>
          )}
          {phase === "live" && VIRTUAL_CAM.test(currentLabel) && (
            <p className="absolute inset-x-4 top-10 mx-auto w-fit max-w-md rounded bg-clay/90 px-3 py-1.5 text-center text-xs">
              Caméra virtuelle détectée ({currentLabel}). Choisissez votre vraie webcam dans le menu « Caméra » en bas.
            </p>
          )}
          {phase === "live" && detector === "error" && (
            <p className="absolute inset-x-0 top-3 mx-auto w-fit rounded bg-black/70 px-3 py-1.5 text-xs">
              Détection du corps indisponible (connexion ?) — rechargez la page
            </p>
          )}

          {/* résultat IA */}
          {ai.state !== "idle" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              {ai.state === "running" && (
                <div className="text-center">
                  <div className="relative mx-auto mb-4 h-24 w-20 overflow-hidden rounded border border-white/30">
                    <div className="animate-scan absolute inset-x-0 h-full bg-gradient-to-b from-transparent via-white/40 to-transparent" />
                  </div>
                  <p className="text-sm">{ai.step}</p>
                  <p className="mt-1 text-xs text-white/60">De 30 secondes à 2 minutes (service gratuit)</p>
                </div>
              )}
              {ai.state === "error" && (
                <div className="max-w-sm px-6 text-center">
                  <p className="font-medium">Rendu IA indisponible</p>
                  <p className="mt-2 text-sm text-white/70">{ai.message}</p>
                  <button onClick={() => setAi({ state: "idle" })} className="mt-5 rounded-full bg-white px-5 py-2 text-sm text-ink">
                    Retour au live
                  </button>
                </div>
              )}
              {ai.state === "done" && (
                <div className="relative h-full w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element -- image distante générée par l'API */}
                  <img src={ai.image} alt={`Vous portant le ${product.name}`} className="h-full w-full object-contain" />
                  <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                    <a href={ai.image} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm text-ink">
                      <DownloadIcon className="h-4 w-4" /> Ouvrir
                    </a>
                    <button onClick={() => setAi({ state: "idle" })} className="rounded-full bg-white/15 px-4 py-2 text-sm backdrop-blur">
                      Retour au live
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <p className="absolute bottom-2 right-3 text-[10px] text-white/50">Aperçu indicatif · l&apos;IA peut se tromper</p>
        </div>

        {/* contrôles */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-[#161616] px-4 py-4">
          <div>
            <p className="text-sm font-medium">{product.name}</p>
            <div className="mt-2 flex gap-2">
              {product.variants.map((x) => (
                <button
                  key={x.id}
                  onClick={() => onVariant(x.id)}
                  aria-label={x.name}
                  aria-pressed={x.id === v.id}
                  title={x.name}
                  className={`h-8 w-8 rounded-full border-2 p-0.5 ${x.id === v.id ? "border-white" : "border-transparent"}`}
                >
                  <span className="block h-full w-full rounded-full" style={{ background: x.swatch }} />
                </button>
              ))}
            </div>
            {devices.length > 1 && (
              <label className="mt-3 flex items-center gap-2 text-xs text-white/70">
                Caméra
                <select
                  value={devices.find((d) => d.label === currentLabel)?.deviceId ?? deviceId ?? ""}
                  onChange={(e) => chooseCam(e.target.value)}
                  className="max-w-[220px] rounded-md border border-white/20 bg-[#222] px-2 py-1 text-white"
                >
                  {devices.map((d, i) => (
                    <option key={d.deviceId || i} value={d.deviceId}>
                      {d.label || `Caméra ${i + 1}`}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={snapshot}
              disabled={phase !== "live"}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-white/25 px-4 text-sm hover:bg-white/10 disabled:opacity-40"
            >
              <ShutterIcon className="h-4 w-4" /> Photo
            </button>
            <button
              onClick={runAi}
              disabled={phase !== "live" || ai.state === "running"}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-medium text-ink hover:bg-white/90 disabled:opacity-40"
            >
              <SparkIcon className="h-4 w-4" /> Rendu réaliste IA
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Overlay({ title, detail, children }: { title: string; detail?: string; children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/90 p-6 text-center">
      <div className="max-w-sm">
        <p className="font-medium">{title}</p>
        <p className="mt-2 text-sm text-white/70">{children}</p>
        {detail && <p className="mt-3 font-mono text-[11px] text-white/40">{detail}</p>}
      </div>
    </div>
  );
}
