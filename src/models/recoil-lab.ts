/** Ideal one-axis balloon: constant small pressure excess, fixed orientation and no external horizontal force. */
export function balloonRecoil(time: number, area = 32e-6) {
  if (![time, area].every(Number.isFinite) || area <= 0)
    throw new RangeError('Positive nozzle area required');
  const shellMass = 0.004,
    initialGas = 0.003,
    density = 1.2,
    pressure = 300,
    exhaust = Math.sqrt((2 * pressure) / density),
    flow = density * area * exhaust,
    duration = initialGas / flow,
    t = Math.max(0, Math.min(time, 0.9 * duration)),
    gas = initialGas - flow * t,
    mass = shellMass + gas,
    m0 = shellMass + initialGas,
    log = Math.log1p((flow * t) / mass),
    v = exhaust * log,
    x = (exhaust / flow) * (flow * t - mass * log),
    radius = Math.cbrt((3 * gas) / (4 * Math.PI * density)),
    momentum = mass * v,
    gasMomentum = -exhaust * mass * log;
  return {
    time: t,
    duration,
    gas,
    mass,
    shellMass,
    initialGas,
    flow,
    exhaust,
    v,
    x,
    radius,
    thrust: flow * exhaust,
    momentum,
    gasMomentum,
  };
}
export function balloonParcel(emitted: number, now: number, area = 32e-6) {
  const s = balloonRecoil(emitted, area),
    t = Math.max(0, now - s.time),
    vx = s.v - s.exhaust;
  return { x: s.x - s.radius - 0.018 + vx * t, vx, time: t };
}
export const ROTOR = {
  coneSlope: 0.36,
  height: 0.25,
  nozzleRadius: 0.14,
  nozzleHeight: 0.035,
  dryInertia: 0.006,
  density: 1000,
  gravity: 9.8,
};
/** Rotating conical free surface: z=zc+w²r²/(2g), intersecting cone z=r/k. */
export function rotorGeometry(edgeRadius: number, omega: number) {
  const { coneSlope: k, density: rho, gravity: g } = ROTOR,
    r = edgeRadius,
    w = omega,
    centerHeight = r / k - (w * w * r * r) / (2 * g),
    volume = (Math.PI * r ** 3) / (3 * k) - (Math.PI * w * w * r ** 4) / (4 * g),
    waterInertia =
      (rho * Math.PI * r ** 5) / (10 * k) - (rho * Math.PI * w * w * r ** 6) / (12 * g);
  return {
    edgeRadius: r,
    edgeHeight: r / k,
    centerHeight,
    volume,
    mass: rho * volume,
    waterInertia,
    inertia: ROTOR.dryInertia + waterInertia,
    volumeR: Math.PI * r * r * (1 / k - (w * w * r) / g),
    volumeOmega: (-Math.PI * w * r ** 4) / (2 * g),
  };
}
export function rotorRates(
  edgeRadius: number,
  omega: number,
  nozzleArea = Math.PI * 0.0018 ** 2,
  direction = 1,
) {
  const s = rotorGeometry(edgeRadius, omega),
    { nozzleRadius: R, density: rho, gravity: g, coneSlope: k } = ROTOR,
    sign = direction < 0 ? -1 : 1,
    u = Math.sqrt(
      Math.max(0, 2 * g * (s.centerHeight - ROTOR.nozzleHeight) + omega * omega * R * R),
    ),
    flow = 2 * rho * nozzleArea * u,
    absoluteTangential = omega * R - sign * u,
    escapedRate = flow * R * absoluteTangential,
    effective = ROTOR.dryInertia + (rho * Math.PI * edgeRadius ** 5) / (10 * k),
    alpha = (flow * (sign * R * u - omega * (R * R - (edgeRadius * edgeRadius) / 2))) / effective,
    radialRate = (-flow / rho - s.volumeOmega * alpha) / s.volumeR;
  return { ...s, u, flow, absoluteTangential, escapedRate, alpha, radialRate, sign };
}
export type RotorSample = ReturnType<typeof rotorRates> & {
  time: number;
  omega: number;
  angle: number;
  escapedAngularMomentum: number;
  angularMomentum: number;
};
/** Precompute once per configuration, then sample deterministically for seeking. */
export function waterRotorTrajectory(
  nozzleArea = Math.PI * 0.0018 ** 2,
  direction = 1,
  duration = 6,
) {
  if (
    ![nozzleArea, direction, duration].every(Number.isFinite) ||
    nozzleArea <= 0 ||
    nozzleArea > Math.PI * 0.003 ** 2 ||
    duration < 0 ||
    duration > 6
  )
    throw new RangeError('Finite bounded rotor settings required');
  const dt = 0.005;
  let r = 0.072,
    w = 0,
    angle = 0,
    escaped = 0,
    time = 0;
  const samples: RotorSample[] = [];
  const push = () => {
    const q = rotorRates(r, w, nozzleArea, direction);
    samples.push({
      ...q,
      time,
      omega: w,
      angle,
      escapedAngularMomentum: escaped,
      angularMomentum: q.inertia * w,
    });
  };
  push();
  while (time < duration - 1e-10) {
    const step = Math.min(dt, duration - time),
      der = (v: number[]) => {
        const q = rotorRates(v[0], v[1], nozzleArea, direction);
        return [q.radialRate, q.alpha, v[1], q.escapedRate];
      },
      y = [r, w, angle, escaped],
      a = der(y),
      b = der(y.map((v, i) => v + (a[i] * step) / 2)),
      c = der(y.map((v, i) => v + (b[i] * step) / 2)),
      d = der(y.map((v, i) => v + c[i] * step)),
      next = y.map((v, i) => v + (step * (a[i] + 2 * b[i] + 2 * c[i] + d[i])) / 6);
    [r, w, angle, escaped] = next;
    time += step;
    const geometry = rotorGeometry(r, w);
    if (
      geometry.centerHeight <= ROTOR.nozzleHeight + 0.01 ||
      geometry.edgeHeight >= ROTOR.height ||
      geometry.volumeR <= 0
    )
      break;
    push();
  }
  return { samples, nozzleArea, direction, duration: samples.at(-1)!.time };
}
export type RotorTrajectory = ReturnType<typeof waterRotorTrajectory>;
export function sampleRotor(path: RotorTrajectory, time: number): RotorSample {
  const t = Math.max(0, Math.min(path.duration, time)),
    index = Math.min(path.samples.length - 1, Math.floor(t / 0.005)),
    a = path.samples[index],
    b = path.samples[Math.min(index + 1, path.samples.length - 1)],
    f = b.time > a.time ? (t - a.time) / (b.time - a.time) : 0;
  return Object.fromEntries(
    Object.keys(a).map((k) => [
      k,
      a[k as keyof RotorSample] + (b[k as keyof RotorSample] - a[k as keyof RotorSample]) * f,
    ]),
  ) as RotorSample;
}
export function rotorOutlet(s: RotorSample, arm = 0) {
  const theta = s.angle + arm * Math.PI,
    R = ROTOR.nozzleRadius,
    x = R * Math.cos(theta),
    y = R * Math.sin(theta),
    vx = -Math.sin(theta) * s.absoluteTangential,
    vy = Math.cos(theta) * s.absoluteTangential;
  return { x, y, z: ROTOR.nozzleHeight, vx, vy, theta };
}
export function waterParcel(path: RotorTrajectory, emitted: number, now: number, arm = 0) {
  const s = sampleRotor(path, emitted),
    p = rotorOutlet(s, arm),
    dt = Math.max(0, now - s.time);
  return { x: p.x + p.vx * dt, y: p.y + p.vy * dt, z: p.z - 4.9 * dt * dt, emitted: s.time, dt };
}
