export type Sample =
  | 'hexene'
  | 'bromobutane'
  | 'phenol'
  | 'ethanal'
  | 'ethanol'
  | 'benzene'
  | 'ccl4'
  | 'propanol'
  | 'chloropropane'
  | 'propanal';
export type Test = 'water' | 'bromine' | 'permanganate' | 'halide' | 'iron' | 'copper';
export const names: Record<Sample, string> = {
  hexene: '1-己烯',
  bromobutane: '1-溴丁烷',
  phenol: '苯酚溶液',
  ethanal: '乙醛',
  ethanol: '乙醇',
  benzene: '苯',
  ccl4: '四氯化碳',
  propanol: '1-丙醇',
  chloropropane: '2-氯丙烷',
  propanal: '丙醛',
};
export function testSample(sample: Sample, test: Test, pretreat = true) {
  const layer = ['hexene', 'benzene', 'chloropropane'].includes(sample)
    ? 'upper'
    : ['bromobutane', 'ccl4'].includes(sample)
      ? 'lower'
      : 'mixed';
  let result = 'unchanged',
    color = '#d6e2d6',
    precipitate = 'none';
  if (test === 'water') result = layer;
  if (test === 'bromine') {
    if (sample === 'hexene') result = 'addition';
    else if (sample === 'phenol') {
      result = 'substitution';
      precipitate = 'white';
    } else if (['ethanal', 'propanal'].includes(sample)) result = 'oxidation';
    else {
      result = layer === 'mixed' ? 'unchanged' : 'partition';
      color = '#bd975a';
    }
  }
  if (test === 'permanganate') {
    result = ['hexene', 'ethanal', 'propanal', 'phenol', 'ethanol', 'propanol'].includes(sample)
      ? 'nonspecific-oxidation'
      : 'unchanged';
    color = result === 'unchanged' ? '#9f7daf' : '#d6e2d6';
  }
  if (test === 'halide') {
    if (!pretreat) {
      result = 'invalid-preparation';
      precipitate = 'brown';
    } else if (sample === 'bromobutane') {
      result = 'bromide';
      precipitate = 'cream';
    } else if (sample === 'chloropropane') {
      result = 'chloride';
      precipitate = 'white';
    }
  }
  if (test === 'iron' && sample === 'phenol') {
    result = 'phenolic';
    color = '#9675a9';
  }
  if (test === 'copper') {
    if (['ethanal', 'propanal'].includes(sample)) {
      result = 'aldehyde';
      precipitate = 'red';
    } else color = '#8bb5bd';
  }
  return { layer, result, color, precipitate };
}
export const candidateGroups: Sample[][] = [
  ['ethanol', 'hexene', 'benzene', 'ccl4'],
  ['propanol', 'chloropropane', 'propanal', 'phenol'],
];
export function candidates(group: number, observations: { test: Test; result: string }[]) {
  return candidateGroups[group].filter((s) =>
    observations.every((o) => testSample(s, o.test).result === o.result),
  );
}
export function aspirinEvidence(hydrolyzed: boolean, neutralized: boolean) {
  return {
    initialAcidity: true,
    phenolicOH: hydrolyzed,
    ironPositive: hydrolyzed && neutralized,
    interpretable: neutralized,
    aspirin: hydrolyzed ? 0 : 1,
    salicylateSkeleton: hydrolyzed ? 1 : 0,
    aceticAcid: hydrolyzed ? 1 : 0,
  };
}
export const synthesisSteps = [
  { id: 'hydrate', from: 'ethene', to: 'ethanol', condition: '水 / 催化剂 / 加热加压' },
  { id: 'chlorinate', from: 'ethene', to: 'dichloroethane', condition: 'Cl₂ 加成' },
  { id: 'hydrolyze', from: 'dichloroethane', to: 'glycol', condition: 'NaOH 水溶液 / 加热' },
  { id: 'oxidize', from: 'glycol', to: 'oxalic', condition: '氧化 / 教材条件' },
  { id: 'esterify', from: 'oxalic', to: 'target', condition: '2 乙醇 / 催化酯化' },
] as const;
export function branchYield(yieldPerStep: number) {
  const y = Math.max(0, Math.min(1, yieldPerStep));
  return { ethanolBranch: y, acidBranch: y ** 3, target: Math.min(y, y ** 3) * y };
}
export function esterAtoms(mobile: boolean, split: number) {
  const p = Math.max(0, Math.min(1, split));
  const labels = ['CH₃', 'CH₂', p > 0.6 ? 'OH' : 'O', 'C', 'C', p > 0.6 ? 'OH' : 'O', 'CH₂', 'CH₃'];
  return labels.map((label, i) => {
    const fragment = i < 3 ? 'left' : i > 4 ? 'right' : 'acid',
      shift = fragment === 'left' ? -p * 18 : fragment === 'right' ? p * 18 : 0;
    return {
      id: ['L1', 'L2', 'OL', 'A1', 'A2', 'OR', 'R1', 'R2'][i],
      label,
      fragment,
      x: mobile
        ? 130 + (fragment === 'left' ? -p * 30 : fragment === 'right' ? p * 30 : 0)
        : 45 + i * 67 + shift,
      y: mobile ? 35 + i * 38 + shift : 125,
    };
  });
}
export const nmrPatterns = {
  ethanol: { positions: [1.2, 3.65, 2.2], areas: [3, 2, 1] },
  acetic: { positions: [2.1, 11.5], areas: [3, 1] },
  ester: { positions: [1.25, 4.1, 2.05], areas: [3, 2, 3] },
};

/** A fixed unknown and independent aliquots; every exclusion follows an observed test. */
export function identificationDemo(group: number, progress: number) {
  const sample: Sample = group === 0 ? 'hexene' : 'chloropropane';
  const tests: Test[] = group === 0 ? ['water', 'bromine'] : ['iron', 'copper', 'halide'];
  const scaled = Math.max(0, Math.min(1, progress)) * tests.length;
  const index = Math.min(tests.length - 1, Math.floor(scaled));
  const reactionProgress = Math.min(1, (scaled - index) / 0.7);
  const observations = tests
    .slice(0, index + (reactionProgress >= 1 ? 1 : 0))
    .map((test) => ({ test, result: testSample(sample, test).result }));
  return { sample, test: tests[index], reactionProgress, observations };
}
