export type ChickenCell = 'oviduct' | 'erythrocyte' | 'islet';
export const chickenCells: ChickenCell[] = ['oviduct', 'erythrocyte', 'islet'];
export const assayedGenes = ['Oval', 'Glob', 'Ins'] as const;
/** The textbook reports detection, not molecule counts or complete transcriptomes. */
export function expressionEvidence(cell: ChickenCell, assay: 'DNA' | 'mRNA') {
  return assayedGenes.map((gene, i) => ({
    gene,
    detected: assay === 'DNA' || i === chickenCells.indexOf(cell),
  }));
}
export function linariaState(plant: 'A' | 'B') {
  return {
    sequence: 'CGCGCGCG',
    methylated: plant === 'B',
    lcycExpressed: plant === 'A',
    symmetry: plant === 'A' ? 'bilateral' : 'radial',
    spurs: plant === 'A' ? 1 : 5,
  };
}
export type CoatState = 'yellow' | 'mottled' | 'dark';
export function agoutiState(coat: CoatState) {
  return {
    genotype: 'Avy/a',
    sequence: 'CGCGCGCG',
    methylatedSites: coat === 'yellow' ? [] : coat === 'dark' ? [0, 1, 2, 3] : [0, 2],
    ectopicExpression: coat === 'yellow' ? 'high' : coat === 'dark' ? 'suppressed' : 'mosaic',
    coat,
  };
}
export function vestigialEvidence(temperature: 25 | 31, generation: 'parent' | 'offspring') {
  return {
    genotype: 'vg/vg',
    developmentTemperature: generation === 'offspring' ? 25 : temperature,
    phenotype: generation === 'parent' && temperature === 31 ? 'some-near-normal' : 'vestigial',
    quantitative: false,
    mechanismProven: false,
  };
}
export function wingOutline(length: number, side: -1 | 1) {
  const x = (a: number) => 130 + side * a;
  return `M${x(12)} 97C${x(40 * length)} ${100 - 40 * length} ${x(85 * length)} ${125 - 20 * length} ${x(76 * length)} ${140 + 50 * length}Q${x(47 * length)} ${156 + 35 * length} ${x(12)} 105Z`;
}
export function floralPetal(index: number, radial: boolean) {
  const angle = radial ? index * 72 : -50 + index * 25;
  return { angle, radial, upper: !radial && index < 2 };
}
