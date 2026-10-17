/** DC nodal solution, linear positive resistors and ideal excitation. A finite
 * detector resistance is included; Infinity selects an ideal open-circuit meter. */
export interface BridgeParameters {
  supply: number;
  r1: number;
  r2: number;
  r3: number;
  r4: number;
  meter: number;
}
export const bridgeDefaults = (): BridgeParameters => ({
  supply: 5,
  r1: 1000,
  r2: 1000,
  r3: 1000,
  r4: 1000,
  meter: 1000,
});
export function bridgeState(p: BridgeParameters) {
  if (
    ![p.supply, p.r1, p.r2, p.r3, p.r4].every(Number.isFinite) ||
    p.supply < 0 ||
    [p.r1, p.r2, p.r3, p.r4, p.meter].some((r) => r <= 0) ||
    (!Number.isFinite(p.meter) && p.meter !== Infinity)
  )
    throw new RangeError('Nonnegative finite supply and positive resistances required');
  const g = 1 / p.meter,
    a = 1 / p.r1 + 1 / p.r2 + g,
    b = 1 / p.r3 + 1 / p.r4 + g,
    det = a * b - g * g;
  const va = ((p.supply / p.r1) * b + (g * p.supply) / p.r3) / det,
    vb = ((p.supply / p.r3) * a + (g * p.supply) / p.r1) / det;
  const i1 = (p.supply - va) / p.r1,
    i2 = va / p.r2,
    i3 = (p.supply - vb) / p.r3,
    i4 = vb / p.r4,
    im = (va - vb) * g;
  const sourceCurrent = i1 + i3,
    sourcePower = p.supply * sourceCurrent,
    dissipation =
      i1 * i1 * p.r1 +
      i2 * i2 * p.r2 +
      i3 * i3 * p.r3 +
      i4 * i4 * p.r4 +
      (g ? im * im * p.meter : 0);
  return {
    va,
    vb,
    difference: va - vb,
    i1,
    i2,
    i3,
    i4,
    im,
    sourceCurrent,
    sourcePower,
    dissipation,
    balanced: Math.abs(p.r1 * p.r4 - p.r2 * p.r3) < 1e-8,
  };
}
export function bridgeShot(chapter: number, progress: number) {
  const u = Math.max(0, Math.min(1, progress)),
    e = u * u * (3 - 2 * u),
    p = bridgeDefaults();
  if (chapter === 2) p.r4 = 1000 + 1000 * e;
  if (chapter === 3) {
    p.r4 = 2000;
    p.r2 = 1000 + 1000 * e;
  }
  if (chapter === 4) {
    p.r2 = p.r4 = 2000;
    p.supply = 5 + 5 * e;
  }
  if (chapter === 5) {
    p.r4 = 2000;
    p.meter = 100 * 10 ** (4 * e);
  }
  return p;
}
