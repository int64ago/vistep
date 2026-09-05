export const frequencyOrder = Array.from({ length: 64 }, (_, i) => i).sort(
  (a, b) => (a % 8) + Math.floor(a / 8) - ((b % 8) + Math.floor(b / 8)) || a - b,
);

export const quantTable = [
  16, 11, 10, 16, 24, 40, 51, 61, 12, 12, 14, 19, 26, 58, 60, 55, 14, 13, 16, 24, 40, 57, 69, 56,
  14, 17, 22, 29, 51, 87, 80, 62, 18, 22, 37, 56, 68, 109, 103, 77, 24, 35, 55, 64, 81, 104, 113,
  92, 49, 64, 78, 87, 103, 121, 120, 101, 72, 92, 95, 98, 112, 100, 103, 99,
];
const C = (n: number) => (n === 0 ? 1 / Math.sqrt(2) : 1);
export function dct(block: number[]) {
  return Array.from({ length: 64 }, (_, i) => {
    const u = i % 8,
      v = Math.floor(i / 8);
    let sum = 0;
    for (let y = 0; y < 8; y++)
      for (let x = 0; x < 8; x++)
        sum +=
          (block[y * 8 + x] - 128) *
          Math.cos(((2 * x + 1) * u * Math.PI) / 16) *
          Math.cos(((2 * y + 1) * v * Math.PI) / 16);
    return 0.25 * C(u) * C(v) * sum;
  });
}
export function idct(coeff: number[]) {
  return Array.from({ length: 64 }, (_, i) => {
    const x = i % 8,
      y = Math.floor(i / 8);
    let sum = 0;
    for (let v = 0; v < 8; v++)
      for (let u = 0; u < 8; u++)
        sum +=
          C(u) *
          C(v) *
          coeff[v * 8 + u] *
          Math.cos(((2 * x + 1) * u * Math.PI) / 16) *
          Math.cos(((2 * y + 1) * v * Math.PI) / 16);
    return 128 + sum * 0.25;
  });
}
export function compressBlock(block: number[], quality: number, keep = 64) {
  const coefficients = dct(block),
    scale = quality < 50 ? 5000 / Math.max(1, quality) : 200 - 2 * quality;
  const table = quantTable.map((n) => Math.max(1, Math.floor((n * scale + 50) / 100)));
  const allowed = new Set(frequencyOrder.slice(0, keep));
  const quantized = coefficients.map((n, i) => (allowed.has(i) ? Math.round(n / table[i]) : 0));
  const reconstructed = idct(quantized.map((n, i) => n * table[i])).map((n) =>
    Math.max(0, Math.min(255, Math.round(n))),
  );
  return {
    coefficients,
    quantized,
    reconstructed,
    table,
    mse: reconstructed.reduce((s, n, i) => s + (n - block[i]) ** 2, 0) / 64,
    nonzero: quantized.filter(Boolean).length,
  };
}
export function sampleBlock(pattern: string) {
  return Array.from({ length: 64 }, (_, i) => {
    const x = i % 8,
      y = Math.floor(i / 8);
    if (pattern === 'edge') return x > y ? 222 : 42;
    if (pattern === 'texture') return Math.round(128 + 68 * Math.cos(x * 2.4) * Math.sin(y * 1.9));
    return Math.round(48 + x * 18 + y * 9 + 13 * Math.cos(y * 0.8));
  });
}
