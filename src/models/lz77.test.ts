import { describe, it, expect } from 'vitest';
import { lzEncode, lzDecode, lzFrame, LZ_TEXT } from './lz77';
describe('greedy bounded LZ77', () => {
  it('losslessly reconstructs reproducible inputs for every window', () => {
    for (const w of [1, 2, 4, 12, 64])
      for (const text of [
        '',
        LZ_TEXT,
        'ABABABABABAB',
        '😀😀😀😀中文中文',
        'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      ])
        expect(lzDecode(lzEncode(text, w).tokens)).toBe(text);
  });
  it('uses backward distance and permits newly written symbols as a source', () => {
    const r = lzEncode('ABABABABABAB');
    expect(r.tokens).toEqual([
      { at: 0, kind: 'literal', value: 'A', length: 1 },
      { at: 1, kind: 'literal', value: 'B', length: 1 },
      { at: 2, kind: 'match', distance: 2, length: 10 },
    ]);
    for (let n = 0; n <= 10; n++)
      expect(lzFrame(r, 2, n).history).toBe('ABABABABABAB'.slice(0, n + 2));
  });
  it('matches an exhaustive greedy length oracle', () => {
    const r = lzEncode(LZ_TEXT, 8);
    for (const t of r.tokens) {
      let best = 0;
      for (let d = 1; d <= Math.min(8, t.at); d++) {
        let l = 0;
        while (l < 18 && t.at + l < r.chars.length && r.chars[t.at + l] === r.chars[t.at + l - d])
          l++;
        best = Math.max(best, l);
      }
      expect(t.kind === 'match' ? t.length : 1).toBe(best >= 3 ? best : 1);
    }
  });
  it('rejects invalid references and ranges', () => {
    expect(() => lzDecode([{ at: 0, kind: 'match', distance: 1, length: 2 }])).toThrow();
    expect(() => lzEncode('abc', 0)).toThrow();
    expect(() => lzEncode('x'.repeat(97))).toThrow();
  });
});
