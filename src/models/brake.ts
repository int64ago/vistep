/** Millimetres, newtons and MPa (= N/mm²), unless a field names another unit.
 * A deliberately specified teaching assembly, not a production brake specification.
 */
export const BRAKE = {
  masterDiameter: 10,
  pistonDiameter: 18,
  freeStroke: 0.4,
  padGap: 0.25,
  leverRatio: 4,
  fluidCompliance: 5, // mm³/MPa: liquid and hose together
  padStiffness: 10_000, // N/mm, each pad/support assembly
  atmosphericPressure: 0.101325,
  friction: 0.38,
  effectiveRadius: 0.07, // m
  rotorRadius: 80, // mm
  rotorThickness: 2,
};
export const area = (diameter: number) => (Math.PI * diameter ** 2) / 4;
export type BrakeOptions = { masterDiameter?: number; bubbleVolume?: number };
/** Volume balance after the reservoir compensation port closes.
 * Seal friction and return forces are neglected; both pads move symmetrically.
 */
export function brakeState(stroke: number, options: BrakeOptions = {}) {
  const diameter = options.masterDiameter ?? BRAKE.masterDiameter,
    bubbleVolume = options.bubbleVolume ?? 0;
  if (
    ![stroke, diameter, bubbleVolume].every(Number.isFinite) ||
    stroke < 0 ||
    stroke > 6 ||
    diameter < 8 ||
    diameter > 14 ||
    bubbleVolume < 0 ||
    bubbleVolume > 150
  )
    throw new RangeError('Brake teaching parameters are outside their supported range.');
  const masterArea = area(diameter),
    pistonArea = area(BRAKE.pistonDiameter),
    swept = masterArea * Math.max(0, stroke - BRAKE.freeStroke),
    gapVolume = 2 * pistonArea * BRAKE.padGap,
    excess = Math.max(0, swept - gapVolume),
    compliance = BRAKE.fluidCompliance + (2 * pistonArea ** 2) / BRAKE.padStiffness;
  const compressedAir = (p: number) => (bubbleVolume * p) / (BRAKE.atmosphericPressure + p);
  let low = 0,
    high = excess / compliance;
  for (let i = 0; bubbleVolume > 0 && i < 64; i++) {
    const p = (low + high) / 2;
    if (compliance * p + compressedAir(p) > excess) high = p;
    else low = p;
  }
  const pressure = bubbleVolume ? (low + high) / 2 : high,
    padForce = pressure * pistonArea,
    padTravel = Math.min(BRAKE.padGap, swept / (2 * pistonArea)),
    padCompression = padForce / BRAKE.padStiffness,
    fluidVolume = BRAKE.fluidCompliance * pressure,
    padVolume = 2 * pistonArea * padCompression,
    bubbleCompressed = compressedAir(pressure),
    airWork =
      BRAKE.atmosphericPressure *
      bubbleVolume *
      (Math.log1p(pressure / BRAKE.atmosphericPressure) -
        pressure / (BRAKE.atmosphericPressure + pressure));
  return {
    stroke,
    diameter,
    masterArea,
    pistonArea,
    swept,
    gapVolume,
    portOpen: stroke < BRAKE.freeStroke,
    contact: swept >= gapVolume,
    pressure,
    padForce,
    clampForce: 2 * padForce,
    masterForce: pressure * masterArea,
    handForce: (pressure * masterArea) / BRAKE.leverRatio,
    handTravel: stroke * BRAKE.leverRatio,
    padTravel,
    padCompression,
    fluidVolume,
    padVolume,
    bubbleVolume,
    bubbleRemaining: bubbleVolume - bubbleCompressed,
    bubbleCompressed,
    deadStroke: BRAKE.freeStroke + gapVolume / masterArea,
    torque: 2 * padForce * BRAKE.friction * BRAKE.effectiveRadius,
    storedJoules: (0.5 * compliance * pressure ** 2 + airWork) / 1000,
    fluidStoredJoules: (0.5 * BRAKE.fluidCompliance * pressure ** 2) / 1000,
    padStoredJoules: (pressure * padVolume) / 2000,
    airStoredJoules: airWork / 1000,
  };
}
/** Force-controlled counterpart, still accounting for gap take-up and compliance. */
export function brakeAtPressure(pressure: number, options: BrakeOptions = {}) {
  if (!Number.isFinite(pressure) || pressure < 0 || pressure > 8)
    throw new RangeError('Pressure must be between zero and eight MPa.');
  const masterArea = area(options.masterDiameter ?? BRAKE.masterDiameter),
    pistonArea = area(BRAKE.pistonDiameter),
    compliance = BRAKE.fluidCompliance + (2 * pistonArea ** 2) / BRAKE.padStiffness,
    air = ((options.bubbleVolume ?? 0) * pressure) / (BRAKE.atmosphericPressure + pressure),
    stroke =
      BRAKE.freeStroke + (2 * pistonArea * BRAKE.padGap + compliance * pressure + air) / masterArea;
  return brakeState(stroke, options);
}
/** Equivalent bicycle + rider translation, with ideal rolling and constant brake torque.
 * One brake, 100 kg, wheel radius .35 m, initially 5 m/s. No tire limit or heat loss.
 */
export function brakeStop(torque: number, seconds: number) {
  if (![torque, seconds].every(Number.isFinite) || torque < 0 || seconds < 0)
    throw new RangeError('Non-negative finite torque and time required.');
  const mass = 100,
    wheelRadius = 0.35,
    initialSpeed = 5,
    deceleration = torque / (mass * wheelRadius),
    stoppingTime = torque ? initialSpeed / deceleration : Infinity,
    time = Math.min(seconds, stoppingTime),
    speed = Math.max(0, initialSpeed - deceleration * time),
    distance = initialSpeed * time - 0.5 * deceleration * time ** 2,
    angle = distance / wheelRadius,
    kineticJoules = 0.5 * mass * speed ** 2,
    heatJoules = 0.5 * mass * initialSpeed ** 2 - kineticJoules;
  return { speed, distance, angle, stoppingTime, kineticJoules, heatJoules, seconds: time };
}
const ease = (p: number) => {
  const q = Math.max(0, Math.min(1, p));
  return q * q * (3 - 2 * q);
};
/** Directly seekable stages; displayed motion does not depend on previously visited chapters. */
export function brakeShot(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  let state = brakeState(0),
    cutaway = 0,
    focus: 'assembly' | 'master' | 'caliper' = 'assembly',
    comparison: 'none' | 'areas' | 'air' = 'none';
  let rotation = 0;
  if (chapter === 0) {
    state = brakeState(ease((p - 0.12) / 0.7) * 3);
    cutaway = ease((p - 0.55) / 0.4);
    // Integrate the rising braking torque over the opening's four physical seconds.
    // A fixed grid makes direct seeking deterministic; the final partial step is exact in time.
    let omega = 5 / 0.35;
    const end = p * 4,
      dt = 1 / 120;
    for (let time = 0; time < end; time += dt) {
      const h = Math.min(dt, end - time),
        phase = (time + h / 2) / 4,
        torque = brakeState(ease((phase - 0.12) / 0.7) * 3).torque,
        acceleration = torque / (100 * 0.35 ** 2),
        moving = acceleration ? Math.min(h, omega / acceleration) : h;
      rotation += omega * moving - 0.5 * acceleration * moving ** 2;
      omega = Math.max(0, omega - acceleration * h);
    }
  }
  if (chapter === 1) {
    state = brakeState(0.7 * ease(p));
    cutaway = 1;
    focus = 'master';
  }
  if (chapter === 2) {
    state = brakeState(0.4 + 2.3 * ease(p));
    cutaway = 1;
    focus = 'caliper';
  }
  if (chapter === 3) {
    state = brakeAtPressure(0.2 + 3.8 * ease(p));
    cutaway = 1;
    comparison = 'areas';
  }
  if (chapter === 4) {
    state = brakeAtPressure(3, { masterDiameter: 10 + 4 * ease(p) });
    cutaway = 1;
    comparison = 'areas';
    focus = 'master';
  }
  if (chapter === 5) {
    state = brakeState(3 * ease((p - 0.1) / 0.65), { bubbleVolume: 80 });
    cutaway = 1;
    comparison = 'air';
    focus = 'master';
  }
  const stop = brakeStop(brakeAtPressure(4).torque, 4 * ease(p));
  if (chapter === 6) {
    state = brakeAtPressure(4);
    cutaway = 1;
    focus = 'caliper';
    rotation = stop.angle;
  }
  if (chapter === 7) {
    state = brakeState(3 * (1 - ease((p - 0.12) / 0.7)));
    cutaway = 1;
    rotation = 0;
  }
  return { state, cutaway, focus, comparison, rotation, stop, showEnergy: chapter === 6 };
}
