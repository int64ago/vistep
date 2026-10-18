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
