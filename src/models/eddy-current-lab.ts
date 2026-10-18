/** Effective low-frequency electromechanical models. SI units; coefficients are representative. */
export type DampingApparatus = 'meter' | 'frame' | 'disc' | 'tube' | 'spring';
export function dampedMotion(
  time: number,
  mass: number,
  stiffness: number,
  damping: number,
  initial: number,
) {
  const t = Math.max(0, time),
    a = damping / (2 * mass),
    w2 = stiffness / mass,
    disc = a * a - w2;
  let x: number, v: number;
  if (Math.abs(disc) < 1e-10) {
    x = initial * (1 + a * t) * Math.exp(-a * t);
    v = -initial * a * a * t * Math.exp(-a * t);
  } else if (disc < 0) {
    const w = Math.sqrt(-disc),
      e = Math.exp(-a * t);
    x = initial * e * (Math.cos(w * t) + (a / w) * Math.sin(w * t));
    v = ((-initial * e * w2) / w) * Math.sin(w * t);
  } else {
    const d = Math.sqrt(disc),
      r1 = -a + d,
      r2 = -a - d,
      A = (-initial * r2) / (r1 - r2),
      B = (initial * r1) / (r1 - r2);
    x = A * Math.exp(r1 * t) + B * Math.exp(r2 * t);
    v = A * r1 * Math.exp(r1 * t) + B * r2 * Math.exp(r2 * t);
  }
  return {
    position: x,
    velocity: v,
    energy: 0.5 * mass * v * v + 0.5 * stiffness * x * x,
    heatPower: damping * v * v,
  };
}
export function meterDamping(time: number, shorted: boolean) {
  return dampedMotion(time, 2e-6, 1.8e-4, shorted ? 4e-5 : 3e-6, 0.5);
}
export function springDamping(time: number, closed: boolean) {
  return dampedMotion(time, 0.08, 3, closed ? 0.27 : 0.008, 0.045);
}
export function discBraking(time: number, field = 0.3) {
  const t = Math.max(0, time),
    inertia = 0.0012,
    initial = 15,
    c = 0.00008 + 0.004 * (field / 0.3) ** 2,
    tau = inertia / c;
  const omega = initial * Math.exp(-t / tau),
    angle = initial * tau * (1 - Math.exp(-t / tau));
  return {
    omega,
    angle,
    energy: 0.5 * inertia * omega * omega,
    initialEnergy: 0.5 * inertia * initial * initial,
    heatPower: c * omega * omega,
    torque: -c * omega,
  };
}
export function frameDrive(time: number, driveOmega = 1.6) {
  const t = Math.max(0, time),
    inertia = 0.002,
    k = 0.004,
    drag = 0.0004,
    tau = inertia / (k + drag),
    limit = (k * driveOmega) / (k + drag);
  const omega = limit * (1 - Math.exp(-t / tau)),
    angle = limit * (t - tau * (1 - Math.exp(-t / tau))),
    slip = driveOmega - omega,
    torque = k * slip;
  return {
    omega,
    angle,
    magnetAngle: driveOmega * t,
    slip,
    torque,
    joulePower: k * slip * slip,
    inputPower: torque * driveOmega,
    mechanicalPower: torque * omega,
  };
}
export function tubeFall(time: number, slit: boolean) {
  const mass = 0.025,
    g = 9.8,
    c = slit ? 0.012 : 0.35,
    tau = mass / c,
    terminal = (mass * g) / c;
  const raw = (t: number) => ({
    y: terminal * (t - tau * (1 - Math.exp(-t / tau))),
    v: terminal * (1 - Math.exp(-t / tau)),
  });
  const t = Math.max(0, time);
  let limit = t;
  if (raw(t).y > 1) {
    let lo = 0,
      hi = t;
    for (let i = 0; i < 45; i++) {
      const m = (lo + hi) / 2;
      if (raw(m).y < 1) lo = m;
      else hi = m;
    }
    limit = (lo + hi) / 2;
  }
  const at = raw(limit),
    landed = t > limit + 1e-9;
  return {
    position: Math.min(1, at.y),
    velocity: landed ? 0 : at.v,
    terminal,
    heatPower: landed ? 0 : c * at.v * at.v,
    fallTime: limit,
    landed,
  };
}
export function dampingShot(chapter: number, progress: number) {
  const modes: DampingApparatus[] = ['meter', 'frame', 'disc', 'tube', 'spring'];
  return {
    apparatus: modes[Math.min(4, Math.floor(chapter / 2))],
    enabled: chapter % 2 === 1,
    time:
      Math.max(0, Math.min(1, progress)) *
      (chapter < 2 ? 3 : chapter < 4 ? 4 : chapter < 6 ? 3 : chapter < 8 ? 1.8 : 4),
    direction: chapter === 3 ? -1 : 1,
  };
}
