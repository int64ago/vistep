export type HydrogenOrbital = '1s' | '2s' | '2p';
export function radialProbability(orbital: HydrogenOrbital, r: number) {
  const x = Math.max(0, r);
  return orbital === '1s'
    ? 4 * x * x * Math.exp(-2 * x)
    : orbital === '2s'
      ? (x * x * (2 - x) ** 2 * Math.exp(-x)) / 8
      : (x ** 4 * Math.exp(-x)) / 24;
}
export function radialCdf(orbital: HydrogenOrbital, r: number) {
  const x = Math.max(0, r);
  return Math.max(
    0,
    Math.min(
      1,
      orbital === '1s'
        ? 1 - Math.exp(-2 * x) * (1 + 2 * x + 2 * x * x)
        : orbital === '2s'
          ? 1 - (Math.exp(-x) * (x ** 4 + 4 * x * x + 8 * x + 8)) / 8
          : 1 - Math.exp(-x) * (1 + x + (x * x) / 2 + x ** 3 / 6 + x ** 4 / 24),
    ),
  );
}
export function orbitalRadius(orbital: HydrogenOrbital, probability = 0.9) {
  const p = Math.max(0.001, Math.min(0.999, probability));
  let lo = 0,
    hi = 40;
  for (let i = 0; i < 60; i++) {
    const m = (lo + hi) / 2;
    if (radialCdf(orbital, m) < p) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
}
function radicalInverse(i: number, base: number) {
  let x = 0,
    f = 1 / base;
  while (i) {
    x += (i % base) * f;
    i = Math.floor(i / base);
    f /= base;
  }
  return x;
}
/** Deterministic samples of 3D |psi|², not positions along one trajectory. Distances in a0. */
export function orbitalSamples(orbital: HydrogenOrbital, count = 900) {
  return Array.from({ length: count }, (_, i) => {
    const r = orbitalRadius(orbital, radicalInverse(i + 1, 2)),
      u = 2 * radicalInverse(i + 1, 3) - 1,
      c = orbital === '2p' ? Math.cbrt(u) : u,
      s = Math.sqrt(1 - c * c),
      phi = 2 * Math.PI * radicalInverse(i + 1, 5);
    return { r, x: r * s * Math.cos(phi), y: r * c, z: r * s * Math.sin(phi) };
  });
}
export const ORBITAL_SAMPLES = {
  '1s': orbitalSamples('1s'),
  '2s': orbitalSamples('2s'),
  '2p': orbitalSamples('2p'),
};
export function projectOrbital(
  p: { x: number; y: number; z: number },
  axis: 'x' | 'y' | 'z' = 'y',
) {
  const v =
    axis === 'x' ? { x: p.y, y: p.x, z: p.z } : axis === 'z' ? { x: p.x, y: p.z, z: p.y } : p;
  const cy = Math.cos(0.6),
    sy = Math.sin(0.6),
    cp = Math.cos(0.4),
    sp = Math.sin(0.4);
  return { x: cy * v.x - sy * v.z, y: sp * sy * v.x + cp * v.y + sp * cy * v.z };
}
export function bohrHydrogen(n: number) {
  const level = Math.max(1, Math.min(4, Math.round(n)));
  return { n: level, radius: level ** 2, energy: -13.605693 / level ** 2 };
}
export function atomicDirector(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  return {
    chapter,
    progress: p,
    orbital: (chapter === 6 ? '2s' : chapter === 7 ? '2p' : '1s') as HydrogenOrbital,
    probability: chapter === 5 ? 0.5 + 0.4 * p : 0.9,
    count: chapter === 4 ? Math.max(1, Math.round(900 * p)) : 900,
    contour: chapter === 5 || chapter === 6,
    bohrN: chapter === 3 && p < 0.5 ? 2 : 1,
  };
}
