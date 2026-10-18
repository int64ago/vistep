export type RodPath = 'still' | 'along-field' | 'cutting';
export type CoilPath = 'close' | 'open' | 'rheostat' | 'insert';
const MU0 = 4 * Math.PI * 1e-7;
export function smoothChange(t: number, start: number, duration = 1) {
  const u = (t - start) / duration;
  if (u <= 0) return { value: 0, rate: 0 };
  if (u >= 1) return { value: 1, rate: 0 };
  return { value: u * u * (3 - 2 * u), rate: (6 * u * (1 - u)) / duration };
}
export function rodInduction(path: RodPath, time: number, field = 0.3, speed = 1) {
  if (![time, field, speed].every(Number.isFinite) || speed <= 0)
    throw new RangeError('Finite values and positive speed required');
  const a = smoothChange(time * speed, 2, 2),
    b = smoothChange(time * speed, 6, 2),
    q = a.value - b.value,
    dq = (a.rate - b.rate) * speed;
  const x = 0.12 + (path === 'cutting' ? 0.16 * q : 0),
    z = path === 'along-field' ? 0.12 * q : 0,
    vx = path === 'cutting' ? 0.16 * dq : 0,
    vz = path === 'along-field' ? 0.12 * dq : 0;
  const length = 0.18,
    resistance = 5,
    flux = field * length * x,
    emf = -field * length * vx || 0,
    current = emf / resistance;
  return { x, z, vx, vz, length, field, resistance, flux, emf, current };
}
/** Small-radius inner winding samples the axial field of the finite outer solenoid. */
export function coilCoupling(x: number) {
  const radius = 0.055,
    length = 0.1,
    innerRadius = 0.02,
    n1 = 100,
    n2 = 300,
    samples = 9;
  let sum = 0,
    derivative = 0;
  for (let i = 0; i < samples; i++) {
    const q = x - 0.02 + (0.04 * (i + 0.5)) / samples,
      a = q + length / 2,
      b = q - length / 2;
    sum += a / Math.hypot(radius, a) - b / Math.hypot(radius, b);
    derivative +=
      (radius * radius) / (radius * radius + a * a) ** 1.5 -
      (radius * radius) / (radius * radius + b * b) ** 1.5;
  }
  const factor = (MU0 * n1 * n2 * Math.PI * innerRadius * innerRadius) / (2 * length * samples);
  return { mutual: sum * factor, derivative: derivative * factor };
}
export function coilInduction(path: CoilPath, time: number, speed = 1) {
  if (![time, speed].every(Number.isFinite) || speed <= 0)
    throw new RangeError('Finite time and positive speed required');
  const a = smoothChange(time * speed, 2, 1),
    b = smoothChange(time * speed, 6, 1),
    q = a.value - b.value,
    dq = (a.rate - b.rate) * speed;
  let primary = 1,
    dPrimary = 0,
    offset = 0,
    velocity = 0,
    rheostat = 4;
  if (path === 'close') {
    primary = a.value;
    dPrimary = a.rate * speed;
  }
  if (path === 'open') {
    primary = 1 - a.value;
    dPrimary = -a.rate * speed;
  }
  if (path === 'rheostat') {
    rheostat = 20 - 16 * q;
    primary = 6 / (rheostat + 2);
    dPrimary = (96 * dq) / (rheostat + 2) ** 2;
  }
  if (path === 'insert') {
    primary = 0.5;
    rheostat = 10;
    offset = 0.13 * (1 - q);
    velocity = -0.13 * dq;
  }
  const coupling = coilCoupling(offset),
    fluxLinkage = coupling.mutual * primary,
    emf = -(coupling.mutual * dPrimary + coupling.derivative * velocity * primary) || 0,
    resistance = 20,
    current = emf / resistance;
  return {
    primary,
    dPrimary,
    offset,
    velocity,
    rheostat,
    fluxLinkage,
    emf,
    current,
    resistance,
    ...coupling,
    transition: a.value > 0 && a.value < 1,
    closed: path === 'open' ? a.value < 1 : path === 'close' ? a.value > 0 : true,
  };
}
export function inductionProjection(x: number, y: number, z: number) {
  return [55 + 900 * x + 220 * z, 205 - 650 * y - 160 * z] as const;
}
