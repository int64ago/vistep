import { finiteClamp } from './modern-labs';
export const GRAVITY_G = 6.6743e-11,
  EARTH_RADIUS = 6.371e6,
  EARTH_MU = 3.986004418e14;
export function moonEarthTest(ratio = 60.3) {
  const r = finiteClamp(ratio, 1, 100),
    g = EARTH_MU / EARTH_RADIUS ** 2,
    period = 27.321661 * 86400;
  return {
    ratio: r,
    g,
    predicted: g / r ** 2,
    observed: (4 * Math.PI ** 2 * (r * EARTH_RADIUS)) / period ** 2,
  };
}
/** Force and torque from both external masses on both test masses, in SI. */
export function torsionTorque(theta: number, side = 1, bigMass = 158) {
  const l = 0.9,
    d = 0.23,
    m = 0.73;
  let torque = 0;
  for (const s of [-1, 1]) {
    const x = s * l * Math.cos(theta),
      y = s * l * Math.sin(theta);
    for (const b of [-1, 1]) {
      const bx = b * l,
        by = b * d * side,
        dx = bx - x,
        dy = by - y,
        r = Math.hypot(dx, dy),
        f = (GRAVITY_G * m * bigMass) / r ** 3;
      torque += x * f * dy - y * f * dx;
    }
  }
  return torque;
}
export function torsionBalance(side = 1, mass = 158, seconds = 0) {
  const k = 2.5e-5,
    I = 2 * 0.73 * 0.9 ** 2,
    b = 2 * Math.sqrt(k * I) * 0.35;
  let equilibrium = 0;
  for (let i = 0; i < 20; i++) equilibrium = torsionTorque(equilibrium, side, mass) / k;
  const t = finiteClamp(seconds, 0, 10000),
    steps = Math.max(1, Math.ceil(t / 3)),
    dt = t / steps;
  let theta = 0,
    omega = 0;
  for (let i = 0; i < steps; i++) {
    const accel = (q: number, w: number) => (torsionTorque(q, side, mass) - k * q - b * w) / I;
    const a = accel(theta, omega),
      midQ = theta + (omega * dt) / 2,
      midW = omega + (a * dt) / 2;
    theta += midW * dt;
    omega += accel(midQ, midW) * dt;
  }
  return {
    theta,
    equilibrium,
    torque: torsionTorque(theta, side, mass),
    k,
    period: 2 * Math.PI * Math.sqrt(I / k),
  };
}
/** Central gravity at 300 km, velocity Verlet, stopped on the spherical surface. */
export function cannonOrbit(speedKm = 7.73) {
  let x = 0,
    y = EARTH_RADIUS + 3e5,
    vx = finiteClamp(speedKm, 0, 11) * 1000,
    vy = 0;
  const dt = 2,
    r0 = y,
    points = [];
  const accel = (x: number, y: number) => {
    const r = Math.hypot(x, y);
    return { x: (-EARTH_MU * x) / r ** 3, y: (-EARTH_MU * y) / r ** 3 };
  };
  let a = accel(x, y);
  let hit = false;
  for (let i = 0; i <= 3000; i++) {
    if (i % 5 === 0)
      points.push({ x, y, time: i * dt, r: Math.hypot(x, y), speed: Math.hypot(vx, vy) });
    x += vx * dt + 0.5 * a.x * dt ** 2;
    y += vy * dt + 0.5 * a.y * dt ** 2;
    const b = accel(x, y);
    vx += 0.5 * (a.x + b.x) * dt;
    vy += 0.5 * (a.y + b.y) * dt;
    a = b;
    if (Math.hypot(x, y) <= EARTH_RADIUS) {
      const r = Math.hypot(x, y);
      points.push({
        x: (x * EARTH_RADIUS) / r,
        y: (y * EARTH_RADIUS) / r,
        time: (i + 1) * dt,
        r: EARTH_RADIUS,
        speed: Math.hypot(vx, vy),
      });
      hit = true;
      break;
    }
  }
  return {
    points,
    hit,
    circularSpeed: Math.sqrt(EARTH_MU / r0) / 1000,
    escapeSpeed: Math.sqrt((2 * EARTH_MU) / r0) / 1000,
  };
}
