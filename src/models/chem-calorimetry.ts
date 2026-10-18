const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const smooth = (x: number) => {
  const p = clamp(x, 0, 1);
  return p * p * (3 - 2 * p);
};
export interface CupOptions {
  baseMolarity?: number;
  vesselCapacity?: number;
  conductance?: number;
  acidTemperature?: number;
  baseTemperature?: number;
}
/** Equal 50 mL dilute solutions: density 1 g/mL, cp 4.18 J/(g K). Time law is illustrative. */
export function cupCalorimetry(time: number, options: CupOptions = {}) {
  const baseMolarity = clamp(options.baseMolarity ?? 0.55, 0, 1),
    vesselCapacity = clamp(options.vesselCapacity ?? 25, 0, 100),
    conductance = clamp(options.conductance ?? 1.5, 0, 10);
  const acidTemperature = options.acidTemperature ?? 20,
    baseTemperature = options.baseTemperature ?? 20.4;
  const initial = (acidTemperature + baseTemperature) / 2,
    solutionCapacity = 100 * 4.18,
    capacity = solutionCapacity + vesselCapacity;
  const acidMoles = 0.05 * 0.5,
    baseMoles = 0.05 * baseMolarity,
    waterMoles = Math.min(acidMoles, baseMoles),
    released = waterMoles * 57300;
  let temperature = initial,
    peak = initial,
    peakTime = 0,
    environment = 0,
    elapsed = 0;
  const end = clamp(time, 0, 180),
    points = [{ time: 0, temperature: initial }];
  while (elapsed < end - 1e-9) {
    const dt = Math.min(0.1, end - elapsed),
      next = elapsed + dt;
    const reactionHeat = released * (smooth(next / 20) - smooth(elapsed / 20));
    const exchange = conductance * (initial - temperature) * dt;
    temperature += (reactionHeat + exchange) / capacity;
    environment += exchange;
    elapsed = next;
    if (temperature > peak) {
      peak = temperature;
      peakTime = elapsed;
    }
    if (Math.round(elapsed * 10) % 10 === 0 || elapsed >= end)
      points.push({ time: elapsed, temperature });
  }
  const progress = smooth(end / 20),
    apparentHeat = solutionCapacity * (peak - initial);
  return {
    time: end,
    initial,
    temperature,
    peak,
    peakTime,
    progress,
    acidMoles,
    baseMoles,
    waterMoles,
    acidRemaining: acidMoles - waterMoles * progress,
    baseRemaining: baseMoles - waterMoles * progress,
    released: released * progress,
    environment,
    solutionCapacity,
    vesselCapacity,
    capacity,
    stored: capacity * (temperature - initial),
    residual: capacity * (temperature - initial) - released * progress - environment,
    apparentHeat,
    apparentEnthalpy: waterMoles > 0 ? -apparentHeat / waterMoles / 1000 : null,
    points,
  };
}
export function repeatedCups(conductance = 1.5, vesselCapacity = 25) {
  const offsets = [0.02, -0.01, -0.01];
  const rows = [-0.2, 0, 0.2].map((delta, i) => {
    const c = cupCalorimetry(120, {
      conductance: Math.max(0, conductance + delta),
      vesselCapacity,
    });
    return { initial: c.initial, peak: c.peak + offsets[i], rise: c.peak + offsets[i] - c.initial };
  });
  const meanRise = rows.reduce((sum, r) => sum + r.rise, 0) / rows.length;
  return { rows, meanRise, heat: 418 * meanRise, enthalpy: (-418 * meanRise) / 0.025 / 1000 };
}
/** Ideal ice calorimeter: initially 0 C; complete graphite oxidation; independent drains. */
export function iceCalorimetry(progress: number, carbonGrams = 0.04, ambientHeat = 800) {
  const p = clamp(progress, 0, 1),
    carbon = clamp(carbonGrams, 0, 0.1),
    latent = 333.5;
  const sourceHeat = (carbon / 12.01) * 393500 * p,
    outerHeat = clamp(ambientHeat, 0, 50000) * p;
  const guardMelt = Math.min(100, outerHeat / latent),
    leakage = Math.max(0, outerHeat - 100 * latent);
  const middleMelt = Math.min(200, (sourceHeat + leakage) / latent);
  return {
    progress: p,
    carbon,
    carbonRemaining: carbon * (1 - p),
    sourceHeat,
    outerHeat,
    guardMelt,
    middleMelt,
    latent,
    measuredHeat: middleMelt * latent,
    leakage,
    guardIntact: guardMelt < 100,
    overflow: Math.max(0, sourceHeat + leakage - 200 * latent),
  };
}
export function calorimetryDirector(chapter: number, progress: number) {
  const c = clamp(Math.floor(chapter), 0, 6),
    p = clamp(progress, 0, 1);
  return {
    chapter: c,
    progress: p,
    cupTime: c === 0 ? 0 : c === 1 ? 120 * p : 120,
    iceProgress: c < 5 ? 0 : c === 5 ? p : 1,
  };
}
