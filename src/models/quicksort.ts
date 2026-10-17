export type QuickItem = { id: string; value: number; origin: number };
export type QuickFrame = {
  items: QuickItem[];
  lt: number;
  scan: number;
  gt: number;
  action: 'start' | 'less' | 'equal' | 'greater';
  inspected: string | null;
  swapped: [number, number] | null;
};
export type QuickStrategy = 'middle' | 'minimum' | 'median';
export const QUICK_VALUES = [6, 3, 8, 3, 5, 2, 7, 3];
export const quickItems = (values: readonly number[]) =>
  values.map((value, origin) => ({ id: `quick-${origin}`, value, origin }));
/** Dijkstra's three-way partition: [0,lt)<pivot; [lt,scan)=pivot; [scan,gt] unknown; (gt,n)>pivot. */
export function quickPartition(input: readonly QuickItem[], pivot: number) {
  if (
    input.length > 128 ||
    !Number.isFinite(pivot) ||
    input.some((x) => !Number.isFinite(x.value)) ||
    new Set(input.map((x) => x.id)).size !== input.length
  )
    throw new RangeError('Invalid partition input');
  const items = [...input],
    frames: QuickFrame[] = [];
  let lt = 0,
    scan = 0,
    gt = items.length - 1;
  const save = (
    action: QuickFrame['action'],
    inspected: string | null,
    swapped: QuickFrame['swapped'],
  ) => frames.push({ items: [...items], lt, scan, gt, action, inspected, swapped });
  save('start', null, null);
  while (scan <= gt) {
    const inspected = items[scan];
    if (inspected.value < pivot) {
      const pair: [number, number] = [lt, scan];
      [items[lt], items[scan]] = [items[scan], items[lt]];
      lt++;
      scan++;
      save('less', inspected.id, pair);
    } else if (inspected.value > pivot) {
      const pair: [number, number] = [scan, gt];
      [items[scan], items[gt]] = [items[gt], items[scan]];
      gt--;
      save('greater', inspected.id, pair);
    } else {
      scan++;
      save('equal', inspected.id, null);
    }
  }
  return { frames, result: items, lt, gt, classifications: input.length };
}
export function quickSortTrace(
  values: readonly number[],
  strategy: QuickStrategy = 'middle',
  firstPivot?: number,
) {
  if (
    values.length > 128 ||
    values.some((v) => !Number.isFinite(v)) ||
    !['middle', 'minimum', 'median'].includes(strategy) ||
    (values.length && firstPivot !== undefined && !values.includes(firstPivot))
  )
    throw new RangeError('Invalid quicksort input or pivot');
  const input = quickItems(values),
    working = [...input];
  const steps: { items: QuickItem[]; low: number; high: number; depth: number }[] = [
      { items: [...working], low: 0, high: values.length - 1, depth: 0 },
    ],
    partitions: { size: number; depth: number; pivot: number }[] = [];
  let classifications = 0,
    maxDepth = 0;
  const sort = (low: number, high: number, depth: number) => {
    if (low >= high) return;
    const slice = working.slice(low, high + 1),
      pivot =
        depth === 1 && firstPivot !== undefined
          ? firstPivot
          : strategy === 'minimum'
            ? Math.min(...slice.map((x) => x.value))
            : strategy === 'median'
              ? slice.map((x) => x.value).sort((a, b) => a - b)[Math.floor(slice.length / 2)]
              : slice[Math.floor(slice.length / 2)].value;
    const run = quickPartition(slice, pivot);
    classifications += run.classifications;
    maxDepth = Math.max(maxDepth, depth);
    partitions.push({ size: slice.length, depth, pivot });
    for (const frame of run.frames.slice(1)) {
      working.splice(low, slice.length, ...frame.items);
      steps.push({ items: [...working], low, high, depth });
    }
    sort(low, low + run.lt - 1, depth + 1);
    sort(low + run.gt + 1, high, depth + 1);
  };
  sort(0, working.length - 1, 1);
  return { input, result: [...working], steps, partitions, classifications, maxDepth };
}
