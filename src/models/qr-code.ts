/** QR Model 2, Version 1-L: one byte segment: ASCII 1–17 bytes; UTF-8 with ECI 26, 1–16 bytes.
 * Independent bounded implementation of ISO/IEC 18004. See the topic brief for
 * source/validation provenance. No runtime dependency and no damage decoder.
 */
export const QR_SIZE = 21;
export const QR_QUIET = 4;
export const QR_CAPACITY = 19;
export const QR_PARITY = 7;
export const QR_MAX_BYTES = 17;
export const QR_UTF8_MAX_BYTES = 16;
export const QR_MESSAGE = 'https://vistep.ai';
export const QR_TRACKED_BYTE = 8;
export type QrBit = 0 | 1;
export type QrRole = 'data' | 'finder' | 'separator' | 'timing' | 'format' | 'dark';
export type QrPoint = readonly [number, number];
export type QrGrid = QrBit[][];
export const qrBits = (n: number, length = 8): QrBit[] =>
  Array.from({ length }, (_, i) => ((n >>> (length - 1 - i)) & 1) as QrBit);
export const qrHex = (n: number) => n.toString(16).toUpperCase().padStart(2, '0');
const byte = (n: number) => {
  if (!Number.isInteger(n) || n < 0 || n > 255) throw new RangeError('Expected a byte');
};
export function qrUtf8(text: string): number[] {
  // Reject isolated UTF-16 surrogates rather than silently encode replacement characters.
  for (let i = 0; i < text.length; i++) {
    const u = text.charCodeAt(i);
    if (u >= 0xd800 && u <= 0xdbff) {
      const v = text.charCodeAt(++i);
      if (!(v >= 0xdc00 && v <= 0xdfff)) throw new RangeError('Invalid Unicode');
    } else if (u >= 0xdc00 && u <= 0xdfff) throw new RangeError('Invalid Unicode');
  }
  const result = [...new TextEncoder().encode(text)];
  if (
    result.length < 1 ||
    result.length > (result.some((v) => v > 127) ? QR_UTF8_MAX_BYTES : QR_MAX_BYTES)
  )
    throw new RangeError('UTF-8 byte limit exceeded');
  return result;
}
export type QrField = {
  kind: 'eci-mode' | 'eci' | 'byte-mode' | 'count' | 'payload' | 'terminator' | 'align' | 'pad';
  start: number;
  bits: QrBit[];
  byteIndex?: number;
};
export function qrStream(payload: readonly number[]) {
  const eci = payload.some((v) => v > 127);
  if (payload.length < 1 || payload.length > (eci ? QR_UTF8_MAX_BYTES : QR_MAX_BYTES))
    throw new RangeError('UTF-8 byte limit exceeded');
  payload.forEach(byte);
  const fields: QrField[] = [],
    bits: QrBit[] = [];
  const append = (kind: QrField['kind'], value: number, length: number, byteIndex?: number) => {
    const chunk = qrBits(value, length);
    fields.push({ kind, start: bits.length, bits: chunk, byteIndex });
    bits.push(...chunk);
  };
  if (eci) {
    append('eci-mode', 7, 4);
    append('eci', 26, 8);
  }
  append('byte-mode', 4, 4);
  append('count', payload.length, 8);
  payload.forEach((v, i) => append('payload', v, 8, i));
  append('terminator', 0, Math.min(4, 152 - bits.length));
  append('align', 0, (8 - (bits.length % 8)) % 8);
  let pad = 0;
  while (bits.length < 152) append('pad', pad++ % 2 ? 0x11 : 0xec, 8);
  const codewords = Array.from({ length: 19 }, (_, i) =>
    bits.slice(i * 8, i * 8 + 8).reduce<number>((a, b) => (a << 1) | b, 0),
  );
  return { fields, bits, codewords, eci, payloadStart: eci ? 24 : 12 };
}
/** Polynomial multiplication in GF(256), reducing by x^8+x^4+x^3+x^2+1. */
export function qrGf(a: number, b: number): number {
  byte(a);
  byte(b);
  let result = 0,
    left = a,
    right = b;
  for (let i = 0; i < 8; i++) {
    if (right & 1) result ^= left;
    right >>>= 1;
    left <<= 1;
    if (left & 0x100) left ^= 0x11d;
  }
  return result;
}
export function qrGenerator(): number[] {
  let polynomial = [1],
    root = 1;
  for (let i = 0; i < 7; i++) {
    const next = Array(polynomial.length + 1).fill(0) as number[];
    polynomial.forEach((a, j) => {
      next[j] ^= a;
      next[j + 1] ^= qrGf(a, root);
    });
    polynomial = next;
    root = qrGf(root, 2);
  }
  return polynomial;
}
export function qrRs(data: readonly number[]) {
  if (data.length !== 19) throw new RangeError('Version 1-L has 19 data codewords');
  data.forEach(byte);
  const generator = qrGenerator(),
    dividend = [...data, ...Array(7).fill(0)];
  const steps: { index: number; input: number; factor: number; remainder: number[] }[] = [];
  for (let i = 0; i < data.length; i++) {
    const factor = dividend[i];
    generator.forEach((g, j) => {
      dividend[i + j] ^= qrGf(factor, g);
    });
    // The remainder after feeding this prefix, independent of future data bytes.
    const prefix = [...data.slice(0, i + 1), ...Array(7).fill(0)];
    for (let k = 0; k <= i; k++) {
      const f = prefix[k];
      generator.forEach((g, j) => {
        prefix[k + j] ^= qrGf(f, g);
      });
    }
    steps.push({ index: i, input: data[i], factor, remainder: prefix.slice(-7) });
  }
  return { generator, steps, parity: dividend.slice(-7) };
}
export function qrFormat(mask: number) {
  if (!Number.isInteger(mask) || mask < 0 || mask > 7) throw new RangeError('Mask must be 0–7');
  const data = 8 | mask; // Error correction L is binary 01.
  let remainder = data << 10;
  for (let bit = 14; bit >= 10; bit--) if (remainder & (1 << bit)) remainder ^= 0x537 << (bit - 10);
  return {
    data,
    remainder,
    unmasked: (data << 10) | remainder,
    value: ((data << 10) | remainder) ^ 0x5412,
  };
}
export const QR_FORMAT_A: readonly QrPoint[] = [
  [8, 0],
  [8, 1],
  [8, 2],
  [8, 3],
  [8, 4],
  [8, 5],
  [8, 7],
  [8, 8],
  [7, 8],
  [5, 8],
  [4, 8],
  [3, 8],
  [2, 8],
  [1, 8],
  [0, 8],
];
export const QR_FORMAT_B: readonly QrPoint[] = [
  [20, 8],
  [19, 8],
  [18, 8],
  [17, 8],
  [16, 8],
  [15, 8],
  [14, 8],
  [13, 8],
  [8, 14],
  [8, 15],
  [8, 16],
  [8, 17],
  [8, 18],
  [8, 19],
  [8, 20],
];
export function qrFunctionGrid() {
  const base: QrGrid = Array.from({ length: 21 }, () => Array<QrBit>(21).fill(0));
  const roles: QrRole[][] = Array.from({ length: 21 }, () => Array<QrRole>(21).fill('data'));
  const set = (x: number, y: number, value: QrBit, role: QrRole) => {
    base[y][x] = value;
    roles[y][x] = role;
  };
  for (const [left, top] of [
    [0, 0],
    [14, 0],
    [0, 14],
  ]) {
    for (let dy = -1; dy <= 7; dy++)
      for (let dx = -1; dx <= 7; dx++) {
        const x = left + dx,
          y = top + dy;
        if (x < 0 || y < 0 || x >= 21 || y >= 21) continue;
        const separator = dx === -1 || dy === -1 || dx === 7 || dy === 7;
        const dark =
          !separator &&
          (dx === 0 ||
            dx === 6 ||
            dy === 0 ||
            dy === 6 ||
            (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4));
        set(x, y, dark ? 1 : 0, separator ? 'separator' : 'finder');
      }
  }
  for (let i = 8; i <= 12; i++) {
    set(i, 6, i % 2 ? 0 : 1, 'timing');
    set(6, i, i % 2 ? 0 : 1, 'timing');
  }
  for (const [x, y] of [...QR_FORMAT_A, ...QR_FORMAT_B]) set(x, y, 0, 'format');
  set(8, 13, 1, 'dark');
  const path: QrPoint[] = [];
  [20, 18, 16, 14, 12, 10, 8, 5, 3, 1].forEach((right, pair) => {
    for (let step = 0; step < 21; step++) {
      const y = pair % 2 ? step : 20 - step;
      for (const x of [right, right - 1]) if (roles[y][x] === 'data') path.push([x, y]);
    }
  });
  return { base, roles, path };
}
export function qrMask(mask: number, x: number, y: number): boolean {
  const formulas = [
    (x + y) % 2,
    y % 2,
    x % 3,
    (x + y) % 3,
    (Math.floor(y / 2) + Math.floor(x / 3)) % 2,
    ((x * y) % 2) + ((x * y) % 3),
    (((x * y) % 2) + ((x * y) % 3)) % 2,
    (((x + y) % 2) + ((x * y) % 3)) % 2,
  ];
  if (!Number.isInteger(mask) || mask < 0 || mask > 7) throw new RangeError('Mask must be 0–7');
  return formulas[mask] === 0;
}
export type QrPenalty = {
  runs: number;
  blocks: number;
  finders: number;
  balance: number;
  total: number;
};
/** ISO mask penalties. N3 measures complete 1:1:3:1:1 run ratios and their
 * light context, including the virtual light boundary (also used by Nayuki).
 * This run-list implementation is independent of the reference encoder.
 */
export function qrPenalty(grid: QrGrid): QrPenalty {
  let runs = 0,
    blocks = 0,
    finders = 0;
  const lines = [...grid, ...Array.from({ length: 21 }, (_, x) => grid.map((row) => row[x]))];
  for (const line of lines) {
    const groups: { bit: QrBit; length: number }[] = [];
    for (const bit of line) {
      if (groups.at(-1)?.bit === bit) groups.at(-1)!.length++;
      else groups.push({ bit, length: 1 });
    }
    for (const g of groups) if (g.length >= 5) runs += g.length - 2;
    const framed = groups.map((g) => ({ ...g }));
    if (framed[0].bit === 0) framed[0].length += 21;
    else framed.unshift({ bit: 0, length: 21 });
    if (framed.at(-1)!.bit === 0) framed.at(-1)!.length += 21;
    else framed.push({ bit: 0, length: 21 });
    for (let i = 1; i + 5 < framed.length; i++) {
      const n = framed[i].length;
      if (
        framed[i].bit !== 1 ||
        framed[i + 1].length !== n ||
        framed[i + 2].length !== 3 * n ||
        framed[i + 3].length !== n ||
        framed[i + 4].length !== n
      )
        continue;
      const before = framed[i - 1].length,
        after = framed[i + 5].length;
      if (before >= 4 * n && after >= n) finders += 40;
      if (after >= 4 * n && before >= n) finders += 40;
    }
  }
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++)
      if (
        grid[y][x] === grid[y][x + 1] &&
        grid[y][x] === grid[y + 1][x] &&
        grid[y][x] === grid[y + 1][x + 1]
      )
        blocks += 3;
  const dark = grid.flat().reduce<number>((a, b) => a + b, 0);
  const balance = Math.max(0, Math.ceil(Math.abs(dark * 20 - 4410) / 441) - 1) * 10;
  return { runs, blocks, finders, balance, total: runs + blocks + finders + balance };
}
export function qrEncode(text: string, forcedMask = -1) {
  if (!Number.isInteger(forcedMask) || forcedMask < -1 || forcedMask > 7)
    throw new RangeError('Invalid mask');
  const payload = qrUtf8(text),
    stream = qrStream(payload),
    rs = qrRs(stream.codewords),
    codewords = [...stream.codewords, ...rs.parity];
  const codeBits = codewords.flatMap((v) => qrBits(v)),
    { base, roles, path } = qrFunctionGrid();
  const unmasked = base.map((row) => [...row]);
  path.forEach(([x, y], i) => {
    unmasked[y][x] = codeBits[i];
  });
  const candidates = Array.from({ length: 8 }, (_, mask) => {
    const modules = unmasked.map((row, y) =>
      row.map((b, x) => (roles[y][x] === 'data' && qrMask(mask, x, y) ? 1 - b : b) as QrBit),
    );
    const format = qrFormat(mask);
    for (const copy of [QR_FORMAT_A, QR_FORMAT_B])
      copy.forEach(([x, y], i) => {
        modules[y][x] = ((format.value >>> i) & 1) as QrBit;
      });
    return { mask, modules, format, penalty: qrPenalty(modules) };
  });
  const best = candidates.reduce((a, b) => (b.penalty.total < a.penalty.total ? b : a)).mask;
  const mask = forcedMask === -1 ? best : forcedMask;
  return {
    text,
    payload,
    stream,
    rs,
    codewords,
    codeBits,
    base,
    roles,
    path,
    unmasked,
    candidates,
    best,
    mask,
    modules: candidates[mask].modules,
  };
}
export type QrEncoding = ReturnType<typeof qrEncode>;
export function qrQuietGrid(modules: QrGrid): QrGrid {
  return Array.from({ length: 29 }, (_, y) =>
    Array.from({ length: 29 }, (_, x) => modules[y - 4]?.[x - 4] ?? 0),
  );
}
export function qrSvg(modules: QrGrid): string {
  const path = modules
    .flatMap((row, y) => row.flatMap((bit, x) => (bit ? [`M${x + 4} ${y + 4}h1v1h-1z`] : [])))
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 29 29" shape-rendering="crispEdges"><path fill="#fff" d="M0 0h29v29H0z"/><path fill="#111" d="${path}"/></svg>`;
}
export function qrTracked(qr: QrEncoding, byteIndex = QR_TRACKED_BYTE, bitIndex = 1) {
  const byte = Math.max(0, Math.min(qr.payload.length - 1, Math.floor(byteIndex)));
  const bit = Math.max(0, Math.min(7, Math.floor(bitIndex)));
  if (!qr.payload.length) return null;
  const index = qr.stream.payloadStart + byte * 8 + bit,
    [x, y] = qr.path[index];
  return {
    byteIndex: byte,
    bitIndex: bit,
    index,
    codeword: Math.floor(index / 8),
    x,
    y,
    raw: qr.codeBits[index],
    mask: qrMask(qr.mask, x, y) ? 1 : 0,
    printed: qr.modules[y][x],
  };
}
/** Pure shot selection from the shared chapter director. No mutable playback history. */
export function qrShot(chapter: number, progress: number) {
  const c = Number.isFinite(chapter) ? Math.max(0, Math.min(7, Math.floor(chapter))) : 0;
  const p = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0;
  return {
    chapter: c,
    progress: p,
    byte: Math.min(16, Math.floor(p * 17)),
    field: Math.min(5, Math.floor(p * 6)),
    rsStep: Math.min(18, Math.floor(p * 19)),
    structure: Math.min(2, Math.floor(p * 3)),
    placed: Math.min(208, Math.floor(p * 240)),
    mask: Math.min(7, Math.floor(p * 9)),
    maskSettled: p >= 0.9,
    formatCopy: p < 0.5 ? 0 : 1,
    clean: c === 7 && p >= 0.38,
  };
}
