import { fusionOutline } from './bio-plant-cell-engineering';
export const animalClamp = (x: number, a = 0, b = 1) =>
  Math.min(b, Math.max(a, Number.isFinite(x) ? x : a));
export function animalGrowth(t: number, adherent = true, contact = true) {
  const time = animalClamp(t, 0, 24),
    k = adherent && contact ? 32 : 72,
    n = 4 * Math.exp(0.35 * time);
  return {
    n: k / (1 + (k / 4 - 1) * Math.exp(-0.35 * time)),
    capacity: k,
    unrestricted: n,
    adherent,
  };
}
export function bicarbonatePH(co2Percent = 5, bicarbonate = 24) {
  return 6.1 + Math.log10(bicarbonate / ((0.03 * 760 * animalClamp(co2Percent, 0.1, 20)) / 100));
}
export function passageFrame(p0: number, w: number) {
  const p = animalClamp(p0),
    cx = w / 2,
    batch = Math.min(1, Math.floor(p * 2)),
    q = p === 1 ? 1 : p * 2 - batch,
    dx = batch === 0 ? w * 0.25 : w * 0.75;
  const tipFor = (v: number, d: number) => {
    if (v < 0.2) return { x: cx, y: 120 };
    if (v < 0.35) return { x: cx, y: 120 - ((v - 0.2) / 0.15) * 75 };
    if (v < 0.55) return { x: cx + ((d - cx) * (v - 0.35)) / 0.2, y: 45 };
    if (v < 0.75) return { x: d, y: 45 + ((v - 0.55) / 0.2) * 150 };
    if (v < 0.9) return { x: d, y: 195 };
    const t = (v - 0.9) / 0.1;
    return t < 0.35
      ? { x: d, y: 195 - (150 * t) / 0.35 }
      : t < 0.7
        ? { x: d + ((cx - d) * (t - 0.35)) / 0.35, y: 45 }
        : { x: cx, y: 45 + (75 * (t - 0.7)) / 0.3 };
  };
  const tip = tipFor(q, dx),
    cells = Array.from({ length: 16 }, (_, i) => {
      const b = i < 8 ? 0 : 1,
        j = i % 8,
        v = animalClamp(p * 2 - b),
        d = b === 0 ? w * 0.25 : w * 0.75,
        t = tipFor(v, d),
        from = { x: cx - 24 + (i % 4) * 16, y: 89 + Math.floor(i / 4) * 12 },
        to = { x: d - 24 + (j % 4) * 16, y: 224 + Math.floor(j / 4) * 16 },
        held = { x: t.x + (j % 2 ? 4 : -4), y: t.y - 9 - Math.floor(j / 2) * 7 };
      let x, y;
      if (v < 0.2) {
        const a = v / 0.2;
        x = from.x + (held.x - from.x) * a;
        y = from.y + (held.y - from.y) * a;
      } else if (v < 0.75) {
        x = held.x;
        y = held.y;
      } else {
        const a = animalClamp((v - 0.75) / 0.15);
        x = held.x + (to.x - held.x) * a;
        y = held.y + (to.y - held.y) * a;
        if (v >= 0.9) {
          x = to.x;
          y = to.y;
        }
      }
      return {
        id: `cell-${i}`,
        x,
        y,
        detached: animalClamp(v / 0.1),
        inSource: v === 0,
        inTransit: v > 0 && v < 0.9,
        inReceiver: v >= 0.9,
        inPipette: v >= 0.2 && v < 0.75,
        receiver: b,
      };
    });
  const taken = [0, 1].map((b) => 2 * animalClamp((p * 2 - b) / 0.2)),
    delivered = [0, 1].map((b) => 2 * animalClamp((p * 2 - b - 0.75) / 0.15));
  return {
    tip,
    cells,
    sourceMl: 10 - taken[0] - taken[1],
    pipetteMl: taken[0] + taken[1] - delivered[0] - delivered[1],
    receivers: [3 + delivered[0], 3 + delivered[1]],
  };
}
export const passagePositions = (p: number, w: number) => passageFrame(p, w).cells;
export type HybridKind = 'B' | 'M' | 'BM-target' | 'BM-other' | 'BB' | 'MM';
export function hybridSelection(kind: HybridKind, time: number, hat = true) {
  const p = animalClamp(time),
    hybrid = kind.startsWith('BM'),
    bOnly = kind === 'B' || kind === 'BB';
  return {
    survival: hybrid
      ? 1
      : bOnly
        ? 1 - animalClamp((p - 0.4) / 0.6)
        : hat
          ? 1 - animalClamp(p / 0.4)
          : 1,
    target: kind === 'BM-target',
    immortal: !bOnly,
    salvage: kind !== 'M' && kind !== 'MM',
  };
}
export function cloneOccupancy(lambda: number) {
  const l = animalClamp(lambda, 0, 10),
    empty = Math.exp(-l),
    single = l * empty,
    multi = 1 - empty - single;
  return { empty, single, multi, singleAmongOccupied: l === 0 ? null : single / (1 - empty) };
}
function unionUnequal(R: number, r: number, d: number) {
  if (d >= R + r) return Math.PI * (R * R + r * r);
  if (d <= Math.abs(R - r)) return Math.PI * Math.max(R, r) ** 2;
  const a = Math.acos((d * d + R * R - r * r) / (2 * d * R)),
    b = Math.acos((d * d + r * r - R * R) / (2 * d * r));
  return (
    Math.PI * (R * R + r * r) -
    R * R * a -
    r * r * b +
    0.5 * Math.sqrt((-d + R + r) * (d + R - r) * (d - R + r) * (d + R + r))
  );
}
export function donorFusion(progress: number) {
  const p = animalClamp(progress),
    r = 8,
    R0 = 55,
    d = 67 - 47 * p,
    target = Math.PI * (R0 * R0 + r * r);
  let lo = R0,
    hi = Math.hypot(R0, r);
  for (let i = 0; i < 55; i++) {
    const mid = (lo + hi) / 2;
    if (unionUnequal(mid, r, d) > target) hi = mid;
    else lo = mid;
  }
  const R = (lo + hi) / 2,
    connected = d < R + r,
    inside = d <= R - r;
  let path = '';
  if (connected && !inside) {
    const x = (d * d + R * R - r * r) / (2 * d),
      h = Math.sqrt(Math.max(0, R * R - x * x)),
      angleB = Math.acos((d - x) / r);
    path = `M${x} ${-h} A${R} ${R} 0 1 0 ${x} ${h} A${r} ${r} 0 ${angleB < Math.PI / 2 ? 1 : 0} 0 ${x} ${-h} Z`;
  }
  return {
    R,
    r,
    d,
    connected,
    inside,
    path,
    area: unionUnequal(R, r, d),
    nucleus: { x: d, y: 0 },
    target,
  };
}
export function enucleation(progress: number, w: number) {
  const p = animalClamp(progress),
    cx = w / 2,
    cy = 151,
    r = 55,
    spindle = { x: cx + 37, y: cy - 16 },
    tip =
      p < 0.3
        ? w - 8 + ((spindle.x - (w - 8)) * p) / 0.3
        : p < 0.6
          ? spindle.x
          : spindle.x + ((w - 26 - spindle.x) * (p - 0.6)) / 0.4,
    aspirate = animalClamp((p - 0.3) / 0.3),
    cargo = { x: p < 0.3 ? spindle.x : tip + aspirate * 13, y: spindle.y },
    inside = Math.hypot(cargo.x - cx, cargo.y - cy) < r,
    pore = p > 0.1 && p < 0.95;
  return {
    cx,
    cy,
    r,
    spindle,
    tip,
    cargo,
    inside,
    pore,
    removed: !inside,
    mitochondria: Array.from({ length: 12 }, (_, i) => {
      const a = 0.5 + (i / 12) * Math.PI * 2;
      return { id: `oocyte-mt-${i}`, x: cx + 36 * Math.cos(a), y: cy + 36 * Math.sin(a) };
    }),
  };
}
export function hybridFusion(progress: number) {
  return fusionOutline(progress, 25, 18);
}
export const cloneProvenance = {
  nuclear: 'somatic-donor',
  mitochondrial: 'mostly-oocyte-donor',
  gestation: 'recipient',
} as const;
