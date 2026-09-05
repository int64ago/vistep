export type Point = number[];
export const distance = (a: Point, b: Point) =>
  Math.sqrt(a.reduce((sum, v, i) => sum + (v - b[i]) ** 2, 0));
function solveLinear(a: number[][], b: number[]) {
  const n = b.length;
  const m = a.map((r, i) => [...r, b[i]]);
  for (let k = 0; k < n; k++) {
    let pivot = k;
    for (let i = k + 1; i < n; i++) if (Math.abs(m[i][k]) > Math.abs(m[pivot][k])) pivot = i;
    if (Math.abs(m[pivot][k]) < 1e-9) return null;
    [m[k], m[pivot]] = [m[pivot], m[k]];
    const s = m[k][k];
    for (let j = k; j <= n; j++) m[k][j] /= s;
    for (let i = 0; i < n; i++)
      if (i !== k) {
        const f = m[i][k];
        for (let j = k; j <= n; j++) m[i][j] -= f * m[k][j];
      }
  }
  return m.map((row) => row[n]);
}
/** Local pseudorange least-squares; the clock unknown is expressed in distance units. */
export function locate(
  satellites: Point[],
  ranges: number[],
  dimensions: number,
  solveClock: boolean,
  initial?: Point,
) {
  const n = dimensions + (solveClock ? 1 : 0);
  if (satellites.length < n) return null;
  const state = initial
    ? [...initial.slice(0, dimensions), ...(solveClock ? [0] : [])]
    : Array(n).fill(0);
  for (let iter = 0; iter < 40; iter++) {
    const j = satellites.map((s) => {
      const d = Math.max(distance(state.slice(0, dimensions), s), 0.001);
      return [...s.map((v, k) => (state[k] - v) / d), ...(solveClock ? [1] : [])];
    });
    const residual = satellites.map(
      (s, i) =>
        ranges[i] - distance(state.slice(0, dimensions), s) - (solveClock ? state[dimensions] : 0),
    );
    const a = Array.from({ length: n }, (_, x) =>
      Array.from({ length: n }, (_, y) => j.reduce((v, row) => v + row[x] * row[y], 0)),
    );
    const b = Array.from({ length: n }, (_, x) =>
      j.reduce((v, row, i) => v + row[x] * residual[i], 0),
    );
    const delta = solveLinear(a, b);
    if (!delta) return null;
    for (let k = 0; k < n; k++) state[k] += delta[k];
    if (Math.sqrt(delta.reduce((s, v) => s + v * v, 0)) < 1e-6) break;
    if (state.some((v) => !Number.isFinite(v) || Math.abs(v) > 1e7)) return null;
  }
  return {
    position: state.slice(0, dimensions),
    clock: solveClock ? state[dimensions] : 0,
    residual: Math.sqrt(
      satellites.reduce(
        (sum, s, i) =>
          sum +
          (distance(state.slice(0, dimensions), s) +
            (solveClock ? state[dimensions] : 0) -
            ranges[i]) **
            2,
        0,
      ) / satellites.length,
    ),
  };
}
