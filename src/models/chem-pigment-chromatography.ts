const clamp = (n: number, a = 0, b = 1) => (Number.isFinite(n) ? Math.max(a, Math.min(b, n)) : a);
export const pigmentColors = ['#56856f', '#c4a443', '#c77d47'] as const;
/** Selected linear retention factors, not a reconstruction of any named pigment/solvent data. */
export function retentionFactors(contrast = 1) {
  const c = clamp(contrast);
  return [2 + 2 * c, 2 - 0.2 * c, 2 - 1.6 * c];
}
export function phaseBalance(retention: number) {
  const k = clamp(retention, 0, 8);
  return { k, mobile: 1 / (1 + k), bound: k / (1 + k), relativeVelocity: 1 / (1 + k) };
}
/** A periodic representative residence history: move only during the mobile interval. */
export function residenceTrace(retention: number, time: number) {
  const m = phaseBalance(retention),
    t = clamp(time, 0, 6),
    cycles = Math.floor(t),
    phase = t - cycles;
  return {
    ...m,
    distance: (cycles * m.mobile + Math.min(phase, m.mobile)) / 6,
    moving: phase < m.mobile,
    phase,
  };
}
export function pigmentBands(time = 1, contrast = 1, spreading = 0.35) {
  const t = clamp(time),
    spread = clamp(spreading),
    count = 160;
  const bands = retentionFactors(contrast).map((k, id) => {
    const phase = phaseBalance(k),
      center = 0.1 + 0.74 * t * phase.relativeVelocity;
    // Compact triangular initial/dispersion profiles avoid an implicit unmodelled column outlet.
    const halfWidth = 0.025 + (0.045 + 0.22 * spread) * Math.sqrt(t * phase.relativeVelocity);
    const raw = Array.from({ length: count }, (_, i) =>
      Math.max(0, 1 - Math.abs((i + 0.5) / count - center) / halfWidth),
    );
    const sum = raw.reduce((a, b) => a + b, 0),
      cells = raw.map((v) => v / sum);
    return { id, ...phase, center, halfWidth, cells, color: pigmentColors[id] };
  });
  // At equal retention the two internal boundaries coincide; the middle sample has zero width.
  const boundaries = [
    0,
    (bands[0].center + bands[1].center) / 2,
    (bands[1].center + bands[2].center) / 2,
    1,
  ];
  const sections = Array.from({ length: 3 }, (_, j) => {
    const amounts = bands.map((b) =>
      b.cells.reduce((s, amount, i) => {
        const lo = i / count,
          hi = (i + 1) / count;
        const portion =
          Math.max(0, Math.min(hi, boundaries[j + 1]) - Math.max(lo, boundaries[j])) * count;
        return s + amount * portion;
      }, 0),
    );
    const total = amounts.reduce((a, b) => a + b, 0);
    return {
      id: j,
      from: boundaries[j],
      to: boundaries[j + 1],
      amounts,
      total,
      dominantFraction: total ? Math.max(...amounts) / total : 0,
    };
  });
  const overlap = bands[0].cells.reduce((s, a, i) => s + Math.min(a, bands[1].cells[i]), 0);
  return {
    time: t,
    contrast: clamp(contrast),
    spreading: spread,
    bands,
    sections,
    boundaries,
    overlap,
  };
}
/** Selected 92% transfer at completion, not an ethanol extraction-yield measurement. */
export function extractPigmentSections(time = 1, contrast = 1, spreading = 0.35, progress = 1) {
  const column = pigmentBands(time, contrast, spreading),
    fraction = 0.92 * clamp(progress);
  return {
    ...column,
    fraction,
    samples: column.sections.map((section) => ({
      ...section,
      dissolved: section.amounts.map((a) => a * fraction),
      adsorbed: section.amounts.map((a) => a * (1 - fraction)),
    })),
  };
}
export function chromatographyDirector(chapter: number, progress: number) {
  const c = Math.floor(clamp(chapter, 0, 6)),
    p = clamp(progress);
  return {
    chapter: c,
    p,
    time: c === 0 ? 0 : c === 2 ? p : 1,
    contrast: c === 3 ? p : 1,
    spreading: c === 4 ? 0.15 + 0.85 * p : 0.35,
    remove: c === 5 ? p : c === 6 ? 1 : 0,
    extract: c === 6 ? p : 0,
  };
}
