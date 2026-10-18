export type Illumination = 'spot' | 'full' | 'spectrum' | 'dark';
const clamp = (x: number) => Math.max(0, Math.min(1, x));
export function oxygenSource(x: number, mode: Illumination, spot = 0.4) {
  if (mode === 'dark') return 0;
  if (mode === 'full') return 1;
  if (mode === 'spot') return Math.exp(-(((x - spot) / 0.06) ** 2));
  return (
    0.08 + 0.9 * Math.exp(-(((x - 0.14) / 0.12) ** 2)) + 0.85 * Math.exp(-(((x - 0.88) / 0.1) ** 2))
  );
}
/** Deterministic quantile transport visualizes aerotaxis; density is qualitative. */
export function engelmannBacteria(progress: number, mode: Illumination, spot = 0.4) {
  const weights = Array.from({ length: 201 }, (_, i) => 0.025 + oxygenSource(i / 200, mode, spot)),
    total = weights.reduce((a, b) => a + b, 0);
  return Array.from({ length: 60 }, (_, id) => {
    const startX = ((id * 37) % 61) / 61,
      startY = id % 2 === 0 ? 65 + ((id * 11) % 25) : 173 + ((id * 7) % 25);
    let targetX = startX,
      sum = 0;
    for (let i = 0; i < weights.length; i++) {
      sum += weights[i];
      if (sum / total > (id + 0.5) / 60) {
        targetX = i / 200;
        break;
      }
    }
    const p = mode === 'dark' ? 0 : clamp(progress);
    return {
      id,
      x: 30 + (startX + (targetX - startX) * p) * 300,
      y: startY + ((id % 2 === 0 ? 91 : 169) - startY) * p,
    };
  });
}
export function hillReaction(progress: number, light = true, acceptor = true) {
  const reaction = light && acceptor ? clamp(progress) : 0;
  return { oxygen: reaction, reducedAcceptor: 4 * reaction, waterConsumed: 2 * reaction };
}
export function oxygenIsotope(waterLabeled: boolean, carbonDioxideLabeled: boolean) {
  return {
    oxygenAtoms: [
      { id: 'water-0', mass: waterLabeled ? 18 : 16 },
      { id: 'water-1', mass: waterLabeled ? 18 : 16 },
    ],
    co2OxygenMass: carbonDioxideLabeled ? 18 : 16,
  };
}
export function photophosphorylation(
  progress: number,
  light = true,
  adp = true,
  phosphate = true,
  cyclic = false,
) {
  const atp = light && adp && phosphate ? clamp(progress) : 0;
  return {
    atp,
    adp: adp ? 1 - atp : 0,
    phosphate: phosphate ? 1 - atp : 0,
    oxygen: cyclic ? 0 : atp,
  };
}
export function carbonTracer(progress: number) {
  const time = clamp(progress) * 6,
    co2 = Math.exp(-time),
    c3 = 2 * (Math.exp(-time * 0.5) - Math.exp(-time));
  return { co2, c3, sugar: 1 - co2 - c3 };
}
/** Small resource reservoir: carbon reduction can continue briefly after the lamp goes dark. */
export function photosynthesisCoupling(time: number, lightOffAt = Infinity, co2 = true) {
  let atp = 0,
    nadph = 0,
    triose = 0;
  const dt = 0.025;
  for (let t = 0; t < Math.max(0, Math.min(20, time)); t += dt) {
    const light = t < lightOffAt;
    if (light) {
      atp = Math.min(18, atp + 3.6 * dt);
      nadph = Math.min(12, nadph + 2.4 * dt);
    }
    const rate = co2 ? Math.min(0.3, atp / 9, nadph / 6) : 0;
    atp -= 9 * rate * dt;
    nadph -= 6 * rate * dt;
    triose += rate * dt;
  }
  return { atp, nadph, triose, co2Fixed: triose * 3, light: time < lightOffAt };
}
export function leafDiscs(time: number, intensity: number, infiltrated = true, co2 = 1) {
  const gross =
      ((Math.max(0, intensity) / (Math.max(0, intensity) + 0.35)) * Math.max(0, co2)) /
      (Math.max(0, co2) + 0.3),
    respiration = 0.12,
    net = gross - respiration,
    gas = Math.max(0, (infiltrated ? 0 : 1) + net * Math.max(0, time) * 0.18),
    discs = Array.from({ length: 10 }, (_, id) => ({
      id,
      gas,
      threshold: 0.45 + id * 0.035,
      rise: clamp((gas - (0.45 + id * 0.035)) * 5),
    }));
  return { gross, respiration, net, discs, floating: discs.filter((d) => d.rise > 0.95).length };
}
