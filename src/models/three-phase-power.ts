export interface ThreePhaseParameters {
  voltage: number;
  frequency: number;
  impedance: number;
  angle: number;
  aScale: number;
  phases: 1 | 3;
}
export const threePhaseDefaults = (): ThreePhaseParameters => ({
  voltage: 230,
  frequency: 50,
  impedance: 100,
  angle: 0,
  aScale: 1,
  phases: 3,
});
export function threePhase(p: ThreePhaseParameters, theta: number) {
  if (
    ![p.voltage, p.frequency, p.impedance, p.angle, p.aScale, theta].every(Number.isFinite) ||
    p.voltage <= 0 ||
    p.frequency <= 0 ||
    p.impedance <= 0 ||
    p.aScale <= 0 ||
    Math.abs(p.angle) > Math.PI / 3 + 1e-12 ||
    ![1, 3].includes(p.phases)
  )
    throw new RangeError('Sinusoidal star load parameters required');
  const phase = Array.from({ length: 3 }, (_, index) => {
    const phaseAngle = theta - (index * 2 * Math.PI) / 3,
      z = p.impedance * (index === 0 ? p.aScale : 1),
      active = p.phases === 3 || index === 0,
      irms = active ? p.voltage / z : 0,
      v = Math.SQRT2 * p.voltage * Math.sin(phaseAngle),
      i = Math.SQRT2 * irms * Math.sin(phaseAngle - p.angle);
    return {
      index,
      active,
      phaseAngle,
      impedance: z,
      resistance: z * Math.cos(p.angle),
      inductance: (z * Math.sin(p.angle)) / (2 * Math.PI * p.frequency),
      irms,
      voltage: v,
      current: i,
      power: v * i,
      activePower: p.voltage * irms * Math.cos(p.angle),
      reactivePower: p.voltage * irms * Math.sin(p.angle),
      phasor: [p.voltage * Math.cos(phaseAngle), p.voltage * Math.sin(phaseAngle)] as [
        number,
        number,
      ],
    };
  });
  const neutral = phase.reduce((s, q) => s + q.current, 0),
    power = phase.reduce((s, q) => s + q.power, 0),
    activePower = phase.reduce((s, q) => s + q.activePower, 0),
    reactivePower = phase.reduce((s, q) => s + q.reactivePower, 0),
    neutralX = phase.reduce(
      (s, q) => s + q.irms * Math.cos((-q.index * 2 * Math.PI) / 3 - p.angle),
      0,
    ),
    neutralY = phase.reduce(
      (s, q) => s + q.irms * Math.sin((-q.index * 2 * Math.PI) / 3 - p.angle),
      0,
    );
  return {
    ...p,
    theta,
    phase,
    neutral,
    power,
    activePower,
    reactivePower,
    neutralRms: Math.hypot(neutralX, neutralY),
    lineVoltage: phase[0].voltage - phase[1].voltage,
    lineRms: Math.hypot(
      phase[0].phasor[0] - phase[1].phasor[0],
      phase[0].phasor[1] - phase[1].phasor[1],
    ),
  };
}
export function threePhaseShot(chapter: number, progress: number) {
  const u = Math.max(0, Math.min(1, progress)),
    p = threePhaseDefaults();
  if (chapter === 2) p.phases = 1;
  if (chapter === 4) p.angle = Math.PI / 4;
  if (chapter === 5) p.aScale = 0.5;
  return threePhase(p, 2 * Math.PI * (2 * u + 0.125));
}
