/** Classical acoustics in a stationary, uniform medium. Time is in T₀, length in cT₀.
 * Circles are sections of spherical constant-phase fronts, not moving air parcels.
 * Both trajectories are straight and strictly subsonic. No light/relativistic model.
 */
export type DopplerVector = { x: number; y: number };
export type DopplerBody = { origin: DopplerVector; velocity: DopplerVector };
export type DopplerConfig = {
  c: number;
  period: number;
  source: DopplerBody;
  observer: DopplerBody;
};
export type DopplerArrival = {
  id: number;
  emitted: number;
  arrived: number;
  center: DopplerVector;
  contact: DopplerVector;
};
export const dopplerAdd = (a: DopplerVector, b: DopplerVector): DopplerVector => ({
  x: a.x + b.x,
  y: a.y + b.y,
});
export const dopplerScale = (a: DopplerVector, n: number): DopplerVector => ({
  x: a.x * n,
  y: a.y * n,
});
export const dopplerSub = (a: DopplerVector, b: DopplerVector): DopplerVector => ({
  x: a.x - b.x,
  y: a.y - b.y,
});
export const dopplerDot = (a: DopplerVector, b: DopplerVector) => a.x * b.x + a.y * b.y;
export const dopplerLength = (a: DopplerVector) => Math.hypot(a.x, a.y);
export const dopplerPosition = (body: DopplerBody, time: number) =>
  dopplerAdd(body.origin, dopplerScale(body.velocity, time));

export function validateDoppler(config: DopplerConfig) {
  const numbers = [
    config.c,
    config.period,
    ...[config.source, config.observer].flatMap((body) => [
      body.origin.x,
      body.origin.y,
      body.velocity.x,
      body.velocity.y,
    ]),
  ];
  if (!numbers.every(Number.isFinite) || config.c <= 0 || config.period <= 0)
    throw new RangeError('Finite geometry, c > 0 and period > 0 required');
  if (
    dopplerLength(config.source.velocity) >= config.c ||
    dopplerLength(config.observer.velocity) >= config.c
  )
    throw new RangeError('The sonic boundary and supersonic motion are outside this model');
}

/** Positive solution of |r + vτ| = cτ. Rationalized when the direct sum cancels. */
function travelDelay(r: DopplerVector, v: DopplerVector, c: number) {
  const distance2 = dopplerDot(r, r);
  if (distance2 === 0) return 0;
  const a = c * c - dopplerDot(v, v);
  const b = dopplerDot(r, v);
  const root = Math.sqrt(b * b + a * distance2);
  return b < 0 ? distance2 / (root - b) : (root + b) / a;
}

/** Each integer ID labels a phase crest emitted at id · T₀, including before t=0. */
export function dopplerArrival(config: DopplerConfig, id: number): DopplerArrival {
  validateDoppler(config);
  if (!Number.isSafeInteger(id)) throw new RangeError('Emission ID must be a safe integer');
  const emitted = id * config.period;
  const center = dopplerPosition(config.source, emitted);
  const r = dopplerSub(dopplerPosition(config.observer, emitted), center);
  const arrived = emitted + travelDelay(r, config.observer.velocity, config.c);
  return { id, emitted, arrived, center, contact: dopplerPosition(config.observer, arrived) };
}

/** Backtrace the phase arriving now to its exact emission position. */
export function dopplerRetarded(config: DopplerConfig, time: number) {
  validateDoppler(config);
  if (!Number.isFinite(time)) throw new RangeError('Finite time required');
  const observer = dopplerPosition(config.observer, time);
  const r = dopplerSub(observer, dopplerPosition(config.source, time));
  const delay = travelDelay(r, config.source.velocity, config.c);
  const emitted = time - delay;
  const center = dopplerPosition(config.source, emitted);
  const direction =
    delay > 0 ? dopplerScale(dopplerSub(observer, center), 1 / (config.c * delay)) : null;
  // At coincident source/observer, ray direction and its derivative are undefined.
  const frequencyRatio = direction
    ? (config.c - dopplerDot(direction, config.observer.velocity)) /
      (config.c - dopplerDot(direction, config.source.velocity))
    : null;
  return { emitted, delay, center, observer, direction, frequencyRatio };
}

export function dopplerFrame(config: DopplerConfig, time: number) {
  const retarded = dopplerRetarded(config, time);
  const source = dopplerPosition(config.source, time);
  const observer = retarded.observer;
  const lastId = Math.floor(retarded.emitted / config.period);
  const previous = dopplerArrival(config, lastId);
  const next = dopplerArrival(config, lastId + 1);
  const interval = next.arrived - previous.arrived;
  const sourceSpeed = dopplerLength(config.source.velocity);
  // A conservative envelope around both current bodies plus the field margins.
  // Renderer culling removes circles that do not intersect its viewport.
  const maxAge =
    (dopplerLength(dopplerSub(observer, source)) + 16 * config.c * config.period) /
    (config.c - sourceSpeed);
  const firstId = Math.floor((time - maxAge) / config.period);
  const latestId = Math.floor(time / config.period);
  const frontCount = latestId - firstId + 1;
  // The exact arrival solver supports arbitrarily close subsonic inputs. A finite
  // visual cannot materialize millions of crests; never silently drop identities.
  if (frontCount > 2048)
    throw new RangeError(
      'Too many phase fronts for this visual field; use the exact arrival solver',
    );
  const wavefronts = Array.from({ length: frontCount }, (_, i) => {
    const id = firstId + i;
    const emitted = id * config.period;
    return {
      id,
      emitted,
      center: dopplerPosition(config.source, emitted),
      radius: config.c * (time - emitted),
    };
  });
  const rulerStart = time - 3.5 * config.period;
  const rulerEnd = time + 2.5 * config.period;
  const startId = Math.min(
    Math.floor(dopplerRetarded(config, rulerStart).emitted / config.period) - 1,
    Math.floor(rulerStart / config.period),
  );
  const endId = Math.max(
    Math.ceil(dopplerRetarded(config, rulerEnd).emitted / config.period) + 1,
    Math.ceil(rulerEnd / config.period),
  );
  const events = Array.from({ length: endId - startId + 1 }, (_, i) =>
    dopplerArrival(config, startId + i),
  );
  return {
    config,
    time,
    source,
    observer,
    retarded,
    previous,
    next,
    interval,
    averageRatio: config.period / interval,
    frontWavelength: (config.c - sourceSpeed) * config.period,
    rearWavelength: (config.c + sourceSpeed) * config.period,
    wavefronts,
    events,
    rulerStart,
    rulerEnd,
    sourcePulse: Math.exp(-7 * (time / config.period - Math.floor(time / config.period))),
    arrivalPulse: Math.exp(-7 * Math.max(0, (time - previous.arrived) / config.period)),
  };
}
export type DopplerFrame = ReturnType<typeof dopplerFrame>;
export type DopplerFocus =
  'equal' | 'centers' | 'front' | 'rear' | 'receiver' | 'together' | 'bearing' | 'limit';
export const dopplerFocus: DopplerFocus[] = [
  'equal',
  'centers',
  'front',
  'rear',
  'receiver',
  'together',
  'bearing',
  'limit',
];

export function dopplerExperiment(
  sourceSpeed = 0.55,
  observerSpeed = 0,
  offset = 1.5,
): DopplerConfig {
  return {
    c: 1,
    period: 1,
    source: { origin: { x: -3.2, y: 0 }, velocity: { x: sourceSpeed, y: 0 } },
    observer: { origin: { x: 3.2, y: offset }, velocity: { x: observerSpeed, y: 0 } },
  };
}

/** Editorial cuts select independent constant-velocity experiments; never integrate frame history. */
export function dopplerShot(chapter: number, progress: number) {
  const index = Math.max(0, Math.min(7, Math.floor(Number.isFinite(chapter) ? chapter : 0)));
  const q = Math.max(0, Math.min(1, ((Number.isFinite(progress) ? progress : 0) - 0.06) / 0.86));
  const p = q * q * (3 - 2 * q);
  const config = dopplerExperiment();
  let duration = 7;
  switch (index) {
    case 0:
      config.source.velocity.x = 0;
      config.source.origin.x = -2;
      config.observer.origin = { x: 2.3, y: 0 };
      break;
    case 1:
      config.source.velocity.x = 0.45;
      config.observer.origin.y = 1.3;
      duration = 8;
      break;
    case 2:
      config.observer.origin.y = 0;
      duration = 6.8;
      break;
    case 3:
      config.source.origin.x = -1;
      config.observer.origin = { x: -3.2, y: 0 };
      duration = 6.8;
      break;
    case 4:
      config.source.velocity.x = 0;
      config.observer.velocity.x = -0.4;
      config.observer.origin.y = 0;
      duration = 9;
      break;
    case 5:
      config.source.velocity.x = 0.35;
      config.observer.velocity.x = 0.35;
      config.observer.origin = { x: 0.8, y: 0 };
      duration = 8;
      break;
    case 6:
      config.source.origin.x = -3.6;
      config.source.velocity.x = 0.65;
      config.observer.origin = { x: 0, y: 1.5 };
      duration = 12;
      break;
    case 7:
      config.source.velocity.x = 0.85;
      config.observer.origin = { x: 3.5, y: 0 };
      duration = 7;
      break;
  }
  return { focus: dopplerFocus[index], frame: dopplerFrame(config, p * duration) };
}
