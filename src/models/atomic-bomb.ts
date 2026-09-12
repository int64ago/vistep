/** Fission teaching models: binding energy, one fission channel, one-group multiplication in a
 * bare sphere and a counter-addressed neutron random walk with the same collision probabilities.
 *
 * Length unit: one neutron mean free path λ between collisions. Time unit: λ / neutron speed.
 * These are textbook approximations (Lamarsh ch. 6, Serber's primer §§2–5) with illustrative
 * cross-section ratios; they are not material data and do not describe any device.
 */

/** Semi-empirical mass formula coefficients in MeV (Rohlf, Modern Physics from α to Z⁰). */
export const SEMF = {
  volume: 15.75,
  surface: 17.8,
  coulomb: 0.711,
  asymmetry: 23.7,
  pairing: 11.18,
} as const;
export const U_MEV = 931.49410242;
const HYDROGEN_U = 1.00782503223,
  NEUTRON_U = 1.00866491588;
export type Nuclide = { name: string; A: number; Z: number; massU: number };
/** AME2020 atomic masses in u; U-235 fission into Ba-141 + Kr-92 + 3n is the OpenStax example. */
export const NUCLIDES = {
  u235: { name: 'U-235', A: 235, Z: 92, massU: 235.0439281 },
  ba141: { name: 'Ba-141', A: 141, Z: 56, massU: 140.914403 },
  kr92: { name: 'Kr-92', A: 92, Z: 36, massU: 91.926173 },
  fe56: { name: 'Fe-56', A: 56, Z: 26, massU: 55.9349363 },
} as const satisfies Record<string, Nuclide>;

function checkNucleus(A: number, Z: number) {
  if (!Number.isInteger(A) || !Number.isInteger(Z) || A < 1 || Z < 0 || Z > A)
    throw new RangeError('A nucleus needs integer A ≥ 1 and 0 ≤ Z ≤ A');
}
/** Bethe–Weizsäcker binding energy in MeV. */
export function semfBindingMeV(A: number, Z: number, includePairing = true) {
  checkNucleus(A, Z);
  const N = A - Z,
    pairing = !includePairing || A % 2 ? 0 : ((Z % 2 ? -1 : 1) * SEMF.pairing) / Math.sqrt(A);
  return (
    SEMF.volume * A -
    SEMF.surface * A ** (2 / 3) -
    (SEMF.coulomb * Z * (Z - 1)) / A ** (1 / 3) -
    (SEMF.asymmetry * (N - Z) ** 2) / A +
    pairing
  );
}
/** The most bound Z for a given A under the same formula. */
export function semfStableZ(A: number) {
  if (!Number.isInteger(A) || A < 1) throw new RangeError('A must be a positive integer');
  return Math.max(1, Math.round(A / (1.98 + 0.0155 * A ** (2 / 3))));
}
/** Measured binding energy per nucleon from an atomic mass. */
export function measuredBindingMeV(nuclide: Nuclide) {
  checkNucleus(nuclide.A, nuclide.Z);
  const N = nuclide.A - nuclide.Z;
  return (nuclide.Z * HYDROGEN_U + N * NEUTRON_U - nuclide.massU) * U_MEV;
}
export const bindingPerNucleon = (nuclide: Nuclide) => measuredBindingMeV(nuclide) / nuclide.A;
/** Binding energy per nucleon along the valley of stability, for the curve. The pairing term is
 * omitted so the drawn trend does not alternate with parity; marked nuclides use measured masses. */
export function bindingCurve(maxA = 250, step = 1) {
  if (!Number.isInteger(maxA) || maxA < 4 || !Number.isInteger(step) || step < 1)
    throw new RangeError('Invalid binding curve range');
  const points: { A: number; perNucleon: number }[] = [];
  for (let A = 4; A <= maxA; A += step) {
    const Z = semfStableZ(A);
    points.push({ A, perNucleon: Math.max(0, semfBindingMeV(A, Z, false) / A) });
  }
  return points;
}
/** Q of n + U-235 → Ba-141 + Kr-92 + 3 n from measured masses (≈ 173 MeV prompt release). */
export function fissionQMeV() {
  return (
    (NUCLIDES.u235.massU + NEUTRON_U - NUCLIDES.ba141.massU - NUCLIDES.kr92.massU - 3 * NEUTRON_U) *
    U_MEV
  );
}
/** Mass fraction converted, from the same channel. */
export const fissionMassFraction = () => fissionQMeV() / U_MEV / (NUCLIDES.u235.massU + NEUTRON_U);
/** A typical chemical reaction releases a few eV per atom (carbon combustion ≈ 4.1 eV). */
export const CHEMICAL_EV_PER_ATOM = 4.1;

/** Illustrative one-group constants shared by the diffusion estimate and the random walk.
 * Per collision: 0.72 scatter, 0.25 fission, 0.03 capture; 2.4 prompt neutrons per fission. */
export const FISSION = {
  nu: 2.4,
  scatter: 0.72,
  fission: 0.25,
  capture: 0.03,
  threeNeutronChance: 0.4,
  extrapolation: 0.71,
  promptGenerationS: 1e-8,
  thermalPromptLifetimeS: 1e-4,
  delayedFraction: 0.0065,
  delayedMeanLifeS: 12.5,
} as const;
export const infiniteMultiplication = () =>
  (FISSION.nu * FISSION.fission) / (FISSION.fission + FISSION.capture);
/** Diffusion area L² = D/Σa with D = λ/3 and Σa per unit λ. */
export const diffusionArea = () => 1 / 3 / (FISSION.fission + FISSION.capture);
function checkRadius(radius: number) {
  if (!Number.isFinite(radius) || radius <= 0)
    throw new RangeError('Sphere radius must be a positive number of mean free paths');
}
/** Bare-sphere geometric buckling with the extrapolated boundary. */
export const buckling = (radius: number) => (
  checkRadius(radius),
  Math.PI / (radius + FISSION.extrapolation)
);
/** Effective multiplication k = k∞ / (1 + L²B²) for a bare sphere of the given radius (in λ). */
export function multiplication(radius: number) {
  return infiniteMultiplication() / (1 + diffusionArea() * buckling(radius) ** 2);
}
export const nonLeakage = (radius: number) => 1 / (1 + diffusionArea() * buckling(radius) ** 2);
/** Radius where k = 1 in the same model. */
export function criticalRadius() {
  const b = Math.sqrt((infiniteMultiplication() - 1) / diffusionArea());
  return Math.PI / b - FISSION.extrapolation;
}
/** Sphere surface-to-volume ratio in 1/λ. */
export const surfaceToVolume = (radius: number) => (checkRadius(radius), 3 / radius);

/** Populations after g generations and neutron number against time for a fixed k and lifetime. */
export function generationGrowth(k: number, generations: number) {
  if (!Number.isFinite(k) || k <= 0 || !Number.isFinite(generations) || generations < 0)
    throw new RangeError('Invalid growth request');
  return k ** generations;
}
export function generationsToReach(k: number, target: number) {
  if (!Number.isFinite(k) || k <= 1 || !Number.isFinite(target) || target < 1)
    throw new RangeError('Growth requires k > 1 and a target ≥ 1');
  return Math.log(target) / Math.log(k);
}
/** One delayed group: the average time between generations lengthens to (1−β)ℓ + β·τd. */
export function effectiveGenerationS(promptLifetimeS: number) {
  if (!Number.isFinite(promptLifetimeS) || promptLifetimeS <= 0)
    throw new RangeError('Prompt lifetime must be positive');
  return (
    (1 - FISSION.delayedFraction) * promptLifetimeS +
    FISSION.delayedFraction * FISSION.delayedMeanLifeS
  );
}
export function populationAt(k: number, generationS: number, timeS: number) {
  if (!Number.isFinite(generationS) || generationS <= 0 || !Number.isFinite(timeS) || timeS < 0)
    throw new RangeError('Invalid population request');
  return generationGrowth(k, timeS / generationS);
}
export type GrowthRegime = { id: string; k: number; generationS: number };
export const GROWTH_REGIMES: GrowthRegime[] = [
  { id: 'reactor-prompt', k: 1.001, generationS: FISSION.thermalPromptLifetimeS },
  {
    id: 'reactor-delayed',
    k: 1.001,
    generationS: effectiveGenerationS(FISSION.thermalPromptLifetimeS),
  },
  { id: 'explosive', k: 1.5, generationS: FISSION.promptGenerationS },
];

/** Uniform expansion by a linear factor s at fixed mass: density falls as 1/s³, so the mean free
 * path grows as s³ and the radius measured in mean free paths falls as 1/s². */
export function expandedRadius(radius: number, scale: number) {
  checkRadius(radius);
  if (!Number.isFinite(scale) || scale < 1) throw new RangeError('Expansion scale must be ≥ 1');
  return radius / scale ** 2;
}
export const expandedMultiplication = (radius: number, scale: number) =>
  multiplication(expandedRadius(radius, scale));
/** Expansion factor at which the same sphere returns to k = 1. */
export function stoppingScale(radius: number) {
  checkRadius(radius);
  return Math.sqrt(Math.max(1, radius / criticalRadius()));
}

/** Counter-addressed unit random: no cursor, so seeking cannot change any history. */
export function unitRandom(seed: number, neutron: number, step: number) {
  for (const value of [seed, neutron, step])
    if (!Number.isInteger(value) || value < 0 || value > 0xffffffff)
      throw new RangeError('Random counters must be unsigned 32-bit integers');
  let word = (seed ^ Math.imul(neutron + 1, 0x9e3779b9) ^ Math.imul(step + 1, 0x85ebca6b)) >>> 0;
  word = Math.imul(word ^ (word >>> 16), 0x7feb352d);
  word = Math.imul(word ^ (word >>> 15), 0x846ca68b);
  word = (word ^ (word >>> 16)) >>> 0;
  return (word + 0.5) / 0x100000000;
}
export type Vec3 = readonly [number, number, number];
export type NeutronFate = 'leak' | 'capture' | 'fission' | 'open';
export type Neutron = {
  id: number;
  generation: number;
  parent: number | null;
  born: number;
  /** Start point, every collision, and the final point (surface exit for a leak). */
  points: Vec3[];
  /** Cumulative time at each point. */
  times: number[];
  end: number;
  fate: NeutronFate;
  children: number[];
};
export type FissionChain = {
  radius: number;
  seed: number;
  neutrons: Neutron[];
  /** Neutrons born in each generation. */
  generations: number[];
  fissions: number;
  leaked: number;
  captured: number;
  duration: number;
  truncated: boolean;
};
export type ChainOptions = { maxNeutrons?: number; maxGenerations?: number; maxFlights?: number };
/** Transport random walk in a bare sphere: exponential flights, isotropic scattering, the same
 * collision fractions as the diffusion estimate. Children start where their parent fissioned. */
export function fissionChain(
  radius: number,
  seed: number,
  options: ChainOptions = {},
): FissionChain {
  if (radius !== Infinity) checkRadius(radius);
  const maxNeutrons = options.maxNeutrons ?? 400,
    maxGenerations = options.maxGenerations ?? 14,
    maxFlights = options.maxFlights ?? 80;
  if (![maxNeutrons, maxGenerations, maxFlights].every((v) => Number.isInteger(v) && v > 0))
    throw new RangeError('Chain limits must be positive integers');
  const neutrons: Neutron[] = [],
    generations: number[] = [],
    absorb = FISSION.fission + FISSION.capture,
    fissionShare = FISSION.fission / absorb;
  let fissions = 0,
    leaked = 0,
    captured = 0,
    truncated = false;
  const spawn = (generation: number, parent: number | null, born: number, at: Vec3) => {
    if (neutrons.length >= maxNeutrons || generation >= maxGenerations) {
      truncated = true;
      return;
    }
    const id = neutrons.length;
    neutrons.push({
      id,
      generation,
      parent,
      born,
      points: [at],
      times: [born],
      end: born,
      fate: 'open',
      children: [],
    });
    generations[generation] = (generations[generation] ?? 0) + 1;
  };
  spawn(0, null, 0, [0, 0, 0]);
  for (let id = 0; id < neutrons.length; id++) {
    const n = neutrons[id];
    let [x, y, z] = n.points[0],
      time = n.born;
    for (let flight = 0; flight < maxFlights; flight++) {
      const base = flight * 6;
      const length = -Math.log(unitRandom(seed, id, base)),
        cosTheta = 2 * unitRandom(seed, id, base + 1) - 1,
        phi = 2 * Math.PI * unitRandom(seed, id, base + 2),
        sinTheta = Math.sqrt(1 - cosTheta * cosTheta);
      const dx = sinTheta * Math.cos(phi),
        dy = sinTheta * Math.sin(phi),
        dz = cosTheta;
      // Exit distance along this direction: |p + d t|² = R².
      const b = x * dx + y * dy + z * dz,
        c = x * x + y * y + z * z - radius * radius,
        exit = radius === Infinity ? Infinity : -b + Math.sqrt(Math.max(0, b * b - c));
      if (length >= exit) {
        x += dx * exit;
        y += dy * exit;
        z += dz * exit;
        time += exit;
        n.points.push([x, y, z]);
        n.times.push(time);
        n.fate = 'leak';
        leaked++;
        break;
      }
      x += dx * length;
      y += dy * length;
      z += dz * length;
      time += length;
      n.points.push([x, y, z]);
      n.times.push(time);
      if (unitRandom(seed, id, base + 3) < absorb) {
        if (unitRandom(seed, id, base + 4) < fissionShare) {
          n.fate = 'fission';
          fissions++;
          const count = unitRandom(seed, id, base + 5) < FISSION.threeNeutronChance ? 3 : 2;
          for (let child = 0; child < count; child++) {
            const next = neutrons.length;
            spawn(n.generation + 1, id, time, [x, y, z]);
            if (neutrons.length > next) n.children.push(next);
          }
        } else {
          n.fate = 'capture';
          captured++;
        }
        break;
      }
    }
    if (n.fate === 'open') truncated = true;
    n.end = time;
  }
  return {
    radius,
    seed,
    neutrons,
    generations,
    fissions,
    leaked,
    captured,
    duration: Math.max(...neutrons.map((n) => n.end)),
    truncated,
  };
}
/** Neutrons born per neutron of the previous generation, per completed generation. */
export function chainMultiplication(chain: FissionChain) {
  return chain.generations.slice(1).map((count, i) => count / chain.generations[i]);
}
/** Power-iteration estimate of k from the same walk: independent single-neutron histories, each
 * batch started where the previous batch's fission neutrons were born. */
export function estimateMultiplication(radius: number, seed: number, histories = 400, batches = 6) {
  checkRadius(radius);
  if (!Number.isInteger(histories) || histories < 10 || !Number.isInteger(batches) || batches < 1)
    throw new RangeError('Invalid estimate request');
  let sources: Vec3[] = Array.from({ length: histories }, (_, i) => {
    const r = radius * Math.cbrt(unitRandom(seed, i, 900)),
      cosTheta = 2 * unitRandom(seed, i, 901) - 1,
      phi = 2 * Math.PI * unitRandom(seed, i, 902),
      s = Math.sqrt(1 - cosTheta * cosTheta);
    return [r * s * Math.cos(phi), r * s * Math.sin(phi), r * cosTheta];
  });
  const estimates: number[] = [];
  for (let batch = 0; batch < batches; batch++) {
    const born: Vec3[] = [];
    for (const [i, at] of sources.entries())
      born.push(...walkFrom(radius, (seed + 7919 * (batch + 1) + 104729 * (i + 1)) >>> 0, at));
    estimates.push(born.length / sources.length);
    if (!born.length) break;
    sources = born.slice(0, histories);
    while (sources.length < histories) sources.push(born[sources.length % born.length]);
  }
  const tail = estimates.slice(-Math.min(3, estimates.length));
  return { estimates, k: tail.reduce((a, b) => a + b, 0) / tail.length };
}
/** One neutron history from an arbitrary start; returns the birth points of its fission children. */
export function walkFrom(radius: number, seed: number, start: Vec3, maxFlights = 80) {
  checkRadius(radius);
  let [x, y, z] = start;
  const absorb = FISSION.fission + FISSION.capture,
    fissionShare = FISSION.fission / absorb;
  for (let flight = 0; flight < maxFlights; flight++) {
    const base = flight * 6;
    const length = -Math.log(unitRandom(seed, 0, base)),
      cosTheta = 2 * unitRandom(seed, 0, base + 1) - 1,
      phi = 2 * Math.PI * unitRandom(seed, 0, base + 2),
      sinTheta = Math.sqrt(1 - cosTheta * cosTheta);
    const dx = sinTheta * Math.cos(phi),
      dy = sinTheta * Math.sin(phi),
      dz = cosTheta;
    const b = x * dx + y * dy + z * dz,
      c = x * x + y * y + z * z - radius * radius,
      exit = -b + Math.sqrt(Math.max(0, b * b - c));
    if (length >= exit) return [];
    x += dx * length;
    y += dy * length;
    z += dz * length;
    if (unitRandom(seed, 0, base + 3) < absorb) {
      if (unitRandom(seed, 0, base + 4) < fissionShare) {
        const count = unitRandom(seed, 0, base + 5) < FISSION.threeNeutronChance ? 3 : 2;
        return Array.from({ length: count }, (): Vec3 => [x, y, z]);
      }
      return [];
    }
  }
  return [];
}
/** Deterministic seed search so the film shows a chain that behaves as the chapter states. */
export function chooseSeed(
  radius: number,
  accept: (chain: FissionChain) => boolean,
  options: ChainOptions = {},
  from = 1,
  limit = 2000,
) {
  for (let seed = from; seed < from + limit; seed++) {
    const chain = fissionChain(radius, seed, options);
    if (accept(chain)) return { seed, chain };
  }
  throw new Error(`No seed within ${limit} tries satisfies the requested chain behaviour`);
}
/** Visible portion of every neutron path at a walk time. */
export function chainAt(chain: FissionChain, time: number) {
  if (!Number.isFinite(time)) throw new RangeError('Walk time must be finite');
  const alive: number[] = [];
  let fissions = 0,
    leaked = 0,
    captured = 0,
    generation = 0;
  const paths = chain.neutrons.map((n) => {
    if (time < n.born) return null;
    const points: Vec3[] = [n.points[0]];
    let done = true;
    for (let i = 1; i < n.points.length; i++) {
      if (time >= n.times[i]) {
        points.push(n.points[i]);
        continue;
      }
      const a = n.points[i - 1],
        b = n.points[i],
        f = (time - n.times[i - 1]) / (n.times[i] - n.times[i - 1]);
      points.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]);
      done = false;
      break;
    }
    const finished = done && time >= n.end;
    if (finished) {
      if (n.fate === 'fission') fissions++;
      if (n.fate === 'leak') leaked++;
      if (n.fate === 'capture') captured++;
    } else alive.push(n.id);
    generation = Math.max(generation, n.generation);
    return { id: n.id, points, finished, fate: finished ? n.fate : 'open', since: time - n.end };
  });
  return { paths, alive, fissions, leaked, captured, generation };
}

/** Liquid-drop outline for the capture → deformation → scission sequence. `deformation` runs
 * from 0 (a sphere of A = 236) to 1 (two separated fragments); volumes scale with A. */
export function dropOutline(deformation: number, samples = 96) {
  if (!Number.isFinite(deformation) || !Number.isInteger(samples) || samples < 16)
    throw new RangeError('Invalid drop outline request');
  const d = Math.max(0, Math.min(1, deformation)),
    heavy = Math.cbrt(NUCLIDES.ba141.A / 236),
    light = Math.cbrt(NUCLIDES.kr92.A / 236);
  // Lobe centres separate along x while the neck thins to zero at scission (d = 1).
  const gap = 1.85 * d,
    cH = (-gap * light) / (heavy + light),
    cL = (gap * heavy) / (heavy + light),
    rH = 1 + (heavy - 1) * d,
    rL = 1 + (light - 1) * d,
    neck = Math.max(0, 1 - d),
    outline: { x: number; y: number }[] = [];
  const blend = 1.2 * d * (1 - d);
  const profile = (x: number) => {
    const h = Math.max(0, rH * rH - (x - cH) ** 2),
      l = Math.max(0, rL * rL - (x - cL) ** 2);
    // A smooth waist instead of a crease where the two lobes meet; exact circles at d = 0 and 1.
    const lobe = Math.sqrt(Math.max(h, l) + blend * Math.min(h, l));
    const between = x > cH && x < cL;
    const u = between ? (x - (cH + cL) / 2) / ((cL - cH) / 2 || 1) : 1;
    const bridge = between ? neck * 0.92 * Math.min(rH, rL) * Math.sqrt(Math.max(0, 1 - u * u)) : 0;
    return Math.max(lobe, bridge);
  };
  const left = cH - rH,
    right = cL + rL;
  for (let i = 0; i <= samples; i++) {
    const x = left + ((right - left) * i) / samples;
    outline.push({ x, y: profile(x) });
  }
  for (let i = samples; i >= 0; i--) outline.push({ x: outline[i].x, y: -outline[i].y });
  return { outline, heavy: { x: cH, r: rH }, light: { x: cL, r: rL }, separated: d >= 1 };
}
