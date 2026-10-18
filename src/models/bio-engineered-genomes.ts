/** Conceptual chromosome blocks, not DNA sequences or laboratory instructions. */
export function fusedChromosomes(fusions: number) {
  const n = Math.max(0, Math.min(15, Math.floor(fusions)));
  return Array.from({ length: 16 - n }, (_, i) => ({
    id: i,
    blocks: i === 0 ? Array.from({ length: n + 1 }, (_, j) => j) : [i + n],
    centromeres: 1,
  }));
}
export function genomeAssembly(progress: number) {
  const n = Math.max(0, Math.min(12, Math.floor(progress * 12)));
  return { assembledBlocks: n, complete: n === 12, basePairs: 1080000 };
}
export function genomeViability(
  assembled: boolean,
  recipient: boolean,
  essentialFunctions: boolean,
) {
  return { supportsGrowth: assembled && recipient && essentialFunctions, requiresRecipient: true };
}
export function chromosomeLayout(fusions: number) {
  const groups = fusedChromosomes(fusions);
  let x = 22;
  return groups.map((g) => {
    const length = g.blocks.length * 14;
    const obj = { ...g, x, length };
    x += length + 5;
    return obj;
  });
}

const bound = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (x: number) => {
  const p = bound(x);
  return p * p * (3 - 2 * p);
};
/** Each material segment retains its ID and both endpoints throughout assembly. */
export function genomeSegmentPoints(id: number, progress: number, transfer = 0) {
  const f = smooth((progress - id * 0.025) / 0.68),
    center = { x: 90 + 165 * bound(transfer), y: 130 },
    radius = 48;
  return Array.from({ length: 17 }, (_, j) => {
    const u = j / 16,
      angle = ((id + u) * Math.PI) / 6;
    const start = {
      x: 42 + (id % 4) * 85 + ((u - 0.5) * Math.PI * radius) / 6,
      y: 50 + Math.floor(id / 4) * 80,
    };
    const end = { x: center.x + radius * Math.cos(angle), y: center.y + radius * Math.sin(angle) };
    return { x: start.x + (end.x - start.x) * f, y: start.y + (end.y - start.y) * f };
  });
}
export function continuousFusion(fusions: number) {
  const f = Math.min(15, Math.max(0, fusions)),
    n = Math.floor(f),
    blend = smooth(f - n);
  const xAt = (id: number, step: number) => 22 + id * 14 + Math.max(0, id - step) * 5;
  const blocks = Array.from({ length: 16 }, (_, id) => ({
    id,
    x: xAt(id, n) + (xAt(id, Math.min(15, n + 1)) - xAt(id, n)) * blend,
    centromereOpacity: id === 0 ? 1 : id <= n ? 0 : id === n + 1 ? 1 - blend : 1,
  }));
  return {
    blocks,
    chromosomes: 16 - n,
    completed: n === 15,
    joining: n < 15 ? { from: n, to: n + 1, progress: blend } : null,
  };
}
/** A conditional illustration, not a biological growth or success-rate prediction. */
export function hypotheticalBudding(
  progress: number,
  conditions: { assembled: boolean; recipient: boolean; essential: boolean },
) {
  const allowed = genomeViability(
      conditions.assembled,
      conditions.recipient,
      conditions.essential,
    ).supportsGrowth,
    p = allowed ? bound(progress) : 0;
  const radius = 32 * smooth((p - 0.06) / 0.6),
    separation = smooth((p - 0.68) / 0.32),
    distance = 36 + radius * (0.48 + 0.75 * separation),
    nucleus = smooth((p - 0.32) / 0.34);
  return {
    allowed,
    radius,
    distance,
    nucleus,
    hasCell: conditions.recipient,
    chromosomeCount: 1,
    realSuccessRate: null,
  };
}
/** Union of mother and bud walls; the shared contact boundary is absent while connected. */
export function yeastBudOutline(radius: number, distance: number) {
  const R = 36,
    r = radius,
    d = distance;
  if (r < 0.01) return `M${-R} 0A${R} ${R} 0 1 0 ${R} 0A${R} ${R} 0 1 0 ${-R} 0Z`;
  if (d >= R + r)
    return `M${-R} 0A${R} ${R} 0 1 0 ${R} 0A${R} ${R} 0 1 0 ${-R} 0ZM${d - r} 0A${r} ${r} 0 1 0 ${d + r} 0A${r} ${r} 0 1 0 ${d - r} 0Z`;
  const x = (R * R - r * r + d * d) / (2 * d),
    y = Math.sqrt(Math.max(0, R * R - x * x));
  return `M${x} ${-y}A${R} ${R} 0 1 0 ${x} ${y}A${r} ${r} 0 1 0 ${x} ${-y}Z`;
}
export function yeastChromosomePoints(id: number) {
  const x = (u: number) => -15 + 30 * u,
    y = (u: number) => 7 * Math.sin(u * Math.PI * 3);
  return Array.from({ length: 5 }, (_, j) => {
    const u = (id + j / 4) / 16;
    return { x: x(u), y: y(u) };
  });
}
