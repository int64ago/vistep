import { describe, expect, it } from 'vitest';
import { rleCountBytes, rleDecode, rleEncode, rlePattern } from './run-length-encoding';
describe('R1 byte-run teaching format', () => {
  it('counts real serialized bytes including header; short runs can expand', () => {
    const bands = rleEncode(rlePattern('bands'));
    expect(bands.runs.map((r) => [r.count, r.value])).toEqual([
      [16, 0],
      [16, 1],
      [16, 2],
      [16, 3],
    ]);
    expect([...bands.bytes]).toEqual([82, 49, 16, 0, 16, 1, 16, 2, 16, 3]);
    expect(bands.bytes.length).toBe(10);
    expect(rleEncode(rlePattern('vertical')).bytes.length).toBe(130);
    expect(rleEncode(rlePattern('checker')).runs).toHaveLength(57);
    expect(rleEncode(rlePattern('checker')).bytes.length).toBe(116);
  });
  it('uses canonical unsigned LEB128 counts at127/128 and supports the exact4096 boundary', () => {
    expect(rleCountBytes(127)).toEqual([127]);
    expect(rleCountBytes(128)).toEqual([128, 1]);
    expect(rleEncode(new Uint8Array(127)).bytes.length).toBe(4);
    expect(rleEncode(new Uint8Array(128)).bytes.length).toBe(5);
    const max = new Uint8Array(4096).fill(255);
    expect(rleDecode(rleEncode(max).bytes)).toEqual(max);
    expect(rleDecode([82, 49])).toEqual(new Uint8Array());
  });
  it('round-trips sixty deterministic streams and repeated UTF-8 bytes without claiming character runs', () => {
    for (let seed = 0; seed < 60; seed++) {
      const data = Uint8Array.from(
        { length: seed * 17 },
        (_, i) => (Math.floor(i / (1 + (seed % 19))) * 13) % 256,
      );
      const q = rleEncode(data);
      expect(rleDecode(q.bytes)).toEqual(data);
      expect(q.runs.reduce((sum, r) => sum + r.count, 0)).toBe(data.length);
      q.runs.forEach((r) =>
        expect([...data.slice(r.start, r.end)].every((b) => b === r.value)).toBe(true),
      );
    }
    const utf8 = new TextEncoder().encode('哈哈哈');
    expect(rleDecode(rleEncode(utf8).bytes)).toEqual(utf8);
    expect(rleEncode(utf8).bytes.length).toBeGreaterThan(utf8.length);
  });
  it('rejects zero/noncanonical counts, truncated records, invalid bytes and expansion bombs', () => {
    for (const data of [
      [0, 49],
      [82, 49, 0, 1],
      [82, 49, 128],
      [82, 49, 1],
      [82, 49, 129, 0, 1],
      [82, 49, 255, 255, 1],
    ])
      expect(() => rleDecode(data)).toThrow();
    expect(() => rleDecode([82, 49, 10, 1], 9)).toThrow();
    expect(() => rleEncode([-1])).toThrow();
    expect(() => rleEncode(new Uint8Array(4097))).toThrow();
  });
});
