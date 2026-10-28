/** Textbook idealization: hot sealing at atmospheric pressure, then fixed n and V.
 * Air entry is a prescribed, quasi-static pressure interpolation, not a flow-rate law. */
export const BOWL_AMBIENT = 100000;
export const BOWL_SEAL_C = 149.5;
const bounded = (x: number, min: number, max: number, fallback: number) =>
  Number.isFinite(x) ? Math.max(min, Math.min(max, x)) : fallback;
export function sealedBowls(
  temperatureC: number,
  sealedAtC = BOWL_SEAL_C,
  radius = 0.1,
  pull = 0,
  vented: boolean | number = false,
) {
  const temperature = bounded(temperatureC, -273.149, 10000, 15);
  const sealTemperature = bounded(sealedAtC, -273.149, 10000, BOWL_SEAL_C);
  const r = bounded(radius, 0, 100, 0.1);
  const applied = bounded(pull, 0, 1e12, 0);
  const exchange = typeof vented === 'boolean' ? Number(vented) : bounded(vented, 0, 1, 0);
  const sealedPressure = (BOWL_AMBIENT * (temperature + 273.15)) / (sealTemperature + 273.15);
  const inside = sealedPressure + (BOWL_AMBIENT - sealedPressure) * exchange;
  const area = Math.PI * r * r;
  const outsideForce = BOWL_AMBIENT * area;
  const insideForce = inside * area;
  const closing = outsideForce - insideForce;
  const holding = Math.max(0, closing);
  return {
    temperature,
    sealTemperature,
    radius: r,
    pull: applied,
    exchange,
    inside,
    ambient: BOWL_AMBIENT,
    area,
    outsideForce,
    insideForce,
    closing,
    holding,
    opens: applied > closing,
    contact: Math.max(0, closing - applied),
    openingNet: Math.max(0, applied - closing),
    people: holding / 200,
    /** At equal temperature and approximately fixed volume, current amount / sealed amount. */
    amountRatio: inside / sealedPressure,
  };
}
export function inferSealTemperature(force = 1000, coldC = 15, radius = 0.1) {
  if (
    ![force, coldC, radius].every(Number.isFinite) ||
    force < 0 ||
    coldC <= -273.15 ||
    radius <= 0
  )
    return null;
  const fraction = force / (BOWL_AMBIENT * Math.PI * radius * radius);
  return fraction >= 1 ? null : (coldC + 273.15) / (1 - fraction) - 273.15;
}
export type BowlsState = {
  chapter: number;
  temperature: number;
  pull: number;
  exchange: number;
  gap: number;
  phase: number;
  hotSetup: boolean;
  cooling: boolean;
  prediction: boolean;
};
const ramp = (p: number, a: number, b: number) => bounded((p - a) / (b - a), 0, 1, 0);
/** Measured bilingual speech anchors: close by4.8s, cool by10.8s,
 * release contact at22.5s, and match pressure by15.7s in the final chapter. */
export function bowlsShot(chapter: number, progress: number, chapterTime?: number): BowlsState {
  const c = Math.round(bounded(chapter, 0, 3, 0)),
    p = bounded(progress, 0, 1, 0);
  const time = bounded(chapterTime ?? p * (c === 0 ? 26 : 36), 0, 300, 0);
  const ease = (a: number, b: number) => {
    const x = ramp(time, a, b);
    return x * x * (3 - 2 * x);
  };
  const s: BowlsState = {
    chapter: c,
    temperature: 15,
    pull: 0,
    exchange: 0,
    gap: 0,
    phase: p,
    hotSetup: false,
    cooling: false,
    prediction: false,
  };
  if (c === 0)
    return { ...s, temperature: BOWL_SEAL_C, gap: 22 * (1 - ease(3.2, 4.8)), hotSetup: time < 4.8 };
  if (c === 1)
    return { ...s, temperature: BOWL_SEAL_C - 134.5 * ease(0.8, 10.8), cooling: time < 10.8 };
  if (c === 2) {
    const critical = sealedBowls(15).holding;
    // Reach the rounded textbook1000N estimate at marginal equilibrium; then exceed it.
    const pull = 200 + (critical - 200) * ease(9.2, 16) + (1000 - critical) * ease(22.5, 23.2);
    return {
      ...s,
      pull,
      gap: sealedBowls(15, BOWL_SEAL_C, 0.1, pull).opens ? 2 * ease(22.5, 24) : 0,
    };
  }
  const exchange = ease(9.2, 15.7);
  const pressure = sealedBowls(15, BOWL_SEAL_C, 0.1, 800, exchange);
  return {
    ...s,
    pull: 800,
    exchange,
    prediction: true,
    gap: time <= 9.2 ? 0 : 2 * ease(9.2, 9.7) + (pressure.opens ? 22 * ease(10.8, 17.7) : 0),
  };
}
/** Matched trial: temperature and each-side pull are identical; only air entry changes. */
export function bowlsTrial(
  s: BowlsState,
  patch: Partial<Pick<BowlsState, 'temperature' | 'pull' | 'exchange'>>,
): BowlsState {
  const state = { ...s, ...patch, hotSetup: false, cooling: false, phase: 0.5 };
  const pressure = sealedBowls(state.temperature, BOWL_SEAL_C, 0.1, state.pull, state.exchange);
  return {
    ...state,
    temperature: pressure.temperature,
    pull: pressure.pull,
    exchange: pressure.exchange,
    gap: pressure.opens
      ? pressure.exchange === 1 || pressure.inside === pressure.ambient
        ? 24
        : 2 + 22 * pressure.exchange
      : pressure.exchange > 0
        ? 2
        : 0,
  };
}
/** Surface-normal vectors. Components integrate to ±pπr², not p·2πr². */
export function bowlPressureArrow(
  side: -1 | 1,
  angle: number,
  gap: number,
  pressure: number,
  inside: boolean,
) {
  const nx = side * Math.cos(angle),
    ny = Math.sin(angle),
    x = 140 + (side * gap) / 2 + 53 * nx,
    y = 78 + 53 * ny;
  const length = (Math.max(0, pressure) / BOWL_AMBIENT) * 18;
  return {
    x1: x + (inside ? -1 : 1) * length * nx,
    y1: y + (inside ? -1 : 1) * length * ny,
    x2: x,
    y2: y,
    nx,
    ny,
  };
}
