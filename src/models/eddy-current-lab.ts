/** SI low-frequency teaching models. Resistive response; inductive transients are omitted.
 * Effective motion coefficients are not measurements of the textbook instruments. */
export type DampingApparatus = 'meter' | 'frame' | 'disc' | 'tube' | 'spring';
const finite = (x: number, name: string) => {
  if (!Number.isFinite(x)) throw new RangeError(name + ' must be finite');
  return x;
};
const positive = (x: number, name: string) => {
  finite(x, name);
  if (x <= 0) throw new RangeError(name + ' must be positive');
  return x;
};
const nonnegative = (x: number, name: string) => {
  finite(x, name);
  if (x < 0) throw new RangeError(name + ' must be nonnegative');
  return x;
};
const timeOf = (x: number) => Math.max(0, finite(x, 'time'));
const checked = <T extends Record<string, unknown>>(value: T): T => {
  for (const v of Object.values(value))
    if (typeof v === 'number' && !Number.isFinite(v))
      throw new RangeError('Outside the finite numerical model domain');
  return value;
};
export function dampedMotion(
  time: number,
  mass: number,
  stiffness: number,
  damping: number,
  initial: number,
) {
  const t = timeOf(time),
    m = positive(mass, 'mass'),
    k = nonnegative(stiffness, 'stiffness'),
    c = nonnegative(damping, 'damping');
  finite(initial, 'initial');
  const a = c / (2 * m),
    w2 = k / m,
    disc = a * a - w2;
  let x: number, v: number;
  if (k === 0) {
    x = initial;
    v = 0;
  } else if (Math.abs(disc) < 1e-10) {
    x = initial * (1 + a * t) * Math.exp(-a * t);
    v = -initial * a * a * t * Math.exp(-a * t);
  } else if (disc < 0) {
    const w = Math.sqrt(-disc),
      e = Math.exp(-a * t);
    x = initial * e * (Math.cos(w * t) + (a / w) * Math.sin(w * t));
    v = ((-initial * e * w2) / w) * Math.sin(w * t);
  } else {
    const d = Math.sqrt(disc),
      r1 = -w2 / (a + d),
      r2 = -a - d,
      A = (-initial * r2) / (r1 - r2),
      B = (initial * r1) / (r1 - r2);
    x = A * Math.exp(r1 * t) + B * Math.exp(r2 * t);
    v = A * r1 * Math.exp(r1 * t) + B * r2 * Math.exp(r2 * t);
  }
  return checked({
    position: x,
    velocity: v,
    energy: 0.5 * m * v * v + 0.5 * k * x * x,
    heatPower: c * v * v,
  });
}
export function meterDamping(time: number, shorted: boolean) {
  return dampedMotion(time, 2e-6, 1.8e-4, shorted ? 4e-5 : 3e-6, 0.5);
}
export function springDamping(time: number, closed: boolean) {
  return dampedMotion(time, 0.08, 3, closed ? 0.27 : 0.008, 0.045);
}
export function discBraking(time: number, field = 0.3) {
  const t = timeOf(time),
    B = finite(field, 'field'),
    inertia = 0.0012,
    initial = 15,
    emCoefficient = 0.004 * (B / 0.3) ** 2,
    c = 0.00008 + emCoefficient,
    tau = inertia / c;
  const omega = initial * Math.exp(-t / tau),
    angle = initial * tau * -Math.expm1(-t / tau),
    energy = 0.5 * inertia * omega * omega,
    initialEnergy = 0.5 * inertia * initial * initial,
    loss = initialEnergy - energy;
  return checked({
    omega,
    angle,
    energy,
    initialEnergy,
    heatPower: c * omega * omega,
    torque: -c * omega,
    emTorque: -emCoefficient * omega,
    joulePower: emCoefficient * omega * omega,
    jouleHeat: (loss * emCoefficient) / c,
    otherHeat: (loss * 0.00008) / c,
  });
}
export function frameDrive(time: number, driveOmega = 1.6) {
  const t = timeOf(time),
    input = finite(driveOmega, 'driveOmega'),
    inertia = 0.002,
    k = 0.004,
    drag = 0.0004,
    tau = inertia / (k + drag),
    limit = (k * input) / (k + drag);
  const omega = limit * -Math.expm1(-t / tau),
    angle = limit * (t + tau * Math.expm1(-t / tau)),
    slip = input - omega,
    torque = k * slip;
  return checked({
    omega,
    angle,
    magnetAngle: input * t,
    slip,
    torque,
    joulePower: k * slip * slip,
    inputPower: torque * input,
    mechanicalPower: torque * omega,
    dragPower: drag * omega * omega,
    kineticEnergy: 0.5 * inertia * omega * omega,
  });
}
export function tubeFall(time: number, slit: boolean) {
  const mass = 0.025,
    g = 9.8,
    c = slit ? 0.012 : 0.35,
    tau = mass / c,
    terminal = (mass * g) / c,
    t = timeOf(time);
  const raw = (s: number) => {
    const a = s / tau;
    return checked({
      y: terminal * tau * (a < 1e-4 ? (a * a) / 2 - a ** 3 / 6 + a ** 4 / 24 : a + Math.expm1(-a)),
      v: terminal * -Math.expm1(-a),
    });
  };
  let limit = t;
  if (raw(t).y > 1) {
    let lo = 0,
      hi = t;
    for (let i = 0; i < 60; i++) {
      const m = (lo + hi) / 2;
      if (raw(m).y < 1) lo = m;
      else hi = m;
    }
    limit = (lo + hi) / 2;
  }
  const at = raw(limit),
    landed = t > limit + 1e-9,
    position = Math.min(1, at.y),
    preCatchEnergy = 0.5 * mass * at.v * at.v;
  return checked({
    position,
    velocity: landed ? 0 : at.v,
    terminal,
    heatPower: landed ? 0 : c * at.v * at.v,
    fallTime: limit,
    landed,
    gravityReleased: mass * g * position,
    energy: landed ? 0 : preCatchEnergy,
    jouleHeat: Math.max(0, mass * g * position - preCatchEnergy),
    catchHeat: landed ? preCatchEnergy : 0,
    drag: landed ? 0 : c * at.v,
  });
}
/** One effective reciprocal coupling: epsilon=-K v; I=epsilon/R; F=K I.
 * K may be a flux-linkage gradient in Wb/m or Wb/rad. */
export function resistiveCoupling(
  velocity: number,
  gradient: number,
  resistance: number,
  closed = true,
) {
  const v = finite(velocity, 'velocity'),
    K = finite(gradient, 'gradient'),
    R = positive(resistance, 'resistance'),
    emf = -K * v,
    current = closed ? emf / R : 0,
    force = K * current;
  return checked({
    emf,
    current,
    force,
    joulePower: current * current * R,
    mechanicalPower: force * v,
  });
}
export function oscillatorAccount(kind: 'meter' | 'spring', time: number, closed: boolean) {
  const meter = kind === 'meter',
    s = meter ? meterDamping(time, closed) : springDamping(time, closed),
    background = meter ? 3e-6 : 0.008,
    added = meter ? 3.7e-5 : 0.262,
    R = meter ? 100 : 10,
    K = Math.sqrt(added * R),
    initialEnergy = meter ? 0.5 * 1.8e-4 * 0.5 ** 2 : 0.5 * 3 * 0.045 ** 2,
    total = background + (closed ? added : 0),
    loss = Math.max(0, initialEnergy - s.energy),
    coupling = resistiveCoupling(s.velocity, K, R, closed);
  return checked({
    ...s,
    ...coupling,
    initialEnergy,
    jouleHeat: closed ? (loss * added) / total : 0,
    otherHeat: (loss * background) / total,
    gradient: K,
    resistance: R,
    flux: 0.02 + K * s.position,
  });
}
/** Two local equivalent loops cross opposite edges of a localized B patch.
 * Effective l/r/R reproduce the existing b(B)=.004(B/.3)^2 torque coefficient exactly.
 * These are a lumped two-loop approximation, not an eddy-current field solution. */
export function discLoop(omega: number, field: number, edge: 1 | -1) {
  const B = finite(field, 'field'),
    radius = 0.08,
    length = 0.02,
    resistance = 0.0001152,
    gradient = edge * B * length * radius;
  return checked({
    ...resistiveCoupling(omega, gradient, resistance),
    gradient,
    field: B,
    edge,
    radius,
    length,
    resistance,
    fluxRate: gradient * omega,
  });
}
/** One frame's sinusoidal linked flux; motion and energy display use the cycle average.
 * <torque>=k slip and <I²R>=k slip². The instantaneous quantities are kept distinct. */
export function frameFlux(relativeAngle: number, slip: number) {
  const delta = finite(relativeAngle, 'relativeAngle'),
    s = finite(slip, 'slip'),
    R = 0.02,
    K = Math.sqrt(2 * 0.004 * R),
    flux = K * Math.cos(delta),
    fluxRate = -K * Math.sin(delta) * s,
    emf = -fluxRate,
    current = emf / R,
    instantTorque = K * Math.sin(delta) * current;
  return checked({
    flux,
    fluxRate,
    emf,
    current,
    instantTorque,
    instantJoulePower: current * current * R,
    meanTorque: 0.004 * s,
    meanJoulePower: 0.004 * s * s,
    resistance: R,
  });
}
export const TUBE = Object.freeze({
  radius: 0.035,
  thickness: 0.001,
  conductivity: 3.5e7,
  coefficient: 0.35,
  mu0: 4 * Math.PI * 1e-7,
});
/** Point-dipole flux in a thin, long pipe; moment chosen to match the effective c.
 * Local ring currents are physical samples, not a claim that the few drawn rings exhaust the integral.
 * z is downward; positive I is clockwise viewed from above. */
export function tubeRing(
  ringZ: number,
  magnetZ: number,
  velocity: number,
  polarity = 1,
  closed = true,
  ringWidth = 0.01,
) {
  const z = finite(ringZ, 'ringZ') - finite(magnetZ, 'magnetZ'),
    v = finite(velocity, 'velocity'),
    p = finite(polarity, 'polarity'),
    dz = positive(ringWidth, 'ringWidth'),
    { radius: a, thickness: h, conductivity: sigma, coefficient: c, mu0 } = TUBE;
  const moment = Math.sqrt((c * 1024 * a ** 4) / (45 * mu0 * mu0 * sigma * h)),
    A = (mu0 * moment * p * a * a) / 2,
    flux = A / (a * a + z * z) ** 1.5,
    gradient = (3 * A * z) / (a * a + z * z) ** 2.5,
    resistance = (2 * Math.PI * a) / (sigma * h * dz);
  return checked({
    ...resistiveCoupling(v, gradient, resistance, closed),
    flux,
    gradient,
    fluxRate: gradient * v,
    resistance,
    ringZ,
    magnetZ,
    moment: moment * p,
  });
}
export function dampingShot(chapter: number, progress: number) {
  const c = Math.max(0, Math.min(9, Math.floor(finite(chapter, 'chapter')))),
    p = Math.max(0, Math.min(1, finite(progress, 'progress'))),
    modes: DampingApparatus[] = ['meter', 'frame', 'disc', 'tube', 'spring'];
  return checked({
    apparatus: modes[Math.floor(c / 2)]!,
    enabled: c % 2 === 1,
    time: p * (c < 2 ? 3 : c < 4 ? 4 : c < 6 ? 3 : c < 8 ? 1.8 : 4),
    direction: c === 3 ? -1 : 1,
  });
}
export type EddyView = 'apparatus' | 'loop' | 'energy' | 'compare';
export interface EddyShot {
  apparatus: DampingApparatus;
  enabled: boolean;
  time: number;
  direction: number;
  field: number;
  view: EddyView;
  held: boolean;
  question: boolean;
  reveal: boolean;
  progress: number;
}
/** Chapter-relative seconds: decoded word times + the recorded 0.45s lead-in. */
export const EDDY_MEASURED_CUTS = Object.freeze({
  zh: Object.freeze({
    frameLoop: 5.67,
    frameQuestion: 11.17,
    frameSync: 13.31,
    frameEnergy: 17.93,
    discLoop: 3.95,
    discEnergy: 14.49,
    discQuestion: 17.33,
    discReverse: 21.45,
    discLateEnergy: 25.75,
    tubeLoop: 5.21,
    tubeEnergy: 15.91,
    tubeSamples: 20.91,
    slitReveal: 5.65,
    slitLocal: 8.95,
    holdQuestion: 13.77,
    holdReveal: 18.29,
  }),
  en: Object.freeze({
    frameLoop: 5.43,
    frameQuestion: 10.15,
    frameSync: 12.25,
    frameEnergy: 16.53,
    discLoop: 3.11,
    discEnergy: 12.69,
    discQuestion: 16.15,
    discReverse: 20.19,
    discLateEnergy: 24.37,
    tubeLoop: 5.87,
    tubeEnergy: 15.87,
    tubeSamples: 20.41,
    slitReveal: 3.53,
    slitLocal: 7.41,
    holdQuestion: 12.97,
    holdReveal: 17.55,
  }),
});
export function eddyDirector(
  chapter: number,
  seconds: number,
  locale: 'zh' | 'en' = 'zh',
): EddyShot {
  const c = Math.max(0, Math.min(9, Math.floor(finite(chapter, 'chapter')))),
    t = timeOf(seconds),
    duration = [22, 22, 22, 26, 22, 30, 30, 30, 22, 22][c]!,
    p = Math.min(1, t / duration),
    base = dampingShot(c, p),
    cut = EDDY_MEASURED_CUTS[locale],
    span = (from: number, to: number) => Math.max(0, Math.min(1, (t - from) / (to - from)));
  let view: EddyView = 'apparatus',
    held = false,
    question = false,
    reveal = true,
    time = base.time,
    field = base.enabled ? 0.3 : 0,
    direction = base.direction,
    enabled = base.enabled;
  if (c === 0 || c === 8) {
    view = t < 12 ? 'apparatus' : 'compare';
    time = Math.min(c === 0 ? 3 : 4, t / 4);
  }
  if (c === 1 || c === 9) {
    view = t < 5 ? 'apparatus' : t < 14 ? 'loop' : 'energy';
    time = c === 1 ? Math.max(0, t - 1) / 40 : Math.min(4, Math.max(0, t - 1) / 5);
  }
  if (c === 2) {
    view = t < 10 ? 'apparatus' : 'loop';
    time = t / 5;
  }
  if (c === 3) {
    view = t < cut.frameLoop ? 'apparatus' : t < cut.frameEnergy ? 'loop' : 'energy';
    time = t / 5;
    held = t >= cut.frameSync && t < cut.frameEnergy;
    question = t >= cut.frameQuestion && t < cut.frameSync;
    reveal = !question;
  }
  if (c === 4) {
    view = t < 14 ? 'apparatus' : 'compare';
    time = Math.min(3, t / 6);
    question = t >= 18;
    reveal = !question;
  }
  if (c === 5) {
    view =
      t < cut.discLoop
        ? 'apparatus'
        : t < cut.discEnergy
          ? 'loop'
          : t < cut.discQuestion
            ? 'energy'
            : t < cut.discLateEnergy
              ? 'loop'
              : 'energy';
    time =
      t < cut.discQuestion
        ? (t / cut.discQuestion) * 0.32
        : t < cut.discReverse
          ? 0.32
          : 0.32 + (t - cut.discReverse) * 0.12;
    field = t < cut.discReverse ? 0.3 : -0.3;
    question = t >= cut.discQuestion && t < cut.discReverse;
    reveal = !question;
  }
  if (c === 6) {
    view =
      t < cut.tubeLoop
        ? 'apparatus'
        : t < cut.tubeEnergy
          ? 'loop'
          : t < cut.tubeSamples
            ? 'energy'
            : 'loop';
    time =
      t < cut.tubeLoop
        ? span(0, cut.tubeLoop) * 0.4
        : t < cut.tubeEnergy
          ? 0.4 + span(cut.tubeLoop, cut.tubeEnergy) * 0.7
          : t < cut.tubeSamples
            ? 1.1
            : 1.1 + span(cut.tubeSamples, duration) * 0.3;
  }
  if (c === 7) {
    view =
      t < cut.slitLocal
        ? 'compare'
        : t < cut.holdQuestion
          ? 'loop'
          : t < cut.holdReveal
            ? 'apparatus'
            : 'loop';
    question = t < cut.slitReveal || (t >= cut.holdQuestion && t < cut.holdReveal);
    reveal = !question;
    held = t >= cut.holdReveal;
    enabled = t < cut.holdQuestion;
    // Compare one moving interval, then start the explicitly announced second, intact-tube test.
    time =
      t < cut.slitReveal
        ? 0.15
        : t < cut.slitLocal
          ? 0.15 + span(cut.slitReveal, cut.slitLocal) * 0.15
          : t < cut.holdQuestion
            ? 0.3 + span(cut.slitLocal, cut.holdQuestion) * 0.03
            : 0.6;
  }
  return checked({
    ...base,
    enabled,
    time,
    field,
    direction,
    view,
    held,
    question,
    reveal,
    progress: p,
  });
}
