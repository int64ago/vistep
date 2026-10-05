import { describe, expect, it } from 'vitest';
import {
  COMPUTE_INPUT,
  COMPUTE_WEIGHTS,
  computeFrame,
  computeReference,
  computeShot,
  computeStreamTick,
  computeTrace,
} from './cpu-gpu-npu';
describe('one task, three teaching dataflows', () => {
  it('reconstructs all 16 outputs, not just a checksum, from each scheduler', () => {
    const expected = [
      [2, 0, 0, 2],
      [0, 0, 2, 0],
      [3, 0, 1, 3],
      [0, 0, 1, 0],
    ];
    expect(computeReference().output).toEqual(expected);
    for (const engine of ['cpu', 'gpu', 'npu'] as const) {
      const trace = computeTrace(engine);
      expect(trace.at(-1)!.output).toEqual(expected);
      expect(trace.at(-1)!.sums).toEqual(computeReference().sums);
      expect(trace.at(-1)!.done).toBe(true);
      expect(trace.slice(0, -1).every((frame) => !frame.done)).toBe(true);
    }
  });
  it('uses every product exactly once and preserves its data identity', () => {
    for (const engine of ['cpu', 'gpu', 'npu'] as const) {
      const operations = computeTrace(engine).flatMap((f) => f.operations);
      expect(operations).toHaveLength(64);
      expect(new Set(operations.map((o) => `${o.row}/${o.column}/${o.k}`)).size).toBe(64);
      for (const o of operations) {
        expect(o.a).toBe(COMPUTE_INPUT[o.row][o.k]);
        expect(o.b).toBe(COMPUTE_WEIGHTS[o.k][o.column]);
        expect(o.after).toBe(o.before + o.a * o.b);
      }
    }
  });
  it('masks divergent lanes without losing negative and zero results', () => {
    const trace = computeTrace('gpu');
    expect(trace[5].kind).toBe('keep');
    expect(trace[5].lanes.map((p) => p.active)).toEqual([true, true, false, true]);
    expect(trace[5].output[0]).toEqual([2, 0, null, 2]);
    expect(trace[6].lanes.map((p) => p.active)).toEqual([false, false, true, false]);
    expect(trace[6].output[0]).toEqual([2, 0, 0, 2]);
  });
  it('matches independent multiplication for zero, negative, identity and fractional tiles', () => {
    const inputs = [
      COMPUTE_INPUT.map((r) => r.map(() => 0)),
      COMPUTE_INPUT.map((r) => r.map((v) => -v)),
      COMPUTE_INPUT.map((r) => r.map((v) => v / 4)),
    ];
    const weights = [
      COMPUTE_WEIGHTS,
      Array.from({ length: 4 }, (_, i) => Array.from({ length: 4 }, (_, j) => Number(i === j))),
      COMPUTE_WEIGHTS.map((r) => r.map((v) => -v)),
    ];
    for (const x of inputs)
      for (const w of weights)
        for (const engine of ['cpu', 'gpu', 'npu'] as const)
          expect(computeTrace(engine, x, w).at(-1)!.output).toEqual(
            x.map((r) =>
              w[0].map((_, j) =>
                Math.max(
                  0,
                  r.map((v, k) => v * w[k][j]).reduce((a, b) => a + b, 0),
                ),
              ),
            ),
          );
  });
  it('skews the two array streams to the same k at every crossing', () => {
    for (const f of computeTrace('npu'))
      for (const o of f.operations) {
        expect(computeStreamTick(f.step, o.row, o.column)).toBe(o.k);
        expect(f.step - 1).toBe(o.row + o.column + o.k);
      }
    expect(computeTrace('npu').at(-1)!.step).toBe(11);
  });
  it('seeking is a pure lookup and cannot mutate earlier frames or inputs', () => {
    const traces = { cpu: computeTrace('cpu'), gpu: computeTrace('gpu'), npu: computeTrace('npu') };
    const initial = JSON.stringify(traces);
    expect(computeShot(3, 0.2, traces)).toMatchObject({ view: 'gpu', step: 4, selected: [0, 2] });
    expect(computeShot(3, 0.5, traces)).toMatchObject({ view: 'gpu', step: 5, selected: [0, 2] });
    expect(computeShot(3, 0.9, traces)).toMatchObject({ view: 'gpu', step: 6, selected: [0, 2] });
    const seekEnd = computeFrame(traces.npu, computeShot(4, 1, traces).step);
    computeFrame(traces.cpu, computeShot(1, 0.3, traces).step);
    expect(computeFrame(traces.npu, computeShot(4, 1, traces).step)).toEqual(seekEnd);
    expect(JSON.stringify(traces)).toBe(initial);
    expect(computeFrame(traces.cpu, -1).step).toBe(0);
    expect(computeFrame(traces.cpu, Infinity).step).toBe(0);
    expect(computeFrame(traces.cpu, 999).done).toBe(true);
  });
  it('rejects dimensions and nonfinite inputs before rendering misleading arithmetic', () => {
    expect(() => computeTrace('cpu', [[1]])).toThrow(RangeError);
    expect(() =>
      computeTrace(
        'npu',
        COMPUTE_INPUT.map((r) => r.map(() => NaN)),
      ),
    ).toThrow(RangeError);
  });
});
