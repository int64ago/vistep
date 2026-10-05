/** Three deliberately tiny execution models for exactly the same ReLU(XW).
 * A step is an explanatory event, not a clock cycle, latency or benchmark.
 * The array is an output-stationary systolic example, not every NPU's design.
 */
export type ComputeMatrix = number[][];
export type ComputeEngine = 'cpu' | 'gpu' | 'npu';
export const COMPUTE_SIZE = 4;
export const COMPUTE_INPUT: ComputeMatrix = [
  [1, 2, 0, 1],
  [0, 1, 3, 1],
  [2, 0, 1, 2],
  [1, 1, 2, 0],
];
export const COMPUTE_WEIGHTS: ComputeMatrix = [
  [1, -1, 0, 1],
  [0, 1, -1, 0],
  [-1, 0, 1, -1],
  [1, -1, 0, 1],
];
export type ComputeOperation = {
  row: number;
  column: number;
  k: number;
  a: number;
  b: number;
  product: number;
  before: number;
  after: number;
};
export type ComputeFrame = {
  engine: ComputeEngine;
  step: number;
  kind: 'ready' | 'mac' | 'keep' | 'zero' | 'activate';
  sums: ComputeMatrix;
  output: (number | null)[][];
  operations: ComputeOperation[];
  /** Output identities dispatched in this instruction, including masked lanes. */
  lanes: { row: number; column: number; active: boolean }[];
  done: boolean;
};
const zeros = (): ComputeMatrix => Array.from({ length: 4 }, () => Array<number>(4).fill(0));
const empty = (): (number | null)[][] =>
  Array.from({ length: 4 }, () => Array<number | null>(4).fill(null));
const copy = <T>(m: T[][]): T[][] => m.map((r) => [...r]);
function validate(m: ComputeMatrix) {
  if (m.length !== 4 || m.some((r) => r.length !== 4 || r.some((v) => !Number.isFinite(v))))
    throw new RangeError('The teaching tile needs two finite 4×4 matrices.');
}
export function computeReference(input = COMPUTE_INPUT, weights = COMPUTE_WEIGHTS) {
  validate(input);
  validate(weights);
  const sums = input.map((r) =>
    weights[0].map((_, j) => r.reduce((sum, v, k) => sum + v * weights[k][j], 0)),
  );
  return { sums, output: sums.map((r) => r.map((v) => Math.max(0, v))) };
}
export function computeTrace(
  engine: ComputeEngine,
  input = COMPUTE_INPUT,
  weights = COMPUTE_WEIGHTS,
): ComputeFrame[] {
  validate(input);
  validate(weights);
  const sums = zeros(),
    output = empty();
  const trace: ComputeFrame[] = [
    {
      engine,
      step: 0,
      kind: 'ready',
      sums: copy(sums),
      output: copy(output),
      operations: [],
      lanes: [],
      done: false,
    },
  ];
  const mac = (row: number, column: number, k: number): ComputeOperation => {
    const before = sums[row][column],
      a = input[row][k],
      b = weights[k][column];
    sums[row][column] += a * b;
    return { row, column, k, a, b, product: a * b, before, after: sums[row][column] };
  };
  const save = (
    kind: ComputeFrame['kind'],
    operations: ComputeOperation[],
    lanes: ComputeFrame['lanes'],
  ) => {
    trace.push({
      engine,
      step: trace.length,
      kind,
      operations,
      lanes,
      sums: copy(sums),
      output: copy(output),
      done: output.every((r) => r.every((v) => v !== null)),
    });
  };
  if (engine === 'cpu') {
    for (let row = 0; row < 4; row++)
      for (let column = 0; column < 4; column++) {
        const lanes = [{ row, column, active: true }];
        for (let k = 0; k < 4; k++) save('mac', [mac(row, column, k)], lanes);
        output[row][column] = Math.max(0, sums[row][column]);
        save(sums[row][column] < 0 ? 'zero' : 'keep', [], lanes);
      }
  } else if (engine === 'gpu') {
    // Four displayed SIMT lanes are an illustration; NVIDIA's warp has 32.
    for (let row = 0; row < 4; row++) {
      const lanes = Array.from({ length: 4 }, (_, column) => ({ row, column, active: true }));
      for (let k = 0; k < 4; k++)
        save(
          'mac',
          lanes.map((p) => mac(p.row, p.column, k)),
          lanes,
        );
      for (const kind of ['keep', 'zero'] as const) {
        const mask = lanes.map((p) => ({
          ...p,
          active: kind === 'keep' ? sums[row][p.column] >= 0 : sums[row][p.column] < 0,
        }));
        if (!mask.some((p) => p.active)) continue;
        for (const p of mask)
          if (p.active) output[row][p.column] = Math.max(0, sums[row][p.column]);
        save(kind, [], mask);
      }
    }
  } else {
    // Skew both input streams: X[i,k] reaches PE[i,j] at tick i+j+k;
    // W[k,j] reaches the same PE on exactly that tick. Each MAC is visited once.
    for (let tick = 0; tick <= 9; tick++) {
      const operations: ComputeOperation[] = [];
      for (let row = 0; row < 4; row++)
        for (let column = 0; column < 4; column++) {
          const k = tick - row - column;
          if (k >= 0 && k < 4) operations.push(mac(row, column, k));
        }
      save(
        'mac',
        operations,
        operations.map(({ row, column }) => ({ row, column, active: true })),
      );
    }
    // A supported elementwise activation follows the tile; it is not another MAC.
    for (let row = 0; row < 4; row++)
      for (let column = 0; column < 4; column++)
        output[row][column] = Math.max(0, sums[row][column]);
    save(
      'activate',
      [],
      Array.from({ length: 16 }, (_, i) => ({
        row: Math.floor(i / 4),
        column: i % 4,
        active: true,
      })),
    );
  }
  return trace;
}
export function computeFrame(trace: ComputeFrame[], step: number): ComputeFrame {
  return trace[
    Math.max(0, Math.min(trace.length - 1, Math.floor(Number.isFinite(step) ? step : 0)))
  ];
}
const clamp = (v: number) => Math.min(1, Math.max(0, Number.isFinite(v) ? v : 0));
const move = (progress: number, start: number, end: number, low: number, high: number) =>
  low + (high - low) * clamp((progress - start) / (end - start));
export type ComputeShot = {
  view: 'problem' | ComputeEngine | 'flow' | 'compare';
  step: number;
  selected: [number, number];
};
export function computeShot(
  chapter: number,
  progress: number,
  traces: Record<ComputeEngine, ComputeFrame[]>,
): ComputeShot {
  const p = clamp(progress),
    last = (engine: ComputeEngine) => traces[engine].length - 1;
  if (chapter === 0) return { view: 'problem', step: 0, selected: [0, 0] };
  if (chapter === 1)
    return {
      view: 'cpu',
      step: p < 0.5 ? move(p, 0.08, 0.4, 0, 5) : move(p, 0.5, 0.9, 5, last('cpu')),
      selected: [0, 0],
    };
  if (chapter === 2)
    return { view: 'gpu', step: move(p, 0.08, 0.88, 0, last('gpu')), selected: [0, 0] };
  if (chapter === 3)
    return { view: 'gpu', step: p < 0.35 ? 4 : p < 0.68 ? 5 : 6, selected: [0, 2] };
  if (chapter === 4)
    return { view: 'npu', step: move(p, 0.08, 0.88, 0, last('npu')), selected: [1, 1] };
  if (chapter === 5) return { view: 'flow', step: move(p, 0.08, 0.88, 0, 3), selected: [1, 1] };
  return { view: 'compare', step: last('npu'), selected: [0, 0] };
}

/** Coordinates are shared by the renderer and cover, and maintain connected buses. */
export const computeArrayCell = (row: number, column: number, pitch = 96) => ({
  x: 60 + column * pitch,
  y: 60 + row * pitch,
});
export function computeStreamTick(step: number, row: number, column: number) {
  return step - 1 - row - column;
}
