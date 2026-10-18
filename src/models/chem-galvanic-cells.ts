export const FARADAY = 96485.33212;
export const cellClamp = (x: number, a = 0, b = 1) =>
  Math.min(b, Math.max(a, Number.isFinite(x) ? x : a));
export type Cathode = 'Cu' | 'C';
export function acidCell(
  material: 'Zn' | 'Fe' | 'Cu',
  cathode: Cathode,
  closed: boolean,
  wet: boolean,
  time: number,
) {
  const active = material !== 'Cu' && wet;
  const current = closed && active ? (material === 'Zn' ? 0.004 : 0.002) : 0;
  const q = current * cellClamp(time, 0, 120),
    extent = q / (2 * FARADAY);
  return {
    current,
    q,
    extent,
    metal: material,
    cathode,
    localHydrogen: active ? (closed ? 0.15 : 1) : 0,
    cathodeHydrogen: current > 0 ? 1 : 0,
    zincOrIronLoss: extent * (material === 'Zn' ? 65.38 : 55.845),
    external: current > 0,
  };
}
export function simpleCell(
  count: number,
  kind: 'fruit' | 'paper',
  wet: boolean,
  active: boolean,
  load: number,
) {
  const n = Math.round(cellClamp(count, 1, 3)),
    r = kind === 'fruit' ? 1000 : 600;
  // Fruit uses an illustrative Zn/H+ Nernst state: pH3, a(Zn2+)=1e-4, p(H2)=1bar.
  // Saline paper uses a separate illustrative teaching EMF, not the acid half-reaction.
  const e =
    wet && active ? (kind === 'fruit' ? 0.76 - 0.05916 * 3 - 0.02958 * Math.log10(1e-4) : 0.8) : 0;
  const resistance = cellClamp(load, 100, 10000),
    emf = n * e,
    current = emf / (n * r + resistance),
    ledCurrent = Math.max(0, (emf - 1.6) / (n * r + 220));
  return {
    count: n,
    single: e,
    emf,
    current,
    terminal: current * resistance,
    internal: n * r,
    ledCurrent,
    brightness: cellClamp(ledCurrent / 0.0004),
  };
}
export function daniell(
  time: number,
  closed: boolean,
  bridge: boolean,
  zincConcentration: number,
  copperConcentration: number,
) {
  const zn0 = cellClamp(zincConcentration, 0.01, 2),
    cu0 = cellClamp(copperConcentration, 0.01, 2),
    volume = 0.05;
  const dt = cellClamp(time, 0, 3600) / 120;
  let extent = 0;
  for (let i = 0; i < 120; i++) {
    const potential = (x: number) =>
      1.1 -
      ((8.314462618 * 298.15) / (2 * FARADAY)) * Math.log((zn0 + x / volume) / (cu0 - x / volume));
    const rate = (x: number) => (closed && bridge ? potential(x) / (220 * 2 * FARADAY) : 0);
    const mid = extent + (rate(extent) * dt) / 2;
    extent = Math.min(cu0 * volume * 0.95, 0.02 / 65.38, extent + rate(mid) * dt);
  }
  const zn = zn0 + extent / volume,
    cu = cu0 - extent / volume,
    E = 1.1 - ((8.314462618 * 298.15) / (2 * FARADAY)) * Math.log(zn / cu);
  // Fixed-step midpoint integration couples transferred charge to instantaneous potential.
  return {
    emf: E,
    current: closed && bridge ? E / 220 : 0,
    extent,
    q: 2 * FARADAY * extent,
    zn,
    cu,
    zn0,
    cu0,
    volume,
    zincLoss: 65.38 * extent,
    zincWidth: (14 * (0.02 - 65.38 * extent)) / 0.02,
    copperWidth: (((14 * 7.14) / 8.96) * (0.02 + 63.546 * extent)) / 0.02,
    copperGain: 63.546 * extent,
    clMoles: 2 * extent,
    kMoles: 2 * extent,
    openCircuit: !closed || !bridge,
  };
}
export function saltBridge(width: number, lift: number) {
  const cx = width / 2,
    span = Math.min(54, (width - 52) / 2),
    left = cx - span,
    right = cx + span,
    armLeft = left + 18,
    armRight = right - 18,
    dy = -45 * cellClamp(lift);
  return {
    left,
    right,
    armLeft,
    armRight,
    dy,
    mouthY: 190 + dy,
    liquidY: 160,
    conducting: 190 + dy > 160,
    path: `M${armLeft} 190 V136 Q${armLeft} 110 ${cx} 110 Q${armRight} 110 ${armRight} 136 V190`,
  };
}
export function bridgeIon(width: number, progress: number, direction: 'left' | 'right', lift = 0) {
  const g = saltBridge(width, lift),
    p = cellClamp(progress),
    x = direction === 'left' ? g.armLeft : g.armRight;
  if (p < 0.5) {
    const t = p * 2;
    return {
      x: ((1 - t) * (1 - t) * width) / 2 + 2 * (1 - t) * t * x + t * t * x,
      y: (1 - t) * (1 - t) * 110 + 2 * (1 - t) * t * 110 + t * t * 136 + g.dy,
    };
  }
  return { x, y: 136 + (p - 0.5) * 2 * 54 + g.dy };
}
export function fuelCycle(
  chargeSeconds: number,
  dischargeSeconds: number,
  phase: 'charge' | 'isolated' | 'discharge',
) {
  const chargeQ = 0.2 * cellClamp(chargeSeconds, 0, 120),
    retention = 0.008,
    storedQ = chargeQ * retention,
    loadR = 320,
    E0 = 0.9,
    tau = storedQ ? (loadR * storedQ) / E0 : 1;
  const t = phase === 'discharge' ? cellClamp(dischargeSeconds, 0, 120) : 0,
    qLeft = storedQ * Math.exp(-t / tau),
    released = storedQ - qLeft;
  return {
    phase,
    chargeQ,
    storedQ,
    qLeft,
    released,
    hydrogen: qLeft / (2 * FARADAY),
    oxygen: qLeft / (4 * FARADAY),
    generatedHydrogen: chargeQ / (2 * FARADAY),
    generatedOxygen: chargeQ / (4 * FARADAY),
    current:
      phase === 'charge'
        ? 0.2
        : phase === 'discharge' && storedQ > 0
          ? (E0 / loadR) * Math.exp(-t / tau)
          : 0,
    emf: storedQ ? (E0 * qLeft) / storedQ : 0,
    ohRemaining: (chargeQ - released) / FARADAY,
    waterProduced: released / (2 * FARADAY),
    K1: phase === 'charge',
    K2: phase === 'discharge',
  };
}
export type Point = { x: number; y: number };
export function alongWire(points: Point[], fraction: number) {
  const distances = points.slice(1).map((p, i) => Math.hypot(p.x - points[i].x, p.y - points[i].y)),
    total = distances.reduce((a, b) => a + b, 0);
  let n = cellClamp(fraction) * total;
  for (let i = 0; i < distances.length; i++) {
    if (n <= distances[i]) {
      const t = distances[i] ? n / distances[i] : 0;
      return {
        x: points[i].x + (points[i + 1].x - points[i].x) * t,
        y: points[i].y + (points[i + 1].y - points[i].y) * t,
      };
    }
    n -= distances[i];
  }
  return points[points.length - 1];
}
