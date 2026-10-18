/** Reduced, cycle-averaged model of friction-driven basin vibration.
 * E is normalized modal energy, not joules. Fluid breakup is qualitative.
 * dE/dt = 2 (gain - loss) E - 2 gain E².
 * References and the limits of this averaging are documented in the scene brief.
 */
export type BasinMode = 2 | 3;
export type BasinInput = {
  mode: BasinMode;
  strength: number;
  fill: number;
  stopAt?: number;
};
export const BASIN_DEFAULT: BasinInput = { mode: 2, strength: 1, fill: 0.5 };
export const BASIN_SEED_ENERGY = 0.0004;
export const BASIN_LOSS = 0.4;

function validate(input: BasinInput) {
  if (
    ![2, 3].includes(input.mode) ||
    !Number.isFinite(input.strength) ||
    input.strength < 0 ||
    input.strength > 1.5 ||
    !Number.isFinite(input.fill) ||
    input.fill < 0 ||
    input.fill > 1 ||
    (input.stopAt !== undefined && (!Number.isFinite(input.stopAt) || input.stopAt < 0))
  )
    throw new RangeError('Basin parameters outside the teaching model');
}

/** Closed-form logistic evolution also covers subthreshold friction and g = 0. */
export function basinEnergyAfter(initial: number, seconds: number, strength: number) {
  const time = Math.max(0, seconds),
    gain = 1.05 * strength,
    net = gain - BASIN_LOSS;
  if (Math.abs(net) < 1e-10) return initial / (1 + 2 * gain * initial * time);
  const e = Math.exp(-2 * net * time);
  return initial / (e + ((gain * initial) / net) * (1 - e));
}

export function basinEnergy(time: number, input: BasinInput = BASIN_DEFAULT) {
  validate(input);
  if (!Number.isFinite(time) || time < 0)
    throw new RangeError('Time must be finite and nonnegative');
  const rubbingTime = Math.min(time, input.stopAt ?? time);
  const built = basinEnergyAfter(BASIN_SEED_ENERGY, rubbingTime, input.strength);
  return built * Math.exp(-2 * BASIN_LOSS * (time - rubbingTime));
}

export function basinFrequency(mode: BasinMode, fill: number) {
  // 100 / 300 Hz at half fill are representative examples, not a calibrated basin.
  return (mode === 2 ? 100 : 300) * Math.sqrt(1.25 / (1 + 0.5 * fill));
}

export function basinModeValue(theta: number, mode: BasinMode) {
  return Math.cos(mode * (theta - Math.PI / (2 * mode)));
}

export function basinAntinodes(mode: BasinMode) {
  return Array.from({ length: 2 * mode }, (_, index) => ({
    index,
    theta: Math.PI / (2 * mode) + (index * Math.PI) / mode,
  }));
}

export function basinState(time: number, input: BasinInput = BASIN_DEFAULT) {
  const energy = basinEnergy(time, input),
    amplitude = Math.sqrt(energy),
    rubbing = input.strength > 0 && time < (input.stopAt ?? Infinity),
    gain = rubbing ? 1.05 * input.strength : 0;
  return {
    time,
    energy,
    amplitude,
    rubbing,
    frequency: basinFrequency(input.mode, input.fill),
    inputPower: 2 * gain * energy * (1 - energy),
    lossPower: 2 * BASIN_LOSS * energy,
    // Carrier is deliberately slowed, and wall motion enlarged, in the drawing.
    visualPhase: time * 2 * Math.PI * 0.65,
    spraySites: input.fill > 0 && amplitude > 0.5 ? 2 * input.mode : 0,
  };
}

/** Radial shell mode, projected as an ellipse. Shared by live art and cover. */
export function basinRimPath(
  mode: BasinMode,
  amplitude: number,
  phase: number,
  radius = 124,
  cy = 144,
) {
  return (
    Array.from({ length: 145 }, (_, i) => {
      const theta = (i / 144) * Math.PI * 2,
        r = radius + 4 * amplitude * basinModeValue(theta, mode) * Math.cos(phase);
      return `${i ? 'L' : 'M'}${(180 + r * Math.cos(theta)).toFixed(3)} ${(cy + r * 0.48 * Math.sin(theta)).toFixed(3)}`;
    }).join(' ') + 'Z'
  );
}

/** Ballistic markers born at active antinodes; spray thresholds/speeds are illustrative. */
export function basinDroplets(time: number, input: BasinInput = BASIN_DEFAULT) {
  const result: { id: string; theta: number; height: number; age: number }[] = [];
  if (input.fill === 0) return result;
  for (const node of basinAntinodes(input.mode)) {
    const last = Math.floor((time - node.index * 0.023) * 11);
    for (let k = Math.max(0, last - 8); k <= last; k++) {
      const emittedAt = k / 11 + node.index * 0.023,
        age = time - emittedAt;
      if (age < 0) continue;
      const amplitude = Math.sqrt(basinEnergy(emittedAt, input));
      if (amplitude <= 0.5) continue;
      const speed = 1.8 * Math.sqrt(amplitude - 0.5),
        height = speed * age - 4.9 * age * age;
      if (height > 0) result.push({ id: `${node.index}-${k}`, theta: node.theta, height, age });
    }
  }
  return result;
}
