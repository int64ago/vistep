import { chainLoop, TAU } from './mechanisms';
export function bicycleCircular(time: number, rear = 20, cadence = 20) {
  if (
    ![time, rear, cadence].every(Number.isFinite) ||
    !Number.isInteger(rear) ||
    rear < 16 ||
    rear > 24 ||
    cadence < 0
  )
    throw new RangeError('Finite time,16–24 rear teeth and nonnegative cadence required');
  const front = 40,
    pitch = 0.0127,
    chain = chainLoop(front, rear, pitch, 0.42),
    t = Math.max(0, time),
    turns = (t * cadence) / 60,
    phase = turns * front,
    omegaFront = (cadence / 60) * TAU,
    omegaRear = (omegaFront * front) / rear,
    radiusFront = (front * pitch) / TAU,
    radiusRear = (rear * pitch) / TAU,
    chainSpeed = omegaFront * radiusFront,
    frontAngle = chain.alpha - (phase * TAU) / front,
    rearAngle = chain.alpha + ((chain.lengths[0] - phase) * TAU) / rear;
  return {
    time: t,
    front,
    rear,
    cadence,
    chain,
    phase,
    frontAngle,
    rearAngle,
    omegaFront,
    omegaRear,
    radiusFront,
    radiusRear,
    chainSpeed,
    wheelRadius: 0.34,
    wheelRimSpeed: omegaRear * 0.34,
    wheelMidSpeed: omegaRear * 0.17,
    frontSweep: omegaFront * t,
    rearSweep: omegaRear * t,
  };
}

export type BicycleSceneState = {
  view: 'overview' | 'chain' | 'angles' | 'wheel';
  time: number;
  rear: number;
  cadence: number;
};
/** A deterministic presentation of the retained pitch/chain model. */
export function bicycleFilmState(chapter: number, progress: number): BicycleSceneState {
  const c = Number.isFinite(chapter) ? Math.max(0, Math.min(3, Math.floor(chapter))) : 0;
  const p = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress) / 0.82) : 0;
  // A labelled link must actually return to its origin in the tracking chapter.
  const loopSeconds = bicycleCircular(0).chain.count / ((20 / 60) * 40);
  const ease = (x: number) => {
    const u = Math.min(1, Math.max(0, x));
    return u * u * (3 - 2 * u);
  };
  // Compare a short sweep first, then complete the narrated 40:20 tooth example.
  const comparisonTime = p <= 0.22 ? 0.25 * ease(p / 0.22) : 0.25 + 2.75 * ease((p - 0.22) / 0.46);
  return {
    view: (['overview', 'chain', 'angles', 'wheel'] as const)[c],
    time: c === 2 ? comparisonTime : p * (c === 1 ? loopSeconds : 1.6),
    rear: 20,
    cadence: 20,
  };
}

/** Clockwise physical rotation; the SVG flips its y axis only at rendering. */
export function bicycleWheelVelocity(angle: number, radius: number, omega: number) {
  if (![angle, radius, omega].every(Number.isFinite) || radius < 0 || omega < 0)
    throw new RangeError('Finite angle and nonnegative radius/angular speed required');
  return {
    x: radius * Math.cos(angle),
    y: radius * Math.sin(angle),
    vx: omega * radius * Math.sin(angle),
    vy: -omega * radius * Math.cos(angle),
  };
}
