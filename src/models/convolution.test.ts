import { describe, expect, it } from 'vitest';
import {
  CONV_KERNEL,
  CONV_PULSE,
  convolutionInput,
  convolutionTerms,
  correlationWindow,
  discreteConvolution,
} from './convolution';
describe('causal discrete convolution and boundary conditions', () => {
  it('reproduces the actual impulse response and explicit multiply-add sum', () => {
    expect(discreteConvolution(convolutionInput('impulse'), CONV_KERNEL)).toEqual([
      0, 0, 1, 0.5, 0.25, 0, 0, 0, 0,
    ]);
    expect(discreteConvolution(CONV_PULSE, CONV_KERNEL)).toEqual([
      0, 0, 1, 2.5, 2.25, 1, 0.25, 0, 0,
    ]);
    expect(convolutionTerms(CONV_PULSE, CONV_KERNEL, 3).terms.map((t) => t.product)).toEqual([
      2, 0.5, 0,
    ]);
    expect(convolutionTerms(CONV_PULSE, CONV_KERNEL, 3).sum).toBe(2.5);
  });
  it('matches independent polynomial coefficient multiplication across eighty signed cases', () => {
    for (let seed = 0; seed < 80; seed++) {
      const x = Array.from({ length: 1 + (seed % 16) }, (_, i) => ((i * 7 + seed) % 9) - 4),
        h = Array.from({ length: 1 + (seed % 5) }, (_, i) => ((i * 3 + seed) % 5) - 2),
        reference = Array(x.length + h.length - 1).fill(0);
      x.forEach((v, i) => h.forEach((w, k) => (reference[i + k] += v * w)));
      expect(discreteConvolution(x, h)).toEqual(reference);
      const folded = Array(x.length).fill(0);
      reference.forEach((v, n) => (folded[n % x.length] += v));
      expect(discreteConvolution(x, h, 'circular')).toEqual(folded);
      expect(discreteConvolution(x, h, 'causal-same')).toEqual(reference.slice(0, x.length));
    }
  });
  it('distinguishes asymmetric correlation and shows discarded tails versus wrapped tails', () => {
    expect(discreteConvolution(CONV_PULSE, CONV_KERNEL)[2]).toBe(1);
    expect(correlationWindow(CONV_PULSE, CONV_KERNEL)[2]).toBe(2.25);
    const edge = convolutionInput('edge');
    expect(discreteConvolution(edge, CONV_KERNEL)).toEqual([0, 0, 0, 0, 0, 0, 1, 0.5, 0.25]);
    expect(discreteConvolution(edge, CONV_KERNEL, 'causal-same')).toEqual([0, 0, 0, 0, 0, 0, 1]);
    expect(discreteConvolution(edge, CONV_KERNEL, 'circular')).toEqual([0.5, 0.25, 0, 0, 0, 0, 1]);
  });
  it('is linear, preserves declared zero padding, handles empty signals and rejects invalid values', () => {
    const x = [1, -1, 2],
      z = [3, 0, -2],
      h = [1, 0.5];
    const sum = discreteConvolution(
        x.map((v, i) => 2 * v + z[i]),
        h,
      ),
      a = discreteConvolution(x, h),
      b = discreteConvolution(z, h);
    expect(sum).toEqual(a.map((v, i) => 2 * v + b[i]));
    expect(convolutionTerms([1], [1, 2], 0).terms[1]).toMatchObject({ index: null, value: 0 });
    expect(discreteConvolution([], h)).toEqual([]);
    expect(() => discreteConvolution([NaN], h)).toThrow();
    expect(() => convolutionTerms(x, h, 0.5)).toThrow();
  });
});
