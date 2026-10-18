import { ironThiocyanate } from './chem-iron-cycle';
export const IRON_PRACTICAL_CASES = [
  'iron-copper',
  'ferric-copper',
  'ferric-iodide',
  'ferrous-zinc',
  'permanganate',
  'ferric-test',
  'iron-test',
] as const;
export type IronPracticalCase = (typeof IRON_PRACTICAL_CASES)[number];
const unit = (x: number) => Math.max(0, Math.min(1, x));
/** Relative mmol-style amounts. Ideal net reactions, no rate or competing reactions. */
export function ironPractical(kind: IronPracticalCase, extent = 1, partner = 1, test = true) {
  const p = unit(extent),
    a = Math.max(0, Math.min(2, partner));
  let fe0 = 0,
    fe2 = 0,
    fe3 = 0,
    cu0 = 0,
    cu2 = 0,
    zn0 = 0,
    zn2 = 0,
    iodide = 0,
    iodine = 0,
    mn7 = 0,
    mn2 = 0,
    electrons = 0,
    initialIron = 1,
    initialCopper = 0,
    initialZinc = 0,
    initialIodine = 0,
    initialManganese = 0;
  if (kind === 'iron-copper') {
    const r = Math.min(1, a) * p;
    fe0 = 1 - r;
    fe2 = r;
    cu0 = r;
    cu2 = a - r;
    electrons = 2 * r;
    initialCopper = a;
  }
  if (kind === 'ferric-copper') {
    const r = Math.min(1, a) * p;
    fe3 = 1 - r;
    fe2 = r;
    cu0 = a / 2 - r / 2;
    cu2 = r / 2;
    electrons = r;
    initialCopper = a / 2;
  }
  if (kind === 'ferric-iodide') {
    const r = Math.min(1, a) * p;
    fe3 = 1 - r;
    fe2 = r;
    iodide = a - r;
    iodine = r / 2;
    electrons = r;
    initialIodine = a;
  }
  if (kind === 'ferrous-zinc') {
    const r = Math.min(1, a) * p;
    fe2 = 1 - r;
    fe0 = r;
    zn0 = a - r;
    zn2 = r;
    electrons = 2 * r;
    initialZinc = a;
  }
  if (kind === 'permanganate') {
    const r = Math.min(1, a) * p;
    fe2 = 1 - r;
    fe3 = r;
    mn7 = a / 5 - r / 5;
    mn2 = r / 5;
    electrons = r;
    initialManganese = a / 5;
  }
  if (kind === 'ferric-test') fe3 = 1;
  if (kind === 'iron-test') {
    const r = Math.min(1, a) * p;
    fe3 = 1 - r;
    fe2 = 1.5 * r;
    fe0 = a / 2 - r / 2;
    initialIron = 1 + a / 2;
    electrons = r;
  }
  const diagnostic =
    test &&
    (kind === 'ferric-test' || kind === 'iron-test' || (kind === 'permanganate' && mn7 < 1e-10));
  const complex = ironThiocyanate(fe3 * 0.0025, diagnostic ? 0.0075 : 0);
  return {
    kind,
    fe0,
    fe2,
    fe3,
    cu0,
    cu2,
    zn0,
    zn2,
    iodide,
    iodine,
    mn7,
    mn2,
    electrons,
    initialIron,
    initialCopper,
    initialZinc,
    initialIodine,
    initialManganese,
    diagnostic,
    red: complex.red,
    starch: test && kind === 'ferric-iodide' && iodine > 0,
  };
}
export function ironPracticalDirector(chapter: number, progress: number) {
  const kind = IRON_PRACTICAL_CASES[Math.max(0, Math.min(6, chapter))],
    p = unit(progress),
    late = ['ferric-iodide', 'permanganate', 'iron-test'].includes(kind);
  return {
    kind,
    extent: late ? Math.min(1, p / 0.65) : kind === 'ferric-test' ? 1 : p,
    partner: 1,
    test: kind === 'ferric-test' ? p > 0.15 : late ? p > 0.75 : false,
    progress: p,
  };
}
export const IRON_PRACTICAL_EQUATIONS: Record<IronPracticalCase, string> = {
  'iron-copper': 'Fe + Cu²⁺ → Fe²⁺ + Cu',
  'ferric-copper': '2Fe³⁺ + Cu → 2Fe²⁺ + Cu²⁺',
  'ferric-iodide': '2Fe³⁺ + 2I⁻ → 2Fe²⁺ + I₂',
  'ferrous-zinc': 'Fe²⁺ + Zn → Fe + Zn²⁺',
  permanganate: '5Fe²⁺ + MnO₄⁻ + 8H⁺ → 5Fe³⁺ + Mn²⁺ + 4H₂O',
  'ferric-test': 'Fe³⁺ + SCN⁻ ⇌ FeSCN²⁺',
  'iron-test': '2Fe³⁺ + Fe → 3Fe²⁺',
};
