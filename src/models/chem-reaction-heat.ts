/** Two deliberately illustrative heat-capacity models; no textbook measured temperature or kinetic fit. */
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, Number.isFinite(x) ? x : a));
const smooth = (x: number) => {
  const p = clamp(x);
  return p * p * (3 - 2 * p);
};
export function magnesiumInventory(extent: number) {
  const x = clamp(extent);
  return {
    magnesium: 1 - x,
    hydrogenIon: 2.4 - 2 * x,
    magnesiumIon: x,
    hydrogenGas: x,
    chloride: 2.4,
  };
}
export function crystalInventory(extent: number) {
  const x = clamp(extent);
  return {
    hydrate: 1 - x,
    ammoniumChloride: 2.2 - 2 * x,
    bariumChloride: x,
    ammonia: 2 * x,
    water: 10 * x,
  };
}
export const waterLatentHeat = 333500;
export function phaseState(enthalpy: number, waterMass = 0.0005, reactorCapacity = 20) {
  const m = clamp(waterMass, 0, 0.004),
    c = clamp(reactorCapacity, 1, 100),
    latent = m * waterLatentHeat;
  if (enthalpy > latent)
    return { temperature: (enthalpy - latent) / (c + m * 4180), iceFraction: 0 };
  if (enthalpy < 0) return { temperature: enthalpy / (c + m * 2100), iceFraction: m > 0 ? 1 : 0 };
  return { temperature: 0, iceFraction: latent > 0 ? 1 - enthalpy / latent : 0 };
}
export function reactionHeat(
  kind: 'magnesium' | 'crystals',
  seconds: number,
  options: { coupling?: number; waterMass?: number; amount?: number } = {},
) {
  const t = clamp(seconds, 0, 90),
    k = clamp(options.coupling ?? 0.06, 0, 0.5),
    m = kind === 'crystals' ? clamp(options.waterMass ?? 0.0005, 0, 0.004) : 0,
    amount = clamp(options.amount ?? 1, 0, 1),
    ambient = 20;
  const C = kind === 'magnesium' ? 16 : 20,
    maxHeat = (kind === 'magnesium' ? 96 : -800) * amount;
  const initialEnergy =
    kind === 'magnesium' ? C * ambient : (C + m * 4180) * ambient + m * waterLatentHeat;
  let E = initialEnergy,
    environmentInput = 0,
    reactionInput = 0,
    time = 0;
  const state = (e: number) =>
    kind === 'magnesium' ? { temperature: e / C, iceFraction: 0 } : phaseState(e, m, C);
  while (time < t - 1e-10) {
    const dt = Math.min(0.05, t - time),
      x0 = smooth(time / 30),
      x1 = smooth((time + dt) / 30),
      q = maxHeat * (x1 - x0),
      env = k * (ambient - state(E).temperature) * dt;
    E += q + env;
    reactionInput += q;
    environmentInput += env;
    time += dt;
  }
  const s = state(E),
    extent = smooth(t / 30) * amount,
    inventory = kind === 'magnesium' ? magnesiumInventory(extent) : crystalInventory(extent);
  return {
    ...s,
    kind,
    time: t,
    extent,
    inventory,
    waterMass: m,
    reactionInput,
    environmentInput,
    storedEnergyChange: E - initialEnergy,
    energyResidual: E - initialEnergy - reactionInput - environmentInput,
    attached: m > 0 && s.iceFraction > 0.5,
    heatFlowIntoMixture: k * (ambient - s.temperature),
    ambient,
  };
}
export function heatDirector(chapter: number, progress: number) {
  const c = Math.floor(clamp(chapter, 0, 5)),
    p = clamp(progress);
  return {
    chapter: c,
    progress: p,
    kind: (c < 3 ? 'magnesium' : 'crystals') as 'magnesium' | 'crystals',
    seconds:
      c === 0
        ? 0
        : c === 1
          ? p * 30
          : c === 2
            ? 30 + p * 60
            : c === 3
              ? p * 15
              : c === 4
                ? 15 + p * 15
                : 40,
    lift: c === 5 ? 30 * smooth(p) : 0,
  };
}
