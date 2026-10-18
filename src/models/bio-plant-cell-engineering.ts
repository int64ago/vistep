export const plantCellClamp = (x: number, a = 0, b = 1) =>
  Math.min(b, Math.max(a, Number.isFinite(x) ? x : a));
export function unionArea(r: number, d: number) {
  if (d >= 2 * r) return 2 * Math.PI * r * r;
  const h = Math.sqrt(Math.max(0, 4 * r * r - d * d));
  return 2 * Math.PI * r * r - (2 * r * r * Math.acos(d / (2 * r)) - (d * h) / 2);
}
/** Conserves illustrated cross-sectional area, not a claim about real 3-D volume. */
export function fusionOutline(progress: number, r0 = 34, gap = 22) {
  const p = plantCellClamp(progress),
    fuse = plantCellClamp((p - 0.25) / 0.75),
    d = p < 0.25 ? 2 * r0 + 2 * gap * (1 - p / 0.25) : 2 * r0 * (1 - fuse),
    target = 2 * Math.PI * r0 * r0;
  let lo = r0,
    hi = r0 * Math.SQRT2;
  if (fuse > 0)
    for (let i = 0; i < 55; i++) {
      const mid = (lo + hi) / 2;
      if (unionArea(mid, d) > target) hi = mid;
      else lo = mid;
    }
  const r = fuse > 0 ? (lo + hi) / 2 : r0,
    h = Math.sqrt(Math.max(0, r * r - (d * d) / 4));
  return {
    p,
    fuse,
    d,
    r,
    half: d / 2,
    h,
    area: unionArea(r, d),
    path: `M0 ${-h} A${r} ${r} 0 1 0 0 ${h} A${r} ${r} 0 1 0 0 ${-h} Z`,
    connected: fuse > 1e-7,
  };
}
export function fusionGeometry(w: number, progress: number, nuclear = 0) {
  const vertical = w < 420,
    r0 = vertical ? 32 : 43,
    cx = w / 2,
    cy = 151,
    body = fusionOutline(progress, r0, vertical ? 18 : 25),
    np = plantCellClamp(nuclear),
    nuc = fusionOutline(np, 9, 5),
    ns =
      Math.max(14, body.half) * (1 - plantCellClamp(np / 0.25)) +
      nuc.half * plantCellClamp(np / 0.25);
  const map = (x: number, y: number) =>
    vertical ? { x: cx - y, y: cy + x } : { x: cx + x, y: cy + y };
  const markers = Array.from({ length: 4 }, (_, i) => {
    const group = i < 2 ? 0 : 1,
      sign = group === 0 ? -1 : 1,
      x = sign * ns + sign * 3 * np,
      y = i % 2 ? 3 : -3;
    return { id: `${group ? 'B' : 'A'}${(i % 2) + 1}`, group, ...map(x, y), localX: x, localY: y };
  });
  const organelles = Array.from({ length: 12 }, (_, i) => {
    const sign = i < 6 ? -1 : 1,
      angle = ((i % 6) / 6) * Math.PI * 2 + (i < 6 ? 0 : Math.PI / 6);
    const x = sign * body.half + body.r * 0.67 * Math.cos(angle),
      y = body.r * 0.67 * Math.sin(angle);
    return { id: `org-${i}`, group: i < 6 ? 0 : 1, ...map(x, y), localX: x, localY: y };
  });
  return { vertical, cx, cy, r0, body, nuc, ns, map, markers, organelles, nuclear: np };
}
export function insideFusion(
  x: number,
  y: number,
  g: ReturnType<typeof fusionOutline>,
  margin = 0,
) {
  return Math.min(Math.hypot(x - g.half, y), Math.hypot(x + g.half, y)) <= g.r - margin + 1e-7;
}
export function tissueState(stage: number, progress: number, contaminated = false) {
  const p = plantCellClamp(progress),
    valid = !contaminated;
  return {
    callus: valid ? (stage === 0 ? p : 1) : 0,
    shoot: valid ? (stage < 1 ? 0 : stage === 1 ? p : 1) : 0,
    root: valid ? (stage < 2 ? 0 : stage === 2 ? p : 1) : 0,
    acclimatized: valid && stage === 3 ? p : 0,
    contaminated,
    stemOpacity: 1 - (stage === 0 ? p : 1) * 0.6,
  };
}
export function hormoneResponse(auxin: number, cytokinin: number) {
  const a = plantCellClamp(auxin, 0, 20),
    c = plantCellClamp(cytokinin, 0, 20),
    total = a + c;
  if (total === 0) return { root: 0, shoot: 0, callus: 0.08, vigor: 0.08, ratio: null, total };
  const log = Math.log((a + 0.08) / (c + 0.08)),
    vigor = (1 - Math.exp(-total / 2)) * Math.exp(-Math.max(0, total - 6) / 5),
    sig = (x: number) => 1 / (1 + Math.exp(-2 * x));
  return {
    root: vigor * sig(log - 0.65),
    shoot: vigor * sig(-log - 0.65),
    callus: vigor * Math.exp((-log * log) / 0.8),
    vigor,
    ratio: c === 0 ? Infinity : a / c,
    total,
  };
}
export function explantRate(success: string, total: string) {
  if (
    success.trim() === '' ||
    total.trim() === '' ||
    !Number.isInteger(+success) ||
    !Number.isInteger(+total) ||
    +total <= 0 ||
    +success < 0 ||
    +success > +total
  )
    return null;
  return +success / +total;
}
export const hybridEvidence = {
  tomato: { nuclear: ['A'], plastid: 'A' },
  potato: { nuclear: ['B'], plastid: 'B' },
  hybrid: { nuclear: ['A', 'B'], plastid: 'one-parent' },
} as const;
