/** A tiny, insertion-only B+ tree, independently authored from CMU 15-445 Lecture 08.
 * Leaves: 3 (integer key, row ID) entries. Internal pages: 4 children.
 * Separate append-only heap: 4 complete rows/page. No MVCC, deletion or disk timing.
 */
export const DI_LEAF_CAPACITY = 3;
export const DI_FANOUT = 4;
export const DI_HEAP_CAPACITY = 4;
export type DiEntry = { key: number; rowId: number };
export type DiRow = DiEntry & { payload: string; heap: number };
export type DiLeaf = { id: number; kind: 'leaf'; entries: DiEntry[]; next: number | null };
export type DiInner = { id: number; kind: 'inner'; keys: DiEntry[]; children: number[] };
export type DiPage = DiLeaf | DiInner;
export type DiTree = {
  root: number;
  nextPage: number;
  rows: DiRow[];
  pages: Record<number, DiPage>;
};
export type DiChange = {
  kind: 'insert' | 'leaf-split' | 'parent' | 'internal-split' | 'root';
  tree: DiTree;
  page: number;
  right?: number;
  separator?: DiEntry;
  before?: DiPage;
};
export type DiQueryStep = {
  kind: 'page' | 'compare' | 'link' | 'match';
  space: 'index' | 'heap';
  page: number;
  slot?: number;
  rowId?: number;
  lhs?: DiEntry;
  rhs?: DiEntry;
  order?: number;
  target?: number;
  indexPages: number;
  heapPages: number;
  comparisons: number;
  found: number[];
};
export type DiQuery = {
  rows: DiRow[];
  steps: DiQueryStep[];
  indexPages: number;
  heapPages: number;
  comparisons: number;
};
export function diCompare(a: DiEntry, b: DiEntry) {
  return Math.sign(a.key - b.key) || Math.sign(a.rowId - b.rowId);
}
function validKey(key: number) {
  if (!Number.isSafeInteger(key) || Math.abs(key) > 1_000_000)
    throw new RangeError('integer key outside ±1000000');
}
export function diEmpty(): DiTree {
  return {
    root: 1,
    nextPage: 2,
    rows: [],
    pages: { 1: { id: 1, kind: 'leaf', entries: [], next: null } },
  };
}
function clone<T>(value: T): T {
  return structuredClone(value);
}
export function diMinimum(tree: DiTree, id: number): DiEntry {
  const page = tree.pages[id];
  if (page.kind === 'leaf') {
    if (!page.entries.length) throw new Error('empty non-root subtree');
    return { ...page.entries[0] };
  }
  return diMinimum(tree, page.children[0]);
}
function refresh(tree: DiTree, page: DiInner) {
  page.keys = page.children.slice(1).map((id) => diMinimum(tree, id));
}
export function diHeight(tree: DiTree) {
  let id = tree.root,
    height = 1;
  while (tree.pages[id].kind === 'inner') {
    id = (tree.pages[id] as DiInner).children[0];
    height++;
  }
  return height;
}
/** Copy on insert: no returned snapshot is subsequently mutated. Events may be transiently overfull. */
export function diInsert(previous: DiTree, key: number, payload?: string) {
  validKey(key);
  const tree = clone(previous),
    rowId = tree.rows.length + 1;
  const entry: DiEntry = { key, rowId };
  tree.rows.push({
    ...entry,
    heap: Math.floor((rowId - 1) / DI_HEAP_CAPACITY) + 1,
    payload: payload ?? `item-${String(rowId).padStart(2, '0')}`,
  });
  const changes: DiChange[] = [];
  const record = (change: Omit<DiChange, 'tree'>) =>
    changes.push({ ...clone(change), tree: clone(tree) });
  function add(id: number): number | null {
    const page = tree.pages[id];
    if (page.kind === 'leaf') {
      let slot = 0;
      while (slot < page.entries.length && diCompare(page.entries[slot], entry) < 0) slot++;
      page.entries.splice(slot, 0, entry);
      record({ kind: 'insert', page: id });
      if (page.entries.length <= DI_LEAF_CAPACITY) return null;
      const before = clone(page),
        rightId = tree.nextPage++;
      const right: DiLeaf = {
        id: rightId,
        kind: 'leaf',
        entries: page.entries.splice(2),
        next: page.next,
      };
      page.next = rightId;
      tree.pages[rightId] = right;
      record({ kind: 'leaf-split', page: id, right: rightId, separator: right.entries[0], before });
      return rightId;
    }
    let slot = 0;
    while (slot < page.keys.length && diCompare(entry, page.keys[slot]) >= 0) slot++;
    const right = add(page.children[slot]);
    if (right !== null) page.children.splice(slot + 1, 0, right);
    refresh(tree, page);
    if (right !== null)
      record({ kind: 'parent', page: id, right, separator: diMinimum(tree, right) });
    if (page.children.length <= DI_FANOUT) return null;
    const before = clone(page),
      rightId = tree.nextPage++;
    const newPage: DiInner = {
      id: rightId,
      kind: 'inner',
      children: page.children.splice(3),
      keys: [],
    };
    tree.pages[rightId] = newPage;
    refresh(tree, page);
    refresh(tree, newPage);
    record({
      kind: 'internal-split',
      page: id,
      right: rightId,
      separator: diMinimum(tree, rightId),
      before,
    });
    return rightId;
  }
  const right = add(tree.root);
  if (right !== null) {
    const root: DiInner = {
      id: tree.nextPage++,
      kind: 'inner',
      children: [tree.root, right],
      keys: [],
    };
    tree.pages[root.id] = root;
    tree.root = root.id;
    refresh(tree, root);
    record({ kind: 'root', page: root.id, right, separator: root.keys[0] });
  }
  return { tree, changes, row: tree.rows.at(-1)! };
}
export function diBuild(keys: readonly number[]) {
  return keys.reduce((tree, key) => diInsert(tree, key).tree, diEmpty());
}
/** Seed only changes append order. Fisher–Yates with a fixed 32-bit LCG. */
export function diDataset(seed = 19) {
  const keys = [
    8, 12, 17, 23, 28, 31, 35, 38, 42, 42, 42, 47, 51, 55, 58, 63, 66, 70, 74, 78, 82, 86, 91, 95,
  ];
  let state = seed >>> 0;
  for (let i = keys.length - 1; i > 0; i--) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const j = state % (i + 1);
    [keys[i], keys[j]] = [keys[j], keys[i]];
  }
  return keys;
}
/** One fresh unbounded page cache/query: count distinct touched pages, not physical I/O or latency.
 * Every numeric or composite three-way comparator invocation counts as one comparison.
 * Result presentation sorts outside the access trace, identically for both plans.
 */
export function diQuery(
  tree: DiTree,
  low: number,
  high = low,
  plan: 'index' | 'scan' = 'index',
): DiQuery {
  validKey(low);
  validKey(high);
  if (low > high) throw new RangeError('lower bound exceeds upper bound');
  const index = new Set<number>(),
    heap = new Set<number>(),
    found: number[] = [],
    steps: DiQueryStep[] = [];
  let comparisons = 0;
  const record = (s: Omit<DiQueryStep, 'indexPages' | 'heapPages' | 'comparisons' | 'found'>) => {
    steps.push({
      ...s,
      indexPages: index.size,
      heapPages: heap.size,
      comparisons,
      found: [...found],
    });
  };
  const visit = (space: 'index' | 'heap', page: number) => {
    (space === 'index' ? index : heap).add(page);
    record({ kind: 'page', space, page });
  };
  const compare = (
    lhs: DiEntry,
    rhs: DiEntry,
    space: 'index' | 'heap',
    page: number,
    slot: number,
  ) => {
    const order = diCompare(lhs, rhs);
    comparisons++;
    record({ kind: 'compare', lhs, rhs, order, space, page, slot });
    return order;
  };
  // Numeric comparisons use rowId=0 on both sides; routing uses full pairs.
  const qualifies = (entry: DiEntry, space: 'index' | 'heap', page: number, slot: number) => {
    if (compare({ key: entry.key, rowId: 0 }, { key: low, rowId: 0 }, space, page, slot) < 0)
      return -1;
    return compare({ key: entry.key, rowId: 0 }, { key: high, rowId: 0 }, space, page, slot) <= 0
      ? 0
      : 1;
  };
  const match = (entry: DiEntry) => {
    const row = tree.rows[entry.rowId - 1];
    if (plan === 'index') visit('heap', row.heap);
    found.push(row.rowId);
    record({ kind: 'match', space: 'heap', page: row.heap, rowId: row.rowId });
  };
  if (plan === 'scan') {
    for (const row of tree.rows) {
      if (!heap.has(row.heap)) visit('heap', row.heap);
      if (qualifies(row, 'heap', row.heap, (row.rowId - 1) % DI_HEAP_CAPACITY) === 0) match(row);
    }
  } else {
    let id = tree.root;
    const probe = { key: low, rowId: 0 }; // zero precedes every real row ID, including all duplicate keys.
    while (tree.pages[id].kind === 'inner') {
      visit('index', id);
      const page = tree.pages[id] as DiInner;
      let slot = 0;
      while (slot < page.keys.length && compare(probe, page.keys[slot], 'index', id, slot) >= 0)
        slot++;
      record({ kind: 'link', space: 'index', page: id, target: page.children[slot] });
      id = page.children[slot];
    }
    let done = false;
    while (!done) {
      const page = tree.pages[id] as DiLeaf;
      visit('index', id);
      for (let slot = 0; slot < page.entries.length; slot++) {
        const entry = page.entries[slot],
          result = qualifies(entry, 'index', id, slot);
        if (result > 0) {
          done = true;
          break;
        }
        if (result === 0) match(entry);
      }
      if (done || page.next === null) break;
      record({ kind: 'link', space: 'index', page: id, target: page.next });
      id = page.next;
    }
  }
  return {
    rows: found.map((id) => ({ ...tree.rows[id - 1] })).sort(diCompare),
    steps,
    indexPages: index.size,
    heapPages: heap.size,
    comparisons,
  };
}
export function diLeaves(tree: DiTree) {
  let id = tree.root;
  while (tree.pages[id].kind === 'inner') id = (tree.pages[id] as DiInner).children[0];
  const leaves: DiLeaf[] = [];
  const seen = new Set<number>();
  while (true) {
    if (seen.has(id)) throw new Error('leaf link cycle');
    seen.add(id);
    const page = tree.pages[id] as DiLeaf;
    leaves.push(page);
    if (page.next === null) return leaves;
    id = page.next;
  }
}
export function diParse(value: string) {
  return /^\d{1,2}$/.test(value.trim()) ? Number(value) : null;
}
export function diFilm() {
  const base = diBuild(diDataset());
  let tree = base;
  const additions: ReturnType<typeof diInsert>[] = [];
  // Deterministic insert sequence; retain all intermediate commits and split events.
  for (let i = 0; i < 100; i++) {
    const added = diInsert(tree, (i * 13 + 40) % 100);
    additions.push(added);
    tree = added.tree;
    if (added.changes.some((c) => c.kind === 'root')) break;
  }
  const leafIndex = additions.findIndex((a) => a.changes.some((c) => c.kind === 'leaf-split'));
  return { base, additions, leafIndex, grown: tree, point: 63, low: 38, high: 47 };
}
export type DiFilm = ReturnType<typeof diFilm>;
/** History-free reconstruction. Event cursor and snapshots are functions of chapter/progress only. */
export function diShot(film: DiFilm, chapter: number, progress: number) {
  const c = Math.max(0, Math.min(7, Number.isFinite(chapter) ? Math.floor(chapter) : 0));
  const p = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
  let tree = film.base;
  let query: DiQuery | null = null,
    change: DiChange | null = null;
  let added = 0;
  if (c === 5) {
    const a = film.additions[film.leafIndex];
    added = film.leafIndex + 1;
    if (p < 0.25 && film.leafIndex > 0) {
      const prep = Math.min(film.leafIndex - 1, Math.floor((p / 0.25) * film.leafIndex));
      change = film.additions[prep].changes[0];
      added = prep + 1;
    } else
      change =
        a.changes[
          Math.min(
            a.changes.length - 1,
            Math.floor(Math.max(0, (p - 0.25) / 0.75) * a.changes.length),
          )
        ];
    tree = change.tree;
  } else if (c === 6) {
    const events = film.additions
      .slice(film.leafIndex + 1)
      .flatMap((a, i) => a.changes.map((change) => ({ change, added: film.leafIndex + i + 2 })));
    const lastCount = film.additions.at(-1)!.changes.length;
    const preCount = events.length - lastCount;
    const eventIndex =
      p < 0.25 && preCount > 0
        ? Math.floor((p / 0.25) * preCount)
        : preCount +
          Math.min(lastCount - 1, Math.floor(Math.max(0, (p - 0.25) / 0.75) * lastCount));
    const current = events[eventIndex];
    if (current) {
      change = current.change;
      tree = change.tree;
      added = current.added;
    } else tree = film.grown;
  } else if (c === 7) {
    tree = film.grown;
    added = film.additions.length;
  }
  if (c === 0) query = diQuery(tree, film.point, film.point, 'scan');
  if (c === 1 || c === 2 || c === 3) query = diQuery(tree, film.point);
  if (c === 4) query = diQuery(tree, film.low, film.high);
  if (c === 7) query = diQuery(tree, 0, 99);
  const cursor = query
    ? Math.min(query.steps.length - 1, Math.floor(p * (c === 1 ? 5 : query.steps.length)))
    : 0;
  return { chapter: c, progress: p, tree, query, cursor, change, added };
}
