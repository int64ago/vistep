/** SI units throughout. A one-dimensional, quasi-steady teaching apparatus, not CFD. */
export const SIPHON = {
  gravity: 9.80665,
  density: 998.2,
  diameter: 0.012,
  darcy: 0.03,
  entranceK: 0.5,
  bendK: 0.4,
  atmosphere: 101325,
  temperature: 20,
  sourceArea: 0.06,
  receiverArea: 0.12,
  receiverFloor: -0.5,
  totalVolume: 0.063,
  receiverInitial: 0.006,
  inlet: 0.2,
  radius: 0.8,
  crest: 1.9,
  chapterSeconds: 22,
} as const;
export const tubeArea = (Math.PI * SIPHON.diameter ** 2) / 4;
export type SiphonPoint = { x: number; y: number };
export type SiphonGeometry = {
  angle: number;
  top: number;
  leg: number;
  length: number;
  crestAt: number;
  crest: SiphonPoint;
  inlet: SiphonPoint;
  outlet: SiphonPoint;
};
const bound = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const smooth = (v: number) => {
  const x = bound(v, 0, 1);
  return x * x * (3 - 2 * x);
};
function finite(...v: number[]) {
  if (v.some((x) => !Number.isFinite(x))) throw new RangeError('Siphon inputs must be finite.');
}
/** Rigid U tube rotates about its immersed inlet: length and contained volume do not change. */
export function siphonGeometry(angle = 0, top = SIPHON.crest as number): SiphonGeometry {
  finite(angle, top);
  if (angle < 0 || angle > 0.75 || top < 1.85 || top > 12)
    throw new RangeError('Outside apparatus geometry.');
  if (top > 1.900001 && angle > 0) throw new RangeError('Tall comparison rigs remain upright.');
  const leg = top - SIPHON.radius - SIPHON.inlet;
  const rotate = (x: number, y: number): SiphonPoint => ({
    x: x * Math.cos(angle) - (y - SIPHON.inlet) * Math.sin(angle),
    y: SIPHON.inlet + x * Math.sin(angle) + (y - SIPHON.inlet) * Math.cos(angle),
  });
  const center = rotate(SIPHON.radius, top - SIPHON.radius);
  return {
    angle,
    top,
    leg,
    length: 2 * leg + Math.PI * SIPHON.radius,
    crestAt: leg + SIPHON.radius * (Math.PI / 2 + angle),
    crest: { x: center.x, y: center.y + SIPHON.radius },
    inlet: rotate(0, SIPHON.inlet),
    outlet: rotate(2 * SIPHON.radius, SIPHON.inlet),
  };
}
/** Arc-length parameter, shared by tube walls, water, pressure samples and dye markers. */
export function siphonPoint(g: SiphonGeometry, distance: number): SiphonPoint {
  const s = bound(distance, 0, g.length);
  let x = 0,
    y = SIPHON.inlet + s;
  if (s > g.leg && s <= g.leg + Math.PI * SIPHON.radius) {
    const a = Math.PI - (s - g.leg) / SIPHON.radius;
    x = SIPHON.radius + SIPHON.radius * Math.cos(a);
    y = g.top - SIPHON.radius + SIPHON.radius * Math.sin(a);
  } else if (s > g.leg) {
    x = 2 * SIPHON.radius;
    y = g.top - SIPHON.radius - (s - g.leg - Math.PI * SIPHON.radius);
  }
  return {
    x: x * Math.cos(g.angle) - (y - SIPHON.inlet) * Math.sin(g.angle),
    y: SIPHON.inlet + x * Math.sin(g.angle) + (y - SIPHON.inlet) * Math.cos(g.angle),
  };
}
/** NIST WebBook Antoine coefficients, 273–303 K. Pressure in Pa; UI limited to 5–29 °C. */
export function siphonVaporPressure(temperature = SIPHON.temperature as number) {
  finite(temperature);
  if (temperature < 0 || temperature > 29.85) throw new RangeError('Outside Antoine fit.');
  return 1e5 * 10 ** (5.40221 - 1838.675 / (temperature + 273.15 - 31.737));
}
export type SiphonStatus = 'air' | 'priming' | 'flow' | 'level' | 'vented' | 'vapor' | 'uncovered';
export type SiphonState = {
  geometry: SiphonGeometry;
  sourceVolume: number;
  receiverVolume: number;
  tubeVolume: number;
  totalVolume: number;
  sourceLevel: number;
  receiverLevel: number;
  wet: [number, number][];
  status: SiphonStatus;
  head: number;
  velocity: number;
  flow: number;
  candidateVelocity: number;
  crestPressure: number;
  /** Pressure required by the continuous-column hypothesis, including after its failure. */
  minimumPressure: number;
  /** Arc length from the inlet; need not coincide with the geometrical crest. */
  minimumPressureAt: number;
  vaporPressure: number;
  atmosphere: number;
  temperature: number;
  lossHead: number;
  velocityHead: number;
  /** Crest-only head allowance; single-phase validity instead uses minimumPressure. */
  crestLimit: number;
  pressureValid: boolean;
  travel: number;
  vent: boolean;
  pump: boolean;
  seconds: number;
};
export type SiphonInput = {
  geometry?: SiphonGeometry;
  sourceVolume?: number;
  receiverVolume?: number;
  wet?: [number, number][];
  atmosphere?: number;
  temperature?: number;
  status?: SiphonStatus;
  travel?: number;
  seconds?: number;
};
function pressureAt(
  g: SiphonGeometry,
  sourceLevel: number,
  atmosphere: number,
  velocityHead: number,
  distance: number,
) {
  const at = bound(distance, 0, g.length),
    p = siphonPoint(g, at);
  const k =
    SIPHON.entranceK +
    (SIPHON.darcy * at) / SIPHON.diameter +
    SIPHON.bendK * bound((at - g.leg) / (Math.PI * SIPHON.radius), 0, 1);
  return (
    atmosphere + SIPHON.density * SIPHON.gravity * (sourceLevel - p.y - (1 + k) * velocityHead)
  );
}

/** Exact extrema of this piecewise straight/circular tube, not a sampled pressure grid. */
function minimumPressure(
  g: SiphonGeometry,
  sourceLevel: number,
  atmosphere: number,
  velocityHead: number,
) {
  const bendEnd = g.leg + Math.PI * SIPHON.radius;
  const candidates = [0, g.leg, bendEnd, g.length, g.crestAt];
  // On the bend: dp/ds = -ρg[dz/ds + (f/D + Kbend/(πR))·v²/(2g)].
  // With this rotation, dz/ds = -cos(π - (s-leg)/R + angle).
  const lossSlope =
    (SIPHON.darcy / SIPHON.diameter + SIPHON.bendK / (Math.PI * SIPHON.radius)) * velocityHead;
  if (lossSlope <= 1) {
    const stationary = g.leg + SIPHON.radius * (Math.PI + g.angle - Math.acos(lossSlope));
    if (stationary >= g.leg && stationary <= bendEnd) candidates.push(stationary);
  }
  // Straight-leg pressure gradients are constant; their endpoints suffice.
  let at = candidates[0],
    pressure = pressureAt(g, sourceLevel, atmosphere, velocityHead, at);
  for (const candidate of candidates.slice(1)) {
    const value = pressureAt(g, sourceLevel, atmosphere, velocityHead, candidate);
    if (value < pressure) {
      at = candidate;
      pressure = value;
    }
  }
  return { pressure, at };
}
export function siphonState(input: SiphonInput = {}): SiphonState {
  const geometry = input.geometry ?? siphonGeometry();
  const wet = input.wet ?? [[0, geometry.length]];
  for (let i = 1; i < wet.length; i++)
    if (wet[i][0] < wet[i - 1][1] - 1e-9) throw new RangeError('Water intervals overlap.');
  const tubeVolume = wet.reduce((sum, [a, b]) => {
    finite(a, b);
    if (a < 0 || b < a || b > geometry.length + 1e-9)
      throw new RangeError('Invalid water interval.');
    return sum + (b - a) * tubeArea;
  }, 0);
  const receiverVolume = input.receiverVolume ?? SIPHON.receiverInitial;
  const sourceVolume = input.sourceVolume ?? SIPHON.totalVolume - receiverVolume - tubeVolume;
  const atmosphere = input.atmosphere ?? SIPHON.atmosphere;
  const temperature = input.temperature ?? SIPHON.temperature;
  finite(sourceVolume, receiverVolume, atmosphere);
  if (sourceVolume < 0 || receiverVolume < 0 || atmosphere < 50000 || atmosphere > 110000)
    throw new RangeError('Outside fluid parameters.');
  const sourceLevel = sourceVolume / SIPHON.sourceArea;
  const receiverLevel = SIPHON.receiverFloor + receiverVolume / SIPHON.receiverArea;
  // Free jet only: a submerged outlet requires a different downstream boundary condition.
  if (receiverLevel >= geometry.outlet.y)
    throw new RangeError('Receiver has submerged the free outlet.');
  const head = sourceLevel - geometry.outlet.y;
  const coefficient =
    1 + SIPHON.entranceK + SIPHON.bendK + (SIPHON.darcy * geometry.length) / SIPHON.diameter;
  const candidateVelocity = Math.sqrt((2 * SIPHON.gravity * Math.max(0, head)) / coefficient);
  const velocityHead = candidateVelocity ** 2 / (2 * SIPHON.gravity);
  const upstreamK =
    SIPHON.entranceK +
    (SIPHON.darcy * geometry.crestAt) / SIPHON.diameter +
    SIPHON.bendK * bound((geometry.crestAt - geometry.leg) / (Math.PI * SIPHON.radius), 0, 1);
  const crestPressure = pressureAt(
    geometry,
    sourceLevel,
    atmosphere,
    velocityHead,
    geometry.crestAt,
  );
  const minimum = minimumPressure(geometry, sourceLevel, atmosphere, velocityHead);
  const vaporPressure = siphonVaporPressure(temperature);
  let status = input.status ?? 'flow';
  const columnFull = Math.abs(tubeVolume - tubeArea * geometry.length) < 1e-10;
  if (!columnFull && ['flow', 'level', 'uncovered'].includes(status)) status = 'air';
  if (status === 'flow' || status === 'level' || status === 'vapor' || status === 'uncovered') {
    status =
      sourceLevel <= geometry.inlet.y
        ? 'uncovered'
        : minimum.pressure <= vaporPressure + 1e-8 // Pa: roundoff at exact equality.
          ? 'vapor'
          : head <= 1e-7
            ? 'level'
            : 'flow';
  }
  const velocity = status === 'flow' ? candidateVelocity : 0;
  return {
    geometry,
    sourceVolume,
    receiverVolume,
    tubeVolume,
    totalVolume: sourceVolume + receiverVolume + tubeVolume,
    sourceLevel,
    receiverLevel,
    wet,
    status,
    head,
    velocity,
    flow: velocity * tubeArea,
    candidateVelocity,
    crestPressure,
    minimumPressure: minimum.pressure,
    minimumPressureAt: minimum.at,
    vaporPressure,
    atmosphere,
    temperature,
    lossHead: (coefficient - 1) * velocityHead,
    velocityHead,
    crestLimit:
      (atmosphere - vaporPressure) / (SIPHON.density * SIPHON.gravity) -
      (1 + upstreamK) * velocityHead,
    pressureValid: status === 'flow' || (status === 'level' && Math.abs(head) < 1e-7),
    travel: input.travel ?? 0,
    vent: status === 'vented',
    pump: status === 'priming',
    seconds: input.seconds ?? 0,
  };
}
export function siphonPressure(s: SiphonState, distance: number) {
  finite(distance);
  return pressureAt(s.geometry, s.sourceLevel, s.atmosphere, s.velocityHead, distance);
}
// Fixed-step replay cache: independent of RAF cadence, playback direction and measured voice lengths.
const STEP = 0.1;
type ReservoirFrame = {
  source: number;
  receiver: number;
  travel: number;
  wet: [number, number][];
  angle: number;
  status: SiphonStatus;
};
let movie: ReservoirFrame[] | undefined;
function mainFilm() {
  if (movie) return movie;
  const g = siphonGeometry(),
    L = g.length;
  const initialWet =
    (SIPHON.totalVolume - SIPHON.receiverInitial - SIPHON.sourceArea * SIPHON.inlet) /
    (SIPHON.sourceArea + tubeArea);
  let source: number = SIPHON.totalVolume - SIPHON.receiverInitial - initialWet * tubeArea;
  let receiver: number = SIPHON.receiverInitial,
    travel = 0,
    previousWet = initialWet;
  let airSource = source,
    airReceiver = receiver,
    airAt = g.crestAt,
    finalLeft = initialWet;
  const frames: ReservoirFrame[] = [];
  for (let i = 0; i <= 132 / STEP; i++) {
    const time = i * STEP,
      c = Math.min(5, Math.floor(time / 22)),
      p = (time - c * 22) / 22;
    let angle = 0,
      status: SiphonStatus = 'flow',
      wet: [number, number][] = [[0, L]];
    if (c === 0) {
      status = 'air';
      wet = [[0, initialWet]];
    }
    if (c === 1 && p < 0.66) {
      status = 'priming';
      const end = initialWet + (L - initialWet) * smooth((p - 0.12) / 0.5);
      wet = [[0, end]];
    }
    if (c === 4)
      angle =
        Math.asin(
          bound((source / SIPHON.sourceArea - SIPHON.inlet) / (2 * SIPHON.radius), 0, 0.68),
        ) * smooth((p - 0.1) / 0.6);
    if (c === 5 && p < 0.24) angle = frames[1099].angle * (1 - smooth(p / 0.24));
    if (c <= 1) {
      const currentWet = wet[0][1];
      source -= (currentWet - previousWet) * tubeArea;
      previousWet = currentWet;
    }
    if (c === 5 && p >= 0.4) {
      if (time - STEP < 110 + 22 * 0.4) {
        airSource = source;
        airReceiver = receiver;
        airAt = g.crestAt;
        finalLeft =
          (airSource + tubeArea * airAt - SIPHON.sourceArea * SIPHON.inlet) /
          (SIPHON.sourceArea + tubeArea);
      }
      const drain = smooth((p - 0.4) / 0.36);
      const left = airAt + (finalLeft - airAt) * drain;
      const right = airAt + (L - airAt) * drain;
      wet = [
        [0, left],
        [right, L],
      ];
      source = airSource + (airAt - left) * tubeArea;
      receiver = airReceiver + (right - airAt) * tubeArea;
      status = 'vented';
    }
    const state = siphonState({
      geometry: siphonGeometry(angle),
      sourceVolume: source,
      receiverVolume: receiver,
      wet,
      status,
    });
    frames.push({ source, receiver, travel, wet, angle, status: state.status });
    if (i < 132 / STEP && state.flow > 0) {
      const amount = Math.min(
        state.flow * STEP,
        Math.max(0, source - SIPHON.sourceArea * SIPHON.inlet),
      );
      source -= amount;
      receiver += amount;
      travel += amount / tubeArea;
    }
  }
  movie = frames;
  return frames;
}
export type SiphonShot = {
  state: SiphonState;
  /** Read-only slopes of the film's conserved inventories, in m³ per model second.
   * These describe the prescribed vent drainage, not continuous-column velocity. */
  branchFlow?: { source: number; receiver: number };
  view: 'apparatus' | 'pressure' | 'height';
  focus: number;
  comparison: boolean;
};
export function siphonShot(chapter: number, progress: number): SiphonShot {
  finite(chapter, progress);
  const c = bound(Math.floor(chapter), 0, 7),
    p = bound(progress, 0, 1);
  if (c >= 6) {
    // Prepared, prefilled comparisons. Different straight-leg lengths are NOT a stretching hose.
    const top = c === 6 ? 1.9 + 9.6 * smooth((p - 0.12) / 0.72) : 8.5;
    const atmosphere = c === 7 ? 101325 - 31325 * smooth((p - 0.14) / 0.68) : 101325;
    const state = siphonState({ geometry: siphonGeometry(0, top), atmosphere, seconds: p * 22 });
    return { state, view: 'height', focus: state.geometry.crestAt, comparison: true };
  }
  const frames = mainFilm(),
    coordinate = (c * 22 + p * 22) / STEP;
  const i = Math.min(frames.length - 1, Math.floor(coordinate)),
    a = frames[i],
    b = frames[Math.min(frames.length - 1, i + 1)];
  const f = coordinate - i,
    lerp = (x: number, y: number) => x + (y - x) * f;
  const wet: [number, number][] =
    a.wet.length === b.wet.length
      ? a.wet.map(([l, r], n) => [lerp(l, b.wet[n][0]), lerp(r, b.wet[n][1])])
      : a.wet;
  const state = siphonState({
    geometry: siphonGeometry(lerp(a.angle, b.angle)),
    sourceVolume: lerp(a.source, b.source),
    receiverVolume: lerp(a.receiver, b.receiver),
    wet,
    status: a.status,
    travel: lerp(a.travel, b.travel),
    seconds: c * 22 + p * 22,
  });
  return {
    state,
    // The same adjacent frames interpolate both wet intervals and reservoir volumes.
    // Use their right-hand slope at a knot; the final frame has zero drainage.
    branchFlow:
      a.status === 'vented' && b.status === 'vented'
        ? {
            source: Math.max(0, (b.source - a.source) / STEP),
            receiver: Math.max(0, (b.receiver - a.receiver) / STEP),
          }
        : undefined,
    view: c === 3 ? 'pressure' : 'apparatus',
    focus:
      c === 2
        ? Math.max(0, (state.travel - frames[440].travel) * 0.22) <= state.geometry.length
          ? Math.max(0, (state.travel - frames[440].travel) * 0.22)
          : 0
        : c === 0 || c === 3
          ? state.geometry.crestAt
          : 0,
    comparison: false,
  };
}
/** Each manual setting is a reproducible trial. Advancing trial time really transfers water. */
export function siphonTrial({
  angle = 0,
  top = 1.9,
  atmosphere = 101325,
  temperature = 20,
  primed = true,
  vented = false,
  seconds = 0,
} = {}): SiphonState {
  finite(angle, top, atmosphere, temperature, seconds);
  const geometry = siphonGeometry(angle, top),
    duration = bound(seconds, 0, 300);
  let source = SIPHON.totalVolume - SIPHON.receiverInitial - geometry.length * tubeArea;
  let receiver: number = SIPHON.receiverInitial,
    travel = 0;
  let wet: [number, number][] = [[0, geometry.length]];
  if (!primed || vented) {
    // Equilibrium in the source-connected leg, including its displacement from the reservoir.
    let low = 0,
      high = geometry.crestAt;
    for (let i = 0; i < 48; i++) {
      const mid = (low + high) / 2;
      if (
        siphonPoint(geometry, mid).y <
        (SIPHON.totalVolume - receiver - mid * tubeArea) / SIPHON.sourceArea
      )
        low = mid;
      else high = mid;
    }
    wet = [[0, (low + high) / 2]];
    source = SIPHON.totalVolume - receiver - wet[0][1] * tubeArea;
  }
  for (let at = 0; at < duration; at += STEP) {
    const s = siphonState({
      geometry,
      sourceVolume: source,
      receiverVolume: receiver,
      wet,
      atmosphere,
      temperature,
      status: !primed ? 'air' : vented ? 'vented' : 'flow',
    });
    const amount = Math.min(
      s.flow * Math.min(STEP, duration - at),
      Math.max(0, source - SIPHON.sourceArea * SIPHON.inlet),
    );
    source -= amount;
    receiver += amount;
    travel += amount / tubeArea;
    if (!amount) break;
  }
  return siphonState({
    geometry,
    sourceVolume: source,
    receiverVolume: receiver,
    wet,
    atmosphere,
    temperature,
    status: !primed ? 'air' : vented ? 'vented' : 'flow',
    seconds: duration,
    travel,
  });
}
