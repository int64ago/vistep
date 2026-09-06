import { deflateSync } from 'node:zlib';
/** Minimal RGBA PNG encoder for build-time raster covers; only imported by server-rendered art. */
const crcTable = Uint32Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Uint8Array) {
  const out = new Uint8Array(12 + data.length),
    view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  out.set(Buffer.from(type, 'ascii'), 4);
  out.set(data, 8);
  view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}
export function encodePng(width: number, height: number, rgba: ArrayLike<number>) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1)
    throw new RangeError('Invalid PNG size');
  if (rgba.length !== width * height * 4) throw new RangeError('RGBA data does not match size');
  const header = new Uint8Array(13),
    headerView = new DataView(header.buffer);
  headerView.setUint32(0, width);
  headerView.setUint32(4, height);
  header.set([8, 6, 0, 0, 0], 8); // 8-bit RGBA, no interlace
  const stride = width * 4,
    raw = new Uint8Array((stride + 1) * height);
  for (let row = 0; row < height; row++) {
    raw[row * (stride + 1)] = 0; // filter: none
    for (let i = 0; i < stride; i++) raw[row * (stride + 1) + 1 + i] = rgba[row * stride + i];
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', new Uint8Array(0)),
  ]);
}
export const pngDataUri = (width: number, height: number, rgba: ArrayLike<number>) =>
  `data:image/png;base64,${encodePng(width, height, rgba).toString('base64')}`;
