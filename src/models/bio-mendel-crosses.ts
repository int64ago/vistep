export type MonoGenotype = 'DD' | 'Dd' | 'dd';
export type DiGenotype = 'YYRR' | 'YyRr' | 'yyrr';
export type Gamete = { alleles: string; probability: number };
/** Independent loci, equal segregation and no viability selection. */
export function mendelGametes(genotype: string): Gamete[] {
  if (genotype.length !== 2 && genotype.length !== 4)
    throw new Error('One or two diploid loci required');
  let states: Gamete[] = [{ alleles: '', probability: 1 }];
  for (let i = 0; i < genotype.length; i += 2) {
    const next = new Map<string, number>();
    for (const state of states)
      for (const allele of genotype.slice(i, i + 2)) {
        const key = state.alleles + allele;
        next.set(key, (next.get(key) ?? 0) + state.probability / 2);
      }
    states = [...next].map(([alleles, probability]) => ({ alleles, probability }));
  }
  return states;
}
export function fertilize(a: string, b: string) {
  if (a.length !== b.length) throw new Error('Matched loci required');
  return [...a].map((x, i) => [x, b[i]].sort().join('')).join('');
}
export function peaPhenotype(genotype: string) {
  return genotype.length === 2
    ? genotype.includes('D')
      ? 'tall'
      : 'short'
    : `${genotype.includes('Y') ? 'yellow' : 'green'}-${genotype.includes('R') ? 'round' : 'wrinkled'}`;
}
export function mendelCross(mother: string, father: string) {
  const rows = mendelGametes(mother),
    columns = mendelGametes(father),
    cells = rows.flatMap((a, row) =>
      columns.map((b, column) => {
        const genotype = fertilize(a.alleles, b.alleles);
        return {
          row,
          column,
          maternal: a.alleles,
          paternal: b.alleles,
          genotype,
          phenotype: peaPhenotype(genotype),
          probability: a.probability * b.probability,
        };
      }),
    );
  const phenotype = new Map<string, number>();
  for (const c of cells)
    phenotype.set(c.phenotype, (phenotype.get(c.phenotype) ?? 0) + c.probability);
  return { rows, columns, cells, phenotype: Object.fromEntries(phenotype) };
}
export const mendelObservations = {
  self: { labels: ['tall', 'short'], values: [787, 277], expected: [3, 1] },
  test: { labels: ['tall', 'short'], values: [87, 79], expected: [1, 1] },
  diSelf: {
    labels: ['yellow-round', 'green-round', 'yellow-wrinkled', 'green-wrinkled'],
    values: [315, 108, 101, 32],
    expected: [9, 3, 3, 1],
  },
  diTestFemale: {
    labels: ['yellow-round', 'yellow-wrinkled', 'green-round', 'green-wrinkled'],
    values: [31, 27, 26, 26],
    expected: [1, 1, 1, 1],
  },
  diTestMale: {
    labels: ['yellow-round', 'yellow-wrinkled', 'green-round', 'green-wrinkled'],
    values: [24, 22, 25, 26],
    expected: [1, 1, 1, 1],
  },
} as const;
export function segregationDraws(seed: number, count: number) {
  let state = seed >>> 0;
  const random = () => {
    state += 0x6d2b79f5;
    let v = state;
    v = Math.imul(v ^ (v >>> 15), v | 1);
    v ^= v + Math.imul(v ^ (v >>> 7), v | 61);
    return ((v ^ (v >>> 14)) >>> 0) / 4294967296;
  };
  return Array.from({ length: Math.max(0, Math.min(10000, Math.floor(count))) }, (_, id) => {
    const maternalIndex = Math.floor(random() * 20),
      paternalIndex = Math.floor(random() * 20),
      maternal = maternalIndex < 10 ? 'D' : 'd',
      paternal = paternalIndex < 10 ? 'D' : 'd',
      genotype = fertilize(maternal, paternal);
    return {
      id,
      maternalIndex,
      paternalIndex,
      maternal,
      paternal,
      genotype,
      phenotype: peaPhenotype(genotype),
    };
  });
}
export function segregationCounts(seed: number, count: number) {
  const counts = { DD: 0, Dd: 0, dd: 0 };
  for (const d of segregationDraws(seed, count)) counts[d.genotype as MonoGenotype]++;
  return counts;
}
export function bucketPoint(index: number, side: number) {
  return { x: 47 + side * 204 + (index % 5) * 17, y: 129 + Math.floor(index / 5) * 19 };
}
export function drawBallPoint(index: number, side: number, phase: number) {
  const start = bucketPoint(index, side),
    p = Math.max(0, Math.min(1, phase)),
    travel = p < 0.35 ? p / 0.35 : p < 0.65 ? 1 : (1 - p) / 0.35,
    e = travel * travel * (3 - 2 * travel);
  return {
    x: start.x + (161 + side * 38 - start.x) * e,
    y: start.y + (55 - start.y) * e - 28 * Math.sin(e * Math.PI),
  };
}
export function pollinationState(progress: number, emasculated = true, protectedFlower = true) {
  const p = Math.max(0, Math.min(1, progress)),
    removal = Math.min(1, p / 0.25),
    pollen = Math.min(1, Math.max(0, (p - 0.48) / 0.28));
  const firstBag =
      Math.min(1, Math.max(0, (p - 0.25) / 0.06)) *
      (1 - Math.min(1, Math.max(0, (p - 0.4) / 0.06))),
    lastBag = Math.min(1, Math.max(0, (p - 0.8) / 0.13));
  return {
    removal: emasculated ? removal : 0,
    pollen,
    bag: protectedFlower ? Math.max(firstBag, lastBag) : 0,
    controlledCross: emasculated && protectedFlower,
  };
}
export function peaOutline(phenotype: string, radius = 20) {
  return (
    Array.from({ length: 49 }, (_, i) => {
      const a = (i / 48) * Math.PI * 2,
        r =
          radius *
          (phenotype.includes('wrinkled')
            ? 0.83 + 0.12 * Math.sin(a * 7) + 0.05 * Math.cos(a * 11)
            : 1);
      return `${i === 0 ? 'M' : 'L'}${Math.cos(a) * r},${Math.sin(a) * r}`;
    }).join(' ') + 'Z'
  );
}
