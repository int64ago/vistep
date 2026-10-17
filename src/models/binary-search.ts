export const BINARY_VALUES = [2, 5, 9, 12, 16, 21, 25, 29, 34, 37, 41, 46, 52, 57, 63, 70];
export type BinaryFrame = {
  low: number;
  high: number;
  mid: number | null;
  value: number | null;
  nextLow: number;
  nextHigh: number;
  relation: 'less' | 'greater' | 'equal' | 'absent';
  found: number | null;
};
/** Inclusive candidate interval. Duplicates may return any matching index, not necessarily first. */
export function binarySearchTrace(values: readonly number[], target: number) {
  if (
    !Number.isFinite(target) ||
    values.some((n, i) => !Number.isFinite(n) || (i > 0 && n < values[i - 1]))
  )
    throw new RangeError('Binary search requires finite sorted values');
  let low = 0,
    high = values.length - 1;
  const frames: BinaryFrame[] = [];
  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2),
      value = values[mid];
    const relation = value === target ? 'equal' : value < target ? 'less' : 'greater';
    const nextLow = relation === 'less' ? mid + 1 : low,
      nextHigh = relation === 'greater' ? mid - 1 : high;
    frames.push({
      low,
      high,
      mid,
      value,
      nextLow,
      nextHigh,
      relation,
      found: relation === 'equal' ? mid : null,
    });
    if (relation === 'equal') return { frames, found: mid, comparisons: frames.length };
    low = nextLow;
    high = nextHigh;
  }
  const comparisons = frames.length;
  frames.push({
    low,
    high,
    mid: null,
    value: null,
    nextLow: low,
    nextHigh: high,
    relation: 'absent',
    found: null,
  });
  return { frames, found: null, comparisons };
}
