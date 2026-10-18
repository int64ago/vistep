export const dnaClamp = (x: number, a = 0, b = 1) =>
  Math.min(b, Math.max(a, Number.isFinite(x) ? x : a));
export const dnaComplement = (s: string) =>
  s
    .split('')
    .map((a) => ({ A: 'T', T: 'A', C: 'G', G: 'C' })[a] ?? 'N')
    .join('');
export function restrictionFrame(progress: number, stage: number, blunt = false, ligase = true) {
  const p = dnaClamp(progress),
    sequence = blunt ? 'ATCCCGGGTA' : 'TCGAATTCGA',
    topCut = blunt ? 5 : 3,
    bottomCut = blunt ? 5 : 7,
    separated =
      stage === 0
        ? 22 * dnaClamp((p - 0.2) / 0.65)
        : stage === 1
          ? 22 * (1 - dnaClamp(p / 0.65))
          : 0,
    cut = stage > 0 || p > 0.2,
    joined = stage === 2 && ligase && p > 0.55,
    bases = [sequence, dnaComplement(sequence)].flatMap((seq, row) =>
      seq.split('').map((base, i) => {
        const left = i < (row ? bottomCut : topCut);
        return {
          id: `${row}-${i}`,
          base,
          row,
          i,
          left,
          x: (i - 4.5) * 17 + (left ? -separated : separated),
          y: row ? 176 : 136,
        };
      }),
    );
  return {
    sequence,
    complement: dnaComplement(sequence),
    topCut,
    bottomCut,
    separated,
    cut,
    joined,
    bases,
    overhang: blunt ? '' : sequence.slice(topCut, bottomCut),
    nicks: cut && !joined ? 2 : 0,
  };
}
export function filtrationFrame(progress: number) {
  const p = dnaClamp(progress),
    initial = 3468,
    source = initial * (1 - p),
    receiver = initial * p,
    h = source <= 504 ? source / 18 : (-18 + Math.sqrt(324 + 3 * (source - 504))) / 1.5,
    top = source <= 504 ? 150 - h : 122 - h,
    half = source <= 504 ? 9 : 9 + 0.75 * h,
    sourcePath =
      source <= 504 ? `M-9 ${top}H9V150H-9Z` : `M${-half} ${top}H${half}L9 122V150H-9V122Z`;
  const particles = Array.from({ length: 10 }, (_, i) => {
    const q = dnaClamp((p * 1.7 - i * 0.065) / 1.1),
      x0 = ((i % 3) - 1) * 12,
      y0 = 78 + Math.floor(i / 3) * 3,
      xt = ((i % 5) - 2) * 13,
      yt = 220 + Math.floor(i / 5) * 11;
    let x, y;
    if (q < 0.2) {
      const u = q / 0.2;
      x = x0 * (1 - u);
      y = y0 + (93 - y0) * u;
    } else if (q < 0.6) {
      x = 0;
      y = 93 + (63 * (q - 0.2)) / 0.4;
    } else {
      const u = (q - 0.6) / 0.4;
      x = xt * u;
      y = 156 + (yt - 156) * u;
    }
    return { id: `DNA-${i}`, x, y };
  });
  return { source, receiver, total: initial, sourcePath, level: 244 - receiver / 88, particles };
}
export const precipitationFrame = (progress: number) => {
  const p = dnaClamp(progress),
    delivered = 20 * dnaClamp(p / 0.5);
  return {
    stock: 20 - delivered,
    receiver: 20 + delivered,
    total: 40,
    level: 240 - (20 + delivered) * 2.5,
    precipitate: dnaClamp((p - 0.35) / 0.5),
  };
};
export function identificationFrame(progress: number, heat = true, dna = true) {
  const p = dnaClamp(progress),
    reagent = 4 * dnaClamp(p / 0.35),
    heated = heat && p > 0.4 && p < 0.85,
    cooled = heat && p >= 0.95,
    warmth = heat ? dnaClamp((p - 0.4) / 0.1) * (1 - dnaClamp((p - 0.85) / 0.15)) : 0,
    blue = dna && heat && p > 0.4 ? dnaClamp((p - 0.55) / 0.4) : 0;
  return { stock: 4 - reagent, volume: 5 + reagent, heated, cooled, warmth, blue, blankBlue: 0 };
}
export function pcrFrame(progress: number) {
  const p = dnaClamp(progress),
    phase = Math.min(2, Math.floor(p * 3)),
    q = p === 1 ? 1 : p * 3 - phase,
    gap = phase === 0 ? 30 * q : 30,
    extension = phase === 2 ? q : 0;
  return {
    phase,
    q,
    temperature: [94, 55, 72][phase],
    topY: 120 - gap,
    bottomY: 170 + gap,
    primer: phase === 2 ? 1 : phase === 1 ? dnaClamp(q * 3) : 0,
    extension,
  };
}
export function pcrYield(cycles: number, efficiency = 1, template = true) {
  const n = Math.round(dnaClamp(cycles, 0, 30)),
    e = dnaClamp(efficiency);
  return {
    cycles: n,
    total: template ? (1 + e) ** n : 0,
    idealExact: template && e === 1 ? Math.max(0, 2 ** n - 2 * n - (n === 0 ? 1 : 0)) : null,
  };
}
export const plasmidFrame = (p0: number, promoter = true, origin = true) => {
  const p = dnaClamp(p0);
  return {
    insertOffset: 48 * (1 - dnaClamp(p / 0.8)),
    ligated: p > 0.85,
    copies: origin ? 1 + Math.floor(p * 3) : 1,
    entryY: 75 + 105 * dnaClamp(p / 0.65),
    pore: p > 0.1 && p < 0.76,
    inside: p > 0.4,
    transcript: promoter ? dnaClamp((p - 0.65) / 0.2) : 0,
    protein: promoter ? dnaClamp((p - 0.8) / 0.2) : 0,
  };
};
export const gelDistance = (bp: number) => 100 * Math.log10(3000 / dnaClamp(bp, 100, 2000));
export function gelFrame(
  progress: number,
  sample: 'target' | 'offtarget' | 'none' = 'target',
  contamination = false,
  stain = true,
) {
  const p = dnaClamp(progress);
  const lanes = [
    { id: 'M', bands: [2000, 1000, 500, 200, 100] },
    { id: '+', bands: [500] },
    { id: 'S', bands: sample === 'target' ? [500] : sample === 'offtarget' ? [800, 180] : [] },
    { id: 'NTC', bands: contamination ? [500] : [] },
  ];
  return {
    lanes: lanes.map((l) => ({
      ...l,
      bands: l.bands.map((bp, i) => ({
        id: `${l.id}-${bp}-${i}`,
        bp,
        y: 80 + p * gelDistance(bp),
        visible: stain,
      })),
    })),
    valid: !contamination,
    dyeY: 80 + 175 * p,
  };
}
