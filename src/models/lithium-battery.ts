/** Graphite / LFP teaching cell: Coulomb counting + one passive polarization RC.
 * SI electrical units; geometry uses explicitly exaggerated display units.
 * I > 0 discharges. No spatial diffusion, phase separation, aging or entropic heat.
 */
export const LITHIUM = Object.freeze({
  charge: 3600,
  faraday: 96485.33212,
  r0: 0.04,
  rp: 0.03,
  tau: 45,
  capacitance: 1500,
  lowVoltage: 2.8,
  highVoltage: 3.6,
  initialSoc: 0.85,
  duration: 176,
  tracers: 18,
});
export type LithiumPoint = [number, number, number];
export type LithiumCutoff = 'empty' | 'full' | 'voltage-low' | 'voltage-high' | null;
export type LithiumState = {
  soc: number;
  polarization: number;
  elapsed: number;
  chargeOut: number;
  heat: number;
  energyOut: number;
  energyIn: number;
  current: number;
  cutoff: LithiumCutoff;
};
export type LithiumView =
  'layers' | 'paths' | 'separator' | 'inventory' | 'power' | 'rest' | 'charge' | 'limit';
export type LithiumShot = {
  view: LithiumView;
  state: LithiumState;
  before: LithiumState;
  requested: number;
  localTime: number;
  span: number;
  reveal: number;
  chapter: number;
  progress: number;
  values: ReturnType<typeof lithiumReadout>;
};
const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const finite = (...xs: number[]) => xs.every(Number.isFinite);
const smooth = (p: number) => {
  const x = clamp(p);
  return x * x * (3 - 2 * x);
};
export function lithiumInitial(soc: number = LITHIUM.initialSoc): LithiumState {
  if (!finite(soc) || soc < 0 || soc > 1) throw new RangeError('SOC must be in [0,1]');
  return {
    soc,
    polarization: 0,
    elapsed: 0,
    chargeOut: 0,
    heat: 0,
    energyOut: 0,
    energyIn: 0,
    current: 0,
    cutoff: null,
  };
}
/** Deliberately authored LFP-like plateau, not a fit to a commercial cell. */
export function lithiumOcv(soc: number) {
  if (!finite(soc) || soc < 0 || soc > 1) throw new RangeError('SOC');
  const x = 2 * soc - 1;
  return 3.3 + 0.08 * x + 0.14 * x ** 9;
}
/** Integral Q∫₀ᶻ U(s)ds; zero is the modeled lower usable endpoint, not no lithium. */
export function lithiumChemicalEnergy(soc: number) {
  lithiumOcv(soc);
  const x = 2 * soc - 1;
  return LITHIUM.charge * (3.3 * soc + (0.04 * (x * x - 1)) / 2 + 0.007 * (x ** 10 - 1));
}
export function lithiumInventory(soc: number) {
  lithiumOcv(soc);
  const x = 0.05 + 0.9 * soc,
    y = 0.95 - 0.9 * soc,
    hostMoles = LITHIUM.charge / (0.9 * LITHIUM.faraday);
  return {
    x,
    y,
    negativeMoles: x * hostMoles,
    positiveMoles: y * hostMoles,
    totalMoles: hostMoles,
  };
}
export function lithiumReadout(s: LithiumState) {
  const u = lithiumOcv(s.soc),
    i = s.current,
    p = s.polarization,
    voltage = u - LITHIUM.r0 * i - p,
    polarizationEnergy = 0.5 * LITHIUM.capacitance * p * p,
    ohmicHeat = LITHIUM.r0 * i * i,
    relaxationHeat = (p * p) / LITHIUM.rp;
  return {
    ocv: u,
    voltage,
    current: i,
    terminalPower: voltage * i,
    ohmicDrop: LITHIUM.r0 * i,
    polarizationDrop: p,
    ohmicHeat,
    relaxationHeat,
    heatPower: ohmicHeat + relaxationHeat,
    chemicalEnergy: lithiumChemicalEnergy(s.soc),
    polarizationEnergy,
    chemicalRate: -u * i,
    polarizationRate: p * i - relaxationHeat,
    ionMolesPerSecond: i / LITHIUM.faraday,
    inventory: lithiumInventory(s.soc),
  };
}
function check(s: LithiumState, current: number, seconds: number) {
  if (
    !finite(
      ...Object.values(s).filter((v): v is number => typeof v === 'number'),
      current,
      seconds,
    ) ||
    s.soc < 0 ||
    s.soc > 1 ||
    Math.abs(s.polarization) > 0.5 ||
    Math.abs(current) > 2.5 ||
    seconds < 0 ||
    seconds > 7200
  )
    throw new RangeError('Bounded finite cell state, |I| ≤ 2.5 A, 0 ≤ t ≤ 7200 s required');
}
/** Exact constant-current evolution before any cutoff. Heat is integrated analytically. */
function on(s: LithiumState, current: number, seconds: number): LithiumState {
  const b = LITHIUM.rp * current,
    a = s.polarization - b,
    e = Math.exp(-seconds / LITHIUM.tau),
    p = b + a * e,
    soc = clamp(s.soc - (current * seconds) / LITHIUM.charge);
  const integral =
    b * b * seconds +
    2 * b * a * LITHIUM.tau * -Math.expm1(-seconds / LITHIUM.tau) +
    ((a * a * LITHIUM.tau) / 2) * -Math.expm1((-2 * seconds) / LITHIUM.tau);
  const heat = LITHIUM.r0 * current * current * seconds + Math.max(0, integral) / LITHIUM.rp;
  const transferred =
    lithiumChemicalEnergy(s.soc) -
    lithiumChemicalEnergy(soc) +
    0.5 * LITHIUM.capacitance * (s.polarization * s.polarization - p * p) -
    heat;
  return {
    soc,
    polarization: p,
    elapsed: s.elapsed + seconds,
    chargeOut: s.chargeOut + current * seconds,
    heat: s.heat + heat,
    energyOut: s.energyOut + (current > 0 ? Math.max(0, transferred) : 0),
    energyIn: s.energyIn + (current < 0 ? Math.max(0, -transferred) : 0),
    current,
    cutoff: null,
  };
}
function voltageAt(s: LithiumState, current: number, time: number) {
  const p =
    LITHIUM.rp * current + (s.polarization - LITHIUM.rp * current) * Math.exp(-time / LITHIUM.tau);
  return lithiumOcv(clamp(s.soc - (current * time) / LITHIUM.charge)) - LITHIUM.r0 * current - p;
}
/** Current is latched off for the remainder of this commanded segment at a boundary.
 * Voltage limits are illustrative controller thresholds, not charging instructions.
 */
export function lithiumAdvance(s: LithiumState, current: number, seconds: number): LithiumState {
  check(s, current, seconds);
  if (current === 0) return on(s, 0, seconds);
  const capacityTime = ((current > 0 ? s.soc : 1 - s.soc) * LITHIUM.charge) / Math.abs(current);
  let active = Math.min(seconds, capacityTime),
    reason: LithiumCutoff = capacityTime <= seconds ? (current > 0 ? 'empty' : 'full') : null;
  const blocked = (time: number): LithiumCutoff => {
    const v = voltageAt(s, current, time);
    return current > 0 && v <= LITHIUM.lowVoltage
      ? 'voltage-low'
      : current < 0 && v >= LITHIUM.highVoltage
        ? 'voltage-high'
        : null;
  };
  if (blocked(0)) {
    reason = blocked(0);
    active = 0;
  } else {
    // At most 720 samples; intervals shorter than τ/4 bracket the first threshold.
    const n = Math.max(1, Math.ceil(active / 10));
    let previous = 0;
    for (let j = 1; j <= n; j++) {
      const time = (active * j) / n,
        hit = blocked(time);
      if (hit) {
        let low = previous,
          high = time;
        for (let k = 0; k < 42; k++) {
          const mid = (low + high) / 2;
          if (blocked(mid)) high = mid;
          else low = mid;
        }
        active = high;
        reason = hit;
        break;
      }
      previous = time;
    }
  }
  const driven = on(s, current, active),
    rest = reason ? on(driven, 0, Math.max(0, seconds - active)) : driven;
  return { ...rest, cutoff: reason };
}
export function lithiumProgram(
  initialSoc: number,
  segments: readonly { current: number; seconds: number }[],
) {
  if (segments.length > 24) throw new RangeError('At most 24 segments');
  let state = lithiumInitial(initialSoc);
  for (const part of segments) state = lithiumAdvance(state, part.current, part.seconds);
  return state;
}
export const LITHIUM_FILM: readonly { view: LithiumView; current: number; seconds: number }[] = [
  { view: 'layers', current: 0, seconds: 0 },
  { view: 'paths', current: 1, seconds: 180 },
  { view: 'separator', current: 1, seconds: 360 },
  { view: 'inventory', current: 1, seconds: 1260 },
  { view: 'power', current: 2.5, seconds: 90 },
  { view: 'rest', current: 0, seconds: 180 },
  { view: 'charge', current: -1, seconds: 2025 },
  { view: 'limit', current: -1, seconds: 1200 },
];
export function lithiumShot(chapter: number, progress: number): LithiumShot {
  if (!finite(chapter, progress)) throw new RangeError('chapter/progress');
  const c = Math.round(clamp(chapter, 0, 7)),
    p = clamp(progress),
    stage = LITHIUM_FILM[c],
    before = lithiumProgram(LITHIUM.initialSoc, LITHIUM_FILM.slice(0, c)),
    localTime = stage.seconds * smooth(clamp((p - 0.06) / 0.88)),
    state = lithiumAdvance(before, stage.current, localTime);
  return {
    view: stage.view,
    state,
    before,
    requested: stage.current,
    localTime,
    span: stage.seconds,
    reveal: c === 0 ? smooth(p) : 1,
    chapter: c,
    progress: p,
    values: lithiumReadout(state),
  };
}
export function lithiumManual(
  soc: number,
  rate: number,
  time: number,
  mode: 'discharge' | 'charge' | 'rest',
  view: LithiumView,
): LithiumShot {
  const before =
      mode === 'rest' ? lithiumAdvance(lithiumInitial(soc), rate, 120) : lithiumInitial(soc),
    requested = mode === 'charge' ? -rate : mode === 'rest' ? 0 : rate,
    state = lithiumAdvance(before, requested, time);
  return {
    view: mode === 'rest' ? 'rest' : mode === 'charge' && view === 'paths' ? 'charge' : view,
    state,
    before,
    requested,
    localTime: time,
    span: mode === 'rest' ? 300 : 3600,
    reveal: 1,
    chapter: 0,
    progress: 0,
    values: lithiumReadout(state),
  };
}

export const LITHIUM_GEOMETRY = Object.freeze({
  negativeCollector: -1.25,
  positiveCollector: 1.25,
  separatorHalf: 0.12,
  halfHeight: 1.25,
  halfDepth: 0.5,
  terminalY: 1.5,
  wireY: 2.05,
  wireRadius: 0.025,
});
export function lithiumGeometry() {
  const g = LITHIUM_GEOMETRY,
    negative: LithiumPoint[] = [],
    positive: LithiumPoint[] = [];
  for (let row = 0; row < 6; row++)
    for (let column = 0; column < 3; column++) {
      const y = -1.02 + row * 0.4;
      negative.push([-0.98 + column * 0.3, y, -0.12]);
      positive.push([0.98 - column * 0.3, y, -0.12]);
    }
  const external: LithiumPoint[] = [
    [g.negativeCollector, g.terminalY, 0],
    [-1.55, g.terminalY, 0],
    [-1.55, g.wireY, 0],
    [-0.34, g.wireY, 0],
    [0.34, g.wireY, 0],
    [1.55, g.wireY, 0],
    [1.55, g.terminalY, 0],
    [g.positiveCollector, g.terminalY, 0],
  ];
  const bounds: LithiumPoint[] = [];
  for (const x of [-1.62, 1.62])
    for (const y of [-1.34, 2.27]) for (const z of [-0.56, 0.57]) bounds.push([x, y, z]);
  const pores = negative
    .filter((_, i) => i % 3 === 0)
    .flatMap((p) =>
      [-0.3, 0.05, 0.4].map((z) => ({
        center: [0, p[1] + 0.18, z] as LithiumPoint,
        radius: 0.078,
      })),
    );
  return { negative, positive, external, bounds, pores };
}
/** Deterministic polyline arclength interpolation. No wrap or respawn at either end. */
export function lithiumPath(points: readonly LithiumPoint[], fraction: number): LithiumPoint {
  if (!Number.isFinite(fraction) || points.length < 2) throw new RangeError('path');
  const lengths = points.slice(1).map((b, i) => Math.hypot(...b.map((v, k) => v - points[i][k]))),
    total = lengths.reduce((a, b) => a + b, 0);
  let remaining = clamp(fraction) * total;
  for (let i = 0; i < lengths.length; i++) {
    if (remaining <= lengths[i] || i === lengths.length - 1) {
      const q = lengths[i] > 0 ? clamp(remaining / lengths[i]) : 0;
      return points[i].map((v, k) => v + (points[i + 1][k] - v) * q) as LithiumPoint;
    }
    remaining -= lengths[i];
  }
  return [...points.at(-1)!];
}
/** Fixed labeled tracers illustrate selected charge-transfer paths, not atom counts,
 * molecular trajectories or equal ionic/electron transit speeds. Bulk electrolyte
 * salt inventory is held constant; electrode inventory comes from Faraday's law.
 */
export function lithiumTracer(id: number, soc: number) {
  if (!Number.isInteger(id) || id < 0 || id >= LITHIUM.tracers) throw new RangeError('tracer ID');
  lithiumOcv(soc);
  const g = lithiumGeometry(),
    a = g.negative[id],
    b = g.positive[id],
    channel = a[1] + 0.18,
    u = smooth(clamp(((0.85 - soc) / 0.85 - id * 0.05) / 0.14));
  const ionPath: LithiumPoint[] = [
    [a[0], a[1], 0.05],
    [a[0], channel, 0.4],
    [-0.15, channel, 0.4],
    [0.15, channel, 0.4],
    [b[0], channel, 0.4],
    [b[0], b[1], 0.05],
  ];
  const electronPath: LithiumPoint[] = [
    [a[0], a[1], -0.12],
    [-1.25, a[1], -0.12],
    [-1.25, 1.5, 0],
    ...g.external.slice(1),
    [1.25, b[1], -0.12],
    [b[0], b[1], -0.12],
  ];
  return {
    id,
    fraction: u,
    ion: lithiumPath(ionPath, u),
    electron: lithiumPath(electronPath, u),
    ionPath,
    electronPath,
    moving: u > 0 && u < 1,
  };
}
