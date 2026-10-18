export type Sample = 'ethanal' | 'acetone';
export type Metal = 'silver' | 'copper';
export const clamp = (p: number) => Math.max(0, Math.min(1, p));
export function reagentPreparation(progress: number) {
  const p = clamp(progress),
    oxide = p < 0.45 ? p / 0.45 : Math.max(0, (0.85 - p) / 0.4);
  return { oxide, complex: p < 0.45 ? 0 : clamp((p - 0.45) / 0.4), ready: p >= 0.85 };
}
export function redox(
  metal: Metal,
  sample: Sample,
  progress: number,
  metalAmount = 2,
  heated = true,
) {
  const extent =
    sample === 'ethanal' && heated
      ? clamp(progress) * Math.min(1, Math.max(0, metalAmount) / 2)
      : 0;
  return {
    aldehyde: sample === 'ethanal' ? 1 - extent : 0,
    acetone: sample === 'acetone' ? 1 : 0,
    carboxylate: extent,
    oxidizedMetal: metalAmount - 2 * extent,
    reducedMetal: 2 * extent,
    solidUnits: metal === 'silver' ? 2 * extent : extent,
    electrons: 2 * extent,
    carbonOxidation: 1 + 2 * extent,
  };
}
export function metalMarkers(metal: Metal, progress: number) {
  const p = clamp(progress);
  return Array.from({ length: 12 }, (_, i) => {
    const initial = { x: 69 + ((i * 19) % 62), y: 120 + ((i * 17) % 79) },
      pair = Math.floor(i / 2),
      target =
        metal === 'silver'
          ? { x: i % 2 ? 141 : 59, y: 110 + pair * 16 }
          : { x: 77 + pair * 9 + (i % 2 ? 3 : -3), y: 212 - (pair % 3) * 6 };
    return {
      id: `${metal}-${i}`,
      x: initial.x + (target.x - initial.x) * p,
      y: initial.y + (target.y - initial.y) * p,
      target,
    };
  });
}
export const silverWall = 'M59 92V194Q59 231 100 231T141 194V92';
