export type MergeItem = { id: string; value: number; origin: number };
export type MergeFrame = {
  left: MergeItem[];
  right: MergeItem[];
  output: MergeItem[];
  picked: string | null;
  side: 'left' | 'right' | null;
  comparisons: number;
  compared: string[];
};
export const MERGE_VALUES = [7, 3, 5, 3, 8, 2, 6, 1];
export const mergeItems = (values: readonly number[], offset = 0) =>
  values.map((value, i) => ({ id: `merge-${i + offset}`, value, origin: i + offset }));
const ordered = (items: readonly MergeItem[]) =>
  items.every((x, i) => Number.isFinite(x.value) && (i === 0 || x.value >= items[i - 1].value));
function mergeCore(left: readonly MergeItem[], right: readonly MergeItem[]) {
  let i = 0,
    j = 0,
    comparisons = 0;
  const output: MergeItem[] = [],
    frames: MergeFrame[] = [];
  const save = (picked: string | null, side: MergeFrame['side'], compared: string[]) =>
    frames.push({
      left: left.slice(i),
      right: right.slice(j),
      output: [...output],
      picked,
      side,
      comparisons,
      compared,
    });
  save(null, null, []);
  while (i < left.length || j < right.length) {
    const both = i < left.length && j < right.length,
      compared = both ? [left[i].id, right[j].id] : [];
    if (both) comparisons++;
    const takeLeft = j >= right.length || (i < left.length && left[i].value <= right[j].value);
    const item = takeLeft ? left[i++] : right[j++];
    output.push(item);
    save(item.id, takeLeft ? 'left' : 'right', compared);
  }
  return { left: [...left], right: [...right], frames, result: output, comparisons };
}
export function mergeRuns(left: readonly MergeItem[], right: readonly MergeItem[]) {
  if (
    !ordered(left) ||
    !ordered(right) ||
    new Set([...left, ...right].map((x) => x.id)).size !== left.length + right.length
  )
    throw new RangeError('Merge requires sorted runs and distinct item identities');
  return mergeCore(left, right);
}
export function mergeSortTrace(values: readonly number[]) {
  if (values.length > 128 || values.some((v) => !Number.isFinite(v)))
    throw new RangeError('Invalid teaching array');
  const input = mergeItems(values);
  let result = [...input],
    comparisons = 0;
  const passes: { width: number; merges: ReturnType<typeof mergeRuns>[]; result: MergeItem[] }[] =
    [];
  for (let width = 1; width < values.length; width *= 2) {
    const output: MergeItem[] = [],
      merges: ReturnType<typeof mergeRuns>[] = [];
    for (let i = 0; i < result.length; i += width * 2) {
      const run = mergeRuns(result.slice(i, i + width), result.slice(i + width, i + width * 2));
      merges.push(run);
      output.push(...run.result);
      comparisons += run.comparisons;
    }
    result = output;
    passes.push({ width, merges, result: [...result] });
  }
  return { input, passes, result, comparisons };
}
/** Intentionally invalid input: the public merge refuses it; only the consequence is illustrated. */
export function mergeUnsortedWitness() {
  return mergeCore(mergeItems([1, 4, 2]), mergeItems([3, 5], 3));
}
