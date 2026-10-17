/** NIST Monograph 175, type K ITS-90 coefficients; returned EMF is in millivolts. */
const pos = [
  -0.017600413686, 0.038921204975, 0.000018558770032, -9.9457592874e-8, 3.1840945719e-10,
  -5.6072844889e-13, 5.6075059059e-16, -3.2020720003e-19, 9.7151147152e-23, -1.2104721275e-26,
];
const neg = [
  0, 0.039450128025, 0.000023622373598, -3.2858906784e-7, -4.9904828777e-9, -6.7509059173e-11,
  -5.7410327428e-13, -3.1088872894e-15, -1.0451609365e-17, -1.9889266878e-20, -1.6322697486e-23,
];
const polynomial = (c: number[], t: number) => c.reduceRight((s, a) => s * t + a, 0);
export function typeKEmf(temperature: number): number {
  if (!Number.isFinite(temperature) || temperature < -200 || temperature > 1372)
    throw new RangeError('Type K reference function range exceeded');
  if (temperature === 0) return 0;
  return temperature < 0
    ? polynomial(neg, temperature)
    : polynomial(pos, temperature) +
        0.1185976 * Math.exp(-0.0001183432 * (temperature - 126.9686) ** 2);
}
export function typeKTemperature(emf: number): number {
  if (!Number.isFinite(emf) || emf < typeKEmf(-200) || emf > typeKEmf(1372))
    throw new RangeError('Type K inverse range exceeded');
  let lo = -200,
    hi = 1372;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (typeKEmf(mid) < emf) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
export interface ThermocoupleParameters {
  hot: number;
  cold: number;
  sensedCold: number;
  profile: number;
  bridge: boolean;
}
export const thermocoupleDefaults = (): ThermocoupleParameters => ({
  hot: 400,
  cold: 25,
  sensedCold: 25,
  profile: 0,
  bridge: false,
});
export function thermocouple(p: ThermocoupleParameters) {
  if (
    ![p.hot, p.cold, p.sensedCold, p.profile].every(Number.isFinite) ||
    p.hot < 0 ||
    p.hot > 600 ||
    p.cold < 0 ||
    p.cold > 120 ||
    p.sensedCold < 0 ||
    p.sensedCold > 120 ||
    p.profile < 0 ||
    p.profile > 1
  )
    throw new RangeError('Teaching temperature range exceeded');
  const measured = typeKEmf(p.hot) - typeKEmf(p.cold),
    correction = typeKEmf(p.sensedCold),
    corrected = measured + correction;
  return {
    ...p,
    measured,
    correction,
    corrected,
    naive: typeKTemperature(measured),
    indicated: typeKTemperature(corrected),
    bridgeContribution: 0,
  };
}
/** Same endpoint temperatures, with the gradient concentrated nearer the hot junction as a increases. */
export function thermocoupleProfile(x: number, p: ThermocoupleParameters) {
  const u = Math.max(0, Math.min(1, x));
  return p.cold + (p.hot - p.cold) * ((1 - p.profile) * u + p.profile * u ** 4);
}
export function thermocoupleSegments(p: ThermocoupleParameters, count = 32) {
  return Array.from({ length: count }, (_, i) => {
    const x0 = i / count,
      x1 = (i + 1) / count,
      t0 = thermocoupleProfile(x0, p),
      t1 = thermocoupleProfile(x1, p);
    return { x0, x1, t0, t1, emf: typeKEmf(t1) - typeKEmf(t0) };
  });
}
export function thermocoupleShot(chapter: number, progress: number) {
  const u = Math.max(0, Math.min(1, progress)),
    p = thermocoupleDefaults();
  if (chapter === 0) p.hot = 25;
  if (chapter === 1) p.hot = 25 + 375 * u;
  if (chapter === 2 || chapter === 3) {
    p.cold = 25 + 75 * u;
    p.sensedCold = p.cold;
  }
  if (chapter === 4) p.bridge = true;
  if (chapter === 5) p.profile = u;
  return thermocouple(p);
}
