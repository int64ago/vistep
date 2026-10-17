export type HeapItem = { id: string; priority: number; order: number };
export type HeapFrame = {
  items: HeapItem[];
  moving: string | null;
  phase: 'ready' | 'append' | 'swim' | 'replace' | 'sink' | 'settled' | 'empty';
  swapped: [number, number] | null;
};
export const HEAP_PRIORITIES = [9, 7, 8, 3, 5, 2, 6];
export const heapItems = (values: readonly number[]) =>
  values.map((priority, order) => ({ id: `heap-${order}`, priority, order }));
/** Higher priority wins; equal priority uses earlier arrival as an explicit extra key. */
export const heapCompare = (a: HeapItem, b: HeapItem) =>
  a.priority - b.priority || b.order - a.order;
export const heapValid = (items: readonly HeapItem[]) =>
  items.every(
    (item, i) =>
      Number.isFinite(item.priority) &&
      Number.isSafeInteger(item.order) &&
      (i === 0 || heapCompare(items[Math.floor((i - 1) / 2)], item) >= 0),
  );
function check(items: readonly HeapItem[]) {
  if (
    items.length > 128 ||
    !heapValid(items) ||
    new Set(items.map((x) => x.id)).size !== items.length ||
    new Set(items.map((x) => x.order)).size !== items.length
  )
    throw new RangeError('Invalid max heap or identities');
}
export function heapChildChoice(items: readonly HeapItem[], parent: number) {
  const candidates = [parent * 2 + 1, parent * 2 + 2].filter((i) => i < items.length);
  const chosen = candidates.reduce(
    (best, i) => (best === null || heapCompare(items[i], items[best]) > 0 ? i : best),
    null as number | null,
  );
  return { candidates, chosen };
}
export function heapInsertTrace(input: readonly HeapItem[], item: HeapItem) {
  check(input);
  if (
    !Number.isFinite(item.priority) ||
    !Number.isSafeInteger(item.order) ||
    input.some((x) => x.id === item.id || x.order === item.order) ||
    input.length >= 128
  )
    throw new RangeError('Invalid inserted item');
  const items = [...input, item],
    frames: HeapFrame[] = [];
  let i = items.length - 1;
  const save = (phase: HeapFrame['phase'], swapped: HeapFrame['swapped'] = null) =>
    frames.push({ items: [...items], moving: item.id, phase, swapped });
  save('append');
  while (i > 0) {
    const parent = Math.floor((i - 1) / 2);
    if (heapCompare(items[parent], items[i]) >= 0) break;
    [items[parent], items[i]] = [items[i], items[parent]];
    save('swim', [parent, i]);
    i = parent;
  }
  save('settled');
  return { frames, result: items };
}
export function heapPopTrace(input: readonly HeapItem[]) {
  check(input);
  const items = [...input],
    removed = items[0],
    last = items.pop(),
    frames: HeapFrame[] = [];
  if (!items.length) {
    frames.push({ items: [], moving: null, phase: 'empty', swapped: null });
    return { frames, result: items, removed };
  }
  items[0] = last!;
  const moving = last!.id;
  let i = 0;
  const save = (phase: HeapFrame['phase'], swapped: HeapFrame['swapped'] = null) =>
    frames.push({ items: [...items], moving, phase, swapped });
  save('replace');
  while (true) {
    const { chosen } = heapChildChoice(items, i);
    if (chosen === null || heapCompare(items[i], items[chosen]) >= 0) break;
    [items[i], items[chosen]] = [items[chosen], items[i]];
    save('sink', [i, chosen]);
    i = chosen;
  }
  save('settled');
  return { frames, result: items, removed };
}
export function heapDrainTrace(input: readonly HeapItem[]) {
  check(input);
  let items = [...input];
  const output: HeapItem[] = [],
    frames: { items: HeapItem[]; output: HeapItem[] }[] = [{ items: [...items], output: [] }];
  while (items.length) {
    const next = heapPopTrace(items);
    output.push(next.removed!);
    for (const frame of next.frames) frames.push({ items: frame.items, output: [...output] });
    items = next.result;
  }
  return { frames, output };
}
export function heapPosition(index: number) {
  const depth = Math.floor(Math.log2(index + 1)),
    slot = index - (2 ** depth - 1);
  return { x: ((slot + 0.5) * 360) / 2 ** depth, y: 30 + depth * 70 };
}
