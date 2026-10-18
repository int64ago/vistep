export type SodiumView =
  'surface' | 'air' | 'water' | 'peroxide' | 'potassium-air' | 'potassium-water';
export function alkaliWater(extent: number, metal: 'Na' | 'K' = 'Na') {
  const x = Math.max(0, Math.min(1, extent));
  const atomicMass = metal === 'Na' ? 22.98977 : 39.0983;
  return {
    extent: x,
    metal,
    remainingMoles: 1 - x,
    hydrogenMoles: x / 2,
    hydroxideMoles: x,
    metalMass: atomicMass * (1 - x),
    waterConsumed: 18.01528 * x,
    hydroxideMass: (atomicMass + 17.00734) * x,
    hydrogenMass: (2.01588 * x) / 2,
    radiusFraction: Math.cbrt(1 - x),
    density: metal === 'Na' ? 0.97 : 0.89,
  };
}
export function peroxideWater(extent: number) {
  const x = Math.max(0, Math.min(1, extent));
  return { extent: x, remainingMoles: 1 - x, hydroxideMoles: 2 * x, oxygenMoles: x / 2 };
}
/** Fraction of sphere diameter below a flat liquid surface, neglecting gas support and capillarity. */
export function immersedSphere(densityRatio: number) {
  let lo = 0,
    hi = 2;
  const target = Math.max(0, Math.min(1, densityRatio));
  for (let i = 0; i < 60; i++) {
    const h = (lo + hi) / 2,
      volume = (3 * h * h - h * h * h) / 4;
    if (volume < target) lo = h;
    else hi = h;
  }
  return (lo + hi) / 4;
}
export function sodiumDirector(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress)),
    views: SodiumView[] = [
      'surface',
      'air',
      'water',
      'water',
      'peroxide',
      'peroxide',
      'potassium-air',
      'potassium-water',
    ];
  return {
    view: views[Math.max(0, Math.min(7, chapter))],
    progress: p,
    extent:
      chapter === 2
        ? Math.min(0.65, p * 0.65)
        : chapter === 3
          ? 0.65 + p * 0.35
          : chapter === 5
            ? 1
            : p,
    evidence: chapter === 3 || chapter === 5,
    cut: Math.min(1, p / 0.35),
    oxidation: Math.max(0, (p - 0.4) / 0.6),
    melt: chapter === 1 ? Math.min(1, p / 0.3) : Math.min(1, p / 0.25),
  };
}
