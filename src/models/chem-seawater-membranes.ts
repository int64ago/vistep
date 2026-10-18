const clamp = (n: number, a = 0, b = 1) => (Number.isFinite(n) ? Math.max(a, Math.min(b, n)) : a);
/** NaCl-equivalent ideal van't Hoff pressure at 298 K; bar, g/L. */
export const osmoticBar = (salt: number) => (2 * 0.08314 * 298 * clamp(salt, 0, 150)) / 58.44;
/** Dilute-permeate teaching approximation; A and B are chosen, not product specifications. */
export function membraneFlux(pressure: number, salinity: number) {
  const P = clamp(pressure, 0, 100),
    C = clamp(salinity, 0, 150),
    pi = osmoticBar(C),
    signedWater = 1.2 * (P - pi),
    water = Math.max(0, signedWater),
    B = 0.12,
    permeateConcentration = water > 0 ? (B * C) / (water + B) : 0;
  return {
    pressure: P,
    salinity: C,
    osmotic: pi,
    signedWater,
    water,
    permeateConcentration,
    saltFlux: water * permeateConcentration,
    rejection: water > 0 && C > 0 ? 1 - permeateConcentration / C : 0,
  };
}
export function reverseOsmosis(pressure: number, salinity: number, hours: number) {
  let feedVolume = 100,
    feedSalt = 100 * clamp(salinity, 0, 100),
    permeateVolume = 0,
    permeateSalt = 0;
  const initialSalt = feedSalt,
    t = clamp(hours, 0, 2),
    steps = 400,
    dt = t / steps;
  for (let i = 0; i < steps; i++) {
    const f = membraneFlux(pressure, feedSalt / feedVolume),
      dv = Math.min(feedVolume - 10, f.water * dt),
      ds = Math.min(feedSalt, dv * f.permeateConcentration);
    feedVolume -= dv;
    permeateVolume += dv;
    feedSalt -= ds;
    permeateSalt += ds;
  }
  return {
    feedVolume,
    feedSalt,
    permeateVolume,
    permeateSalt,
    initialSalt,
    concentrateSalinity: feedSalt / feedVolume,
    permeateSalinity: permeateVolume ? permeateSalt / permeateVolume : 0,
    recovery: permeateVolume / 100,
    flux: membraneFlux(pressure, feedSalt / feedVolume),
  };
}
export function distillSeawater(progress: number, cooling = true) {
  const evaporated = 30 * clamp(progress),
    collected = cooling ? evaporated : 0;
  return {
    initialWater: 100,
    salt: 3.5,
    remainingWater: 100 - evaporated,
    vapour: evaporated - collected,
    collected,
    productSalt: 0,
  };
}
export const membraneClasses = ['MF', 'UF', 'NF', 'RO'] as const;
export type MembraneClass = (typeof membraneClasses)[number];
export const passage: Record<MembraneClass, number[]> = {
  MF: [0, 0.9, 1, 1],
  UF: [0, 0.02, 1, 1],
  NF: [0, 0.01, 0.4, 1],
  RO: [0, 0, 0.005, 1],
};
export function membranePartition(kind: MembraneClass, recovery: number) {
  const r = clamp(recovery, 0, 0.8),
    initial = [1, 1, 1, 10];
  return initial.map((amount, i) => ({
    kind: i,
    initial: amount,
    permeate: amount * r * passage[kind][i],
    retentate: amount * (1 - r * passage[kind][i]),
  }));
}
export function seawaterDirector(chapter: number, progress: number) {
  const c = Math.floor(clamp(chapter, 0, 7)),
    p = clamp(progress);
  return {
    chapter: c,
    p,
    pressure: c === 1 ? 0 : c === 2 ? 60 * p : 60,
    salinity: 35,
    hours: c === 3 ? 1.5 * p : 1.5,
    recovery: c === 7 ? 0.6 * p : 0.5,
  };
}
