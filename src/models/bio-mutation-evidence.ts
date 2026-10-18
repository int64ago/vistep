export const smokingStudy = {
  cases: { smoking: 823, notSmoking: 480, total: 1303 },
  controls: { smoking: 509, notSmoking: 794, total: 1303 },
};
export function smokingAssociation() {
  const a = smokingStudy.cases,
    b = smokingStudy.controls;
  return {
    caseExposure: a.smoking / a.total,
    controlExposure: b.smoking / b.total,
    oddsRatio: (a.smoking * b.notSmoking) / (a.notSmoking * b.smoking),
    populationRisk: null,
  };
}
export function recessiveLethalTest(lethal: boolean) {
  return [
    { id: 'daughter-1', genotype: 'X* / X+', sex: 'female', viable: true },
    { id: 'daughter-2', genotype: 'X+ / X+', sex: 'female', viable: true },
    { id: 'son-1', genotype: 'X* / Y', sex: 'male', viable: !lethal },
    { id: 'son-2', genotype: 'X+ / Y', sex: 'male', viable: true },
  ];
}
export const coldSteps = [
  { id: 'chill', temperature: 4, duration: '1 week' },
  { id: 'root', temperature: 25, duration: 'roots ≈ 1 cm' },
  { id: 'induce', temperature: 4, duration: '48–72 h' },
  { id: 'fix', temperature: null, duration: 'fixed slide' },
] as const;
const smooth = (x: number) => {
  const p = Math.max(0, Math.min(1, x));
  return p * p * (3 - 2 * p);
};
export function restitutionMitosis(progress: number, blocked: boolean) {
  const p = Math.max(0, Math.min(1, progress));
  const separate = smooth((p - 0.12) / 0.5),
    nuclei = smooth((p - 0.65) / 0.3);
  return {
    blocked,
    separate,
    nuclei,
    cellCount: blocked || p < 0.95 ? 1 : 2,
    chromosomesPerFinalNucleus: blocked ? 8 : 4,
    chromatids: Array.from({ length: 8 }, (_, i) => {
      const parent = Math.floor(i / 2),
        sister = i % 2;
      const offset = (sister ? 1 : -1) * separate;
      return {
        id: `${parent}-${sister}`,
        parent,
        sister,
        x: 160 + offset * (blocked ? 17 : 82),
        y: 54 + parent * 37 + (blocked ? offset * 8 : 0),
      };
    }),
  };
}
export type ChromosomeChange =
  'normal' | 'loss' | 'gain' | 'triploid' | 'tetraploid' | 'haploid-diploid' | 'haploid-tetraploid';
export function chromosomeSets(change: ChromosomeChange) {
  const copies =
    change === 'haploid-diploid' ? 1 : change === 'triploid' ? 3 : change === 'tetraploid' ? 4 : 2;
  const a = Array.from({ length: copies * 3 }, (_, i) => ({
    id: `set-${Math.floor(i / 3)}-type-${i % 3}`,
    set: Math.floor(i / 3),
    type: i % 3,
  }));
  if (change === 'loss') a.pop();
  if (change === 'gain') a.push({ id: 'extra-type-2', set: 2, type: 2 });
  return a;
}
export type StructuralChange = 'deletion' | 'duplication' | 'inversion' | 'translocation';
export function structureSegments(kind: StructuralChange, progress: number) {
  const p = smooth(progress);
  const result: Array<{
    id: string;
    letter: string;
    chromosome: number;
    x: number;
    y: number;
    angle: number;
    opacity: number;
    retained: boolean;
  }> = [];
  for (let ch = 0; ch < (kind === 'translocation' ? 2 : 1); ch++)
    for (let i = 0; i < 6; i++) {
      let x = 45 + i * 43,
        y = kind === 'translocation' ? 75 + ch * 100 : 120,
        angle = 0,
        opacity = 1,
        retained = true;
      if (kind === 'deletion') {
        if (i === 1) {
          y -= 72 * p;
          opacity = 1 - 0.65 * p;
          retained = p < 1;
        } else if (i > 1) x -= 43 * p;
      }
      if (kind === 'duplication' && i > 1) x += 43 * p;
      if (kind === 'inversion' && i >= 1 && i <= 4) {
        const theta = Math.PI * p,
          center = 152.5,
          dx = x - center;
        x = center + dx * Math.cos(theta);
        y = 120 + dx * Math.sin(theta) - 35 * Math.sin(theta);
        angle = 180 * p;
      }
      if (kind === 'translocation' && i >= 3) {
        x += (ch === 0 ? 1 : -1) * 35 * Math.sin(Math.PI * p);
        y += (ch === 0 ? 100 : -100) * p;
      }
      result.push({
        id: `${ch}-${i}`,
        letter: String.fromCharCode(97 + ch * 6 + i),
        chromosome: ch,
        x,
        y,
        angle,
        opacity,
        retained,
      });
    }
  if (kind === 'duplication')
    result.push({
      id: 'copy-0-1',
      letter: 'b',
      chromosome: 0,
      x: 88 + 43 * p,
      y: 120 - 40 * Math.sin(Math.PI * p),
      angle: 0,
      opacity: p,
      retained: true,
    });
  return result;
}
export function countedChromosomes(doubled: boolean) {
  const n = doubled ? 32 : 16;
  return Array.from({ length: n }, (_, i) => ({
    id: i,
    x: doubled ? 53 + (i % 8) * 19 : 63 + (i % 4) * 37,
    y: doubled ? 59 + Math.floor(i / 8) * 34 : 59 + Math.floor(i / 4) * 34,
    angle: (i * 47) % 180,
  }));
}
