export const ecoClamp = (n: number, a = 0, b = 1) =>
  Math.max(a, Math.min(b, Number.isFinite(n) ? n : a));
export const lakeBudget = [
  {
    zh: '生产者',
    en: 'Producers',
    input: 464.6,
    transfer: 62.8,
    respiration: 96.3,
    decomposer: 12.5,
    unused: 293,
  },
  {
    zh: '植食性动物',
    en: 'Herbivores',
    input: 62.8,
    transfer: 12.6,
    respiration: 18.8,
    decomposer: 2.1,
    unused: 29.3,
  },
  {
    zh: '肉食性动物',
    en: 'Carnivores',
    input: 12.6,
    transfer: 0,
    respiration: 7.5,
    decomposer: 0,
    unused: 5,
    trace: true,
  },
];
export function energyBudget(level: number) {
  const row = lakeBudget[Math.round(ecoClamp(level, 0, 2))];
  const remainder = row.input - row.transfer - row.respiration - row.decomposer - row.unused;
  return {
    ...row,
    remainder: Math.abs(remainder) < 1e-10 ? 0 : remainder,
    efficiency: row.transfer / row.input,
  };
}
export function lakeTotals() {
  return { input: 464.6, respiration: 122.6, decomposer: 14.6, unused: 327.3, remainder: 0.1 };
}
export function cornBudget(carbonKg = 2675, respiredGlucoseKg = 2045, incidentKj = 8.5e9) {
  const glucoseKg = carbonKg / 0.4,
    storedKj = glucoseKg * 1.6e4,
    respiredKj = respiredGlucoseKg * 1.6e4;
  return {
    glucoseKg,
    storedKj,
    respiredKj,
    fixedKj: storedKj + respiredKj,
    efficiency: (storedKj + respiredKj) / incidentKj,
  };
}
export type CarbonPool = 'air' | 'plant' | 'animal' | 'soil' | 'ocean' | 'fossil';
export type CarbonMarker = {
  id: number;
  from: CarbonPool;
  to: CarbonPool;
  phase: number;
  pool: CarbonPool | 'transit';
};
export function carbonMarkers(
  progress: number,
  longCycle = false,
  exchange = true,
  burning = true,
): CarbonMarker[] {
  const p = ecoClamp(progress);
  const shortMoves: { [id: number]: [CarbonPool, number, number] } = {
    0: ['plant', 0.03, 0.23],
    1: ['plant', 0.07, 0.27],
    6: ['animal', 0.28, 0.45],
    9: ['air', 0.46, 0.64],
    7: ['air', 0.48, 0.66],
    8: ['soil', 0.67, 0.81],
    10: ['air', 0.82, 0.99],
  };
  const longMoves: { [id: number]: [CarbonPool, number, number] } = {
    ...(exchange
      ? {
          0: ['ocean', 0.05, 0.3],
          1: ['ocean', 0.14, 0.39],
          6: ['air', 0.05, 0.3],
          7: ['air', 0.14, 0.39],
        }
      : {}),
    ...(burning ? { 10: ['air', 0.5, 0.73], 11: ['air', 0.67, 0.9] } : {}),
  } as { [id: number]: [CarbonPool, number, number] };
  return Array.from({ length: 12 }, (_, id) => {
    const from: CarbonPool =
        id < 6
          ? 'air'
          : longCycle
            ? id < 10
              ? 'ocean'
              : 'fossil'
            : id < 9
              ? 'plant'
              : id === 9
                ? 'animal'
                : 'soil',
      m = (longCycle ? longMoves : shortMoves)[id],
      phase = m ? ecoClamp((p - m[1]) / (m[2] - m[1])) : 0,
      to = m?.[0] ?? from;
    return { id, from, to, phase, pool: phase === 0 ? from : phase === 1 ? to : 'transit' };
  });
}
export function carbonLedger(markers: CarbonMarker[]) {
  const ledger = { air: 0, plant: 0, animal: 0, soil: 0, ocean: 0, fossil: 0, transit: 0 };
  for (const m of markers) ledger[m.pool]++;
  return ledger;
}
export function contaminantUptake(time: number, elimination = 0.08, uptake = 0.3) {
  const t = ecoClamp(time, 0, 30),
    e = ecoClamp(elimination, 0, 2),
    u = ecoClamp(uptake, 0, 2),
    total = 24,
    body = e + u === 0 ? 0 : ((total * u) / (e + u)) * (1 - Math.exp(-(e + u) * t)),
    water = total - body;
  return {
    body,
    water,
    total,
    bodyConcentration: body,
    waterConcentration: water / 10,
    uptakeFlux: u * water,
    eliminationFlux: e * body,
  };
}
export function trophicContaminant(progress: number, retention = 0.8, bodyMassKg = 1) {
  const p = ecoClamp(progress),
    ret = ecoClamp(retention),
    mass = ecoClamp(bodyMassKg, 0.5, 10),
    foodMassKg = 10 * p,
    preyConcentration = 2,
    ingested = foodMassKg * preyConcentration,
    retained = ingested * ret,
    rejected = ingested - retained;
  return {
    foodMassKg,
    preyConcentration,
    ingested,
    retained,
    rejected,
    bodyMassKg: mass,
    concentration: retained / mass,
    magnification: retained / mass / preyConcentration,
  };
}
export type FieldEvidence = 'unknown' | 'observed' | 'interview' | 'inferred';
export const farmLinks = [
  { from: 'crop', to: 'insect', zh: '作物→植食昆虫', en: 'Crop→herbivorous insect' },
  { from: 'insect', to: 'bird', zh: '昆虫→食虫鸟', en: 'Insect→insect-eating bird' },
  { from: 'crop', to: 'livestock', zh: '作物饲料→牲畜', en: 'Crop feed→livestock' },
  { from: 'crop', to: 'soil', zh: '秸秆→分解途径', en: 'Residues→decomposition' },
] as const;
export function supportedFoodLinks(evidence: FieldEvidence[]) {
  return farmLinks.map((l, i) => ({
    ...l,
    evidence: evidence[i] ?? 'unknown',
    supported: evidence[i] === 'observed' || evidence[i] === 'interview',
  }));
}
/** A food portion must reach the mouth before its pollutant burden transfers. */
export function feedingStage(progress: number) {
  const p = ecoClamp(progress),
    n = Math.min(10, Math.floor(p * 10)),
    phase = n === 10 ? 1 : p * 10 - n,
    contact = ecoClamp((phase - 0.7) / 0.3);
  return {
    portion: n,
    phase,
    travel: ecoClamp(phase / 0.7),
    contact,
    consumedFraction: (n + (n === 10 ? 0 : contact)) / 10,
  };
}
