/** Two-pole, balanced induction motor. RMS per-phase equivalent circuit;
 * rotor quantities referred to the stator. SI units except explicit rpm.
 * Linear magnetics, no core/friction losses, no saturation or switching transient.
 * The startup envelope uses the quasi-steady circuit and J dω/dt = T - Tload.
 */
export const MOTOR = {
  frequency: 50,
  polePairs: 1,
  voltage: 120,
  r1: 0.65,
  x1: 0.9,
  xm: 30,
  r2: 0.5,
  x2: 0.9,
  inertia: 0.025,
  bars: 24,
  cageRadius: 0.92,
  ringZ: 1.1,
  barRadius: 0.045,
  shaftRadius: 0.18,
  statorInner: 1.16,
  statorOuter: 1.65,
  axisY: 1.84,
} as const;
export type MotorPoint = [number, number, number];
export type Complex = { re: number; im: number };
const c = (re: number, im = 0): Complex => ({ re, im });
const add = (a: Complex, b: Complex) => c(a.re + b.re, a.im + b.im);
const mul = (a: Complex, b: Complex) => c(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
const div = (a: Complex, b: Complex) => {
  const d = b.re * b.re + b.im * b.im;
  return c((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d);
};
const magnitude = (a: Complex) => Math.hypot(a.re, a.im);
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, Number.isFinite(v) ? v : a));
export const motorSyncOmega = (2 * Math.PI * MOTOR.frequency) / MOTOR.polePairs;
export const motorSyncRpm = (60 * MOTOR.frequency) / MOTOR.polePairs;
export const motorAxes = [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3];
export function motorPhases(phasor: Complex, phase: number, direction: 1 | -1 = 1) {
  return motorAxes.map(
    (a) =>
      Math.SQRT2 *
      (phasor.re * Math.cos(phase - direction * a) - phasor.im * Math.sin(phase - direction * a)),
  );
}
export function motorField(currents: readonly number[]) {
  return {
    x: currents.reduce((sum, i, k) => sum + i * Math.cos(motorAxes[k]), 0),
    y: currents.reduce((sum, i, k) => sum + i * Math.sin(motorAxes[k]), 0),
  };
}
export function motorCircuit(slipInput: number, direction: 1 | -1 = 1, energized = true) {
  const slip = clamp(slipInput),
    z1 = c(MOTOR.r1, MOTOR.x1),
    zm = c(0, MOTOR.xm);
  // Rotor admittance avoids the R2/s singularity at synchronism.
  const y2 = div(c(slip), c(MOTOR.r2, slip * MOTOR.x2));
  const yp = add(div(c(1), zm), y2),
    zp = div(c(1), yp);
  const stator = div(c(energized ? MOTOR.voltage : 0), add(z1, zp));
  const gap = mul(stator, zp),
    rotor = mul(gap, y2),
    magnetizing = div(gap, zm);
  const rotorCurrent = magnitude(rotor),
    statorCurrent = magnitude(stator);
  // Alternative polynomial form stays continuous at s=0.
  const gapPower =
    (3 * magnitude(gap) ** 2 * MOTOR.r2 * slip) / (MOTOR.r2 ** 2 + (slip * MOTOR.x2) ** 2);
  const rotorCopper = 3 * rotorCurrent ** 2 * MOTOR.r2;
  const statorCopper = 3 * statorCurrent ** 2 * MOTOR.r1;
  const converted = gapPower * (1 - slip),
    inputPower = 3 * MOTOR.voltage * stator.re;
  const omega = direction * (1 - slip) * motorSyncOmega;
  return {
    slip,
    direction,
    energized,
    stator,
    rotor,
    magnetizing,
    gap,
    rotorCurrent,
    statorCurrent,
    rotorFrequency: slip * MOTOR.frequency,
    gapPower,
    rotorCopper,
    statorCopper,
    converted,
    inputPower,
    omega,
    rpm: (omega * 60) / (2 * Math.PI),
    torque: (direction * gapPower) / motorSyncOmega,
    efficiency: inputPower > 0 ? converted / inputPower : 0,
    rotorLag: Math.atan2(slip * MOTOR.x2, MOTOR.r2),
  };
}
export type MotorCircuit = ReturnType<typeof motorCircuit>;
const zth = div(mul(c(0, MOTOR.xm), c(MOTOR.r1, MOTOR.x1)), c(MOTOR.r1, MOTOR.x1 + MOTOR.xm));
export const motorBreakdownSlip = MOTOR.r2 / Math.hypot(zth.re, zth.im + MOTOR.x2);
export const motorBreakdownTorque = motorCircuit(motorBreakdownSlip).torque;
/** Lowest-slip equilibrium only. Unreachable/unstable requests are rejected. */
export function motorSteadySlip(load: number) {
  if (!Number.isFinite(load) || load < 0 || load >= motorBreakdownTorque) return null;
  if (load === 0) return 0;
  let lo = 0,
    hi = motorBreakdownSlip;
  for (let i = 0; i < 55; i++) {
    const mid = (lo + hi) / 2;
    if (motorCircuit(mid).torque < load) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
type EnvelopePoint = { time: number; omega: number; angle: number };
/** Immutable startup trajectory, integrated from rest once; never animation history. */
function startupTable() {
  const dt = 0.002,
    out: EnvelopePoint[] = [{ time: 0, omega: 0, angle: 0 }];
  const acceleration = (omega: number) =>
    (motorCircuit(1 - omega / motorSyncOmega).torque - 1) / MOTOR.inertia;
  for (let k = 1; k <= 1000; k++) {
    const prev = out[k - 1],
      w = prev.omega;
    const a = acceleration(w),
      b = acceleration(w + (a * dt) / 2),
      d = acceleration(w + (b * dt) / 2),
      e = acceleration(w + d * dt);
    const omega = w + (dt * (a + 2 * b + 2 * d + e)) / 6;
    out.push({ time: k * dt, omega, angle: prev.angle + (dt * (w + omega)) / 2 });
  }
  return out;
}
const startup = startupTable();
export function motorStartup(time: number) {
  const t = clamp(time, 0, 2),
    index = t / 0.002,
    i = Math.min(999, Math.floor(index)),
    f = index - i;
  const a = startup[i],
    b = startup[i + 1];
  const omega = a.omega + (b.omega - a.omega) * f,
    angle = a.angle + (b.angle - a.angle) * f;
  const state = motorCircuit(1 - omega / motorSyncOmega);
  return {
    time: t,
    omega,
    angle,
    state,
    acceleration: (state.torque - 1) / MOTOR.inertia,
    loadPower: omega,
    kineticEnergy: 0.5 * MOTOR.inertia * omega ** 2,
  };
}
/** Geometry is in display units; dimensions illustrate a cage, not a rated design. */
export function motorBarPoint(index: number, z: number, angle = 0): MotorPoint {
  const a = (index * 2 * Math.PI) / MOTOR.bars + angle;
  return [MOTOR.cageRadius * Math.cos(a), MOTOR.cageRadius * Math.sin(a), z];
}
export function motorRingPoint(turn: number, z: number): MotorPoint {
  return [
    MOTOR.cageRadius * Math.cos(turn * 2 * Math.PI),
    MOTOR.cageRadius * Math.sin(turn * 2 * Math.PI),
    z,
  ];
}
/** Display-only mounting and winding dimensions; no equivalent-circuit parameter uses them. */
export const MOTOR_GEOMETRY = {
  axisLift: 0.3,
  baseTop: 0.24,
  windingRadius: 0.023,
  leadRadius: 0.025,
  slotRadius: 1.2,
  turnPitch: 0.065,
  endRadius: 1.56,
  endHalfLength: 1.3,
  phaseEndPitch: 0.17,
  leadRear: 2.48,
  leadPlanePitch: 0.16,
  leadFanRadius: 2.45,
} as const;
/** Continuous three-turn saddle. End arcs flare outside every axial slot bundle;
 * successive phases occupy separate axial planes. A larger end radius alone is
 * insufficient: the radial shoulders remain within 30° of their own slot. */
export function motorWindingPoint(phaseIndex: number, u: number): MotorPoint {
  const total = clamp(u) * 3,
    turn = Math.min(2, Math.floor(total)),
    f = total - turn;
  const base = motorAxes[phaseIndex] + Math.PI / 2,
    axialRadius = MOTOR_GEOMETRY.slotRadius + MOTOR_GEOMETRY.turnPitch * total,
    outerRadius = MOTOR_GEOMETRY.endRadius + MOTOR_GEOMETRY.turnPitch * total,
    l = MOTOR_GEOMETRY.endHalfLength + MOTOR_GEOMETRY.phaseEndPitch * phaseIndex;
  let a = base,
    z = -l,
    r = axialRadius;
  if (f < 0.25) z = -l + 8 * l * f;
  else if (f < 0.5 || f >= 0.75) {
    const front = f < 0.5,
      q = (f - (front ? 0.25 : 0.75)) * 4,
      shoulder = clamp(Math.min(q, 1 - q) * 6),
      flare = shoulder * shoulder * (3 - 2 * shoulder);
    a = base + (front ? 0 : Math.PI) + q * Math.PI;
    z = front ? l : -l;
    r += (outerRadius - axialRadius) * flare;
  } else {
    a = base + Math.PI;
    z = l - 8 * l * (f - 0.5);
  }
  return [r * Math.cos(a), r * Math.sin(a), z];
}
export function motorTerminal(phase: number, end: number): MotorPoint {
  return [-2.0 + phase * 0.25, -0.78 - end * 0.3, -1.9];
}
/** Six separated rear channels. Fan arcs stay outside all terminal feedthroughs;
 * the C-phase route passes above the shaft instead of underneath the bed. */
export function motorWindingLead(phase: number, end: number): MotorPoint[] {
  const p = motorWindingPoint(phase, end),
    terminal = motorTerminal(phase, end),
    z = -MOTOR_GEOMETRY.leadRear - (phase * 2 + end) * MOTOR_GEOMETRY.leadPlanePitch,
    r = Math.hypot(p[0], p[1]),
    a = motorAxes[phase] + Math.PI / 2,
    exit = a + (end ? 0.3 : -0.3),
    destination = Math.atan2(terminal[1], terminal[0]) + 2 * Math.PI,
    targetAngle = phase === 2 ? destination + 2 * Math.PI : destination;
  const points: MotorPoint[] = [p, [p[0], p[1], z]];
  for (let j = 1; j <= 3; j++) {
    const angle = a + ((exit - a) * j) / 3;
    points.push([r * Math.cos(angle), r * Math.sin(angle), z]);
  }
  const fan = MOTOR_GEOMETRY.leadFanRadius;
  points.push([fan * Math.cos(exit), fan * Math.sin(exit), z]);
  const steps = Math.ceil(Math.abs(targetAngle - exit) / (Math.PI / 24));
  for (let j = 1; j <= steps; j++) {
    const angle = exit + ((targetAngle - exit) * j) / steps;
    points.push([fan * Math.cos(angle), fan * Math.sin(angle), z]);
  }
  points.push([terminal[0], terminal[1], z], terminal);
  return points;
}
/** Supply leaves the front of the board; returns arrive from the rear. */
export function motorSupplyLead(phase: number): MotorPoint[] {
  const p = motorTerminal(phase, 0);
  return [p, [p[0], p[1], -1.8], [p[0], -1.4, -1.8], [p[0], -1.59, -2.28]];
}
/** Slot cavities clear the axial winding bundles, including their radial turns. */
export function motorStatorBore(angle: number) {
  const spacing = Math.PI / 3;
  const distance =
    Math.abs(Math.atan2(Math.sin(6 * (angle - Math.PI / 6)), Math.cos(6 * (angle - Math.PI / 6)))) /
    6;
  return distance < spacing * 0.067 ? 1.43 : MOTOR.statorInner;
}
/** Spatial current wave: relative cage-bar units, NOT physical bar amperes.
 * I2 is stator-referred. The ring solution enforces KCL at every junction.
 */
export function motorCage(state: MotorCircuit, fieldAngle: number, rotorAngle: number) {
  const scale = state.rotorCurrent / motorCircuit(1).rotorCurrent;
  const bars = Array.from({ length: MOTOR.bars }, (_, i) => {
    const a = (i * 2 * Math.PI) / MOTOR.bars + rotorAngle;
    return state.direction * scale * Math.cos(a - fieldAngle + state.direction * state.rotorLag);
  });
  let sum = 0;
  const front = bars.map((i) => (sum += i)),
    mean = front.reduce((a, b) => a + b, 0) / MOTOR.bars;
  const rings = front.map((i) => i - mean);
  return { bars, front: rings, back: rings.map((i) => -i) };
}
export function motorSample(
  slip: number,
  phase: number,
  rotorAngle: number,
  direction: 1 | -1 = 1,
  energized = true,
) {
  const circuit = motorCircuit(slip, direction, energized);
  const phases = motorPhases(circuit.stator, phase, direction);
  const magnetizingPhases = motorPhases(circuit.magnetizing, phase, direction);
  const field = motorField(magnetizingPhases),
    fieldAngle = Math.atan2(field.y, field.x);
  return {
    ...circuit,
    phase,
    rotorAngle,
    phases,
    magnetizingPhases,
    field,
    fieldAngle,
    cage: motorCage(circuit, fieldAngle, rotorAngle),
  };
}
export type MotorSample = ReturnType<typeof motorSample>;
const smooth = (p: number) => {
  const x = clamp(p);
  return x * x * (3 - 2 * x);
};
const comparisonSlip = (chapter: number, p: number) =>
  chapter === 4
    ? 0.065 * (1 - smooth((p - 0.15) / 0.6))
    : motorSteadySlip(
        chapter === 5 ? 1 + 3 * smooth((p - 0.15) / 0.65) : 1 + 5 * Math.sin(Math.PI * p) ** 2,
      )!;
// Immutable phase integrals avoid thousands of equilibrium solves per frame.
const comparisonAngles = new Map(
  [4, 5, 7].map((chapter) => {
    const values = [0],
      steps = 1024;
    for (let i = 0; i < steps; i++)
      values.push(
        values[i] + ((1 - comparisonSlip(chapter, (i + 0.5) / steps)) * 2 * Math.PI) / steps,
      );
    return [chapter, values] as const;
  }),
);
export function motorShot(chapterInput: number, progressInput: number) {
  const chapter = Math.floor(clamp(chapterInput, 0, 7)),
    progress = clamp(progressInput);
  let slip = 1,
    phase = progress * 2 * Math.PI,
    rotorAngle = 0,
    direction: 1 | -1 = 1;
  let load = 1,
    physicalTime = 0,
    energized = true;
  if (chapter === 1) phase = progress * 4 * Math.PI;
  if (chapter === 3 || chapter === 6) {
    direction = chapter === 6 ? -1 : 1;
    // A restart from REST, not a plugging transient. Angular inspection is slowed
    // equally for rotor and supply; envelope axes retain physical seconds.
    physicalTime = 2 * smooth(progress);
    const e = motorStartup(physicalTime);
    slip = e.state.slip;
    phase = (motorSyncOmega * physicalTime) / 80;
    rotorAngle = (direction * e.angle) / 80;
  } else if (chapter === 4) {
    slip = 0.065 * (1 - smooth((progress - 0.15) / 0.6));
    phase = progress * 2 * Math.PI;
    // Prescribed-speed comparison; no claim of a free acceleration trajectory.
    rotorAngle = (1 - slip) * phase;
  } else if (chapter === 5 || chapter === 7) {
    load =
      chapter === 5
        ? 1 + 3 * smooth((progress - 0.15) / 0.65)
        : 1 + 5 * Math.sin(Math.PI * progress) ** 2;
    slip = motorSteadySlip(load)!;
    phase = progress * 2 * Math.PI;
    rotorAngle = (1 - slip) * phase;
  }
  if (chapter === 4 || chapter === 5 || chapter === 7) {
    // Integrate the inspection-angle velocity, rather than multiplying the
    // changing endpoint speed by time (which would invent a different slip).
    const values = comparisonAngles.get(chapter)!,
      index = progress * 1024,
      i = Math.min(1023, Math.floor(index));
    rotorAngle = values[i] + (values[i + 1] - values[i]) * (index - i);
  }
  return {
    chapter,
    progress,
    load,
    physicalTime,
    energized,
    state: motorSample(slip, phase, rotorAngle, direction, energized),
    focus:
      chapter < 2
        ? 'field'
        : chapter === 2
          ? 'cage'
          : chapter === 3 || chapter === 6
            ? 'start'
            : chapter === 4
              ? 'sync'
              : chapter === 5
                ? 'load'
                : 'power',
    cutaway: 0.9,
    showBarCurrent: chapter >= 2,
  };
}
export type MotorShot = ReturnType<typeof motorShot>;
