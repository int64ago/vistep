export interface InductorParameters {
  inductance: number;
  resistance: number;
  supply: number;
  clamp: number;
}
export const inductorDefaults = (): InductorParameters => ({
  inductance: 0.1,
  resistance: 20,
  supply: 6,
  clamp: 0.7,
});
function validate(p: InductorParameters, t: number) {
  if (
    ![p.inductance, p.resistance, p.supply, p.clamp].every(Number.isFinite) ||
    p.inductance <= 0 ||
    p.resistance <= 0 ||
    p.supply <= 0 ||
    p.clamp <= 0 ||
    !Number.isFinite(t) ||
    t < 0 ||
    t > 1
  )
    throw new RangeError('Positive RL circuit and clamp with bounded time required');
}
export function inductorOn(p: InductorParameters, time: number) {
  validate(p, time);
  const tau = p.inductance / p.resistance,
    steady = p.supply / p.resistance,
    current = steady * -Math.expm1(-time / tau),
    resistorVoltage = p.resistance * current,
    coilVoltage = p.supply - resistorVoltage;
  return {
    ...p,
    time,
    tau,
    steady,
    current,
    resistorVoltage,
    coilVoltage,
    switchVoltage: 0,
    energy: 0.5 * p.inductance * current ** 2,
    mode: 'on' as const,
  };
}
export function inductorOff(p: InductorParameters, time: number) {
  validate(p, time);
  const tau = p.inductance / p.resistance,
    initial = p.supply / p.resistance,
    b = p.clamp / p.resistance,
    A = initial + b,
    stopTime = tau * Math.log(A / b),
    t = Math.min(time, stopTime),
    decay = Math.exp(-t / tau),
    current = time >= stopTime ? 0 : A * decay - b,
    charge = tau * A * (1 - decay) - b * t,
    squareIntegral =
      0.5 * tau * A * A * (1 - decay * decay) - 2 * tau * A * b * (1 - decay) + b * b * t,
    resistorHeat = p.resistance * squareIntegral,
    clampHeat = p.clamp * charge,
    initialEnergy = 0.5 * p.inductance * initial ** 2,
    energy = 0.5 * p.inductance * current ** 2;
  return {
    ...p,
    time,
    tau,
    steady: initial,
    current,
    resistorVoltage: p.resistance * current,
    coilVoltage: current > 0 ? -(p.resistance * current + p.clamp) : 0,
    switchVoltage: current > 0 ? p.supply + p.clamp : p.supply,
    energy,
    initialEnergy,
    resistorHeat,
    clampHeat,
    stopTime,
    mode: 'off' as const,
  };
}
export type InductorState = ReturnType<typeof inductorOn> | ReturnType<typeof inductorOff>;
export function inductorShot(chapter: number, progress: number) {
  const p = inductorDefaults(),
    u = Math.max(0, Math.min(1, progress));
  if (chapter === 2) p.inductance = 0.2;
  if (chapter === 4) p.clamp = 30;
  if (chapter < 3) return inductorOn(p, (chapter === 2 ? 0.03 : 0.02) * u);
  const stop = inductorOff(p, 0).stopTime;
  return inductorOff(p, (chapter === 3 ? 0.003 : chapter === 4 ? stop * 1.3 : stop * 1.05) * u);
}
