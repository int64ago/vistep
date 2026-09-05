/** A single-turn, externally driven AC generator in a uniform air-gap field.
 * SI electrical/mechanical quantities. Geometry units are converted by metresPerUnit.
 * +θ is rotation about +z. At θ=0 the loop normal is +x, parallel to +B.
 * Conductor A→B defines +normal. e=VB−VA=−dΦ/dt; i leaves B into the load.
 * τem about +z is −iBA sinθ. Thus −τem ω=e i, for either rotation direction.
 */
export const GENERATOR = {
  metresPerUnit: 0.05,
  halfWidth: 1.2,
  halfLength: 1.8,
  cornerRadius: 0.18,
  terminalGap: 0.16,
  wireRadius: 0.035,
  ringRadius: 0.28,
  ringTube: 0.055,
  ringZ: [2.75, 3.36] as const,
  shaftRadius: 0.09,
  axisY: 1.7,
  internalOhms: 0.4,
  fieldTesla: 0.8,
  rpm: 360,
  loadOhms: 8,
} as const;
export const GENERATOR_AREA =
  (4 * GENERATOR.halfWidth * GENERATOR.halfLength - (4 - Math.PI) * GENERATOR.cornerRadius ** 2) *
  GENERATOR.metresPerUnit ** 2;
export const GENERATOR_PERIMETER =
  4 * (GENERATOR.halfWidth + GENERATOR.halfLength - 2 * GENERATOR.cornerRadius) +
  2 * Math.PI * GENERATOR.cornerRadius;
export type GeneratorPoint = [number, number, number];
export type GeneratorInput = {
  angle: number;
  rpm: number;
  field: number;
  load: number;
  connected: boolean;
  internal: number;
};
export const generatorDefaults: GeneratorInput = {
  angle: 0,
  rpm: GENERATOR.rpm,
  field: GENERATOR.fieldTesla,
  load: GENERATOR.loadOhms,
  connected: false,
  internal: GENERATOR.internalOhms,
};
const finite = (v: number, name: string) => {
  if (!Number.isFinite(v)) throw new RangeError(`${name} must be finite`);
  return v;
};

export function generatorState(input: GeneratorInput) {
  const theta = finite(input.angle, 'angle'),
    omega = (finite(input.rpm, 'rpm') * Math.PI) / 30;
  const field = finite(input.field, 'field'),
    resistance = finite(input.load, 'load') + finite(input.internal, 'internal');
  if (input.load <= 0 || input.internal < 0)
    throw new RangeError('Positive load and nonnegative internal resistance required');
  const coupling = field * GENERATOR_AREA,
    flux = coupling * Math.cos(theta);
  const dFlux = -coupling * omega * Math.sin(theta),
    emf = -dFlux;
  const current = input.connected ? emf / resistance : 0;
  const voltage = input.connected ? current * input.load : emf;
  const torque = -coupling * current * Math.sin(theta),
    driveTorque = -torque;
  const loadPower = current ** 2 * input.load,
    internalPower = current ** 2 * input.internal;
  const emfPeak = Math.abs(coupling * omega),
    currentRms = input.connected ? emfPeak / Math.SQRT2 / resistance : 0;
  const voltageRms = input.connected ? currentRms * input.load : emfPeak / Math.SQRT2;
  return {
    input,
    theta,
    omega,
    coupling,
    flux,
    dFlux,
    emf,
    current,
    voltage,
    torque,
    driveTorque,
    normal: [Math.cos(theta), Math.sin(theta), 0] as GeneratorPoint,
    frequency: Math.abs(input.rpm) / 60,
    period: omega ? (2 * Math.PI) / Math.abs(omega) : null,
    emfPeak,
    voltageRms,
    currentRms,
    loadPower,
    internalPower,
    shaftPower: driveTorque * omega,
    meanLoadPower: currentRms ** 2 * input.load,
    meanInternalPower: currentRms ** 2 * input.internal,
    meanTorque: input.connected ? (-(coupling ** 2) * omega) / (2 * resistance) : 0,
  };
}
export type GeneratorState = ReturnType<typeof generatorState>;

/** Work delivered over a directed angular sweep at fixed speed/parameters.
 * Integrates sin²θ analytically. Disallows a sweep opposed to the specified speed.
 */
export function generatorWork(input: GeneratorInput, startAngle: number, endAngle: number) {
  const s = generatorState(input);
  finite(startAngle, 'start angle');
  finite(endAngle, 'end angle');
  const delta = endAngle - startAngle;
  if (s.omega * delta < -1e-12) throw new RangeError('Sweep must follow shaft direction');
  if (!s.omega || !input.connected) return { shaft: 0, load: 0, internal: 0 };
  const angleIntegral = delta / 2 - (Math.sin(2 * endAngle) - Math.sin(2 * startAngle)) / 4;
  const shaft = Math.max(
    0,
    ((s.coupling ** 2 * s.omega) / (input.load + input.internal)) * angleIntegral,
  );
  return {
    shaft,
    load: (shaft * input.load) / (input.load + input.internal),
    internal: (shaft * input.internal) / (input.load + input.internal),
  };
}

export function rotateGeneratorPoint([x, y, z]: GeneratorPoint, angle: number): GeneratorPoint {
  return [x * Math.cos(angle) - y * Math.sin(angle), x * Math.sin(angle) + y * Math.cos(angle), z];
}
/** Rounded rectangular loop in yz, starting halfway along the front edge and
 * progressing toward −y. Its directed area normal is exactly +x. */
export function generatorLoopPoint(fraction: number): GeneratorPoint {
  const w = GENERATOR.halfWidth,
    h = GENERATOR.halfLength,
    r = GENERATOR.cornerRadius;
  const half = w - r,
    vertical = 2 * (h - r),
    horizontal = 2 * (w - r),
    arc = (Math.PI * r) / 2;
  const lengths = [half, arc, vertical, arc, horizontal, arc, vertical, arc, half];
  let d = (((fraction % 1) + 1) % 1) * GENERATOR_PERIMETER,
    part = 0;
  while (part < 8 && d > lengths[part]) d -= lengths[part++];
  const q = d / lengths[part];
  if (part === 0) return [0, -q * half, h];
  if (part === 2) return [0, -w, h - r - q * vertical];
  if (part === 4) return [0, -w + r + q * horizontal, -h];
  if (part === 6) return [0, w, -h + r + q * vertical];
  if (part === 8) return [0, w - r - q * half, h];
  const centers: Record<number, [number, number]> = {
    1: [-w + r, h - r],
    3: [-w + r, -h + r],
    5: [w - r, -h + r],
    7: [w - r, h - r],
  };
  const [cy, cz] = centers[part],
    a = Math.PI / 2 + (((part - 1) / 2 + q) * Math.PI) / 2;
  return [0, cy + r * Math.cos(a), cz + r * Math.sin(a)];
}
export function generatorConductorPoint(t: number): GeneratorPoint {
  const gap = GENERATOR.terminalGap / GENERATOR_PERIMETER;
  return generatorLoopPoint(gap + (1 - 2 * gap) * t);
}
export function generatorRotorLeads(): GeneratorPoint[][] {
  return [
    [generatorConductorPoint(0), [0, -0.16, 2.43], [0, -GENERATOR.ringRadius, GENERATOR.ringZ[0]]],
    [generatorConductorPoint(1), [0, 0.16, 3.1], [0, GENERATOR.ringRadius, GENERATOR.ringZ[1]]],
  ];
}
/** Radial graphite contacts sit on the OUTER ring radius and never orbit. */
export function generatorContacts() {
  return GENERATOR.ringZ.map((z, i) => ({
    label: i === 0 ? 'A' : 'B',
    z,
    touch: [GENERATOR.ringRadius + GENERATOR.ringTube, 0, z] as GeneratorPoint,
    center: [GENERATOR.ringRadius + GENERATOR.ringTube + 0.13, 0, z] as GeneratorPoint,
    lead: [GENERATOR.ringRadius + GENERATOR.ringTube + 0.26, 0, z] as GeneratorPoint,
  }));
}
export function generatorExternalCircuit(narrow: boolean) {
  const [a, b] = generatorContacts(),
    x = narrow ? 1.15 : 3.1,
    y = narrow ? -0.8 : -0.25,
    z = narrow ? 4.05 : 2.95;
  const top: GeneratorPoint = [x, y + 0.42, z],
    bottom: GeneratorPoint = [x, y - 0.42, z];
  return {
    loadPosition: [x, y, z] as GeneratorPoint,
    feed: [b.lead, [x, 0.25, b.z], [x, y + 0.9, z]] as GeneratorPoint[],
    return: [bottom, [x + 0.3, y - 0.52, z], [x + 0.5, -0.8, a.z], a.lead] as GeneratorPoint[],
    switchTop: [x, y + 0.9, z] as GeneratorPoint,
    switchBottom: top,
  };
}
const clamp = (x: number) => Math.min(1, Math.max(0, x));
export const generatorEase = (x: number) => {
  const p = clamp(x);
  return p * p * (3 - 2 * p);
};
const ramp = (p: number, a: number, b: number) => generatorEase((p - a) / (b - a));
/** Integral from 0 to p of smoothstep((p-a)/(b-a)). */
const integratedRamp = (p: number, a: number, b: number) => {
  if (p <= a) return 0;
  if (p >= b) return (b - a) / 2 + p - b;
  const x = (p - a) / (b - a);
  return (b - a) * (x ** 3 - x ** 4 / 2);
};

export function generatorShot(chapter: number, progress: number) {
  const c = Math.max(0, Math.min(7, Math.floor(chapter))),
    p = clamp(progress);
  const input = { ...generatorDefaults, angle: p * 4 * Math.PI };
  if (c === 0) {
    input.rpm = GENERATOR.rpm * ramp(p, 0.14, 0.3);
    input.angle = 4 * Math.PI * integratedRamp(p, 0.14, 0.3);
  }
  if (c === 1)
    input.angle = (Math.PI / 2) * ramp(p, 0.17, 0.4) + (Math.PI / 2) * ramp(p, 0.62, 0.86);
  if (c === 3) input.angle = 2 * Math.PI * p;
  if (c === 4) {
    input.rpm = GENERATOR.rpm * (1 + ramp(p, 0.28, 0.65));
    input.angle = 4 * Math.PI * (p + integratedRamp(p, 0.28, 0.65));
  }
  if (c === 5) input.connected = p >= 0.3;
  if (c === 6) {
    input.connected = true;
    input.rpm = GENERATOR.rpm * (1 - 2 * ramp(p, 0.28, 0.68));
    input.angle = Math.PI / 2 + 2 * Math.PI * (p - 2 * integratedRamp(p, 0.28, 0.68));
  }
  if (c === 7) {
    input.connected = true;
    input.angle = 2 * Math.PI * p;
  }
  const state = generatorState(input);
  return {
    chapter: c,
    progress: p,
    input,
    state,
    work: c === 7 ? generatorWork(input, 0, input.angle) : { shaft: 0, load: 0, internal: 0 },
    contactFocus: c === 2 ? ramp(p, 0.03, 0.22) * (1 - ramp(p, 0.8, 1)) : 0,
    showArea: c === 1,
    showForces: c >= 5,
    showWork: c === 7,
    showReference: c === 4,
    cutaway: c === 1 || c === 2 ? 0.24 : 0.66,
  };
}
export type GeneratorShot = ReturnType<typeof generatorShot>;
