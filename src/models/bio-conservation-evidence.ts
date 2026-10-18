import { signalPathPoint } from './bio-chemical-signals';
export const conservationClamp = (n: number, a = 0, b = 1) =>
  Math.max(a, Math.min(b, Number.isFinite(n) ? n : a));
export const waterSites = [
  { id: 'A', x: 0.25, y: 86, example: 7.8 },
  { id: 'B', x: 0.67, y: 153, example: 5.4 },
  { id: 'C', x: 0.38, y: 232, example: 6.9 },
];
export function waterReading(value: string) {
  if (value.trim() === '') return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= 30 ? n : null;
}
export function crossingPosition(progress: number, width = 320, connected = true) {
  const p = conservationClamp(progress),
    x0 = width * 0.22,
    x1 = width * 0.78;
  return {
    x: connected ? x0 + (x1 - x0) * p : x0 + ((width * 0.4 - x0) * Math.min(p, 0.65)) / 0.65,
    y: 160,
    individualId: 'bear-A',
  };
}
export type NutrientPool = 'soil' | 'crop' | 'animal' | 'treatment' | 'product' | 'loss' | 'stored';
export function nitrogenMarkers(progress: number, reuse = true) {
  const p = conservationClamp(progress);
  return Array.from({ length: 24 }, (_, id) => {
    let from: NutrientPool = 'soil',
      to: NutrientPool = 'soil',
      phase = 0;
    if (p < 0.3) {
      to = 'crop';
      phase = conservationClamp((p - 0.05) / 0.25);
    } else if (p < 0.5) {
      from = 'crop';
      to = id < 6 ? 'product' : 'animal';
      phase = conservationClamp((p - 0.3) / 0.2);
    } else if (id < 6) {
      from = 'product';
      to = 'product';
      phase = 1;
    } else if (p < 0.7) {
      from = 'animal';
      to = 'treatment';
      phase = (p - 0.5) / 0.2;
    } else {
      from = 'treatment';
      to = !reuse ? 'stored' : id < 20 ? 'soil' : 'loss';
      phase = conservationClamp((p - 0.7) / 0.25);
    }
    return {
      id,
      from,
      to,
      phase,
      pool: phase === 0 ? from : phase === 1 ? to : ('transit' as NutrientPool | 'transit'),
    };
  });
}
export function nitrogenLedger(progress: number, reuse = true) {
  const out: Record<NutrientPool | 'transit', number> = {
    soil: 0,
    crop: 0,
    animal: 0,
    treatment: 0,
    product: 0,
    loss: 0,
    stored: 0,
    transit: 0,
  };
  for (const m of nitrogenMarkers(progress, reuse)) out[m.pool]++;
  return out;
}
export function habitatFit(moisture: number, wet = false) {
  const m = conservationClamp(moisture),
    opt = wet ? 0.8 : 0.25;
  return Math.exp(-(((m - opt) / 0.24) ** 2));
}
export function plantEstablishment(progress: number, moisture = 0.5, wet = false) {
  const fit = habitatFit(moisture, wet),
    p = conservationClamp(progress),
    capacity = fit;
  return { fit, amount: capacity * (1 - Math.exp(-5 * p)), moisture: conservationClamp(moisture) };
}
export function nutrientCapacity(input = 10, uptake = 6) {
  const amount = conservationClamp(input, 0, 30),
    capacity = conservationClamp(uptake, 0, 30);
  return {
    input: amount,
    used: Math.min(amount, capacity),
    excess: Math.max(0, amount - capacity),
  };
}
export function courtyardPaths(width: number) {
  const c = width / 2,
    left = width * 0.14,
    right = width * 0.84;
  return {
    c,
    left,
    right,
    liquidY: 205,
    inlet: [
      { x: left, y: 106 },
      { x: left, y: 149 },
      { x: c - 29, y: 220 },
      { x: c - 15, y: 226 },
    ],
    slurry: [
      { x: c - 15, y: 226 },
      { x: c + 33, y: 222 },
      { x: right, y: 222 },
      { x: right, y: 205 },
      { x: width - 15, y: 205 },
      { x: width - 15, y: 240 },
    ],
    gas: [
      { x: c - 10, y: 226 },
      { x: c - 10, y: 205 },
      { x: c, y: 188 },
      { x: c, y: 119 },
      { x: width * 0.76, y: 119 },
      { x: width * 0.76, y: 92 },
    ],
  };
}
export function courtyardMarkers(progress: number, width = 320) {
  const p = conservationClamp(progress),
    g = courtyardPaths(width);
  const nitrogen = Array.from({ length: 12 }, (_, id) => {
    const q = conservationClamp((p - id * 0.025) / 0.65);
    return {
      id,
      ...signalPathPoint(
        [
          ...g.inlet,
          ...g.slurry.slice(1),
          { x: width - 31 + (id % 4) * 4, y: 250 + Math.floor(id / 4) * 3 },
        ],
        q,
      ),
      progress: q,
    };
  });
  const gas = Array.from({ length: 6 }, (_, id) => {
    const q = conservationClamp((p - 0.28 - id * 0.035) / 0.45);
    return { id, ...signalPathPoint(g.gas, q), visible: q > 0 && q < 1 };
  });
  return { ...g, nitrogen, gasMarkers: gas };
}
export function carbonPlot(
  dryAboveKg = 2000,
  dryRootKg = 500,
  areaM2 = 400,
  carbonFraction = 0.47,
  soilDepthCm = 30,
  bulkDensity = 1.2,
  soilCFraction = 0.02,
  rockFraction = 0.1,
) {
  const area = Math.max(1, Number.isFinite(areaM2) ? areaM2 : 400),
    fraction = conservationClamp(carbonFraction),
    above = ((Math.max(0, dryAboveKg) * fraction) / area) * 10,
    roots = ((Math.max(0, dryRootKg) * fraction) / area) * 10,
    litter = ((80 * 0.45) / area) * 10,
    soil =
      conservationClamp(bulkDensity, 0, 2.5) *
      conservationClamp(soilDepthCm, 0, 200) *
      conservationClamp(soilCFraction, 0, 0.5) *
      (1 - conservationClamp(rockFraction)) *
      100;
  return { above, roots, litter, soil, total: above + roots + litter + soil, area };
}
export function carbonStrata(forestPlots = 3) {
  const n = Math.max(1, Math.round(conservationClamp(forestPlots, 1, 9))),
    strata = [
      { name: 'forest', density: 100, areaHa: 20, n },
      { name: 'grass', density: 60, areaHa: 50, n: 2 },
      { name: 'crop', density: 40, areaHa: 30, n: 1 },
    ],
    total = strata.reduce((v, r) => v + r.density * r.areaHa, 0),
    area = strata.reduce((v, r) => v + r.areaHa, 0),
    naive = strata.reduce((v, r) => v + r.density * r.n, 0) / strata.reduce((v, r) => v + r.n, 0);
  return { strata, total, area, weighted: total / area, naive };
}
export function carbonAnnual(co2 = false) {
  return {
    years: '2001–2010',
    value: 201.1 * (co2 ? 44 / 12 : 1),
    unit: co2 ? 'Tg CO₂/yr' : 'Tg C/yr',
    historical: true,
  };
}
