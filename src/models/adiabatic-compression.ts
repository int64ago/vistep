/** Quasistatic ideal-gas piston with constant heat capacities; free expansion is endpoints only. */
export type GasProcess = 'adiabatic' | 'isothermal' | 'free';
export interface CompressionOptions {
  ratio?: number;
  gamma?: number;
  temperature0?: number;
  pressure0?: number;
  volume0?: number;
  process?: GasProcess;
}
export function gasProcess(o: CompressionOptions = {}) {
  const ratio = o.ratio ?? 0.5,
    gamma = o.gamma ?? 1.4,
    temperature0 = o.temperature0 ?? 300,
    pressure0 = o.pressure0 ?? 1e5,
    volume0 = o.volume0 ?? 0.001,
    process = o.process ?? 'adiabatic',
    R = 8.31446261815324;
  if (
    ![ratio, temperature0, pressure0, volume0].every((v) => Number.isFinite(v) && v > 0) ||
    !Number.isFinite(gamma) ||
    gamma <= 1 ||
    !['adiabatic', 'isothermal', 'free'].includes(process) ||
    (process === 'free' && ratio < 1)
  )
    throw new RangeError(
      'Physical state and heat capacity required; free expansion ratio must be at least one',
    );
  const moles = (pressure0 * volume0) / (R * temperature0),
    cv = R / (gamma - 1),
    volume = volume0 * ratio,
    temperature = process === 'adiabatic' ? temperature0 * ratio ** (1 - gamma) : temperature0,
    pressure = (moles * R * temperature) / volume,
    deltaU = moles * cv * (temperature - temperature0),
    workOn =
      process === 'adiabatic'
        ? deltaU
        : process === 'isothermal'
          ? -moles * R * temperature0 * Math.log(ratio)
          : 0,
    heatIn = deltaU - workOn,
    entropy = moles * cv * Math.log(temperature / temperature0) + moles * R * Math.log(ratio);
  return {
    ratio,
    gamma,
    temperature0,
    pressure0,
    volume0,
    process,
    moles,
    cv,
    volume,
    temperature,
    pressure,
    deltaU,
    workOn,
    heatIn,
    entropy,
  };
}
export function compressionShot(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress)),
    base = {
      ratio: 1 - 0.5 * p,
      gamma: 1.4,
      temperature0: 300,
      pressure0: 1e5,
      volume0: 0.001,
      process: 'adiabatic' as GasProcess,
      focus: 'piston' as 'piston' | 'plot' | 'free',
    };
  if (chapter === 1) return { ...base, focus: 'plot' as const };
  if (chapter === 2) return { ...base, process: 'isothermal' as const };
  if (chapter === 3) return { ...base, ratio: 0.5, gamma: p < 0.5 ? 1.4 : 5 / 3 };
  if (chapter === 4) {
    const compressed = gasProcess({ ratio: 0.5 });
    return {
      ...base,
      ratio: 1 + p,
      temperature0: compressed.temperature,
      pressure0: compressed.pressure,
      volume0: 0.0005,
    };
  }
  if (chapter === 5)
    return { ...base, ratio: p < 0.5 ? 1 : 2, process: 'free' as const, focus: 'free' as const };
  return base;
}
