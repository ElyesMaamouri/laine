/**
 * Moteur de dessin du pull sur canvas.
 * Le même code dessine la photo produit (pose standard) et le pull
 * porté en direct sur la caméra (pose détectée par MediaPipe).
 */
export type Pattern = "solid" | "stripes" | "cable" | "jacquard";
export type Neck = "crew" | "v";

export type P = { x: number; y: number };
export type Side = { sh: P; el: P; wr: P; hip: P };
/** a = côté gauche de l'image, b = côté droit */
export type Body = { a: Side; b: Side; /** menton estimé : rien du buste n'est dessiné au-dessus */ chin?: P };
export type SweaterStyle = {
  pattern: Pattern;
  neck: Neck;
  fit: number;
  base: string;
  accent: string;
};

const add = (p: P, q: P): P => ({ x: p.x + q.x, y: p.y + q.y });
const sub = (p: P, q: P): P => ({ x: p.x - q.x, y: p.y - q.y });
const mul = (p: P, k: number): P => ({ x: p.x * k, y: p.y * k });
const len = (p: P) => Math.hypot(p.x, p.y);
const norm = (p: P): P => {
  const l = len(p) || 1;
  return { x: p.x / l, y: p.y / l };
};
const perp = (p: P): P => ({ x: -p.y, y: p.x });
const dot = (p: P, q: P) => p.x * q.x + p.y * q.y;
export const mid = (p: P, q: P): P => ({ x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 });
export const dist = (p: P, q: P) => len(sub(p, q));
export const lerp = (p: P, q: P, t: number): P => ({ x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t });

/** Point exprimé dans le repère du buste (s = latéral, d = vers le bas) */
const at = (o: P, side: P, down: P, s: number, d: number) => add(add(o, mul(side, s)), mul(down, d));

export function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255;
  let g = (n >> 8) & 255;
  let b = n & 255;
  const t = amt < 0 ? 0 : 255;
  const k = Math.abs(amt);
  r = Math.round(r + (t - r) * k);
  g = Math.round(g + (t - g) * k);
  b = Math.round(b + (t - b) * k);
  return `rgb(${r},${g},${b})`;
}

function isDark(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b < 110;
}

/* ---------- texture de maille (motif répété, mis en cache) ---------- */
const knitCache = new Map<string, HTMLCanvasElement>();
function knitTile(color: string) {
  let tile = knitCache.get(color);
  if (tile) return tile;
  tile = document.createElement("canvas");
  tile.width = 10;
  tile.height = 11;
  const c = tile.getContext("2d")!;
  c.strokeStyle = color;
  c.lineWidth = 1.4;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(1, 2);
  c.lineTo(5, 9);
  c.lineTo(9, 2);
  c.stroke();
  knitCache.set(color, tile);
  return tile;
}

/** Tube (manche) passant par des points avec des largeurs variables */
function tubePath(pts: P[], ws: number[]) {
  const left: P[] = [];
  const right: P[] = [];
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    let dir: P;
    if (i === 0) dir = sub(pts[1], pts[0]);
    else if (i === n - 1) dir = sub(pts[n - 1], pts[n - 2]);
    else dir = add(norm(sub(pts[i], pts[i - 1])), norm(sub(pts[i + 1], pts[i])));
    const nn = perp(norm(dir));
    left.push(add(pts[i], mul(nn, ws[i] / 2)));
    right.push(sub(pts[i], mul(nn, ws[i] / 2)));
  }
  const path = new Path2D();
  path.moveTo(left[0].x, left[0].y);
  for (let i = 1; i < n; i++) path.lineTo(left[i].x, left[i].y);
  // bout arrondi au poignet
  const end = pts[n - 1];
  const endDir = norm(sub(pts[n - 1], pts[n - 2]));
  const tip = add(end, mul(endDir, ws[n - 1] * 0.12));
  path.quadraticCurveTo(tip.x, tip.y, right[n - 1].x, right[n - 1].y);
  for (let i = n - 2; i >= 0; i--) path.lineTo(right[i].x, right[i].y);
  path.closePath();
  return path;
}

type Frame = { o: P; side: P; down: P; sw: number; T: number; half: number; wear: number };

/** Remplit une zone avec la couleur, le motif, la maille et l'ombrage */
function paintFabric(ctx: CanvasRenderingContext2D, path: Path2D, st: SweaterStyle, f: Frame, opts: { torso: boolean }) {
  const { sw, T, half } = f;
  ctx.save();
  ctx.fillStyle = st.base;
  ctx.fill(path);
  ctx.clip(path);

  // repère local : x latéral, y vers le bas
  ctx.translate(f.o.x, f.o.y);
  ctx.rotate(Math.atan2(f.side.y, f.side.x));
  const R = sw * 4;

  // ---- motif
  if (st.pattern === "stripes") {
    const h = sw * 0.075;
    ctx.fillStyle = st.accent;
    for (let y = 0.22 * sw; y < T * 1.4 + R; y += h * 2) ctx.fillRect(-R, y, R * 2, h);
  } else if (st.pattern === "jacquard" && opts.torso) {
    const y0 = T * 0.3;
    const bh = T * 0.2;
    ctx.fillStyle = st.accent;
    ctx.fillRect(-R, y0, R * 2, bh);
    const step = sw * 0.11;
    ctx.fillStyle = st.base;
    for (let x = -R; x < R; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, y0 + bh * 0.78);
      ctx.lineTo(x + step / 2, y0 + bh * 0.22);
      ctx.lineTo(x + step, y0 + bh * 0.78);
      ctx.lineTo(x + step * 0.78, y0 + bh * 0.78);
      ctx.lineTo(x + step / 2, y0 + bh * 0.45);
      ctx.lineTo(x + step * 0.22, y0 + bh * 0.78);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillRect(-R, y0 + bh * 0.06, R * 2, bh * 0.06);
    ctx.fillRect(-R, y0 + bh * 0.88, R * 2, bh * 0.06);
    // petits points au-dessus et en dessous
    ctx.fillStyle = st.accent;
    const r = sw * 0.012;
    for (let x = -R; x < R; x += step / 2) {
      for (const y of [y0 - sw * 0.06, y0 + bh + sw * 0.06]) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (st.pattern === "jacquard" && !opts.torso) {
    // bande sur la manche au niveau du biceps
    ctx.fillStyle = st.accent;
    ctx.fillRect(-R, T * 0.3, R * 2, T * 0.05);
  }

  // ---- texture de maille
  const k = sw / 230;
  const knitColor = isDark(st.base) ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.11)";
  const pat = ctx.createPattern(knitTile(knitColor), "repeat");
  if (pat) {
    ctx.save();
    ctx.scale(k, k);
    ctx.fillStyle = pat;
    ctx.fillRect(-R / k, -R / k, (R * 2) / k, (R * 2 + T * 2) / k);
    ctx.restore();
  }

  // ---- torsades
  if (st.pattern === "cable" && opts.torso) {
    const dark = shade(st.base, -0.28);
    const light = shade(st.base, 0.16);
    const step = sw * 0.17;
    const cw = sw * 0.12;
    for (const cx of [-0.62 * half, 0, 0.62 * half]) {
      // côtes de chaque côté
      ctx.strokeStyle = dark;
      ctx.lineWidth = sw * 0.012;
      for (const dx of [-cw * 0.85, cw * 0.85]) {
        ctx.beginPath();
        ctx.moveTo(cx + dx, -sw * 0.2);
        ctx.lineTo(cx + dx, T * 1.3);
        ctx.stroke();
      }
      for (let y = -sw * 0.1; y < T * 1.2; y += step) {
        for (const [col, off] of [
          [dark, sw * 0.012],
          [light, 0],
        ] as const) {
          ctx.strokeStyle = col;
          ctx.lineWidth = sw * 0.05;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(cx - cw / 2 + off, y + off);
          ctx.bezierCurveTo(cx - cw / 2, y + step * 0.5, cx + cw / 2, y + step * 0.5, cx + cw / 2 + off, y + step + off);
          ctx.stroke();
        }
        ctx.strokeStyle = shade(st.base, -0.12);
        ctx.lineWidth = sw * 0.045;
        ctx.beginPath();
        ctx.moveTo(cx + cw / 2, y);
        ctx.bezierCurveTo(cx + cw / 2, y + step * 0.3, cx + cw * 0.1, y + step * 0.4, cx + cw * 0.08, y + step * 0.45);
        ctx.moveTo(cx - cw * 0.08, y + step * 0.6);
        ctx.bezierCurveTo(cx - cw * 0.1, y + step * 0.65, cx - cw / 2, y + step * 0.75, cx - cw / 2, y + step);
        ctx.stroke();
      }
    }
  }

  // ---- bord-côte en bas du pull
  if (opts.torso) {
    const hemY = T * (f.wear > 1 ? 1.2 : 1.1);
    const ribTop = hemY - T * 0.13;
    ctx.fillStyle = shade(st.base, -0.08);
    ctx.fillRect(-R, ribTop, R * 2, R);
    ctx.strokeStyle = isDark(st.base) ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.13)";
    ctx.lineWidth = Math.max(1, sw * 0.008);
    for (let x = -half * 1.3; x < half * 1.3; x += sw * 0.028) {
      ctx.beginPath();
      ctx.moveTo(x, ribTop);
      ctx.lineTo(x, ribTop + R);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.fillRect(-R, ribTop - sw * 0.006, R * 2, sw * 0.012);
  }

  // ---- ombrage (volume)
  if (opts.torso) {
    const g = ctx.createLinearGradient(-half * 1.12, 0, half * 1.12, 0);
    g.addColorStop(0, "rgba(0,0,0,0.30)");
    g.addColorStop(0.2, "rgba(0,0,0,0.04)");
    g.addColorStop(0.5, "rgba(255,255,255,0.05)");
    g.addColorStop(0.8, "rgba(0,0,0,0.04)");
    g.addColorStop(1, "rgba(0,0,0,0.30)");
    ctx.fillStyle = g;
    ctx.fillRect(-R, -R, R * 2, R * 3);
    const gv = ctx.createLinearGradient(0, -sw * 0.1, 0, T * 1.15);
    gv.addColorStop(0, "rgba(255,255,255,0.08)");
    gv.addColorStop(0.6, "rgba(0,0,0,0)");
    gv.addColorStop(1, "rgba(0,0,0,0.12)");
    ctx.fillStyle = gv;
    ctx.fillRect(-R, -R, R * 2, R * 3);
  } else {
    ctx.fillStyle = "rgba(0,0,0,0.07)";
    ctx.fillRect(-R, -R, R * 2, R * 3);
  }
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = "rgba(0,0,0,0.22)";
  ctx.lineWidth = Math.max(1, sw * 0.007);
  ctx.stroke(path);
  ctx.restore();
}

/**
 * wear = ampleur portée. Les points MediaPipe sont au centre des articulations :
 * sur une vraie personne le corps déborde largement des épaules, d'où wear ≈ 1.4 en live.
 */
export function drawSweater(ctx: CanvasRenderingContext2D, body: Body, st: SweaterStyle, wear = 1) {
  const sMid = mid(body.a.sh, body.b.sh);
  const hMid = mid(body.a.hip, body.b.hip);
  const sw = Math.max(4, dist(body.a.sh, body.b.sh));
  const side = norm(sub(body.b.sh, body.a.sh));
  const down = perp(side);
  const T = Math.max(sw * 0.9, dot(sub(hMid, sMid), down));
  const half = sw * 0.5 * st.fit * wear;
  const f: Frame = { o: sMid, side, down, sw, T, half, wear };
  const A = (s: number, d: number) => at(sMid, side, down, s, d);

  // ---- buste
  const neckW = sw * (wear > 1 ? 0.2 : 0.17);
  const neckLift = wear > 1 ? -0.09 * sw : -0.035 * sw; // en live le col remonte à la base du cou
  const neckA = A(-neckW, neckLift);
  const neckB = A(neckW, neckLift);
  const shA = A(-half * 1.1, 0.06 * sw);
  const shB = A(half * 1.1, 0.06 * sw);
  const armA = A(-half * 1.02, T * 0.36);
  const armB = A(half * 1.02, T * 0.36);
  const hemY = T * (wear > 1 ? 1.2 : 1.1);
  const hemA = A(-half * 0.99, hemY);
  const hemB = A(half * 0.99, hemY);

  const torso = new Path2D();
  const q = (c: P, p: P) => torso.quadraticCurveTo(c.x, c.y, p.x, p.y);
  torso.moveTo(neckA.x, neckA.y);
  q(A(-half * 0.65, -0.02 * sw), shA);
  torso.lineTo(armA.x, armA.y);
  q(A(-half * 1.05, T * 0.75), hemA);
  q(A(0, hemY + 0.03 * sw), hemB);
  q(A(half * 1.05, T * 0.75), armB);
  torso.lineTo(shB.x, shB.y);
  q(A(half * 0.65, -0.02 * sw), neckB);
  const vBottom = A(0, 0.45 * sw);
  const crewCtrl = A(0, 0.22 * sw);
  if (st.neck === "v") {
    torso.lineTo(vBottom.x, vBottom.y);
    torso.lineTo(neckA.x, neckA.y);
  } else {
    q(crewCtrl, neckA);
  }
  torso.closePath();
  drawSleeves(ctx, body, st, f, A);
  paintFabric(ctx, torso, st, f, { torso: true });

  // ---- col côtelé
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const neckPath = new Path2D();
  neckPath.moveTo(neckA.x, neckA.y);
  if (st.neck === "v") {
    neckPath.lineTo(vBottom.x, vBottom.y);
    neckPath.lineTo(neckB.x, neckB.y);
  } else {
    neckPath.quadraticCurveTo(crewCtrl.x, crewCtrl.y, neckB.x, neckB.y);
  }
  ctx.strokeStyle = shade(st.base, -0.14);
  ctx.lineWidth = sw * 0.065;
  ctx.stroke(neckPath);
  ctx.strokeStyle = shade(st.base, 0.08);
  ctx.lineWidth = sw * 0.02;
  ctx.stroke(neckPath);
  ctx.restore();
}

/** Manches dessinées SOUS le buste pour une jonction d'épaule propre */
function drawSleeves(ctx: CanvasRenderingContext2D, body: Body, st: SweaterStyle, f: Frame, A: (s: number, d: number) => P) {
  const { sw, half } = f;
  for (const [s, sign] of [
    [body.a, -1],
    [body.b, 1],
  ] as const) {
    const start = A(sign * half * 0.72, 0.3 * sw);
    const el = s.el;
    const wr = s.wr;
    const pts = [start, lerp(start, el, 0.5), el, wr];
    const k = f.wear;
    const ws = [0.4 * sw * st.fit * k, 0.34 * sw * st.fit * k, 0.28 * sw * st.fit * k, 0.22 * sw * k];
    paintFabric(ctx, tubePath(pts, ws), st, f, { torso: false });

    const fore = dist(el, wr);
    const cuffLen = Math.min(fore * 0.35, 0.17 * sw);
    const cuffStart = add(wr, mul(norm(sub(el, wr)), cuffLen));
    const cuff = tubePath([cuffStart, wr], [0.23 * sw * k, 0.21 * sw * k]);
    ctx.save();
    ctx.fillStyle = shade(st.base, -0.1);
    ctx.fill(cuff);
    ctx.strokeStyle = "rgba(0,0,0,0.22)";
    ctx.lineWidth = Math.max(1, sw * 0.007);
    ctx.stroke(cuff);
    ctx.restore();
  }
}

/** Pose « mannequin » utilisée pour les visuels produits */
export function standardBody(w: number, h: number): Body {
  const sw = Math.min(w * 0.34, h * 0.26);
  const T = sw * 1.3;
  const cx = w / 2;
  const shY = h / 2 - (T * 1.1) / 2 + sw * 0.02;
  const mk = (sign: number): Side => ({
    sh: { x: cx + sign * sw * 0.5, y: shY },
    el: { x: cx + sign * sw * 0.8, y: shY + sw * 0.8 },
    wr: { x: cx + sign * sw * 0.9, y: shY + sw * 1.48 },
    hip: { x: cx + sign * sw * 0.45, y: shY + T },
  });
  return { a: mk(-1), b: mk(1) };
}

export function drawFlat(ctx: CanvasRenderingContext2D, w: number, h: number, st: SweaterStyle, bg?: string) {
  if (bg) {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
  }
  // on dessine hors écran puis on pose le pull avec une ombre douce
  const off = document.createElement("canvas");
  off.width = w;
  off.height = h;
  drawSweater(off.getContext("2d")!, standardBody(w, h), st);
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.18)";
  ctx.shadowBlur = w * 0.04;
  ctx.shadowOffsetY = w * 0.015;
  ctx.drawImage(off, 0, 0);
  ctx.restore();
}
