/** Stoichiometric closed-portion account; flame and aerosol appearance are qualitative. */
export function hydrogenChlorine(extent: number, moistAir = true) {
  const x = Math.max(0, Math.min(1, Number.isFinite(extent) ? extent : 0));
  return {
    extent: x,
    hydrogen: 1 - x,
    chlorine: 1 - x,
    hydrogenChloride: 2 * x,
    hydrogenAtoms: 2 * (1 - x) + 2 * x,
    chlorineAtoms: 2 * (1 - x) + 2 * x,
    enthalpyKJ: -184.62 * x,
    fog: moistAir && x > 0,
    flame: x > 0 && x < 1,
  };
}
export function hclAtoms(extent: number) {
  const p = Math.max(0, Math.min(1, extent));
  return [
    { id: 'h1', element: 'H', x: 80 + 40 * p, y: 100 },
    { id: 'h2', element: 'H', x: 110 + 130 * p, y: 100 - 55 * Math.sin(Math.PI * p) },
    { id: 'cl1', element: 'Cl', x: 280 - 130 * p, y: 100 + 55 * Math.sin(Math.PI * p) },
    { id: 'cl2', element: 'Cl', x: 330 - 60 * p, y: 100 },
  ];
}
export function hydrogenChlorineDirector(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  return {
    view: chapter === 0 ? 'flame' : chapter === 1 ? 'fog' : 'molecules',
    extent: chapter === 0 ? 0.05 + 0.9 * p : chapter === 1 ? 1 : p,
    moist: chapter === 1,
    progress: p,
  };
}
