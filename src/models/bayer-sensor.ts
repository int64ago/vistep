export type RGB = [number, number, number];
export type BayerInput = { frequency: number; shift: number; stripes: boolean };
export const BAYER_DEFAULT: BayerInput = { frequency: 2, shift: 0, stripes: false };
export const BAYER_SIZE = 24;
export function bayerChannel(x: number, y: number): 0 | 1 | 2 {
  return y % 2 === 0 ? (x % 2 === 0 ? 0 : 1) : x % 2 === 0 ? 1 : 2;
}
export function bayerSource(x: number, y: number, s: BayerInput): RGB {
  if (![x, y, s.frequency, s.shift].every(Number.isFinite) || s.frequency < 0 || s.frequency > 12)
    throw new RangeError('Finite bounded Bayer input required');
  if (s.stripes) {
    const a = 0.5 + 0.45 * Math.cos(2 * Math.PI * s.frequency * (x + s.shift / BAYER_SIZE));
    return [a, a, a];
  }
  const dx = x - 0.38,
    dy = y - 0.44;
  if (dx * dx + dy * dy < 0.085) return [0.85, 0.16 + 0.28 * y, 0.12];
  if (x > 0.58 && y > 0.25 && y < 0.82) return [0.08, 0.4 + 0.4 * y, 0.72];
  return [0.08 + 0.2 * x, 0.12 + 0.3 * y, 0.22 + 0.17 * x];
}
export function bayerRaw(s: BayerInput, n = BAYER_SIZE) {
  if (!Number.isInteger(n) || n < 4 || n > 64)
    throw new RangeError('Bayer grid outside teaching range');
  return Array.from({ length: n * n }, (_, i) => {
    const x = i % n,
      y = Math.floor(i / n);
    return bayerSource((x + 0.5) / n, (y + 0.5) / n, s)[bayerChannel(x, y)];
  });
}
export function bayerNeighbors(x: number, y: number, channel: number, n = BAYER_SIZE) {
  if (
    channel < 0 ||
    channel > 2 ||
    !Number.isInteger(channel) ||
    x < 0 ||
    y < 0 ||
    x >= n ||
    y >= n
  )
    throw new RangeError('Invalid Bayer pixel');
  if (bayerChannel(x, y) === channel) return [{ x, y }];
  const near = [];
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      const xx = x + dx,
        yy = y + dy;
      if (xx >= 0 && yy >= 0 && xx < n && yy < n && bayerChannel(xx, yy) === channel)
        near.push({ x: xx, y: yy, d: dx * dx + dy * dy });
    }
  const min = Math.min(...near.map((p) => p.d));
  return near.filter((p) => p.d === min).map(({ x, y }) => ({ x, y }));
}
export function demosaicPixel(raw: number[], x: number, y: number, n = BAYER_SIZE): RGB {
  if (raw.length !== n * n) throw new RangeError('Raw dimensions mismatch');
  return [0, 1, 2].map((c) => {
    const near = bayerNeighbors(x, y, c, n);
    return near.reduce((v, p) => v + raw[p.y * n + p.x], 0) / near.length;
  }) as RGB;
}
export function bayerCss(rgb: RGB) {
  return `rgb(${rgb.map((v) => Math.round(255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.max(0, Math.min(1, v)) ** (1 / 2.4) - 0.055))).join(' ')})`;
}
export function bayerShot(chapter: number, progress: number) {
  const c = Math.max(0, Math.min(7, Math.floor(chapter))),
    p = Math.max(0, Math.min(1, progress)),
    e = p * p * (3 - 2 * p),
    input = { ...BAYER_DEFAULT };
  if (c === 6) {
    input.stripes = true;
    input.frequency = 1 + 6 * e;
  }
  if (c === 7) {
    input.stripes = true;
    input.frequency = 7;
    input.shift = e;
  }
  return { input, view: c, reveal: e };
}
