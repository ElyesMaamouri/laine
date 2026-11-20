/**
 * Plaque une VRAIE photo de pull (détourée) sur le corps détecté.
 * - le buste : une transformation affine dans le repère des épaules
 * - chaque manche : bande déformée par triangles (épaule → coude → poignet)
 */
import type { Body, P } from "./sweater";
import { dist, mid } from "./sweater";
import { garments, type GarmentId, type GarmentKP, type KP } from "./garments";

export type Look = { tint?: string; filter?: string };

/* ---------------- chargement + teinte (cache) ---------------- */
const imgCache = new Map<string, Promise<HTMLImageElement>>();
export function loadImage(src: string) {
  let p = imgCache.get(src);
  if (!p) {
    p = new Promise((res, rej) => {
      const im = new Image();
      // images Cloudinary : nécessaire pour pouvoir les lire dans un canvas (rendu IA)
      im.crossOrigin = "anonymous";
      im.onload = () => res(im);
      im.onerror = rej;
      im.src = src;
    });
    imgCache.set(src, p);
  }
  return p;
}

const tintCache = new Map<string, HTMLCanvasElement>();
/** Photo recolorée : filtre CSS (teinte/luminosité) puis multiplication par une couleur */
export function tinted(img: HTMLImageElement, look: Look) {
  const key = `${img.src}|${look.tint ?? ""}|${look.filter ?? ""}`;
  let c = tintCache.get(key);
  if (c) return c;
  c = document.createElement("canvas");
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const ctx = c.getContext("2d")!;
  if (look.filter) ctx.filter = look.filter;
  ctx.drawImage(img, 0, 0);
  ctx.filter = "none";
  if (look.tint) {
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = look.tint;
    ctx.fillRect(0, 0, c.width, c.height);
    // on rétablit la transparence d'origine
    ctx.globalCompositeOperation = "destination-in";
    ctx.drawImage(img, 0, 0);
    ctx.globalCompositeOperation = "source-over";
  }
  tintCache.set(key, c);
  return c;
}

/* ---------------- géométrie ---------------- */
const sub = (p: P, q: P): P => ({ x: p.x - q.x, y: p.y - q.y });
const add = (p: P, q: P): P => ({ x: p.x + q.x, y: p.y + q.y });
const mul = (p: P, k: number): P => ({ x: p.x * k, y: p.y * k });
const dot = (p: P, q: P) => p.x * q.x + p.y * q.y;
const norm = (p: P): P => {
  const l = Math.hypot(p.x, p.y) || 1;
  return { x: p.x / l, y: p.y / l };
};
const perp = (p: P): P => ({ x: -p.y, y: p.x });

/** Dessine la partie `src` (triangle) de l'image sur le triangle `dst` */
function drawTri(ctx: CanvasRenderingContext2D, img: CanvasImageSource, s: [P, P, P], d: [P, P, P]) {
  const [s0, s1, s2] = s;
  const [d0, d1, d2] = d;
  const den = (s1.x - s0.x) * (s2.y - s0.y) - (s2.x - s0.x) * (s1.y - s0.y);
  if (Math.abs(den) < 1e-6) return;
  const a = ((d1.x - d0.x) * (s2.y - s0.y) - (d2.x - d0.x) * (s1.y - s0.y)) / den;
  const b = ((d1.y - d0.y) * (s2.y - s0.y) - (d2.y - d0.y) * (s1.y - s0.y)) / den;
  const c = ((d2.x - d0.x) * (s1.x - s0.x) - (d1.x - d0.x) * (s2.x - s0.x)) / den;
  const e = ((d2.y - d0.y) * (s1.x - s0.x) - (d1.y - d0.y) * (s2.x - s0.x)) / den;
  const f = d0.x - a * s0.x - c * s0.y;
  const g = d0.y - b * s0.x - e * s0.y;

  // triangle de destination légèrement agrandi pour éviter les coutures visibles
  const cx = (d0.x + d1.x + d2.x) / 3;
  const cy = (d0.y + d1.y + d2.y) / 3;
  const grow = (p: P) => {
    const v = { x: p.x - cx, y: p.y - cy };
    const l = Math.hypot(v.x, v.y) || 1;
    return { x: p.x + (v.x / l) * 1.2, y: p.y + (v.y / l) * 1.2 };
  };
  const [e0, e1, e2] = [grow(d0), grow(d1), grow(d2)];
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(e0.x, e0.y);
  ctx.lineTo(e1.x, e1.y);
  ctx.lineTo(e2.x, e2.y);
  ctx.closePath();
  ctx.clip();
  ctx.transform(a, b, c, e, f, g);
  ctx.drawImage(img, 0, 0);
  ctx.restore();
}

/**
 * wear : ampleur portée (≈1.4 en live, car MediaPipe donne le centre des articulations)
 */
export function drawGarment(
  ctx: CanvasRenderingContext2D,
  body: Body,
  id: GarmentId,
  img: CanvasImageSource & { width: number; height: number },
  wear = 1,
) {
  const kp: GarmentKP = garments[id].kp;
  const W = img.width;
  const H = img.height;
  const S = (k: KP): P => ({ x: k[0] * W, y: k[1] * H });

  // repère du buste
  const sMid = mid(body.a.sh, body.b.sh);
  const sw = Math.max(4, dist(body.a.sh, body.b.sh));
  const side = norm(sub(body.b.sh, body.a.sh));
  const down = perp(side);
  const hMid = mid(body.a.hip, body.b.hip);
  const T = Math.max(sw * 0.9, dot(sub(hMid, sMid), down));

  // correspondance photo → corps pour le buste (affine)
  const shL = S(kp.shL);
  const shR = S(kp.shR);
  const srcCx = (shL.x + shR.x) / 2;
  const srcTop = (shL.y + shR.y) / 2;
  const srcBottom = (S(kp.hemL).y + S(kp.hemR).y) / 2;
  const destShoulderW = sw * 1.12 * wear;
  const kx = destShoulderW / Math.max(1, shR.x - shL.x);
  const top = -0.04 * sw; // haut des épaules légèrement au-dessus des articulations
  const hemY = T * (wear > 1 ? 1.22 : 1.1);
  const ky = (hemY - top) / Math.max(1, srcBottom - srcTop);
  const map = (p: P): P => add(sMid, add(mul(side, (p.x - srcCx) * kx), mul(down, top + (p.y - srcTop) * ky)));

  // ---- manches (dessinées sous le buste)
  const sleeve = (sk: GarmentKP["sleeveL"], shK: KP, pitK: KP, el: P, wr: P) => {
    const s0o = S(shK);
    const s0i = S(pitK);
    const s1o = S(sk.elbowOut);
    const s1i = S(sk.elbowIn);
    const s2o = S(sk.cuffOut);
    const s2i = S(sk.cuffIn);
    const d0o = map(s0o);
    const d0i = map(s0i);
    const outward = sub(d0o, d0i); // du dessous de bras vers l'épaule = côté extérieur

    const edge = (center: P, dir: P, width: number, ref: P) => {
      let n = perp(norm(dir));
      if (dot(n, ref) < 0) n = mul(n, -1);
      return [add(center, mul(n, width / 2)), sub(center, mul(n, width / 2))] as const;
    };
    const minW = 0.3 * sw * wear;
    const wE = Math.max(minW, dist(s1o, s1i) * kx);
    const wW = Math.max(minW * 0.75, dist(s2o, s2i) * kx);
    // l'épaule « tire » un peu le coude pour garder la manche attachée
    const [d1o, d1i] = edge(el, sub(el, mid(d0o, d0i)), wE, outward);
    const [d2o, d2i] = edge(wr, sub(wr, el), wW, sub(d1o, d1i));
    // prolonge légèrement au-delà du poignet (le poignet de la photo est au bout de la manche)
    const ext = mul(norm(sub(wr, el)), 0.06 * sw);
    const e2o = add(d2o, ext);
    const e2i = add(d2i, ext);

    drawTri(ctx, img, [s0o, s0i, s1o], [d0o, d0i, d1o]);
    drawTri(ctx, img, [s0i, s1i, s1o], [d0i, d1i, d1o]);
    drawTri(ctx, img, [s1o, s1i, s2o], [d1o, d1i, e2o]);
    drawTri(ctx, img, [s1i, s2i, s2o], [d1i, e2i, e2o]);
  };
  sleeve(kp.sleeveL, kp.shL, kp.pitL, body.a.el, body.a.wr);
  sleeve(kp.sleeveR, kp.shR, kp.pitR, body.b.el, body.b.wr);

  // ---- buste : on ne garde que la zone du corps de la photo (sans les manches)
  const poly: KP[] = [
    ...(kp.collarL ? [kp.collarL] : []),
    kp.neckL,
    kp.shL,
    kp.pitL,
    kp.hemL,
    [kp.hemL[0] + 0.01, Math.min(1, kp.hemL[1] + 0.04)],
    [kp.hemR[0] - 0.01, Math.min(1, kp.hemR[1] + 0.04)],
    kp.hemR,
    kp.pitR,
    kp.shR,
    kp.neckR,
    ...(kp.collarR ? [kp.collarR] : []),
  ];
  const bodyPoly = poly.map(S);
  // le haut du polygone remonte jusqu'au bord de l'image pour garder le col entier
  bodyPoly.unshift({ x: S(kp.collarL ?? kp.neckL).x, y: 0 });
  bodyPoly.push({ x: S(kp.collarR ?? kp.neckR).x, y: 0 });

  ctx.save();
  // rien au-dessus du menton : le col s'arrête sous le visage
  if (body.chin) {
    const c = add(body.chin, mul(down, 0.03 * sw));
    const far = 20 * sw;
    const p1 = sub(c, mul(side, far));
    const p2 = add(c, mul(side, far));
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p2.x + down.x * far, p2.y + down.y * far);
    ctx.lineTo(p1.x + down.x * far, p1.y + down.y * far);
    ctx.closePath();
    ctx.clip();
  }
  const o = map({ x: 0, y: 0 });
  const ux = sub(map({ x: 1, y: 0 }), o);
  const uy = sub(map({ x: 0, y: 1 }), o);
  ctx.transform(ux.x, ux.y, uy.x, uy.y, o.x, o.y);
  ctx.beginPath();
  bodyPoly.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, 0, 0);
  ctx.restore();
}

/** Visuel produit : photo centrée sur un fond */
export function drawProductPhoto(ctx: CanvasRenderingContext2D, w: number, h: number, img: CanvasImageSource & { width: number; height: number }, bg?: string, pad = 0.1) {
  if (bg) {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
  } else ctx.clearRect(0, 0, w, h);
  const k = Math.min((w * (1 - pad * 2)) / img.width, (h * (1 - pad * 2)) / img.height);
  const dw = img.width * k;
  const dh = img.height * k;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.16)";
  ctx.shadowBlur = w * 0.03;
  ctx.shadowOffsetY = w * 0.012;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  ctx.restore();
}
