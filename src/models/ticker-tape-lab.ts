/** Deterministic measurements: dots are generated at acquisition times, not evenly spaced. */
export type TapePath = 'timer' | 'velocity' | 'cart' | 'fall';
export const TAPE_FREQUENCY = 50;
export const tapeLimit = (mode: TapePath) => (mode === 'fall' ? 0.5 : 1);
export function tapeMotion(mode: TapePath, time: number, acceleration = 0.6) {
  if (!Number.isFinite(time) || !Number.isFinite(acceleration))
    throw new RangeError('Motion inputs must be finite.');
  const t = Math.max(0, Math.min(tapeLimit(mode), time));
  if (mode === 'fall') return { t, x: 4.9 * t * t, v: 9.8 * t, a: 9.8 };
  if (mode === 'cart')
    return {
      t,
      x: 0.12 * t + (acceleration * t * t) / 2,
      v: 0.12 + acceleration * t,
      a: acceleration,
    };
  if (mode === 'velocity')
    return {
      t,
      x: 0.12 * t + 0.12 * t * t + 0.08 * t ** 3,
      v: 0.12 + 0.24 * t + 0.24 * t * t,
      a: 0.24 + 0.48 * t,
    };
  return { t, x: 0.3 * t, v: 0.3, a: 0 };
}
export function tapeDots(
  mode: TapePath,
  until: number,
  frequency = TAPE_FREQUENCY,
  acceleration = 0.6,
) {
  if (!Number.isFinite(until)) throw new RangeError('Acquisition time must be finite.');
  if (!Number.isFinite(frequency) || frequency <= 0 || frequency > 1000)
    throw new RangeError('Frequency must be positive and bounded.');
  const count = Math.floor(Math.max(0, Math.min(until, tapeLimit(mode))) * frequency + 1e-8);
  return Array.from({ length: count + 1 }, (_, index) => ({
    index,
    ...tapeMotion(mode, index / frequency, acceleration),
  }));
}
export function tapeInterval(mode: TapePath, start: number, end: number, acceleration = 0.6) {
  const a = tapeMotion(mode, start, acceleration),
    b = tapeMotion(mode, end, acceleration);
  if (b.t <= a.t) throw new RangeError('Measurement needs a nonzero time interval.');
  return { start: a, end: b, dx: b.x - a.x, dt: b.t - a.t, average: (b.x - a.x) / (b.t - a.t) };
}
export function tapeAcceleration(mode: TapePath, center: number, dt = 0.1, acceleration = 0.6) {
  if (!Number.isFinite(dt) || dt <= 0) throw new RangeError('Sampling interval must be positive.');
  const left = tapeMotion(mode, center - dt, acceleration),
    middle = tapeMotion(mode, center, acceleration),
    right = tapeMotion(mode, center + dt, acceleration);
  if (Math.abs(middle.t - left.t - dt) > 1e-9 || Math.abs(right.t - middle.t - dt) > 1e-9)
    throw new RangeError('All three sampling times must be in range.');
  return (right.x - 2 * middle.x + left.x) / dt ** 2;
}
export function tapeShot(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress)),
    mode: TapePath =
      chapter === 0 ? 'timer' : chapter <= 2 ? 'velocity' : chapter === 3 ? 'cart' : 'fall';
  return {
    mode,
    time: chapter === 1 || chapter === 2 ? 1 : tapeLimit(mode) * Math.min(1, p / 0.72),
    start: chapter === 2 ? 0.5 : 0.2,
    end: chapter === 2 ? 0.5 + Math.max(0.02, 0.4 * (1 - Math.min(1, p / 0.75))) : 0.8,
  };
}

export type TapeSample = { index: number; t: number; x: number };
export type TapeSegment = {
  index: number;
  from: TapeSample;
  to: TapeSample;
  midpoint: number;
  dt: number;
  dx: number;
  average: number;
};

/** Keep acquisition IDs when five 50-Hz intervals become one analysis interval. */
export function tapeSegments(mode: TapePath, count = 5, acceleration = 0.6): TapeSegment[] {
  if (!Number.isInteger(count) || count < 1 || count > 5)
    throw new RangeError('Use one to five complete 0.10-second intervals.');
  const dots = tapeDots(mode, count / 10, TAPE_FREQUENCY, acceleration);
  return Array.from({ length: count }, (_, index) => {
    const from = dots[index * 5],
      to = dots[(index + 1) * 5];
    return {
      index,
      from,
      to,
      midpoint: (from.t + to.t) / 2,
      dt: to.t - from.t,
      dx: to.x - from.x,
      average: (to.x - from.x) / (to.t - from.t),
    };
  });
}

/** A conditional constant-acceleration prediction, using only three revealed samples. */
export function predictTapePoint(samples: readonly TapeSample[]) {
  if (samples.length !== 3 || samples.some((s) => !Number.isFinite(s.t) || !Number.isFinite(s.x)))
    throw new RangeError('Prediction needs three finite recorded samples.');
  const [first, middle, last] = samples;
  const dt = middle.t - first.t;
  if (dt <= 0 || Math.abs(last.t - middle.t - dt) > 1e-9)
    throw new RangeError('Prediction needs equal positive time intervals.');
  const previousGap = middle.x - first.x,
    lastGap = last.x - middle.x;
  const increment = lastGap - previousGap,
    nextGap = lastGap + increment;
  return {
    t: last.t + dt,
    x: last.x + nextGap,
    nextGap,
    increment,
    acceleration: increment / dt ** 2,
  };
}

/** Symmetric *sampled* estimate: half-width is a whole number of 50-Hz ticks. */
export function localTapeEstimate(halfTicks: number) {
  if (!Number.isInteger(halfTicks) || halfTicks < 1 || halfTicks > 20)
    throw new RangeError('The observed neighborhood uses one to twenty ticks on each side.');
  const half = halfTicks / TAPE_FREQUENCY;
  return {
    ...tapeInterval('velocity', 0.5 - half, 0.5 + half),
    exact: tapeMotion('velocity', 0.5).v,
    halfTicks,
  };
}

export function uniformTape(speed: number, until: number) {
  if (!Number.isFinite(speed) || speed <= 0 || speed > 1)
    throw new RangeError('Uniform speed must be positive and no greater than 1 m/s.');
  return tapeDots('timer', until).map((dot) => ({ ...dot, x: speed * dot.t, v: speed }));
}

/** Side elevation. Pulley tangents, cart attachment and hanger share one displacement. */
export function tickerCartRig(width: number, displacement: number) {
  if (
    !Number.isFinite(width) ||
    width < 240 ||
    !Number.isFinite(displacement) ||
    displacement < 0 ||
    displacement > 0.22
  )
    throw new RangeError('Rig geometry needs a supported width and displacement.');
  const scale = width < 500 ? 180 : 420,
    travel = displacement * scale;
  const needleX = 28,
    cartX = width * 0.37 + travel;
  const pulley = { x: width - 30, y: 97, r: 10 };
  const hook = { x: cartX + 25, y: pulley.y - pulley.r };
  const hanger = { x: pulley.x + pulley.r, y: 123 + travel };
  const ropeLength = pulley.x - hook.x + (Math.PI * pulley.r) / 2 + hanger.y - pulley.y;
  return {
    scale,
    travel,
    needleX,
    cartX,
    pulley,
    hook,
    hanger,
    ropeLength,
    paperEnd: cartX - 25,
    rope: `M ${hook.x} ${hook.y} H ${pulley.x} A ${pulley.r} ${pulley.r} 0 0 1 ${hanger.x} ${pulley.y} V ${hanger.y}`,
  };
}

const clampUnit = (p: number) => Math.max(0, Math.min(1, p));

/** Chapter-local seconds, including the 0.45s voice lead-in, measured from both 183s tracks.
 * Map speech events to the existing visual beats without changing acquisition physics.
 * Sources: batch-2-timed-speech/ticker-tape-lab-{zh,en}-{0..4}.json,
 * with the revised English fall cue in batch-2-timed-speech-revision.
 */
const tickerSpeechBeats: Record<'zh' | 'en', [number, number][][]> = {
  zh: [
    [
      [0, 0],
      [9, 0.2],
      [14.7, 0.49],
      [15.15, 0.55],
      [18.65, 0.8],
      [31, 1],
    ],
    [
      [0, 0],
      [5.4, 0.18],
      [6.9, 0.36],
      [8.7, 0.52],
      [10.1, 0.56],
      [14, 0.8],
      [28, 1],
    ],
    [
      [0, 0],
      [5.1, 0.22],
      [13, 0.55],
      [18.9, 0.79],
      [33, 1],
    ],
    [
      [0, 0],
      [4.1, 0.17],
      [4.65, 0.2],
      [8.35, 0.24],
      [10.8, 0.4],
      [16.6, 0.46],
      [26.45, 0.62],
      [30.3, 0.8],
      [37, 0.9],
      [38.55, 0.92],
      [47, 1],
    ],
    [
      [0, 0],
      [4.3, 0.15],
      [4.9, 0.18],
      [5.25, 0.24],
      [6.4, 0.4],
      [21.6, 0.62],
      [24.7, 0.76],
      [26.45, 0.79],
      [28.15, 0.86],
      [44, 1],
    ],
  ],
  en: [
    [
      [0, 0],
      [10.2, 0.2],
      [17.6, 0.49],
      [18, 0.55],
      [22.3, 0.8],
      [31, 1],
    ],
    [
      [0, 0],
      [5.7, 0.18],
      [7.2, 0.36],
      [9.2, 0.52],
      [11.1, 0.56],
      [14.6, 0.8],
      [28, 1],
    ],
    [
      [0, 0],
      [5.45, 0.22],
      [12.3, 0.55],
      [18.7, 0.79],
      [33, 1],
    ],
    [
      [0, 0],
      [3.45, 0.17],
      [3.8, 0.2],
      [8.3, 0.24],
      [10.2, 0.4],
      [17, 0.46],
      [28.6, 0.62],
      [33.1, 0.8],
      [39, 0.9],
      [40.3, 0.92],
      [47, 1],
    ],
    [
      [0, 0],
      [5.5, 0.15],
      [5.85, 0.18],
      [6.2, 0.24],
      [7.6, 0.4],
      [25.65, 0.62],
      [28, 0.76],
      [30.45, 0.79],
      [32.4, 0.86],
      [44, 1],
    ],
  ],
};

export function tickerNarratedProgress(chapter: number, seconds: number, locale: 'zh' | 'en') {
  if (!Number.isFinite(seconds) || !Number.isInteger(chapter) || chapter < 0 || chapter > 4)
    throw new RangeError('Narrated tape progress needs a known chapter and finite time.');
  const beats = tickerSpeechBeats[locale][chapter];
  if (seconds <= 0) return 0;
  for (let i = 1; i < beats.length; i++) {
    const [endTime, endProgress] = beats[i];
    if (seconds <= endTime) {
      const [startTime, startProgress] = beats[i - 1];
      return (
        startProgress +
        ((seconds - startTime) / (endTime - startTime)) * (endProgress - startProgress)
      );
    }
  }
  return 1;
}

export function tickerEvidenceShot(chapter: number, progress: number) {
  if (!Number.isFinite(progress) || !Number.isInteger(chapter) || chapter < 0 || chapter > 4)
    throw new RangeError('Unknown tape chapter or progress.');
  const p = clampUnit(progress);
  if (chapter === 0)
    return {
      view: p < 0.2 || p >= 0.8 ? 'steady' : p < 0.55 ? 'acquire' : 'count',
      p,
      time: 0.1 * clampUnit((p - 0.2) / 0.29),
      reveal: false,
      predictionKnown: false,
    };
  if (chapter === 1)
    return { view: 'average', p, time: 1, reveal: p >= 0.8, predictionKnown: false };
  if (chapter === 2) return { view: 'local', p, time: 1, reveal: p >= 0.8, predictionKnown: false };
  if (chapter === 3)
    return {
      view: p < 0.2 ? 'acquire' : p < 0.62 ? 'segments' : p < 0.8 ? 'graph' : 'predict',
      p,
      time: 0.4 * clampUnit(p / 0.17),
      reveal: p >= 0.92,
      predictionKnown: p >= 0.9,
    };
  return {
    view: p < 0.18 ? 'acquire' : p < 0.62 ? 'segments' : p < 0.86 ? 'predict' : 'masses',
    p,
    time: 0.3 * clampUnit(p / 0.15),
    reveal: p >= 0.79,
    predictionKnown: p >= 0.76,
  };
}

/** Count the actual recorded gaps before exposing the derived average. */
export function tapeAverageBeat(progress: number) {
  if (!Number.isFinite(progress)) throw new RangeError('Reading progress must be finite.');
  const p = clampUnit(progress);
  return {
    distanceVisible: p >= 0.18,
    timeVisible: p >= 0.36,
    countedGaps: Math.min(10, Math.floor(clampUnit((p - 0.36) / 0.16) * 10 + 1e-8)),
    averageVisible: p >= 0.56,
  };
}

/** Schematic striker: contact occurs at the same 50-Hz acquisition instants. */
export function tickerNeedleAt(time: number) {
  if (!Number.isFinite(time)) throw new RangeError('Needle time must be finite.');
  const lift = 10 * Math.abs(Math.sin(time * TAPE_FREQUENCY * Math.PI));
  return { lift, contactOpacity: Math.max(0, 1 - lift / 2) };
}
