/** Declared constant-parameter, small-signal electrodynamic driver. All dynamics use SI. */
export type SpeakerParameters = {
  resistance: number;
  inductance: number;
  forceFactor: number;
  mass: number;
  stiffness: number;
  damping: number;
};
export const SPEAKER_PARAMETERS: SpeakerParameters = {
  resistance: 6,
  inductance: 0.0005,
  forceFactor: 4,
  mass: 0.012,
  stiffness: 1200,
  damping: 0.8,
};
export const SPEAKER_DEFAULT = { voltage: 0.35, frequency: 50, phase: 0, damping: 0.8 };
export const SPEAKER_DURATION = 176;
export type SpeakerState = { current: number; position: number; velocity: number };
export type SpeakerComplex = { re: number; im: number };
const C = (re: number, im = 0): SpeakerComplex => ({ re, im });
const mul = (a: SpeakerComplex, b: SpeakerComplex) =>
  C(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
const add = (a: SpeakerComplex, b: SpeakerComplex) => C(a.re + b.re, a.im + b.im);
const div = (a: SpeakerComplex, b: SpeakerComplex) => {
  const d = b.re * b.re + b.im * b.im;
  return C((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d);
};
export const speakerMagnitude = (a: SpeakerComplex) => Math.hypot(a.re, a.im);
const real = (a: SpeakerComplex, phase: number) => a.re * Math.cos(phase) - a.im * Math.sin(phase);
const clean = (n: number) => (Math.abs(n) < 1e-15 ? 0 : n);
export function speakerValidate(p: SpeakerParameters) {
  if (
    ![p.resistance, p.inductance, p.forceFactor, p.mass, p.stiffness, p.damping].every(
      Number.isFinite,
    ) ||
    p.resistance <= 0 ||
    p.inductance <= 0 ||
    p.mass <= 0 ||
    p.stiffness <= 0 ||
    p.forceFactor < 0 ||
    p.damping < 0
  )
    throw new RangeError('Invalid passive speaker parameters');
}
export function speakerEvaluate(p: SpeakerParameters, state: SpeakerState, voltage: number) {
  speakerValidate(p);
  if (![state.current, state.position, state.velocity, voltage].every(Number.isFinite))
    throw new RangeError('Non-finite speaker state');
  const { current: i, position: x, velocity: v } = state,
    backEmf = p.forceFactor * v,
    force = p.forceFactor * i;
  const currentRate = (voltage - p.resistance * i - backEmf) / p.inductance;
  const springForce = -p.stiffness * x,
    dampingForce = -p.damping * v;
  const acceleration = (force + springForce + dampingForce) / p.mass;
  const magneticEnergy = 0.5 * p.inductance * i * i,
    kineticEnergy = 0.5 * p.mass * v * v,
    springEnergy = 0.5 * p.stiffness * x * x;
  const inputPower = voltage * i,
    copperLoss = p.resistance * i * i,
    mechanicalLoss = p.damping * v * v;
  const motorPower = force * v,
    electricalConversion = backEmf * i;
  const storedRate =
    p.inductance * i * currentRate + p.mass * v * acceleration + p.stiffness * x * v;
  return {
    ...state,
    voltage,
    backEmf,
    force,
    currentRate,
    springForce,
    dampingForce,
    acceleration,
    magneticEnergy,
    kineticEnergy,
    springEnergy,
    storedEnergy: magneticEnergy + kineticEnergy + springEnergy,
    inputPower,
    copperLoss,
    mechanicalLoss,
    motorPower,
    electricalConversion,
    storedRate,
  };
}
export function speakerResponse(p: SpeakerParameters, frequency: number, voltage = 1) {
  speakerValidate(p);
  if (!Number.isFinite(frequency) || frequency < 0 || frequency > 1e7 || !Number.isFinite(voltage))
    throw new RangeError('Invalid bounded sinusoidal input');
  const omega = 2 * Math.PI * frequency,
    ze = C(p.resistance, omega * p.inductance),
    mechanical = C(p.stiffness - p.mass * omega * omega, p.damping * omega);
  const denominator = add(mul(ze, mechanical), C(0, omega * p.forceFactor ** 2));
  const unitCurrent = p.forceFactor === 0 ? div(C(1), ze) : div(mechanical, denominator);
  const current = mul(C(voltage), unitCurrent);
  const position = p.forceFactor === 0 ? C(0) : mul(C(voltage), div(C(p.forceFactor), denominator));
  const velocity = mul(C(0, omega), position);
  const impedance =
    speakerMagnitude(unitCurrent) > 1e-18 ? 1 / speakerMagnitude(unitCurrent) : Infinity;
  return {
    frequency,
    omega,
    current,
    position,
    velocity,
    impedance,
    amplitude: speakerMagnitude(position),
    currentAmplitude: speakerMagnitude(current),
    velocityAmplitude: speakerMagnitude(velocity),
    averageInput: 0.5 * voltage * current.re,
    averageCopper: 0.5 * p.resistance * speakerMagnitude(current) ** 2,
    averageMechanical: 0.5 * p.damping * speakerMagnitude(velocity) ** 2,
  };
}
export function speakerSine(
  p: SpeakerParameters,
  frequency: number,
  voltage: number,
  phase: number,
) {
  if (!Number.isFinite(phase)) throw new RangeError('Invalid phase');
  const response = speakerResponse(p, frequency, voltage);
  return speakerEvaluate(
    p,
    {
      current: clean(real(response.current, phase)),
      position: clean(real(response.position, phase)),
      velocity: clean(real(response.velocity, phase)),
    },
    voltage * Math.cos(phase),
  );
}
type Matrix = number[][];
const identity = (): Matrix => [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];
const mmul = (a: Matrix, b: Matrix): Matrix =>
  a.map((row) => b[0].map((_, j) => row.reduce((sum, v, k) => sum + v * b[k][j], 0)));
/** Scaling/squaring with a bounded Taylor series; direct propagation, never frame history. */
function exp3(a: Matrix, time: number) {
  const norm = Math.max(...a.map((row) => row.reduce((s, v) => s + Math.abs(v * time), 0)));
  if (!Number.isFinite(norm) || norm > 1e9)
    throw new RangeError('Transient matrix outside numerical bounds');
  const squares = Math.max(0, Math.ceil(Math.log2(Math.max(norm, 1e-30) / 0.5)));
  const b = a.map((row) => row.map((v) => (v * time) / 2 ** squares));
  let result = identity(),
    term = identity();
  for (let k = 1; k <= 28; k++) {
    term = mmul(term, b).map((row) => row.map((v) => v / k));
    result = result.map((row, i) => row.map((v, j) => v + term[i][j]));
  }
  for (let k = 0; k < squares; k++) result = mmul(result, result);
  return result;
}
export function speakerAdvance(
  p: SpeakerParameters,
  initial: SpeakerState,
  voltage: number,
  time: number,
) {
  speakerValidate(p);
  if (
    !Number.isFinite(time) ||
    time < 0 ||
    time > 2 ||
    !Number.isFinite(voltage) ||
    ![initial.current, initial.position, initial.velocity].every(Number.isFinite)
  )
    throw new RangeError('Invalid bounded transient');
  if (time === 0) return speakerEvaluate(p, { ...initial }, voltage);
  const a = [
    [-p.resistance / p.inductance, 0, -p.forceFactor / p.inductance],
    [0, 0, 1],
    [p.forceFactor / p.mass, -p.stiffness / p.mass, -p.damping / p.mass],
  ];
  const steady = [
    voltage / p.resistance,
    (p.forceFactor * voltage) / (p.resistance * p.stiffness),
    0,
  ];
  const delta = [initial.current - steady[0], initial.position - steady[1], initial.velocity];
  const matrix = exp3(a, time),
    out = matrix.map((row, i) => steady[i] + row.reduce((sum, v, k) => sum + v * delta[k], 0));
  return speakerEvaluate(
    p,
    { current: clean(out[0]), position: clean(out[1]), velocity: clean(out[2]) },
    voltage,
  );
}
export function speakerFrequencyCurve(p: SpeakerParameters, count = 161) {
  if (!Number.isFinite(count)) throw new RangeError('Invalid curve count');
  const n = Math.max(3, Math.min(321, Math.round(count)));
  return Array.from({ length: n }, (_, i) => speakerResponse(p, 20 * 20 ** (i / (n - 1)), 1));
}

export type SpeakerPoint = [number, number]; // axial z, radial r, in drawing millimeters
export function speakerGeometry(position: number) {
  if (!Number.isFinite(position)) throw new RangeError('Invalid cone position');
  const motion = position * 1000 * 8;
  const halves = [-1, 1].map((sign) => {
    const point = (z: number, r: number): SpeakerPoint => [z, r * sign];
    const coil = Array.from({ length: 13 }, (_, i) => point(-26 + (18 * i) / 12 + motion, 13.5));
    const spider = Array.from({ length: 49 }, (_, i) => {
      const q = i / 48;
      return point((-4 + motion) * (1 - q) - 7 * q + 1.5 * Math.sin(6 * Math.PI * q), 13 + 24 * q);
    });
    const cone = [
      point(-4 + motion, 13),
      point(40 + motion, 56),
      point(42 + motion, 56),
      point(-2 + motion, 13),
    ];
    const surround = [
      point(40 + motion, 56),
      point(49 + motion * 0.5, 59),
      point(49, 63),
      point(42, 65),
    ];
    const lead = [point(7, 52), point(-10, 46), point(-14 + motion, 24), point(-5 + motion, 13.8)];
    const basket = [
      point(-26, 37),
      point(-20, 37),
      point(43, 65),
      point(46, 65),
      point(46, 71),
      point(38, 71),
      point(-26, 43),
    ];
    return {
      sign,
      coil,
      spider,
      cone,
      surround,
      lead,
      basket,
      leadTail: [lead[3], point(-8 + motion, 13.8)],
      bobbin: [
        point(-30 + motion, 12),
        point(-2 + motion, 12),
        point(-2 + motion, 13),
        point(-30 + motion, 13),
      ],
      magnet: [point(-34, 18), point(-22, 18), point(-22, 37), point(-34, 37)],
      topPlate: [point(-22, 15), point(-12, 15), point(-12, 40), point(-22, 40)],
      shelf: [point(-8, 37), point(-6, 37), point(-6, 47), point(-8, 47)],
      flux: [
        point(-28, 28),
        point(-17, 28),
        point(-17, 9),
        point(-36, 9),
        point(-36, 28),
        point(-28, 28),
      ],
    };
  });
  return {
    motion,
    halves,
    backPlate: [
      [-39, -40],
      [-34, -40],
      [-34, 40],
      [-39, 40],
    ] as SpeakerPoint[],
    pole: [
      [-34, -11],
      [-10, -11],
      [-10, 11],
      [-34, 11],
    ] as SpeakerPoint[],
    dustCap: [
      [-4 + motion, -13],
      [19 + motion, -10],
      [19 + motion, 10],
      [-4 + motion, 13],
    ] as SpeakerPoint[],
    overhang: 4 - Math.abs(motion),
    linear: Math.abs(position) <= 0.0005,
  };
}
/** One-way kinematic, 1D outgoing plane-wave illustration. No driver SPL/radiation prediction. */
export function speakerAir(
  p: SpeakerParameters,
  frequency: number,
  voltage: number,
  phase: number,
  count = 37,
) {
  if (frequency <= 0 || !Number.isFinite(count) || !Number.isFinite(phase))
    throw new RangeError('Air illustration needs positive frequency and finite phase/count');
  const response = speakerResponse(p, frequency, voltage),
    wavelength = 343 / frequency,
    k = (2 * Math.PI) / wavelength;
  const n = Math.max(5, Math.min(81, Math.round(count))),
    gain = Math.min(1500, 0.22 / Math.max(k * response.amplitude, 1e-15));
  const sample = (rest: number) => {
    const local = phase - k * rest,
      displacement = real(response.position, local),
      velocity = real(response.velocity, local);
    const compression = velocity / 343; // -dξ/ds for a rightward plane wave
    return {
      rest,
      displacement,
      velocity,
      compression,
      position: rest + gain * displacement,
      shade: response.velocityAmplitude > 1e-15 ? velocity / response.velocityAmplitude : 0,
    };
  };
  return {
    wavelength,
    gain,
    particles: Array.from({ length: n }, (_, i) =>
      sample(wavelength * (0.08 + (0.84 * i) / (n - 1))),
    ),
    tracked: sample(wavelength * 0.5),
    boundary: sample(0),
  };
}
const ease = (p: number, a = 0, b = 1) => {
  const q = Math.max(0, Math.min(1, (p - a) / (b - a)));
  return q * q * (3 - 2 * q);
};
export type SpeakerView =
  'assembly' | 'gap' | 'suspension' | 'generator' | 'power' | 'response' | 'damping' | 'air';
export function speakerShot(chapter: number, progress: number) {
  const c = Number.isFinite(chapter) ? Math.max(0, Math.min(7, Math.floor(chapter))) : 0,
    p = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0;
  const parameters = { ...SPEAKER_PARAMETERS };
  let voltage = 0.35,
    frequency = 35,
    phase = 0,
    time = 0;
  let state = speakerSine(parameters, frequency, voltage, phase);
  if (c === 0) {
    time = 0.018 * ease(p, 0.08, 0.88);
    state = speakerAdvance(parameters, { current: 0, position: 0, velocity: 0 }, voltage, time);
  }
  if (c === 1) {
    phase = Math.PI * ease(p, 0.1, 0.84);
    state = speakerSine(parameters, frequency, voltage, phase);
  }
  if (c === 2) {
    phase = Math.PI + 2 * Math.PI * ease(p, 0.05, 0.94);
    state = speakerSine(parameters, frequency, voltage, phase);
  }
  if (c === 3) {
    time = 0.035 * ease(p, 0.08, 0.88);
    voltage = 0;
    state = speakerAdvance(
      parameters,
      {
        current: 0.35 / parameters.resistance,
        position: (parameters.forceFactor * 0.35) / (parameters.resistance * parameters.stiffness),
        velocity: 0,
      },
      0,
      time,
    );
  }
  if (c === 4) {
    frequency = 50;
    phase = 2 * Math.PI * ease(p, 0.08, 0.92);
    state = speakerSine(parameters, frequency, voltage, phase);
  }
  if (c === 5) {
    frequency = 20 * 8 ** ease(p, 0.08, 0.9);
    const response = speakerResponse(parameters, frequency, voltage);
    phase = -Math.atan2(response.position.im, response.position.re);
    state = speakerSine(parameters, frequency, voltage, phase);
  }
  if (c === 6) {
    frequency = 50;
    parameters.damping = 0.3 + 2.2 * ease(p, 0.12, 0.88);
    const response = speakerResponse(parameters, frequency, voltage);
    phase = -Math.atan2(response.position.im, response.position.re);
    state = speakerSine(parameters, frequency, voltage, phase);
  }
  if (c === 7) {
    frequency = 50;
    phase = 2 * Math.PI * ease(p, 0.05, 0.95);
    state = speakerSine(parameters, frequency, voltage, phase);
  }
  const views: SpeakerView[] = [
    'assembly',
    'gap',
    'suspension',
    'generator',
    'power',
    'response',
    'damping',
    'air',
  ];
  return { view: views[c], parameters, voltage, frequency, phase, time, state };
}
