import { describe, expect, it } from 'vitest';
import { huffman, huffmanDecode, HUFFMAN_TEXT } from './huffman';
describe('binary Huffman code', () => {
  it('round trips empty, singleton, Unicode and a skewed alphabet', () => {
    for (const s of ['', 'aaaaa', '😀😀中a中', HUFFMAN_TEXT, 'abcdef']) {
      const r = huffman(s);
      expect(huffmanDecode(r.bits, r.root)).toBe(s);
    }
  });
  it('preserves weights and chooses two minima each time', () => {
    const r = huffman(HUFFMAN_TEXT);
    for (const m of r.merges) {
      const sorted = m.forest.map((n) => n.weight).sort((a, b) => a - b);
      expect(m.parent.weight).toBe(sorted[0] + sorted[1]);
      expect(m.parent.left!.weight).toBe(sorted[0]);
    }
    expect(r.root!.weight).toBe(14);
    expect(r.bits.length).toBe(28);
    expect(r.fixedBits).toBe(42);
  });
  it('is prefix free and achieves the known weighted optimum', () => {
    const r = huffman(HUFFMAN_TEXT),
      c = Object.values(r.codes);
    for (const a of c) for (const b of c) if (a !== b) expect(a.startsWith(b)).toBe(false);
    expect(r.leaves.reduce((n, s) => n + s.weight * r.codes[s.symbol!].length, 0)).toBe(28);
  });
  it('rejects invalid and incomplete codes', () => {
    const r = huffman(HUFFMAN_TEXT);
    expect(() => huffmanDecode('x', r.root)).toThrow();
    expect(() => huffman('x'.repeat(81))).toThrow();
    expect(() => huffmanDecode('1', huffman('aaaa').root)).toThrow();
  });
});
