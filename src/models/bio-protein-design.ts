import evidence from './data/bio-insulin-evidence.json';
export const proteinClamp = (x: number, a = 0, b = 1) =>
  Math.min(b, Math.max(a, Number.isFinite(x) ? x : a));
export const insulinEvidence = evidence;
export const codonTable = {
  A: ['GCT', 'GCC', 'GCA', 'GCG'],
  W: ['TGG'],
  K: ['AAA', 'AAG'],
  E: ['GAA', 'GAG'],
  F: ['TTT', 'TTC'],
} as const;
export const designPeptide = 'AWKEF';
export function backTranslation(index: number) {
  let n = Math.round(proteinClamp(index, 0, 31));
  const codons = designPeptide.split('').map((aa) => {
    const options = codonTable[aa as keyof typeof codonTable],
      c = options[n % options.length];
    n = Math.floor(n / options.length);
    return c;
  });
  return { codons, dna: codons.join(''), peptide: designPeptide, possibilities: 32 };
}
export function enzymeEvidence(time: number, temperature: number) {
  const t = proteinClamp(time, 0, 20),
    T = proteinClamp(temperature, 20, 80),
    factor = Math.exp((T - 60) / 12);
  return [
    { id: 'A', initial: 0.5, k: 0.08 * factor },
    { id: 'B', initial: 0.8 / 2.2, k: 0.012 * factor },
  ].map((a) => ({ ...a, time: t, activity: a.initial * Math.exp(-a.k * t) }));
}
export function association(total: number, ka: number) {
  const c = proteinClamp(total, 0, 10),
    k = proteinClamp(ka, 0, 100),
    m = (2 * c) / (1 + Math.sqrt(1 + 8 * k * c)),
    d = k * m * m;
  return { monomer: m, dimer: d, total: c, monomerFraction: c === 0 ? null : m / c };
}
export function projectedInsulin(width: number, angle: number, lispro = false) {
  const all = evidence.structures[lispro ? '1LPH' : '1TRZ'].atoms,
    centre = all.reduce(
      (a, b) => ({
        x: a.x + b.x / all.length,
        y: a.y + b.y / all.length,
        z: a.z + b.z / all.length,
      }),
      { x: 0, y: 0, z: 0 },
    ),
    radius = Math.max(
      ...all.map((a) => Math.hypot(a.x - centre.x, a.y - centre.y, a.z - centre.z)),
    ),
    scale = Math.min((width - 48) / 2, 96) / radius;
  return all.map((a) => {
    const x = a.x - centre.x,
      y = a.y - centre.y,
      z = a.z - centre.z,
      xx = x * Math.cos(angle) + z * Math.sin(angle),
      zz = -x * Math.sin(angle) + z * Math.cos(angle),
      yy = y * Math.cos(0.4) - zz * Math.sin(0.4);
    return {
      ...a,
      id: `${a.chain}${a.residue}-${a.atom}`,
      x: width / 2 + xx * scale,
      y: 158 + yy * scale,
      depth: y * Math.sin(0.4) + zz * Math.cos(0.4),
      scale,
    };
  });
}
export function matureComparison(index: number) {
  const h = evidence.sequences[0],
    s = evidence.sequences[Math.round(proteinClamp(index, 0, 2))],
    a = globalAlignment(h.a, s.a),
    b = globalAlignment(h.b, s.b);
  return {
    a,
    b,
    matches: a.matches + b.matches,
    length: a.length + b.length,
    identity: (a.matches + b.matches) / (a.length + b.length),
  };
}
export function globalAlignment(a0: string, b0: string) {
  const a = a0.toUpperCase().slice(0, 160),
    b = b0.toUpperCase().slice(0, 160),
    m = a.length,
    n = b.length,
    dp = Array.from({ length: m + 1 }, () => new Int16Array(n + 1));
  for (let i = 0; i <= m; i++) dp[i][0] = -2 * i;
  for (let j = 0; j <= n; j++) dp[0][j] = -2 * j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = Math.max(
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 2 : -1),
        dp[i - 1][j] - 2,
        dp[i][j - 1] - 2,
      );
  let i = m,
    j = n,
    aa = '',
    bb = '';
  while (i || j) {
    if (i && j && dp[i][j] === dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 2 : -1)) {
      aa = a[--i] + aa;
      bb = b[--j] + bb;
    } else if (i && dp[i][j] === dp[i - 1][j] - 2) {
      aa = a[--i] + aa;
      bb = '-' + bb;
    } else {
      aa = '-' + aa;
      bb = b[--j] + bb;
    }
  }
  const matches = aa.split('').filter((v, i) => v !== '-' && v === bb[i]).length;
  return {
    a: aa,
    b: bb,
    matches,
    length: aa.length,
    identity: aa.length ? matches / aa.length : null,
    score: dp[m][n],
  };
}
export function segmentEvidence(a: string, b: string, length: number) {
  const n = Math.min(a.length, b.length, Math.max(0, Math.floor(length))),
    matches = Array.from({ length: n }, (_, i) => a[i] === b[i]).filter(Boolean).length;
  return { n, matches, identity: n ? matches / n : null, coverage: a.length ? n / a.length : null };
}
export function parseProteinFasta(text: string) {
  if (text.split('\n').filter((a) => a.trim().startsWith('>')).length > 1) return null;
  const s = text
    .split('\n')
    .filter((a) => !a.trim().startsWith('>'))
    .join('')
    .replace(/\s/g, '')
    .toUpperCase();
  return /^[ACDEFGHIKLMNPQRSTVWYX]{1,160}$/.test(s) ? s : null;
}
