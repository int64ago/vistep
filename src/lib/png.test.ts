import { describe, expect, it } from 'vitest';
import { inflateSync } from 'node:zlib';
import { encodePng, pngDataUri } from './png';
describe('build-time PNG encoder', () => {
  it('writes a valid RGBA PNG whose pixels round-trip', () => {
    const rgba = Uint8ClampedArray.from({ length: 3 * 2 * 4 }, (_, i) => (i * 37) % 256);
    const png = encodePng(3, 2, rgba);
    expect(png.subarray(1, 4).toString()).toBe('PNG');
    expect(png.readUInt32BE(16)).toBe(3);
    expect(png.readUInt32BE(20)).toBe(2);
    expect(png.readUInt8(24)).toBe(8);
    expect(png.readUInt8(25)).toBe(6);
    const idat = png.indexOf('IDAT');
    const length = png.readUInt32BE(idat - 4);
    const raw = inflateSync(png.subarray(idat + 4, idat + 4 + length));
    expect(raw.length).toBe((3 * 4 + 1) * 2);
    for (let row = 0; row < 2; row++) {
      expect(raw[row * 13]).toBe(0);
      expect([...raw.subarray(row * 13 + 1, row * 13 + 13)]).toEqual([
        ...rgba.subarray(row * 12, row * 12 + 12),
      ]);
    }
    expect(pngDataUri(3, 2, rgba)).toMatch(/^data:image\/png;base64,iVBOR/);
  });
  it('rejects mismatched buffers', () => {
    expect(() => encodePng(2, 2, new Uint8Array(3))).toThrow(RangeError);
    expect(() => encodePng(0, 2, new Uint8Array(0))).toThrow(RangeError);
  });
});
