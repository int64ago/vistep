/** Room-temperature ideal dilute/phase teaching models; no kinetic calibration. */
export const clip = (v: number) => Math.max(0, Math.min(1, v));
export function phenolBalance(
  baseEquivalents: number,
  acidEquivalents = 0,
  total = 1.594,
  solubility = 0.9776,
) {
  const charge = (baseEquivalents - acidEquivalents) * total,
    ka = 1e-10,
    kw = 1e-14;
  function species(pH: number) {
    const h = 10 ** -pH,
      r = ka / h,
      neutral = Math.min(solubility, total / (1 + r)),
      anion = neutral * r;
    return { h, neutral, anion, separated: Math.max(0, total - neutral - anion), oh: kw / h };
  }
  let lo = -1,
    hi = 14.5;
  for (let i = 0; i < 100; i++) {
    const p = (lo + hi) / 2,
      s = species(p);
    if (s.h + charge - s.anion - s.oh > 0) lo = p;
    else hi = p;
  }
  const pH = (lo + hi) / 2;
  return { ...species(pH), pH, total, charge };
}
export function carbonDioxide(dose: number) {
  const x = clip(dose);
  return {
    phenolate: 1 - x,
    phenol: x,
    bicarbonate: x,
    co2Remaining: Math.max(0, dose - x),
    separated: Math.max(0, x - 0.6),
  };
}
export function bromination(br2: number, progress: number) {
  const product = Math.min(1, Math.max(0, br2) / 3) * clip(progress);
  return {
    phenol: 1 - product,
    product,
    br2: Math.max(0, br2 - 3 * product),
    hBr: 3 * product,
    attachedBromine: 3 * product,
  };
}
export const ring = Array.from({ length: 6 }, (_, i) => ({
  id: i + 1,
  x: 150 + 58 * Math.cos(-Math.PI / 2 + (i * Math.PI) / 3),
  y: 115 + 58 * Math.sin(-Math.PI / 2 + (i * Math.PI) / 3),
}));
export function substitutedSites() {
  return [2, 4, 6].map((id) => {
    const a = ring[id - 1],
      dx = a.x - 150,
      dy = a.y - 115;
    return { ...a, end: { x: 150 + dx * 1.65, y: 115 + dy * 1.65 } };
  });
}
export function ferricTest(
  phenol: boolean,
  iron: boolean,
  appropriateMedium: boolean,
  progress: number,
) {
  return {
    violet: phenol && iron && appropriateMedium ? clip(progress) : 0,
    interpretable: appropriateMedium,
  };
}
export const acids = {
  formic: { formula: 'HCOOH', ka1: 1.8e-4, ka2: 0, protons: 1 },
  benzoic: { formula: 'C₆H₅COOH', ka1: 6.3e-5, ka2: 0, protons: 1 },
  oxalic: { formula: 'HOOC—COOH', ka1: 5.9e-2, ka2: 6.4e-5, protons: 2 },
  phenol: { formula: 'C₆H₅OH', ka1: 1e-10, ka2: 0, protons: 0 },
} as const;
export type Acid = keyof typeof acids;
export function acidSolution(acid: Acid, c = 0.01) {
  const a = acids[acid];
  let lo = 0,
    hi = 14;
  for (let i = 0; i < 100; i++) {
    const p = (lo + hi) / 2,
      h = 10 ** -p,
      den = h * h + a.ka1 * h + a.ka1 * a.ka2,
      charge = (c * (a.ka1 * h + 2 * a.ka1 * a.ka2)) / den + 1e-14 / h;
    if (h > charge) lo = p;
    else hi = p;
  }
  return { pH: (lo + hi) / 2, formula: a.formula, co2Equivalent: a.protons * c };
}
export type P = { x: number; y: number };
export function comparisonGeometry(mobile: boolean) {
  const gen = mobile ? { x: 65, y: 85 } : { x: 75, y: 140 },
    wash = mobile ? { x: 65, y: 260 } : { x: 270, y: 150 },
    test = mobile ? { x: 235, y: 260 } : { x: 455, y: 150 };
  const feed: P[] = mobile
    ? [
        { x: gen.x + 10, y: gen.y - 15 },
        { x: gen.x + 10, y: 16 },
        { x: 155, y: 16 },
        { x: 155, y: 160 },
        { x: wash.x - 15, y: 160 },
        { x: wash.x - 15, y: wash.y + 20 },
      ]
    : [
        { x: gen.x + 10, y: gen.y - 15 },
        { x: gen.x + 10, y: 52 },
        { x: wash.x - 15, y: 52 },
        { x: wash.x - 15, y: wash.y + 20 },
      ];
  const rise = [
    feed.at(-1)!,
    { x: wash.x - 10, y: wash.y - 5 },
    { x: wash.x + 15, y: wash.y - 28 },
  ];
  const out = [
    rise.at(-1)!,
    { x: wash.x + 15, y: wash.y - 76 },
    { x: test.x - 10, y: wash.y - 76 },
    { x: test.x - 10, y: test.y + 20 },
  ];
  return { gen, wash, test, feed, rise, out };
}
export const line = (a: P[]) => a.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ');
export function pointOn(a: P[], t: number) {
  const lengths = a.slice(1).map((p, i) => Math.hypot(p.x - a[i].x, p.y - a[i].y));
  let d = clip(t) * lengths.reduce((s, v) => s + v, 0);
  for (let i = 0; i < lengths.length; i++) {
    if (d <= lengths[i] || i === lengths.length - 1) {
      const f = d / lengths[i];
      return { x: a[i].x + (a[i + 1].x - a[i].x) * f, y: a[i].y + (a[i + 1].y - a[i].y) * f };
    }
    d -= lengths[i];
  }
  return a[0];
}
export function comparisonMarker(mobile: boolean, p: number, acetic: boolean, washed: boolean) {
  const g = comparisonGeometry(mobile);
  if (p < 0.55) return pointOn(g.feed, p / 0.55);
  if (acetic && washed) return g.feed.at(-1)!;
  return pointOn([...g.rise, ...g.out.slice(1)], (p - 0.55) / 0.45);
}
export function acidComparison(co2: boolean, acetic: boolean, washed: boolean) {
  const acidCarry = acetic && !washed;
  return { turbid: co2 || acidCarry, validCarbonicEvidence: co2 && !acidCarry, acidCarry };
}
export const historyEvidence = [
  {
    id: 'observation',
    randomized: false,
    title: '腐败与污染的观察',
    claim: '观察提供问题，不能单独证明病因。',
  },
  {
    id: 'intervention',
    randomized: false,
    title: '器械、敷料与手的干预',
    claim: '多项防腐措施共同改变，不能归因于单一动作。',
  },
  {
    id: 'reports',
    randomized: false,
    title: '1867 年病例报告',
    claim: '临床记录支持防腐实践，不是现代随机试验。',
  },
] as const;
