export type ReplicationHypothesis = 'semiconservative' | 'conservative' | 'dispersive';
export type LabeledStrand = { id: string; heavyFraction: number; segments: number[] };
export type LabeledDuplex = { id: string; strands: [LabeledStrand, LabeledStrand] };
const strand = (id: string, heavyFraction: number): LabeledStrand => ({
  id,
  heavyFraction,
  segments: Array.from({ length: 32 }, (_, i) =>
    heavyFraction > 0 && i % Math.round(1 / heavyFraction) === 0 ? 1 : 0,
  ),
});
export function replicationGeneration(
  generation: number,
  hypothesis: ReplicationHypothesis = 'semiconservative',
): LabeledDuplex[] {
  const g = Math.max(0, Math.min(5, Math.floor(generation)));
  let molecules: LabeledDuplex[] = [
    { id: 'parent', strands: [strand('H-A', 1), strand('H-B', 1)] },
  ];
  for (let k = 1; k <= g; k++) {
    if (hypothesis === 'semiconservative')
      molecules = molecules.flatMap((m, i) =>
        m.strands.map((s, j) => ({
          id: `g${k}-${i * 2 + j}`,
          strands: [s, strand(`L-${k}-${i}-${j}`, 0)] as [LabeledStrand, LabeledStrand],
        })),
      );
    else if (hypothesis === 'conservative')
      molecules = molecules.flatMap((m, i) => [
        m,
        { id: `g${k}-${i}`, strands: [strand(`L-${k}-${i}-0`, 0), strand(`L-${k}-${i}-1`, 0)] },
      ]);
    else
      molecules = Array.from({ length: 2 ** k }, (_, i) => ({
        id: `g${k}-${i}`,
        strands: [strand(`mixed-${k}-${i}-0`, 2 ** -k), strand(`mixed-${k}-${i}-1`, 2 ** -k)],
      }));
  }
  return molecules;
}
export function densityBands(
  generation: number,
  hypothesis: ReplicationHypothesis = 'semiconservative',
) {
  const molecules = replicationGeneration(generation, hypothesis),
    counts = new Map<number, number>();
  for (const m of molecules) {
    const f = (m.strands[0].heavyFraction + m.strands[1].heavyFraction) / 2;
    counts.set(f, (counts.get(f) || 0) + 1);
  }
  return [...counts]
    .sort((a, b) => a[0] - b[0])
    .map(([heavyFraction, count]) => ({
      heavyFraction,
      count,
      fraction: count / molecules.length,
      y: 65 + heavyFraction * 160,
    }));
}
export function bandProfile(
  generation: number,
  hypothesis: ReplicationHypothesis,
  y: number,
  width = 5,
) {
  return densityBands(generation, hypothesis).reduce(
    (v, b) =>
      v +
      (b.fraction * Math.exp(-0.5 * ((y - b.y) / width) ** 2)) / (width * Math.sqrt(2 * Math.PI)),
    0,
  );
}
export const forkTop = 'GCATGC';
export const forkBottom = 'CGTACG';
export type ForkBase = {
  id: string;
  index: number;
  template: string;
  base: string;
  visible: number;
  rna: boolean;
  replacement: number;
  x: number;
  y: number;
};
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (v: number) => {
  const x = clamp(v);
  return x * x * (3 - 2 * x);
};
/** Horizontal fork: the top old template runs 3′→5′ left to right. Both new strands grow 5′→3′. */
export function replicationFork(time: number, polymerase = true, primers = true) {
  const s = Math.max(0, Math.min(10, time)),
    open = Math.min(6.5, s),
    forkX = 42 + open * 44;
  const top = (index: number) => {
    const x = 64 + index * 44;
    return { x, y: 120 - 54 * smooth((forkX - x) / 38) };
  };
  const bottom = (index: number) => {
    const x = 64 + index * 44;
    return { x, y: 145 + 71 * smooth((forkX - x) / 38) };
  };
  const leading: ForkBase[] = [],
    lagging: ForkBase[] = [];
  for (let i = 0; i < 6; i++) {
    const position = top(i),
      visible = primers && (i === 0 || polymerase) ? smooth((s - (i + 1)) / 0.65) : 0;
    leading.push({
      id: `new-leading-${i}`,
      index: i,
      template: forkTop[i],
      base: forkBottom[i],
      visible,
      rna: i === 0 && (s < 8.6 || !polymerase),
      replacement: i === 0 ? (polymerase ? smooth((s - 8) / 0.6) : 0) : 1,
      x: position.x,
      y: position.y + 26,
    });
    const lagStart = [3, 2, 5, 4, 7, 6][i],
      isPrimer = i % 2 === 1,
      lagVisible = primers && (isPrimer || polymerase) ? smooth((s - lagStart) / 0.65) : 0,
      rep = polymerase ? smooth((s - 8) / 0.6) : 0,
      pos = bottom(i);
    lagging.push({
      id: `new-lagging-${i}`,
      index: i,
      template: forkBottom[i],
      base: forkTop[i],
      visible: lagVisible,
      rna: isPrimer && rep < 1,
      replacement: isPrimer ? rep : 1,
      x: pos.x,
      y: pos.y - 26,
    });
  }
  const completion = polymerase && primers && s >= 8.6;
  return {
    time: s,
    forkX,
    top: Array.from({ length: 6 }, (_, i) => ({ ...top(i), id: `old-A-${i}`, base: forkTop[i] })),
    bottom: Array.from({ length: 6 }, (_, i) => ({
      ...bottom(i),
      id: `old-B-${i}`,
      base: forkBottom[i],
    })),
    leading,
    lagging,
    ligated: completion ? smooth((s - 8.6) / 1.1) : 0,
    complete: completion && s >= 9.7,
  };
}
