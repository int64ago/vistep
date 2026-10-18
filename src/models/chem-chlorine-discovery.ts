/** Ideal well-mixed collection vessel of unit gas capacity; quantities are dimensionless teaching units. */
export function chlorineGasTrain(throughput: number, hydroxideCapacity = 8) {
  const generated = Math.max(0, Math.min(4, Number.isFinite(throughput) ? throughput : 0)),
    oh = Math.max(0, Math.min(8, hydroxideCapacity));
  const collected = 1 - Math.exp(-generated),
    tail = generated - collected,
    absorbed = Math.min(tail, oh / 2),
    unabsorbed = tail - absorbed;
  return {
    generated,
    collected,
    tail,
    absorbed,
    unabsorbed,
    remainingOH: oh - 2 * absorbed,
    chloride: absorbed,
    hypochlorite: absorbed,
    chlorineAtoms: 2 * (collected + unabsorbed) + absorbed * 2,
  };
}
export type PipePoint = [number, number];
export function pipePosition(points: PipePoint[], fraction: number) {
  const lengths = points
    .slice(1)
    .map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1]));
  let remaining = Math.max(0, Math.min(1, fraction)) * lengths.reduce((a, b) => a + b, 0);
  for (let i = 0; i < lengths.length; i++) {
    if (remaining <= lengths[i]) {
      const p = remaining / (lengths[i] || 1);
      return {
        x: points[i][0] + p * (points[i + 1][0] - points[i][0]),
        y: points[i][1] + p * (points[i + 1][1] - points[i][1]),
      };
    }
    remaining -= lengths[i];
  }
  return { x: points.at(-1)![0], y: points.at(-1)![1] };
}
export function chlorineDiscoveryDirector(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  return {
    history: chapter < 2,
    element: chapter === 1,
    throughput: chapter === 2 ? 2 * p : chapter === 3 ? 2 + 2 * p : 0,
    hydroxide: 8,
    ledger: chapter === 3,
    progress: p,
  };
}
