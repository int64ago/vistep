/** Passive, linear two-mass quarter car, measured upward from static equilibrium.
 * Tire damping, pitch/roll, bump stops and airborne/recontact dynamics are excluded. */
export type SuspensionParameters = {
  sprungMass: number;
  unsprungMass: number;
  stiffness: number;
  damping: number;
  tireStiffness: number;
};
export const SUSPENSION: SuspensionParameters = {
  sprungMass: 300,
  unsprungMass: 45,
  stiffness: 18000,
  damping: 1400,
  tireStiffness: 180000,
};
export const SUSPENSION_GEOMETRY = {
  tireRadius: 0.34,
  rimRadius: 0.195,
  springFreeLength: 0.64,
  springLowerOffset: 0.25,
  damperLowerOffset: -0.15,
  damperTubeLength: 0.55,
  damperRodLength: 0.55,
  guideLength: 0.98,
  rippleAmplitudeLimit: 0.025,
  scale: 4.1,
} as const;
export type SuspensionRoad = {
  kind: 'bump' | 'ripple' | 'flat';
  amplitude: number;
  frequency: number;
};
export type SuspensionState = {
  time: number;
  body: number;
  wheel: number;
  bodyVelocity: number;
  wheelVelocity: number;
  dissipated: number;
  roadWork: number;
};
export const suspensionInitial = (body = 0): SuspensionState => ({
  time: 0,
  body,
  wheel: 0,
  bodyVelocity: 0,
  wheelVelocity: 0,
  dissipated: 0,
  roadWork: 0,
});
const finite = (...values: number[]) => {
  if (values.some((v) => !Number.isFinite(v)))
    throw new RangeError('Suspension input must be finite');
};
const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export function validateSuspension(p: SuspensionParameters) {
  finite(...Object.values(p));
  if (
    p.sprungMass <= 0 ||
    p.unsprungMass <= 0 ||
    p.stiffness < 0 ||
    p.damping < 0 ||
    p.tireStiffness <= 0
  )
    throw new RangeError('Positive masses/tire stiffness and nonnegative spring/damping required');
}
/** Analytic road and derivative: one smooth finite bump, or windowed corrugations.
 * A platen supplies displacement; no horizontal driving speed is implied. */
export function suspensionRoad(time: number, road: SuspensionRoad) {
  finite(time, road.amplitude, road.frequency);
  if (road.amplitude < 0 || road.frequency <= 0)
    throw new RangeError('Positive frequency and nonnegative road height required');
  if (road.kind === 'flat') return { displacement: 0, velocity: 0 };
  const start = 0.8;
  if (road.kind === 'bump') {
    const duration = 0.48,
      q = (time - start) / duration;
    if (q <= 0 || q >= 1) return { displacement: 0, velocity: 0 };
    return {
      displacement: (road.amplitude * (1 - Math.cos(2 * Math.PI * q))) / 2,
      velocity: (road.amplitude * Math.PI * Math.sin(2 * Math.PI * q)) / duration,
    };
  }
  const q = time - start,
    duration = 5;
  if (q <= 0 || q >= duration) return { displacement: 0, velocity: 0 };
  const envelope = Math.sin((Math.PI * q) / duration) ** 2,
    derivative = (Math.PI / duration) * Math.sin((2 * Math.PI * q) / duration),
    omega = 2 * Math.PI * road.frequency;
  return {
    displacement: road.amplitude * envelope * Math.sin(omega * q),
    velocity:
      road.amplitude * (derivative * Math.sin(omega * q) + envelope * omega * Math.cos(omega * q)),
  };
}
export function suspensionForces(
  s: SuspensionState,
  p: SuspensionParameters,
  road: SuspensionRoad,
) {
  const input = suspensionRoad(s.time, road),
    travel = s.body - s.wheel,
    relativeVelocity = s.bodyVelocity - s.wheelVelocity;
  const spring = -p.stiffness * travel,
    damper = -p.damping * relativeVelocity,
    tire = p.tireStiffness * (input.displacement - s.wheel);
  return {
    road: input.displacement,
    roadVelocity: input.velocity,
    travel,
    relativeVelocity,
    spring,
    damper,
    tire,
    bodyAcceleration: (spring + damper) / p.sprungMass,
    wheelAcceleration: (-spring - damper + tire) / p.unsprungMass,
    normalLoad: (p.sprungMass + p.unsprungMass) * 9.81 + tire,
    tireCompression: ((p.sprungMass + p.unsprungMass) * 9.81 + tire) / p.tireStiffness,
    damperPower: p.damping * relativeVelocity ** 2,
    roadPower: tire * input.velocity,
  };
}
export function suspensionEnergy(
  s: SuspensionState,
  p: SuspensionParameters,
  road: SuspensionRoad,
) {
  const f = suspensionForces(s, p, road);
  const kinetic =
    0.5 * p.sprungMass * s.bodyVelocity ** 2 + 0.5 * p.unsprungMass * s.wheelVelocity ** 2;
  const spring = 0.5 * p.stiffness * f.travel ** 2,
    tire = 0.5 * p.tireStiffness * (s.wheel - f.road) ** 2;
  return {
    kinetic,
    spring,
    tire,
    mechanical: kinetic + spring + tire,
    dissipated: s.dissipated,
    roadWork: s.roadWork,
  };
}
export function stepSuspension(
  s: SuspensionState,
  dt: number,
  p: SuspensionParameters,
  road: SuspensionRoad,
): SuspensionState {
  finite(dt, ...Object.values(s));
  if (dt < 0 || dt > 1 / 100) throw new RangeError('Use a nonnegative step no larger than 0.01 s');
  const y = [s.body, s.wheel, s.bodyVelocity, s.wheelVelocity, s.dissipated, s.roadWork];
  const derivative = (v: number[], time: number) => {
    const f = suspensionForces(
      {
        time,
        body: v[0],
        wheel: v[1],
        bodyVelocity: v[2],
        wheelVelocity: v[3],
        dissipated: v[4],
        roadWork: v[5],
      },
      p,
      road,
    );
    return [v[2], v[3], f.bodyAcceleration, f.wheelAcceleration, f.damperPower, f.roadPower];
  };
  const add = (v: number[], scale: number) => y.map((x, i) => x + v[i] * scale);
  const a = derivative(y, s.time),
    b = derivative(add(a, dt / 2), s.time + dt / 2),
    c = derivative(add(b, dt / 2), s.time + dt / 2),
    d = derivative(add(c, dt), s.time + dt);
  const out = y.map((x, i) => x + (dt * (a[i] + 2 * b[i] + 2 * c[i] + d[i])) / 6);
  return {
    time: s.time + dt,
    body: out[0],
    wheel: out[1],
    bodyVelocity: out[2],
    wheelVelocity: out[3],
    dissipated: out[4],
    roadWork: out[5],
  };
}
export type SuspensionTrace = {
  parameters: SuspensionParameters;
  road: SuspensionRoad;
  step: number;
  states: SuspensionState[];
  duration: number;
  contactLimit: number | null;
  initialEnergy: number;
};
/** Pure precomputation; fixed RK4 grid is independent of render cadence and seek history. */
export function simulateSuspension(
  p: SuspensionParameters = SUSPENSION,
  road: SuspensionRoad = { kind: 'bump', amplitude: 0.035, frequency: 10 },
  duration = 8,
  initial = suspensionInitial(),
  step = 1 / 600,
): SuspensionTrace {
  validateSuspension(p);
  finite(duration, step);
  suspensionRoad(0, road);
  if (duration < 0 || duration > 20 || step <= 0 || step > 0.005)
    throw new RangeError('Bounded trace duration and step required');
  let state = { ...initial, time: 0 },
    contactLimit: number | null = null;
  if (suspensionForces(state, p, road).normalLoad <= 0)
    throw new RangeError('Initial state must have positive tire contact load');
  const states = [state],
    initialEnergy = suspensionEnergy(state, p, road).mechanical;
  const count = Math.ceil(duration / step);
  for (let i = 1; i <= count; i++) {
    const target = Math.min(duration, i * step),
      dt = target - state.time;
    let next = stepSuspension(state, dt, p, road);
    if (suspensionForces(next, p, road).normalLoad <= 0) {
      // Stop at the first zero-load boundary. A linear tire must not pull on the road.
      let low = 0,
        high = dt;
      for (let j = 0; j < 32; j++) {
        const mid = (low + high) / 2;
        if (suspensionForces(stepSuspension(state, mid, p, road), p, road).normalLoad > 0)
          low = mid;
        else high = mid;
      }
      next = stepSuspension(state, low, p, road);
      contactLimit = next.time;
      states.push(next);
      break;
    }
    states.push(next);
    state = next;
  }
  return {
    parameters: { ...p },
    road: { ...road },
    step,
    states,
    duration,
    contactLimit,
    initialEnergy,
  };
}
export function sampleSuspension(trace: SuspensionTrace, time: number) {
  finite(time);
  const target = clamp(time, 0, trace.states[trace.states.length - 1].time);
  const index = Math.min(trace.states.length - 1, Math.floor(target / trace.step));
  const state = trace.states[index];
  return target - state.time > 1e-12
    ? stepSuspension(state, target - state.time, trace.parameters, trace.road)
    : { ...state };
}
/** Stop paired runs together at the earliest contact limit; comparisons never mix road/time. */
export function sampleSuspensionPair(
  a: SuspensionTrace,
  b: SuspensionTrace | null,
  requested: number,
) {
  const time = Math.min(
    requested,
    a.states[a.states.length - 1].time,
    b?.states[b.states.length - 1].time ?? Infinity,
  );
  return {
    time,
    a: sampleSuspension(a, time),
    b: b ? sampleSuspension(b, time) : null,
    limited: requested > time + 1e-8 && (a.contactLimit !== null || b?.contactLimit != null),
  };
}
export function suspensionPose(s: SuspensionState, p: SuspensionParameters, road: SuspensionRoad) {
  validateSuspension(p);
  finite(...Object.values(s));
  if (p.stiffness === 0)
    throw new RangeError('Static suspension pose requires positive spring stiffness');
  const g = SUSPENSION_GEOMETRY,
    equilibriumWheel = g.tireRadius - ((p.sprungMass + p.unsprungMass) * 9.81) / p.tireStiffness;
  const equilibriumSpring = g.springFreeLength - (p.sprungMass * 9.81) / p.stiffness;
  const wheelY = equilibriumWheel + s.wheel,
    lowerSpringY = wheelY + g.springLowerOffset;
  const upperMountY = equilibriumWheel + g.springLowerOffset + equilibriumSpring + s.body;
  return {
    wheelY,
    lowerSpringY,
    upperMountY,
    bodyY: upperMountY + 0.115,
    lowerDamperY: wheelY + g.damperLowerOffset,
    springLength: upperMountY - lowerSpringY,
    damperLength: upperMountY - wheelY - g.damperLowerOffset,
    roadY: suspensionRoad(s.time, road).displacement,
    equilibriumWheel,
    equilibriumSpring,
  };
}
export type SuspensionShot = ReturnType<typeof suspensionShot>;
export function suspensionShot(chapter: number, progress: number) {
  finite(chapter, progress);
  const c = Math.floor(clamp(chapter, 0, 7)),
    q = clamp(progress);
  const focus = ['path', 'spring', 'soft', 'damping', 'energy', 'tradeoff', 'contact', 'together'][
    c
  ];
  const road: SuspensionRoad = {
    kind: c === 4 ? 'flat' : c === 6 ? 'ripple' : 'bump',
    amplitude: c === 6 ? 0.021 : 0.035,
    frequency: 10.4,
  };
  const parameters = {
    ...SUSPENSION,
    damping: c === 1 || c === 2 || c === 3 ? 0 : SUSPENSION.damping,
    stiffness: c === 2 ? 12000 : SUSPENSION.stiffness,
  };
  const comparison =
    c === 2
      ? { ...parameters, stiffness: 30000 }
      : c === 3
        ? { ...SUSPENSION }
        : c === 5
          ? { ...SUSPENSION, damping: 6500 }
          : null;
  return {
    chapter: c,
    progress: q,
    focus,
    road,
    parameters,
    comparison,
    initialBody: c === 4 ? 0.04 : 0,
    modelTime: c === 4 ? 3 * q * q : 8 * q,
    cutaway: c === 4 ? 0.5 + 0.5 * Math.sin(Math.PI * q) : 0.55,
    showEnergy: c === 4,
    showContact: c === 6,
  };
}
