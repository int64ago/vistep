/** Normally-open monostable DC plunger relay, reduced electromechanical teaching model. */
export const relayConstants = {
  mu0: 4 * Math.PI * 1e-7,
  area: 30e-6,
  gap: 1e-3,
  travel: 0.6e-3,
  leakInductance: 0.01,
  resistance: 125,
  mass: 0.001,
  preload: 0.006,
  spring: 15,
  damping: 0.04,
  diode: 0.7,
};
export interface RelayParameters {
  voltage: number;
  afterVoltage: number;
  switchAt: number;
  turns: number;
  loadVoltage: number;
  loadResistance: number;
  blocked?: boolean;
}
export function relayMagnet(turns: number, closure: number, current: number) {
  if (
    ![turns, closure, current].every(Number.isFinite) ||
    turns < 200 ||
    turns > 1500 ||
    closure < 0 ||
    closure > relayConstants.travel ||
    current < 0 ||
    current > 1
  )
    throw new RangeError('Invalid relay magnetic state');
  const k = relayConstants.mu0 * turns ** 2 * relayConstants.area,
    gap = relayConstants.gap - closure;
  return {
    inductance: relayConstants.leakInductance + k / gap,
    derivative: k / gap ** 2,
    force: (0.5 * current ** 2 * k) / gap ** 2,
    gap,
  };
}
export function relayTrace(p: RelayParameters, duration = 0.12, step = 0.00002) {
  if (
    ![
      p.voltage,
      p.afterVoltage,
      p.switchAt,
      p.turns,
      p.loadVoltage,
      p.loadResistance,
      duration,
      step,
    ].every(Number.isFinite) ||
    p.voltage < 0 ||
    p.voltage > 12 ||
    p.afterVoltage < 0 ||
    p.afterVoltage > 12 ||
    p.switchAt < 0 ||
    p.switchAt > 1 ||
    p.turns < 200 ||
    p.turns > 1500 ||
    p.loadVoltage < 0 ||
    p.loadVoltage > 24 ||
    p.loadResistance <= 0 ||
    p.loadResistance > 10000 ||
    duration <= 0 ||
    duration > 0.5 ||
    step < 0.000005 ||
    step > 0.0001
  )
    throw new RangeError('Unsupported relay parameters');
  const k = relayConstants,
    points = [];
  let i = 0,
    x = 0,
    v = 0,
    time = 0;
  const derivative = (s: number[], drive: number) => {
    const [rawI, rawX, velocity] = s,
      current = Math.max(0, rawI),
      closure = Math.max(0, Math.min(k.travel, rawX));
    const magnetic = relayMagnet(p.turns, closure, current),
      spring = k.preload + k.spring * closure;
    const terminal = drive > 0 ? drive : current > 0 ? -k.diode : 0;
    const acceleration = (magnetic.force - spring - k.damping * velocity) / k.mass;
    const held =
      p.blocked ||
      (rawX <= 0 && velocity <= 0 && acceleration < 0) ||
      (rawX >= k.travel && velocity >= 0 && acceleration > 0);
    return [
      (terminal -
        k.resistance * current -
        current * magnetic.derivative * (p.blocked ? 0 : velocity)) /
        magnetic.inductance,
      p.blocked ? 0 : velocity,
      held ? 0 : acceleration,
    ];
  };
  while (time <= duration + 1e-12) {
    const source = time < p.switchAt ? p.voltage : p.afterVoltage,
      magnetic = relayMagnet(p.turns, x, i),
      closed = x >= k.travel - 1e-9;
    const loadCurrent = closed ? p.loadVoltage / p.loadResistance : 0;
    points.push({
      time,
      current: i,
      closure: x,
      velocity: v,
      closed,
      source,
      coilPower: k.resistance * i * i,
      magneticForce: magnetic.force,
      springForce: k.preload + k.spring * x,
      inductance: magnetic.inductance,
      loadCurrent,
      loadPower: loadCurrent * p.loadVoltage,
      diodeConducting: source === 0 && i > 1e-9,
    });
    if (time >= duration - 1e-12) break;
    let h = Math.min(step, duration - time);
    if (time < p.switchAt && time + h > p.switchAt) h = p.switchAt - time;
    const drive = time + h / 2 < p.switchAt ? p.voltage : p.afterVoltage,
      s = [i, x, v],
      a = derivative(s, drive),
      b = derivative(
        s.map((value, n) => value + (h * a[n]) / 2),
        drive,
      ),
      c = derivative(
        s.map((value, n) => value + (h * b[n]) / 2),
        drive,
      ),
      d = derivative(
        s.map((value, n) => value + h * c[n]),
        drive,
      );
    [i, x, v] = s.map((value, n) => value + (h * (a[n] + 2 * b[n] + 2 * c[n] + d[n])) / 6);
    i = Math.max(0, i);
    if (x <= 0) {
      x = 0;
      if (v < 0) v = 0;
    }
    if (x >= k.travel) {
      x = k.travel;
      if (v > 0) v = 0;
    }
    if (p.blocked) {
      x = 0;
      v = 0;
    }
    time += h;
  }
  return points;
}
export function relayAt(points: ReturnType<typeof relayTrace>, time: number) {
  if (!Number.isFinite(time) || time < 0 || time > points.at(-1)!.time + 1e-9)
    throw new RangeError('Relay time outside trace');
  let lo = 0,
    hi = points.length - 1;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (points[mid].time <= time) lo = mid;
    else hi = mid - 1;
  }
  return points[lo];
}
