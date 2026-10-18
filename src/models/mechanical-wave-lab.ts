export type RopeDrive = 'up' | 'down' | 'train';
export function sourceDisplacement(
  time: number,
  drive: RopeDrive = 'train',
  frequency = 0.8,
  amplitude = 0.12,
) {
  if (time <= 0) return 0;
  const period = 1 / frequency;
  if (drive !== 'train')
    return time >= period
      ? 0
      : (drive === 'up' ? 1 : -1) * amplitude * Math.sin((Math.PI * time) / period) ** 2;
  const q = Math.min(1, time / (period * 0.5)),
    envelope = q * q * (3 - 2 * q);
  return amplitude * envelope * Math.sin(2 * Math.PI * frequency * time);
}
export function mechanicalDisplacement(
  position: number,
  time: number,
  drive: RopeDrive = 'train',
  frequency = 0.8,
  amplitude = 0.12,
  speed = 2,
) {
  return sourceDisplacement(time - position / speed, drive, frequency, amplitude);
}
export function springMaterialPoint(position: number, time: number, frequency = 0.8) {
  return {
    equilibrium: position,
    position: position + mechanicalDisplacement(position, time, 'train', frequency, 0.2),
    displacement: mechanicalDisplacement(position, time, 'train', frequency, 0.2),
  };
}
export function springHelix(time: number, frequency = 0.8, turns = 55, samples = 1100) {
  return Array.from({ length: samples + 1 }, (_, i) => {
    const q = (i / samples) * 8,
      p = springMaterialPoint(q, time, frequency),
      phase = (2 * Math.PI * turns * i) / samples;
    return { q, x: p.position, y: Math.sin(phase), front: Math.cos(phase) >= 0 };
  });
}
export function humanWavePose(index: number, time: number, period = 2, delay = 0.22) {
  const tau = time - index * delay;
  return {
    index,
    x: index,
    crouch: tau <= 0 ? 0 : (1 - Math.cos((2 * Math.PI * tau) / period)) / 2,
    started: tau > 0,
  };
}
