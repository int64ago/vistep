export const RLE_MAGIC = [0x52, 0x31];
export type RleRun = {
  value: number;
  count: number;
  start: number;
  end: number;
  offset: number;
  bytes: number[];
};
export function rleCountBytes(count: number) {
  if (!Number.isSafeInteger(count) || count < 1 || count > 4096)
    throw new RangeError('Count1–4096');
  const bytes: number[] = [];
  let n = count;
  do {
    const low = n % 128;
    n = Math.floor(n / 128);
    bytes.push(low | (n ? 128 : 0));
  } while (n);
  return bytes;
}
const validate = (data: readonly number[] | Uint8Array) => {
  if (data.length > 8194 || Array.from(data).some((b) => !Number.isInteger(b) || b < 0 || b > 255))
    throw new RangeError('Expected bounded bytes');
};
export function rleEncode(data: readonly number[] | Uint8Array) {
  validate(data);
  if (data.length > 4096) throw new RangeError('Input byte limit');
  const runs: RleRun[] = [],
    bytes = [...RLE_MAGIC];
  let i = 0;
  while (i < data.length) {
    const start = i,
      value = data[i];
    while (i < data.length && data[i] === value) i++;
    const count = i - start,
      record = [...rleCountBytes(count), value];
    runs.push({ value, count, start, end: i, offset: bytes.length, bytes: record });
    bytes.push(...record);
  }
  return { runs, bytes: Uint8Array.from(bytes) };
}
export function rleDecode(input: readonly number[] | Uint8Array, maxOutput = 4096) {
  validate(input);
  if (
    !Number.isInteger(maxOutput) ||
    maxOutput < 0 ||
    maxOutput > 4096 ||
    input[0] !== 82 ||
    input[1] !== 49
  )
    throw new RangeError('Invalid R1 header or limit');
  const output: number[] = [];
  let i = 2;
  while (i < input.length) {
    let count = 0,
      multiplier = 1;
    const start = i;
    while (true) {
      if (i >= input.length || i - start >= 2) throw new RangeError('Truncated or oversized count');
      const byte = input[i++];
      count += (byte & 127) * multiplier;
      if (!(byte & 128)) break;
      multiplier *= 128;
    }
    if (count < 1 || count > maxOutput - output.length || rleCountBytes(count).length !== i - start)
      throw new RangeError('Noncanonical count or output limit');
    if (i >= input.length) throw new RangeError('Missing run value');
    const value = input[i++];
    for (let j = 0; j < count; j++) output.push(value);
  }
  return Uint8Array.from(output);
}
export function rlePattern(name: 'bands' | 'vertical' | 'checker' | 'flat') {
  return Uint8Array.from({ length: 64 }, (_, i) =>
    name === 'flat'
      ? 1
      : name === 'vertical'
        ? (i % 8) % 2
        : name === 'checker'
          ? ((i % 8) + Math.floor(i / 8)) % 2
          : Math.floor(i / 16),
  );
}
export const rleHex = (bytes: readonly number[] | Uint8Array) =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join(' ');
