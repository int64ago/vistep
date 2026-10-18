/** Negative oil drop; downward is positive. SI throughout, except named UI inputs. */
export type OilDropParameters = {
  radius: number;
  chargeMagnitude: number;
  gap: number;
  oilDensity: number;
  airDensity: number;
  viscosity: number;
  pressure: number;
  slipB: number;
  gravity: number;
};
export const OIL_DROP_DEFAULTS: Readonly<OilDropParameters> = Object.freeze({
  radius: 0.8e-6,
  chargeMagnitude: 6.4e-19,
  gap: 0.005,
  oilDensity: 860,
  airDensity: 1.225,
  viscosity: 1.81e-5,
  pressure: 101325,
  slipB: 8.2e-3,
  gravity: 9.8,
});
export const MODERN_ELEMENTARY_CHARGE = 1.602176634e-19;
export const OIL_RETICLE_DISTANCE = 0.0005;
export const oilClamp = (v: number, lo: number, hi: number, fallback = lo) =>
  Math.max(lo, Math.min(hi, Number.isFinite(v) ? v : fallback));
export function oilParameters(p: Partial<OilDropParameters> = {}): OilDropParameters {
  const d = OIL_DROP_DEFAULTS;
  return {
    radius: oilClamp(p.radius ?? d.radius, 0.2e-6, 3e-6, d.radius),
    chargeMagnitude: oilClamp(p.chargeMagnitude ?? d.chargeMagnitude, 0, 3e-18, d.chargeMagnitude),
    gap: oilClamp(p.gap ?? d.gap, 0.002, 0.02, d.gap),
    oilDensity: oilClamp(p.oilDensity ?? d.oilDensity, 500, 1500, d.oilDensity),
    airDensity: oilClamp(p.airDensity ?? d.airDensity, 0, 10, d.airDensity),
    viscosity: oilClamp(p.viscosity ?? d.viscosity, 1e-6, 1e-4, d.viscosity),
    pressure: oilClamp(p.pressure ?? d.pressure, 10000, 200000, d.pressure),
    slipB: oilClamp(p.slipB ?? d.slipB, 0, 0.02, d.slipB),
    gravity: oilClamp(p.gravity ?? d.gravity, 1, 20, d.gravity),
  };
}
export function oilDropPhysics(input: Partial<OilDropParameters> = {}) {
  const p = oilParameters(input),
    volume = (4 * Math.PI * p.radius ** 3) / 3,
    mass = volume * p.oilDensity,
    weight = volume * (p.oilDensity - p.airDensity) * p.gravity,
    slip = 1 + p.slipB / (p.pressure * p.radius),
    drag = (6 * Math.PI * p.viscosity * p.radius) / slip,
    tau = mass / drag,
    fallSpeed = weight / drag;
  return {
    ...p,
    volume,
    mass,
    weight,
    slip,
    drag,
    tau,
    fallSpeed,
    balanceVoltage: p.chargeMagnitude > 0 ? (weight * p.gap) / p.chargeMagnitude : null,
  };
}
/** Velocity input safety bound ±100m/s exceeds every terminal speed in the accepted parameter domain.
 * Do not clamp at a typical microscope speed: legitimate transients can exceed0.1m/s. */
export function oilForces(
  voltage: number,
  velocity: number,
  input: Partial<OilDropParameters> = {},
) {
  const p = oilDropPhysics(input),
    U = oilClamp(voltage, -600, 600),
    v = oilClamp(velocity, -100, 100),
    field = U / p.gap,
    electric = -p.chargeMagnitude * field,
    viscous = -p.drag * v,
    net = p.weight + electric + viscous;
  return {
    weight: p.weight,
    electric,
    viscous,
    net,
    field,
    acceleration: net / p.mass,
    terminal: (p.weight + electric) / p.drag,
  };
}
export type OilState = { y: number; v: number; contact: 'top' | 'bottom' | null };
/** Exact solution for a constant voltage interval; not current terminal speed × total time. */
export function oilStep(
  initial: Pick<OilState, 'y' | 'v'>,
  seconds: number,
  voltage: number,
  input: Partial<OilDropParameters> = {},
): OilState {
  const p = oilDropPhysics(input),
    dt = oilClamp(seconds, 0, 120),
    v0 = oilClamp(initial.v, -100, 100),
    low = -p.gap / 2 + p.radius,
    high = p.gap / 2 - p.radius,
    y0 = oilClamp(initial.y, low, high),
    vt = oilForces(voltage, v0, p).terminal;
  if ((y0 <= low && vt <= 0) || (y0 >= high && vt >= 0))
    return { y: y0, v: 0, contact: y0 <= low ? 'top' : 'bottom' };
  const travel = (t: number) => y0 + vt * t + (v0 - vt) * p.tau * -Math.expm1(-t / p.tau);
  // Velocity has at most one zero in a constant-force interval. Check that extremum as well as its end.
  const ratio = -vt / (v0 - vt),
    turn = ratio > 0 && ratio < 1 ? -p.tau * Math.log(ratio) : -1;
  const segments = turn > 0 && turn < dt ? [0, turn, dt] : [0, dt];
  for (let i = 1; i < segments.length; i++) {
    const a = segments[i - 1]!,
      b = segments[i]!,
      end = travel(b);
    if (end < low || end > high) {
      let l = a,
        h = b;
      const bound = end < low ? low : high;
      for (let j = 0; j < 52; j++) {
        const m = (l + h) / 2,
          ym = travel(m);
        if ((end < low && ym < bound) || (end > high && ym > bound)) h = m;
        else l = m;
      }
      const side = end < low ? 'top' : 'bottom';
      if ((side === 'top' && vt > 0) || (side === 'bottom' && vt < 0))
        return oilStep({ y: bound, v: 0 }, dt - h, voltage, p);
      return { y: bound, v: 0, contact: side };
    }
  }
  return { y: travel(dt), v: vt + (v0 - vt) * Math.exp(-dt / p.tau), contact: null };
}
export type VoltageEvent = { at: number; voltage: number };
export function oilTrajectory(
  time: number,
  events: readonly VoltageEvent[],
  input: Partial<OilDropParameters> = {},
  initial: Pick<OilState, 'y' | 'v'> = { y: -OIL_RETICLE_DISTANCE / 2, v: 0 },
) {
  const t = oilClamp(time, 0, 120),
    ordered = events
      .filter((e) => Number.isFinite(e.at) && Number.isFinite(e.voltage) && e.at >= 0)
      .map((e) => ({ ...e }))
      .sort((a, b) => a.at - b.at);
  let state: OilState = { ...initial, contact: null },
    at = 0,
    voltage = 0;
  for (const e of ordered) {
    if (e.at > t) break;
    state = oilStep(state, e.at - at, voltage, input);
    at = e.at;
    voltage = oilClamp(e.voltage, -600, 600);
  }
  state = oilStep(state, t - at, voltage, input);
  const forces = oilForces(voltage, state.v, input),
    support = state.contact ? -forces.net : 0;
  return {
    ...state,
    time: t,
    voltage,
    forces: {
      ...forces,
      support,
      net: forces.net + support,
      acceleration: (forces.net + support) / oilDropPhysics(input).mass,
    },
  };
}
/** Radius inferred from terminal no-field speed, with buoyancy and Cunningham first-order slip. */
export function inferOilRadius(fallSpeed: number, input: Partial<OilDropParameters> = {}) {
  const p = oilParameters(input),
    v = oilClamp(fallSpeed, 0, 0.1),
    A = (9 * p.viscosity * v) / (2 * (p.oilDensity - p.airDensity) * p.gravity),
    B = p.slipB / p.pressure;
  if (A === 0) return 0;
  return (2 * A) / (Math.sqrt(B * B + 4 * A) + B);
}
export function inferOilCharge(
  fallSpeed: number,
  balanceVoltage: number,
  input: Partial<OilDropParameters> = {},
) {
  const radius = inferOilRadius(fallSpeed, input),
    p = oilParameters(input),
    u = oilClamp(balanceVoltage, -600, 600),
    weight = ((4 * Math.PI * radius ** 3) / 3) * (p.oilDensity - p.airDensity) * p.gravity;
  return { radius, weight, chargeMagnitude: u > 0 ? (weight * p.gap) / u : null };
}
export function oilFallObservation(input: Partial<OilDropParameters> = {}) {
  const p = oilDropPhysics(input);
  return {
    distance: OIL_RETICLE_DISTANCE,
    seconds: OIL_RETICLE_DISTANCE / p.fallSpeed,
    speed: p.fallSpeed,
  };
}
export function oilChanges(rates: readonly number[]) {
  return rates.slice(1).map((v, i) => ({
    from: i + 1,
    to: i + 2,
    change: v - rates[i]!,
    magnitude: Math.abs(v - rates[i]!),
  }));
}
/** Fit an explicit lattice candidate to observed changes. Integers are fitted labels, never record inputs. */
export function oilLatticeFit(changes: readonly number[], lower = 0.004, upper = 0.007) {
  const xs = changes.filter((x) => Number.isFinite(x) && x > 0),
    lo = oilClamp(lower, 0.00001, 1, 0.004),
    hi = oilClamp(upper, lo, 1, 0.007);
  if (!xs.length) return { step: lo, counts: [] as number[], residuals: [] as number[], rms: 0 };
  let best = lo,
    loss = Infinity;
  for (let i = 0; i <= 6000; i++) {
    const k = lo + ((hi - lo) * i) / 6000,
      L = xs.reduce((s, x) => s + (x - Math.round(x / k) * k) ** 2, 0);
    if (L < loss) {
      loss = L;
      best = k;
    }
  }
  let counts = xs.map((x) => Math.max(1, Math.round(x / best)));
  best = oilClamp(
    xs.reduce((s, x, i) => s + x * counts[i]!, 0) / counts.reduce((s, n) => s + n * n, 0),
    lo,
    hi,
  );
  counts = xs.map((x) => Math.max(1, Math.round(x / best)));
  const residuals = xs.map((x, i) => x - counts[i]! * best);
  return {
    step: best,
    counts,
    residuals,
    rms: Math.sqrt(residuals.reduce((s, x) => s + x * x, 0) / xs.length),
  };
}
export function oilLatticeResiduals(changes: readonly number[], step: number) {
  const k = oilClamp(step, 1e-7, 1, 0.0054);
  return changes.map((x) => ({
    observed: x,
    count: Math.round(x / k),
    predicted: Math.round(x / k) * k,
    residual: x - Math.round(x / k) * k,
  }));
}
export type OilShot =
  | 'reticle'
  | 'radius-candidates'
  | 'fall-inference'
  | 'plate-field'
  | 'force-balance'
  | 'charge-inference'
  | 'charge-prediction'
  | 'historical-times'
  | 'historical-bridge'
  | 'lattice'
  | 'held-out';
export type OilDirection = {
  shot: OilShot;
  progress: number;
  physicalTime: number;
  voltage: number;
  chargeScale: number;
  reveal: boolean;
  candidateScale: number;
};
export const OIL_CHAPTER_SECONDS = Object.freeze([56, 64, 85.5]);
const ramp = (t: number, a: number, b: number) => oilClamp((t - a) / (b - a), 0, 1);
/** Chapter-relative events from independent word times, with the 0.45 s lead included.
 * Locale cuts change presentation only; every shot uses the same SI trial and fixed records.
 */
export const OIL_WORD_CUTS = Object.freeze({
  zh: Object.freeze({
    fallStart: 5.15,
    fallEnd: 11.11,
    radii: 24.99,
    fallInference: 39.35,
    sameDrop: 7.95,
    rise: 9.41,
    balance: 14.29,
    chargeInference: 21.51,
    chargeAnswer: 31.69,
    predict: 37.47,
    testOldVoltage: 43.43,
    halfVoltage: 48.57,
    predictionEnd: 54.95,
    rawStart: 3.55,
    bridge: 14.79,
    lattice: 33.55,
    doubleStep: 44.25,
    lockStep: 47.47,
    heldOut: 48.99,
    revealRecord: 58.03,
    finerStep: 65.03,
    absoluteLimit: 71.39,
  }),
  en: Object.freeze({
    fallStart: 5.85,
    fallEnd: 13.99,
    radii: 26.95,
    fallInference: 43.79,
    sameDrop: 9.99,
    rise: 11.89,
    balance: 15.65,
    chargeInference: 22.31,
    chargeAnswer: 32.77,
    predict: 39.89,
    testOldVoltage: 44.73,
    halfVoltage: 49.03,
    predictionEnd: 56.41,
    rawStart: 3.43,
    bridge: 14.87,
    lattice: 34.57,
    doubleStep: 46.65,
    lockStep: 48.83,
    heldOut: 50.35,
    revealRecord: 59.59,
    finerStep: 68.05,
    absoluteLimit: 75.07,
  }),
});
export function oilDirector(
  chapter = 0,
  chapterTime = 0,
  locale: 'zh' | 'en' = 'zh',
): OilDirection {
  const c = Math.round(oilClamp(chapter, 0, 2)),
    t = oilClamp(chapterTime, 0, OIL_CHAPTER_SECONDS[c]!),
    cuts = OIL_WORD_CUTS[locale],
    p = oilDropPhysics(),
    U = p.balanceVoltage!,
    fall = oilFallObservation();
  const d: OilDirection = {
    shot: 'reticle',
    progress: 0,
    physicalTime: 0,
    voltage: 0,
    chargeScale: 1,
    reveal: false,
    candidateScale: 1,
  };
  if (c === 0) {
    d.physicalTime = fall.seconds * ramp(t, cuts.fallStart, cuts.fallEnd);
    d.progress = ramp(t, cuts.fallStart, cuts.fallEnd);
    d.reveal = t >= cuts.fallEnd;
    if (t >= cuts.radii) d.shot = t < cuts.fallInference ? 'radius-candidates' : 'fall-inference';
  }
  if (c === 1) {
    d.shot = t < cuts.sameDrop ? 'plate-field' : 'force-balance';
    d.physicalTime =
      t < cuts.rise
        ? ramp(t, cuts.sameDrop, cuts.rise)
        : t < cuts.balance
          ? 1 + 2 * ramp(t, cuts.rise, cuts.balance)
          : 3 + 3 * ramp(t, cuts.balance, cuts.chargeInference);
    d.voltage = d.physicalTime < 1 ? 0 : d.physicalTime < 3 ? U * 1.45 : U;
    if (t >= cuts.chargeInference) {
      d.shot = 'charge-inference';
      d.reveal = t >= cuts.chargeAnswer;
    }
    if (t >= cuts.predict) {
      d.shot = 'charge-prediction';
      d.chargeScale = 2;
      d.reveal = t >= cuts.halfVoltage;
      d.voltage = d.reveal ? U / 2 : U;
      // Hold the newly charged drop's initial condition while the question is spoken.
      // The trial then advances continuously through its old-voltage interval and switch.
      d.physicalTime = d.reveal
        ? 3 + 3 * ramp(t, cuts.halfVoltage, cuts.predictionEnd)
        : 3 * ramp(t, cuts.testOldVoltage, cuts.halfVoltage);
    }
  }
  if (c === 2) {
    d.shot =
      t < cuts.bridge
        ? 'historical-times'
        : t < cuts.lattice
          ? 'historical-bridge'
          : t < cuts.heldOut
            ? 'lattice'
            : 'held-out';
    d.progress = ramp(t, cuts.rawStart, cuts.bridge);
    d.candidateScale = t >= cuts.doubleStep && t < cuts.lockStep ? 2 : 1;
    d.reveal = t >= cuts.revealRecord;
    // Show the finite-data counterexample when it is discussed, with unchanged dots.
    if (t >= cuts.finerStep && t < cuts.absoluteLimit) {
      d.shot = 'lattice';
      d.candidateScale = 0.5;
    }
  }
  return d;
}
