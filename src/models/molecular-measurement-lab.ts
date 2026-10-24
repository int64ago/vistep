import { brownianNormal } from './brownian-motion';
const finite = (value: number, fallback: number) => (Number.isFinite(value) ? value : fallback);
const bound = (value: number, low: number, high: number, fallback = low) =>
  Math.max(low, Math.min(high, finite(value, fallback)));
export function waterViscosity(kelvin: number) {
  return 2.414e-5 * 10 ** (247.8 / (bound(kelvin, 273.15, 353.15, 293.15) - 140));
}
export function carbonDiffusion(kelvin = 293.15, radius = 0.5e-6) {
  const temperature = bound(kelvin, 273.15, 353.15, 293.15);
  return (
    (1.380649e-23 * temperature) /
    (6 * Math.PI * waterViscosity(temperature) * bound(radius, 0.1e-6, 10e-6, 0.5e-6))
  );
}
export function carbonTrack(seed: number, kelvin = 293.15, radius = 0.5e-6, seconds = 300) {
  const scale = Math.sqrt(2 * carbonDiffusion(kelvin, radius)) * 1e6,
    points = [{ x: 0, y: 0 }];
  for (let i = 0; i < Math.floor(bound(seconds, 0, 300)); i++) {
    const p = points[i];
    points.push({
      x: p.x + scale * brownianNormal(finite(seed, 137), i * 2),
      y: p.y + scale * brownianNormal(finite(seed, 137), i * 2 + 1),
    });
  }
  return points;
}
export function carbonPosition(track: { x: number; y: number }[], seconds: number) {
  const time = bound(seconds, 0, track.length - 1),
    i = Math.floor(time),
    p = track[i],
    q = track[Math.min(i + 1, track.length - 1)],
    fraction = time - i;
  return { x: p.x + (q.x - p.x) * fraction, y: p.y + (q.y - p.y) * fraction };
}
/** Aggregate imbalance, not resolved water molecules or a force measurement. Its direction shares the tracer's seeded increment. */
export function carbonImpacts(seed: number, seconds: number) {
  const i = Math.min(299, Math.floor(bound(seconds, 0, 300))),
    x = brownianNormal(seed, i * 2),
    y = brownianNormal(seed, i * 2 + 1);
  const scale = Math.max(1, Math.abs(x), Math.abs(y));
  return {
    x: x / scale,
    y: y / scale,
    left: 1 + x / scale / 2,
    right: 1 - x / scale / 2,
    top: 1 + y / scale / 2,
    bottom: 1 - y / scale / 2,
  };
}
/** Representative near-room-temperature 50+50 mL observation, not a general equation of state. */
export function waterAlcoholMix(progress: number) {
  const p = bound(progress, 0, 1),
    poured = Math.min(1, p / 0.6),
    settled = Math.max(0, (p - 0.6) / 0.4);
  return {
    water: 50 * (1 - poured),
    ethanol: 50,
    mixture: 50 + 50 * poured - 4 * settled,
    contraction: 4 * settled,
    totalMass: 50 * 0.998 + 50 * 0.789,
    poured,
    settled,
  };
}
/** Qualitative identity-preserving positions. Glyph counts and distances are NOT composition, molecular scale or a volume prediction. */
export function mixtureStructure(progress: number) {
  const { poured, settled } = waterAlcoholMix(progress);
  return Array.from({ length: 16 }, (_, i) => {
    const species = i < 12 ? ('water' as const) : ('ethanol' as const);
    const local = i < 12 ? i : i - 12;
    const start =
      species === 'water'
        ? { x: 18 + (local % 4) * 22, y: 18 + Math.floor(local / 4) * 27 }
        : { x: 175 + (local % 2) * 42, y: 24 + Math.floor(local / 2) * 43 };
    const slot = [0, 1, 2, 4, 5, 7, 8, 10, 11, 13, 14, 15, 3, 6, 9, 12][i];
    const end = {
      x: 112 + (slot % 4) * 35 + (Math.floor(slot / 4) % 2) * 5,
      y: 10 + Math.floor(slot / 4) * 22,
    };
    const moving = species === 'water' ? poured : poured * 0.35 + settled * 0.65;
    return {
      id: `${species}-${local}`,
      species,
      x: start.x + (end.x - start.x) * moving,
      y: start.y + (end.y - start.y) * moving,
      angle: (i * 67 + 23 * moving) % 360,
    };
  });
}
export function oilFilm(totalMl = 1, drops = 50, dilution = 500, areaCm2 = 200) {
  const total = bound(totalMl, 0, 100, 1),
    volumeMl = total / bound(drops, 1, 10000, 50) / bound(dilution, 1, 100000, 500),
    volumeM3 = volumeMl * 1e-6,
    areaM2 = bound(areaCm2, 1e-8, 100000, 200) * 1e-4;
  return {
    dropMl: total / bound(drops, 1, 10000, 50),
    volumeMl,
    volumeM3,
    areaM2,
    thickness: volumeM3 / areaM2,
  };
}
export function oilBoundary(areaCm2 = 200) {
  const raw = Array.from({ length: 96 }, (_, i) => {
    const a = (i / 96) * 2 * Math.PI,
      r = 1 + 0.1 * Math.sin(3 * a) + 0.06 * Math.cos(5 * a);
    return { x: r * Math.cos(a), y: r * Math.sin(a) };
  });
  const unit =
      Math.abs(
        raw.reduce((sum, p, i) => {
          const q = raw[(i + 1) % raw.length];
          return sum + p.x * q.y - q.x * p.y;
        }, 0),
      ) / 2,
    scale = Math.sqrt(bound(areaCm2, 1, 100000, 200) / unit);
  return raw.map((p) => ({ x: p.x * scale, y: p.y * scale }));
}
export type MolecularState = {
  mode: 'brownian' | 'mix' | 'oil';
  temperature: number;
  radius: number;
  time: number;
  progress: number;
  compare: boolean;
  oilStage: number;
  drops: number;
  dilution: number;
  area: number;
};
export function molecularShot(
  chapter: number,
  progress: number,
  chapterTime?: number,
): MolecularState {
  const c = Math.round(bound(chapter, 0, 7)),
    p = bound(progress, 0, 1);
  return {
    mode: c < 2 ? 'brownian' : c < 4 ? 'mix' : 'oil',
    temperature: c === 1 ? 323.15 : 293.15,
    radius: 0.5,
    time: p * 300,
    // Measured zh says “96 mL” at 2.79s; en at 4.05s. The observed volume settles before both.
    progress: c === 2 ? 0 : c === 3 ? bound(((chapterTime ?? p * 28) - 0.2) / 2.4, 0, 1) : p,
    compare: c === 1,
    oilStage: Math.max(0, c - 4),
    drops: 50,
    dilution: 500,
    area: 200,
  };
}

/** Radial powder displacement from the very same polygon boundary; illustrative, not hydrodynamics. */
export function oilPowder(progress: number) {
  const growth = 0.1 + 0.9 * bound(progress / 0.7, 0, 1),
    polygon = oilBoundary(200);
  const fraction = (key: number) => {
    let n = Math.imul(key ^ (key >>> 16), 0x21f0aaad);
    n = Math.imul(n ^ (n >>> 15), 0x735a2d97);
    return ((n ^ (n >>> 15)) >>> 0) / 4294967296;
  };
  return Array.from({ length: 150 }, (_, id) => {
    const x = 18 + fraction(id * 2 + 137) * 243,
      y = 17 + fraction(id * 2 + 138) * 156,
      dx = x - 140,
      dy = y - 96,
      r = Math.hypot(dx, dy),
      ux = dx / (r || 1),
      uy = dy / (r || 1);
    let edge = 0;
    for (let j = 0; j < polygon.length; j++) {
      const a = polygon[j],
        b = polygon[(j + 1) % polygon.length],
        vx = b.x - a.x,
        vy = b.y - a.y,
        den = ux * vy - uy * vx;
      if (Math.abs(den) < 1e-10) continue;
      const distance = (a.x * vy - a.y * vx) / den,
        along = (a.x * uy - a.y * ux) / den;
      if (distance >= 0 && along >= 0 && along <= 1) edge = distance * 8 * growth;
    }
    const displaced = Math.max(r, edge + 2);
    return { id, x: 140 + ux * displaced, y: 96 + uy * displaced };
  });
}
