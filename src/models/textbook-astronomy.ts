import { finiteClamp } from './modern-labs';
export function keplerPoint(a: number, e: number, mean: number) {
  let E = mean;
  for (let i = 0; i < 14; i++) E -= (E - e * Math.sin(E) - mean) / (1 - e * Math.cos(E));
  return { x: a * (Math.cos(E) - e), y: a * Math.sqrt(1 - e * e) * Math.sin(E) };
}
export function marsObservation(days: number, e = 0.0934) {
  const earth = keplerPoint(1, 0, (2 * Math.PI * days) / 365.25),
    mars = keplerPoint(1.5237, e, (2 * Math.PI * days) / 686.98);
  return { earth, mars, longitude: Math.atan2(mars.y - earth.y, mars.x - earth.x) };
}
export function jupiterMoons(days: number) {
  return [
    { r: 5.9, period: 1.769 },
    { r: 9.4, period: 3.551 },
    { r: 15, period: 7.155 },
    { r: 26.3, period: 16.689 },
  ].map((m, i) => {
    const a = (2 * Math.PI * days) / m.period + i * 0.8;
    return {
      x: m.r * Math.sin(a),
      z: m.r * Math.cos(a),
      period: m.period,
      hidden: Math.abs(m.r * Math.sin(a)) < 1 && Math.cos(a) < 0,
    };
  });
}
export function halleyOrbit(fraction: number) {
  const period = 75.3,
    a = period ** (2 / 3),
    e = 0.967;
  const p = keplerPoint(a, e, 2 * Math.PI * finiteClamp(fraction, 0, 1));
  return { ...p, a, e, period, r: Math.hypot(p.x, p.y) };
}
/** Heliocentric restricted three-body example, including acceleration of the Sun.
 * Ideal circular initial orbits; not a fit to the historical Uranus residuals. AU and years. */
export function uranusHistory(neptuneMassScale = 1) {
  const mu = 4 * Math.PI ** 2,
    mass = 5.15e-5 * finiteClamp(neptuneMassScale, 0, 2),
    dt = 0.01,
    rn = 30.1;
  let x = 19.2,
    y = 0,
    vx = 0,
    vy = Math.sqrt(mu / 19.2);
  const accel = (x: number, y: number, t: number) => {
    const a = (2 * Math.PI * t) / rn ** 1.5 + 0.6,
      nx = rn * Math.cos(a),
      ny = rn * Math.sin(a),
      r = Math.hypot(x, y),
      d = Math.hypot(nx - x, ny - y);
    return {
      x: (-mu * x) / r ** 3 + mu * mass * ((nx - x) / d ** 3 - nx / rn ** 3),
      y: (-mu * y) / r ** 3 + mu * mass * ((ny - y) / d ** 3 - ny / rn ** 3),
    };
  };
  let a = accel(x, y, 0);
  const result: {
    time: number;
    x: number;
    y: number;
    residualArcsec: number;
    nx: number;
    ny: number;
  }[] = [];
  for (let i = 0; i <= 8000; i++) {
    const t = i * dt,
      angle = (2 * Math.PI * t) / 19.2 ** 1.5,
      reference = { x: 19.2 * Math.cos(angle), y: 19.2 * Math.sin(angle) };
    if (i % 40 === 0) {
      const difference = Math.atan2(
        y * reference.x - x * reference.y,
        x * reference.x + y * reference.y,
      );
      result.push({
        time: t,
        x,
        y,
        residualArcsec: ((difference * 180) / Math.PI) * 3600,
        nx: rn * Math.cos((2 * Math.PI * t) / rn ** 1.5 + 0.6),
        ny: rn * Math.sin((2 * Math.PI * t) / rn ** 1.5 + 0.6),
      });
    }
    x += vx * dt + 0.5 * a.x * dt * dt;
    y += vy * dt + 0.5 * a.y * dt * dt;
    const b = accel(x, y, t + dt);
    vx += 0.5 * (a.x + b.x) * dt;
    vy += 0.5 * (a.y + b.y) * dt;
    a = b;
  }
  return result;
}
