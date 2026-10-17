export type UfState = { parent: number[]; size: number[]; count: number };
export type UfFrame = {
  state: UfState;
  path: number[];
  changed: number | null;
  phase: 'follow' | 'compress';
};
export const ufCreate = (n: number): UfState => {
  if (!Number.isInteger(n) || n < 1 || n > 64) throw new RangeError('Invalid set size');
  return { parent: Array.from({ length: n }, (_, i) => i), size: Array(n).fill(1), count: n };
};
const copy = (s: UfState): UfState => ({
  parent: [...s.parent],
  size: [...s.size],
  count: s.count,
});
function validate(s: UfState) {
  const n = s.parent.length;
  if (
    !n ||
    n > 64 ||
    s.size.length !== n ||
    !Number.isInteger(s.count) ||
    s.parent.some((x) => !Number.isInteger(x) || x < 0 || x >= n)
  )
    throw new RangeError('Invalid forest');
  let roots = 0;
  const actual = Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    let p = i,
      steps = 0;
    while (s.parent[p] !== p) {
      p = s.parent[p];
      if (++steps >= n) throw new RangeError('Cyclic parent forest');
    }
    actual[p]++;
  }
  for (let i = 0; i < n; i++)
    if (s.parent[i] === i) {
      roots++;
      if (s.size[i] !== actual[i]) throw new RangeError('Invalid root size');
    }
  if (roots !== s.count) throw new RangeError('Invalid component count');
}
export function ufFind(input: UfState, node: number, compress = true) {
  validate(input);
  if (!Number.isInteger(node) || node < 0 || node >= input.parent.length)
    throw new RangeError('Invalid node');
  const state = copy(input),
    path = [node],
    frames: UfFrame[] = [{ state: copy(state), path: [node], changed: null, phase: 'follow' }];
  let root = node;
  while (state.parent[root] !== root) {
    root = state.parent[root];
    path.push(root);
    frames.push({ state: copy(state), path: [...path], changed: null, phase: 'follow' });
  }
  if (compress)
    for (const p of path.slice(0, -1))
      if (state.parent[p] !== root) {
        state.parent[p] = root;
        frames.push({ state: copy(state), path: [...path], changed: p, phase: 'compress' });
      }
  return { state, root, path, frames };
}
export function ufUnion(input: UfState, a: number, b: number) {
  const left = ufFind(input, a, false),
    right = ufFind(input, b, false),
    state = copy(input);
  let small = left.root,
    large = right.root;
  if (small === large)
    return { state, changed: false, small, large, paths: [left.path, right.path] };
  if (
    state.size[small] > state.size[large] ||
    (state.size[small] === state.size[large] && small < large)
  )
    [small, large] = [large, small];
  state.parent[small] = large;
  state.size[large] += state.size[small];
  state.count--;
  return { state, changed: true, small, large, paths: [left.path, right.path] };
}
export const UF_PAIRS: [[number, number], ...[number, number][]] = [
  [0, 1],
  [2, 3],
  [4, 5],
  [6, 7],
  [0, 2],
  [4, 6],
  [0, 4],
];
export function ufLesson() {
  const states = [ufCreate(8)];
  for (const [a, b] of UF_PAIRS) states.push(ufUnion(states[states.length - 1], a, b).state);
  const find = ufFind(states[7], 7);
  return { states, find, redundant: ufUnion(find.state, 1, 7) };
}
/** Forest positions come from parent links; siblings share leaf-space, roots share the same baseline. */
export function ufLayout(state: UfState) {
  validate(state);
  const children = state.parent.map(() => [] as number[]);
  const roots: number[] = [];
  state.parent.forEach((p, i) => (p === i ? roots.push(i) : children[p].push(i)));
  const points = state.parent.map(() => ({ x: 0, y: 0 }));
  let cursor = 0;
  const place = (i: number, depth: number): number => {
    let x: number;
    if (!children[i].length) x = cursor++ + 0.5;
    else {
      const xs = children[i].map((c) => place(c, depth + 1));
      x = (xs[0] + xs[xs.length - 1]) / 2;
    }
    points[i] = { x, y: 30 + depth * 65 };
    return x;
  };
  roots.forEach((r) => place(r, 0));
  return points.map((p) => ({ ...p, x: (p.x * 360) / cursor }));
}
