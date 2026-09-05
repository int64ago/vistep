export function bicycleModel(
  front: number,
  rear: number,
  cadence: number,
  slope: number,
  mass = 80,
) {
  const ratio = front / rear,
    wheelRadius = 0.34,
    crank = 0.17,
    efficiency = 0.96;
  const speed = (cadence / 60) * ratio * 2 * Math.PI * wheelRadius;
  const angle = Math.atan(slope / 100);
  const roadForce =
    mass * 9.81 * (Math.sin(angle) + 0.006 * Math.cos(angle)) + 0.5 * 1.225 * 0.4 * speed ** 2;
  const wheelTorque = roadForce * wheelRadius;
  const crankTorque = (wheelTorque * ratio) / efficiency;
  return {
    ratio,
    speedKmh: speed * 3.6,
    roadForce,
    wheelTorque,
    crankTorque,
    pedalForce: crankTorque / crank,
    power: (crankTorque * cadence * 2 * Math.PI) / 60,
  };
}
