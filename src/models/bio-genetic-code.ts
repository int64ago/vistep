export const codeRna = 'AUGUUUGGCAAAUAA';
export const codeTemplate = 'TACAAACCGTTTATT'; // displayed 3′ → 5′
const bases = ['U', 'C', 'A', 'G'];
const aaRows = [
  'Phe Phe Leu Leu Ser Ser Ser Ser Tyr Tyr Stop Stop Cys Cys Stop Trp',
  'Leu Leu Leu Leu Pro Pro Pro Pro His His Gln Gln Arg Arg Arg Arg',
  'Ile Ile Ile Met Thr Thr Thr Thr Asn Asn Lys Lys Ser Ser Arg Arg',
  'Val Val Val Val Ala Ala Ala Ala Asp Asp Glu Glu Gly Gly Gly Gly',
];
export const geneticCode: Record<string, string> = {};
bases.forEach((a, i) =>
  bases.forEach((b, j) =>
    bases.forEach((c, k) => {
      geneticCode[a + b + c] = aaRows[i].split(' ')[j * 4 + k];
    }),
  ),
);
export const rnaComplement = (x: string) =>
  x
    .split('')
    .map((b) => ({ A: 'U', T: 'A', G: 'C', C: 'G', U: 'A' })[b])
    .join('');
export function codons(rna: string) {
  return Array.from({ length: Math.floor(rna.length / 3) }, (_, i) => rna.slice(i * 3, i * 3 + 3));
}
export function peptide(rna: string) {
  const a: string[] = [];
  for (const c of codons(rna)) {
    if (geneticCode[c] === 'Stop') break;
    a.push(geneticCode[c]);
  }
  return a;
}
export function shiftedSequence(delta: number) {
  delta = Math.max(-3, Math.min(3, Math.trunc(delta)));
  const original = 'AUGGCUACCGGUAAGCCU';
  const ids = original.split('').map((base, i) => ({ id: `original-${i}`, base, original: i }));
  const modified =
    delta > 0
      ? [
          ...ids.slice(0, 3),
          ...'CCC'
            .slice(0, delta)
            .split('')
            .map((base, i) => ({ id: `insert-${i}`, base, original: -1 })),
          ...ids.slice(3),
        ]
      : [...ids.slice(0, 3), ...ids.slice(3 - delta)];
  return {
    original: ids,
    modified,
    delta,
    frameRestored: delta % 3 === 0,
    protein: peptide(modified.map((x) => x.base).join('')),
  };
}
// Original Table 6, experiment 1: 14C-Phe incorporation, counts min⁻¹ mg protein⁻¹.
export const polyUControls = [
  { id: 'none', polymer: '—', counts: 44 },
  { id: 'poly-u', polymer: 'UUUUUU', counts: 39800 },
  { id: 'poly-a', polymer: 'AAAAAA', counts: 50 },
  { id: 'poly-c', polymer: 'CCCCCC', counts: 38 },
] as const;
export function textbookPolyU(aminoAcid: string, hasRna: boolean, intactRibosomes: boolean) {
  return {
    polymer:
      hasRna && intactRibosomes && aminoAcid === 'Phe' ? (Array(6).fill('Phe') as string[]) : [],
    quantitative: false,
  };
}
export const smooth = (x: number) => {
  const y = Math.max(0, Math.min(1, x));
  return y * y * (3 - 2 * y);
};
export function transcription(progress: number, polymerase = true) {
  const n = polymerase ? 15 * Math.max(0, Math.min(1, progress)) : 0;
  const headX = 45 + 18 * n;
  return {
    headX,
    n,
    rna: codeRna.split('').map((base, i) => {
      const visible = smooth(n - i);
      const age = Math.max(0, n - i - 1);
      return { id: `rna-${i}`, base, visible, x: 45 + i * 18, y: 164 + 56 * smooth(age / 2) };
    }),
    template: codeTemplate.split('').map((base, i) => ({
      base,
      x: 45 + i * 18,
      y: 108 + 19 * Math.exp(-(((i - n + 1) / 1.7) ** 2)),
    })),
  };
}
export type TrnaState = {
  id: number;
  x: number;
  y: number;
  opacity: number;
  codon: string;
  anticodon: string;
  aa: string;
  charged: boolean;
};
export function translation(time: number, charged = true) {
  const T = Math.max(0, Math.min(5, time));
  const cycle = Math.min(4, Math.floor(T));
  const u = T - cycle;
  const trnas: TrnaState[] = [];
  const add = (id: number, x: number, y: number, opacity: number, isCharged: boolean) =>
    trnas.push({
      id,
      x,
      y,
      opacity,
      codon: codons(codeRna)[id],
      anticodon: rnaComplement(codons(codeRna)[id]),
      aa: geneticCode[codons(codeRna)[id]],
      charged: isCharged,
    });
  let shift = 0,
    chain: string[] = [],
    chainX = 148,
    chainY = 100,
    released = false,
    releaseFactor = 0;
  if (!charged)
    return {
      trnas,
      shift,
      chain,
      chainX,
      chainY,
      released,
      releaseFactor,
      cycle: 0,
      growing: false,
    };
  if (cycle === 0) {
    const a = smooth(T / 0.7);
    add(0, 130, -60 * (1 - a), a, true);
    chain = ['Met'];
    chainY -= 60 * (1 - a);
  } else if (cycle < 4) {
    const arrival = smooth(u / 0.25),
      transfer = smooth((u - 0.25) / 0.25),
      transloc = smooth((u - 0.55) / 0.3),
      leave = smooth((u - 0.85) / 0.15);
    shift = cycle - 1 + transloc;
    add(cycle - 1, 130 - 90 * transloc - 55 * leave, 15 * leave, 1 - leave, false);
    add(cycle, 220 - 90 * transloc, -60 * (1 - arrival), arrival, transfer < 1);
    chain = codons(codeRna)
      .slice(0, cycle)
      .map((c) => geneticCode[c]);
    chainX = 148 + 70 * transfer - 90 * transloc;
    if (transfer >= 1) {
      chain.push(geneticCode[codons(codeRna)[cycle]]);
      chainX += 20;
    }
  } else {
    shift = 3;
    releaseFactor = smooth(u / 0.35) * (1 - smooth((u - 0.8) / 0.2));
    const release = smooth((u - 0.35) / 0.45);
    add(3, 130 - 75 * release, 15 * release, 1 - release, false);
    chain = ['Met', 'Phe', 'Gly', 'Lys'];
    chainY -= 66 * release;
    chainX += 20 * release;
    released = release > 0;
  }
  return {
    trnas,
    shift,
    chain,
    chainX,
    chainY,
    released,
    releaseFactor,
    cycle,
    growing: !released,
  };
}
