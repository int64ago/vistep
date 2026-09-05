import { describe, expect, it } from 'vitest';
import {
  EC_G,
  EC_GROUPS,
  EC_WEAVE_NODES,
  EC_WEAVE_LOOPS,
  EC_WEAVE_RADIUS,
  EC_H,
  EC_DATA_POSITIONS,
  ecCase,
  ecData,
  ecDecode,
  ecDistance,
  ecEncode,
  ecFlip,
  ecShot,
  type EcBit,
  type EcMode,
} from './error-correction';

// An independent codebook: enumerate ALL 128 words; retain those satisfying
// three explicitly written even-parity equations. No production matrix/encoder.
function referenceBook(extended: boolean) {
  const words: EcBit[][] = [];
  for (let n = 0; n < 128; n++) {
    const w = Array.from({ length: 7 }, (_, i) => ((n >> i) & 1) as EcBit);
    if (
      (w[0] + w[2] + w[4] + w[6]) % 2 ||
      (w[1] + w[2] + w[5] + w[6]) % 2 ||
      (w[3] + w[4] + w[5] + w[6]) % 2
    )
      continue;
    words.push(extended ? [...w, (w.reduce<number>((a, b) => a + b, 0) % 2) as EcBit] : w);
  }
  return words;
}
const mismatch = (a: readonly number[], b: readonly number[]) =>
  a.filter((v, i) => v !== b[i]).length;
const bookWord = (n: number, extended: boolean) =>
  referenceBook(extended).find((w) => parseInt([w[2], w[4], w[5], w[6]].join(''), 2) === n)!;
const combinations = (n: number) =>
  Array.from({ length: n }, (_, i) =>
    Array.from({ length: n - i - 1 }, (_, j) => [i + 1, i + j + 2]),
  ).flat();

describe('Hamming parity weave', () => {
  it('places every visible bit in exactly its mathematical parity regions', () => {
    for (const [i, [x, y]] of EC_WEAVE_NODES.entries()) {
      EC_WEAVE_LOOPS.forEach(([cx, cy], j) => {
        const distance = Math.hypot(x - cx, y - cy);
        expect(distance < EC_WEAVE_RADIUS).toBe(
          (EC_GROUPS[j] as readonly number[]).includes(i + 1),
        );
        // A node's bit glyph (radius 10) stays on the same side of every boundary.
        expect(Math.abs(distance - EC_WEAVE_RADIUS)).toBeGreaterThan(10);
      });
    }
  });
  it('has systematic data columns and orthogonal generator/check matrices', () => {
    expect(EC_DATA_POSITIONS.map((p) => EC_G.map((r) => r[p - 1]))).toEqual([
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ]);
    for (const g of EC_G)
      for (const h of EC_H) expect(g.reduce<number>((s, v, i) => s + v * h[i], 0) % 2).toBe(0);
  });
  it('encodes all 16 messages identically to independently enumerated valid codewords', () => {
    for (const mode of ['hamming', 'extended'] as EcMode[])
      for (let n = 0; n < 16; n++) {
        const word = ecEncode(ecData(n), mode);
        expect(word).toEqual(bookWord(n, mode === 'extended'));
        expect(ecDecode(word, mode).payload).toEqual(ecData(n));
        expect(ecDecode(word, mode).status).toBe('accepted');
      }
    expect(ecEncode(ecData(11))).toEqual([0, 1, 1, 0, 0, 1, 1]);
  });
  it('corrects every single position for every message, including every parity bit', () => {
    for (const mode of ['hamming', 'extended'] as EcMode[])
      for (let n = 0; n < 16; n++)
        for (let p = 1; p <= (mode === 'extended' ? 8 : 7); p++) {
          const sample = ecCase(n, mode, [p]);
          expect(sample.decoded.correction).toBe(p);
          expect(sample.decoded.corrected).toEqual(bookWord(n, mode === 'extended'));
          expect(sample.recovered).toBe(true);
          const candidates = referenceBook(mode === 'extended').filter(
            (w) => mismatch(w, sample.received) <= 1,
          );
          expect(candidates).toEqual([sample.encoded]);
        }
  });
  it('plain Hamming aliases all 16 × 21 double errors to a different single-error candidate', () => {
    for (let n = 0; n < 16; n++)
      for (const [a, b] of combinations(7)) {
        const s = ecCase(n, 'hamming', [a, b]);
        expect(s.decoded.syndrome).toBe(a ^ b);
        expect(s.decoded.correction).not.toBe(a);
        expect(s.decoded.correction).not.toBe(b);
        expect(s.recovered).toBe(false);
        expect(ecDecode(s.decoded.corrected!).syndrome).toBe(0);
        expect(referenceBook(false).filter((w) => mismatch(w, s.received) === 1)).toEqual([
          s.decoded.corrected,
        ]);
      }
  });
  it('extended Hamming detects all 16 × 28 pairs and never invents a corrected payload', () => {
    for (let n = 0; n < 16; n++)
      for (const pair of combinations(8)) {
        const s = ecCase(n, 'extended', pair);
        expect(s.decoded.status).toBe('detected');
        expect(s.decoded.overall).toBe(0);
        expect(s.decoded.syndrome).not.toBe(0);
        expect(s.decoded.correction).toBe(null);
        expect(s.decoded.corrected).toBe(null);
        expect(s.decoded.payload).toBe(null);
        expect(referenceBook(true).filter((w) => mismatch(w, s.received) <= 1)).toHaveLength(0);
        expect(
          referenceBook(true).filter((w) => mismatch(w, s.received) === 2).length,
        ).toBeGreaterThan(1);
      }
  });
  it('independently proves minimum distance 3 and 4 across every valid word pair', () => {
    for (const extended of [false, true]) {
      const book = referenceBook(extended),
        distances: number[] = [];
      for (let i = 0; i < 16; i++)
        for (let j = i + 1; j < 16; j++) {
          const d = mismatch(book[i], book[j]);
          expect(ecDistance(book[i], book[j])).toBe(d);
          distances.push(d);
        }
      expect(Math.min(...distances)).toBe(extended ? 4 : 3);
    }
  });
  it('demonstrates three-error miscorrection and a four-error undetected counterexample', () => {
    for (let n = 0; n < 16; n++) {
      const triple = ecCase(n, 'extended', [1, 2, 3]);
      expect(triple.decoded.status).toBe('overall-corrected');
      expect(triple.recovered).toBe(false);
      const four = ecCase(n, 'extended', [1, 2, 3, 8]);
      expect(four.decoded.status).toBe('accepted');
      expect(four.recovered).toBe(false);
    }
  });
  it('decoder output depends only on received bits, never on transmitter knowledge', () => {
    const a = ecCase(11, 'hamming', [3, 5]),
      b = ecCase(11, 'hamming', [6]);
    expect(a.decoded.checks).toEqual(b.decoded.checks);
    for (let n = 0; n < 256; n++) {
      const w = Array.from({ length: 8 }, (_, i) => ((n >> i) & 1) as EcBit);
      const result = ecDecode(w, 'extended');
      const candidates = referenceBook(true).filter((v) => mismatch(v, w) <= 1);
      expect(result.corrected).toEqual(candidates[0] ?? null);
    }
  });
  it('direct seeks equal repeated frame evaluation, in reverse and shuffled order', () => {
    const frames = Array.from({ length: 801 }, (_, i) =>
      ecShot(Math.min(7, Math.floor(i / 100)), (i % 100) / 99),
    );
    for (let i = 800; i >= 0; i--)
      expect(ecShot(Math.min(7, Math.floor(i / 100)), (i % 100) / 99)).toEqual(frames[i]);
    for (let i = 0; i < 801; i++) {
      const j = (i * 317) % 801;
      expect(ecShot(Math.min(7, Math.floor(j / 100)), (j % 100) / 99)).toEqual(frames[j]);
    }
    expect(ecShot(5, 0.7).sample.recovered).toBe(false);
    expect(ecShot(6, 0.7).sample.decoded.status).toBe('detected');
    expect(ecShot(7, 0.6).sample.decoded.correction).toBe(8);
    expect(ecShot(0, 1).built).toBe(3);
  });
  it('rejects malformed input and leaves inputs immutable', () => {
    for (const n of [-1, 16, NaN, Infinity, 0.4]) expect(() => ecData(n)).toThrow(RangeError);
    expect(() => ecDecode([0, 1] as EcBit[])).toThrow(RangeError);
    expect(() => ecEncode([0, 1, 2, 0] as EcBit[])).toThrow(RangeError);
    const word = Object.freeze(ecEncode(ecData(11)));
    for (const positions of [[0], [8], [1, 1], [1.1]])
      expect(() => ecFlip(word, positions)).toThrow(RangeError);
    ecDecode(word);
    ecFlip(word, [6]);
    expect(word).toEqual(ecEncode(ecData(11)));
    expect(ecShot(NaN, Infinity)).toEqual(ecShot(0, 0));
  });
});
