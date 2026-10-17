/** IAPWS saturation-pressure equation as reproduced by NIST, Appendix A1–A7; Pa. */
export function evaporationSaturation(celsius: number) {
  if (!Number.isFinite(celsius) || celsius < 0 || celsius > 100)
    throw new RangeError('Liquid-water saturation domain 0–100 °C');
  const T = celsius + 273.15,
    n = [
      1167.0521452767, -724213.16703206, -17.073846940092, 12020.82470247, -3232555.0322333,
      14.91510861353, -4823.2657361591, 405113.40542057, -0.23855557567849, 650.17534844798,
    ],
    v = T + n[8] / (T - n[9]),
    A = v * v + n[0] * v + n[1],
    B = n[2] * v * v + n[3] * v + n[4],
    C = n[5] * v * v + n[6] * v + n[7];
  return ((2 * C) / (-B + Math.sqrt(B * B - 4 * A * C))) ** 4 * 1e6;
}
export interface EvaporationOptions {
  air?: number;
  humidity?: number;
  flow?: number;
  initial?: number;
  mass?: number;
  open?: boolean;
}
export function evaporationParameters(o: EvaporationOptions = {}) {
  const air = o.air ?? 30,
    humidity = o.humidity ?? 0.3,
    flow = o.flow ?? 1,
    initial = o.initial ?? air,
    mass = o.mass ?? 0.02,
    open = o.open ?? true;
  if (
    ![air, humidity, flow, initial, mass].every(Number.isFinite) ||
    air < 15 ||
    air > 40 ||
    humidity < 0 ||
    humidity > 1 ||
    flow <= 0 ||
    initial < 5 ||
    initial > 45 ||
    mass <= 0
  )
    throw new RangeError('Air 15–40 °C, initial 5–45 °C, RH 0–1 and positive flow/mass required');
  return {
    air,
    humidity,
    flow,
    initial,
    mass,
    open,
    area: 0.02,
    h: 8 * flow,
    k: open ? 4e-8 * flow : 0,
    vapor: humidity * evaporationSaturation(air),
    cp: 4180,
    latent: 2.43e6,
  };
}
export function evaporationFlux(temperature: number, o: EvaporationOptions = {}) {
  const s = evaporationParameters(o),
    massRate = s.k * s.area * (evaporationSaturation(temperature) - s.vapor),
    heat = s.h * s.area * (s.air - temperature),
    latent = massRate * s.latent;
  return { massRate, heat, latent, net: heat - latent };
}
export function evaporationEquilibrium(o: EvaporationOptions = {}) {
  let lo = 0,
    hi = 50;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (evaporationFlux(mid, o).net > 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
/** Open liquid control volume. Integrates mass, temperature and both outgoing enthalpy terms. */
export function evaporationHistory(o: EvaporationOptions = {}, duration = 900, step = 2) {
  const p = evaporationParameters(o);
  if (!Number.isFinite(duration) || duration < 0 || !Number.isFinite(step) || step <= 0)
    throw new RangeError('Nonnegative time, positive integration step');
  type State = number[];
  const f = (q: State) => {
      if (q[1] <= 0) throw new RangeError('Water exhausted');
      const s = evaporationFlux(q[0], p);
      return [s.net / (q[1] * p.cp), -s.massRate, s.heat, s.latent, s.massRate * p.cp * q[0]];
    },
    initial = [p.initial, p.mass, 0, 0, 0],
    points = [
      { time: 0, temperature: p.initial, mass: p.mass, heat: 0, latent: 0, sensibleOut: 0 },
    ];
  let q = initial;
  const count = Math.ceil(duration / step),
    dt = count ? duration / count : 0;
  for (let i = 0; i < count; i++) {
    const a = f(q),
      b = f(q.map((v, j) => v + (dt * a[j]) / 2)),
      c = f(q.map((v, j) => v + (dt * b[j]) / 2)),
      d = f(q.map((v, j) => v + dt * c[j]));
    q = q.map((v, j) => v + (dt * (a[j] + 2 * b[j] + 2 * c[j] + d[j])) / 6);
    points.push({
      time: (i + 1) * dt,
      temperature: q[0],
      mass: q[1],
      heat: q[2],
      latent: q[3],
      sensibleOut: q[4],
    });
  }
  return points;
}
export function evaporationAt(points: ReturnType<typeof evaporationHistory>, time: number) {
  const end = points.at(-1)!;
  if (time >= end.time) return end;
  if (time <= 0 || points.length === 1) return points[0];
  const i = Math.min(points.length - 2, Math.floor(time / points[1].time)),
    a = points[i],
    b = points[i + 1],
    r = (time - a.time) / (b.time - a.time);
  return {
    time,
    temperature: a.temperature + (b.temperature - a.temperature) * r,
    mass: a.mass + (b.mass - a.mass) * r,
    heat: a.heat + (b.heat - a.heat) * r,
    latent: a.latent + (b.latent - a.latent) * r,
    sensibleOut: a.sensibleOut + (b.sensibleOut - a.sensibleOut) * r,
  };
}
export function evaporationShot(chapter: number) {
  const base = { air: 30, humidity: 0.3, flow: 1, initial: 30, mass: 0.02, open: true };
  if (chapter === 1)
    return {
      one: { ...base, humidity: 0.2 },
      two: { ...base, humidity: 0.8 },
      kind: 'humidity',
      start: 0,
      duration: 900,
    };
  if (chapter === 2)
    return {
      one: { ...base, flow: 0.5 },
      two: { ...base, flow: 2 },
      kind: 'flow',
      start: 0,
      duration: 500,
    };
  if (chapter === 3) return { one: base, two: null, kind: 'balance', start: 600, duration: 300 };
  if (chapter === 4)
    return { one: { ...base, open: false }, two: base, kind: 'closed', start: 0, duration: 600 };
  if (chapter === 5)
    return {
      one: { ...base, humidity: 0.8, initial: 12 },
      two: null,
      kind: 'condensation',
      start: 0,
      duration: 180,
    };
  return { one: base, two: null, kind: 'cooling', start: 0, duration: 240 };
}
