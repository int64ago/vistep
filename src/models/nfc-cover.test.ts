import { describe, expect, it } from 'vitest';
import { nfcArtwork, nfcCover } from './nfc-cover';

describe('NFC cover and fallback composition', () => {
  it('keeps every actual projected path inside catalog and social artwork frames', () => {
    const cover = nfcCover();
    for (const part of cover.paths) {
      const numbers = part.d.match(/-?\d+(?:\.\d+)?/g)!.map(Number);
      for (let i = 0; i < numbers.length; i += 2) {
        expect(numbers[i]).toBeGreaterThan(12);
        expect(numbers[i]).toBeLessThan(388);
        expect(numbers[i + 1]).toBeGreaterThan(10);
        expect(numbers[i + 1]).toBeLessThan(220);
      }
    }
    expect(cover.paths.filter((p) => p.part.endsWith('-spiral'))).toHaveLength(2);
    expect(cover.paths.filter((p) => p.part.endsWith('-outer'))).toHaveLength(2);
  });
  it('preserves connections and fits the complete narrow fallback throughout the input range', () => {
    const cover = nfcCover();
    for (const gapMm of [4, 8, 60])
      for (const tiltDeg of [0, 35, 80]) {
        const flat = nfcArtwork(300, 330, { ...cover.visual, gapMm, tiltDeg });
        expect(flat.paths.map((p) => p.part)).toEqual(cover.paths.map((p) => p.part));
        for (const part of flat.paths) {
          const numbers = part.d.match(/-?\d+(?:\.\d+)?/g)!.map(Number);
          for (let i = 0; i < numbers.length; i += 2) {
            expect(numbers[i]).toBeGreaterThan(4);
            expect(numbers[i]).toBeLessThan(296);
            expect(numbers[i + 1]).toBeGreaterThan(4);
            expect(numbers[i + 1]).toBeLessThan(326);
          }
        }
      }
  });

  it('fits the local flux marker in an actual 254×215 detail frame', () => {
    const visual = { ...nfcCover().visual, gapMm: 8, tiltDeg: 0, closeup: 1 };
    for (const fluxNormalized of [-1, -0.2, 0, 0.2, 1]) {
      const art = nfcArtwork(254, 215, { ...visual, fluxNormalized });
      expect(art.paths.some((p) => p.part === 'local-flux-tip')).toBe(fluxNormalized !== 0);
      for (const part of art.paths) {
        const values = part.d.match(/-?\d+(?:\.\d+)?/g)!.map(Number);
        for (let i = 0; i < values.length; i += 2) {
          expect(values[i]).toBeGreaterThan(4);
          expect(values[i]).toBeLessThan(250);
          expect(values[i + 1]).toBeGreaterThan(4);
          expect(values[i + 1]).toBeLessThan(211);
        }
      }
    }
  });
});
