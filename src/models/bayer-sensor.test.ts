import { describe, it, expect } from 'vitest';
import {
  bayerChannel,
  bayerRaw,
  bayerNeighbors,
  demosaicPixel,
  BAYER_DEFAULT,
  BAYER_SIZE,
} from './bayer-sensor';
describe('RGGB sampling and bilinear interpolation', () => {
  it('has one red, two green and one blue site', () =>
    expect([
      bayerChannel(0, 0),
      bayerChannel(1, 0),
      bayerChannel(0, 1),
      bayerChannel(1, 1),
    ]).toEqual([0, 1, 1, 2]));
  it('preserves every measured value and reconstructs constant color at boundaries', () => {
    const n = BAYER_SIZE,
      raw = bayerRaw(BAYER_DEFAULT);
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++)
        expect(demosaicPixel(raw, x, y)[bayerChannel(x, y)]).toBe(raw[y * n + x]);
    const rgb = [0.2, 0.4, 0.7],
      constant = Array.from(
        { length: n * n },
        (_, i) => rgb[bayerChannel(i % n, Math.floor(i / n))],
      );
    for (const x of [0, 1, n - 2, n - 1])
      for (const y of [0, 1, n - 2, n - 1])
        demosaicPixel(constant, x, y).forEach((v, i) => expect(v).toBeCloseTo(rgb[i], 12));
  });
  it('uses cardinal green and diagonal blue around a red site', () => {
    expect(bayerNeighbors(8, 10, 1)).toHaveLength(4);
    expect(bayerNeighbors(8, 10, 2)).toEqual([
      { x: 7, y: 9 },
      { x: 9, y: 9 },
      { x: 7, y: 11 },
      { x: 9, y: 11 },
    ]);
    expect(() => bayerRaw({ ...BAYER_DEFAULT, frequency: NaN })).toThrow();
  });
});
