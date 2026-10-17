export const CONV_PULSE = [0, 0, 1, 2, 1, 0, 0];
export const CONV_KERNEL = [1, 0.5, 0.25];
export type ConvMode = 'full' | 'causal-same' | 'circular';
const validate = (x: readonly number[], h: readonly number[]) => {
  if (
    x.length > 64 ||
    h.length > 16 ||
    [...x, ...h].some((v) => !Number.isFinite(v) || Math.abs(v) > 1e6)
  )
    throw new RangeError('Finite bounded signals required');
};
export function convolutionTerms(
  x: readonly number[],
  h: readonly number[],
  n: number,
  circular = false,
) {
  validate(x, h);
  if (!x.length || !h.length || !Number.isInteger(n) || Math.abs(n) > 128)
    throw new RangeError('Invalid output index');
  const terms = h.map((weight, k) => {
    const raw = n - k,
      index = circular
        ? ((raw % x.length) + x.length) % x.length
        : raw >= 0 && raw < x.length
          ? raw
          : null,
      value = index === null ? 0 : x[index];
    return { k, index, raw, value, weight, product: value * weight };
  });
  return { terms, sum: terms.reduce((sum, t) => sum + t.product, 0) };
}
export function discreteConvolution(
  x: readonly number[],
  h: readonly number[],
  mode: ConvMode = 'full',
) {
  validate(x, h);
  if (!['full', 'causal-same', 'circular'].includes(mode))
    throw new RangeError('Invalid convolution mode');
  if (!x.length || !h.length) return [];
  const count = mode === 'full' ? x.length + h.length - 1 : x.length;
  return Array.from(
    { length: count },
    (_, n) => convolutionTerms(x, h, n, mode === 'circular').sum,
  );
}
/** Real-valued forward-looking correlation, explicitly restricted to n=0..N−1. */
export function correlationWindow(x: readonly number[], h: readonly number[]) {
  validate(x, h);
  return x.map((_, n) => h.reduce((sum, weight, k) => sum + weight * (x[n + k] ?? 0), 0));
}
export function convolutionInput(pattern: 'pulse' | 'impulse' | 'edge') {
  return pattern === 'pulse'
    ? [...CONV_PULSE]
    : Array.from({ length: 7 }, (_, i) => (i === (pattern === 'edge' ? 6 : 2) ? 1 : 0));
}
