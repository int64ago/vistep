/** SHA-256, independently implemented from FIPS 180-4 §§4–6.
 * Byte-aligned inputs; UTF-8 is an explicit UI encoding, not part of SHA-256.
 * Detailed traces are bounded for teaching; the digest path retains no round log.
 */
export const HASH_MESSAGE = 'abc';
export const HASH_LONG = 'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq';
export const HASH_MAX_BYTES = 1024;
export const HASH_INITIAL = [
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
] as const;
export const HASH_K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
] as const;
export const hashHex = (n: number, length = 8) => (n >>> 0).toString(16).padStart(length, '0');
export const hashBits = (n: number, length = 32) =>
  Array.from({ length }, (_, i) => (n >>> (length - 1 - i)) & 1);
export const hashAdd = (...words: number[]) => words.reduce((a, b) => a + (b >>> 0), 0) >>> 0;
export const hashRot = (n: number, bits: number) => ((n >>> bits) | (n << (32 - bits))) >>> 0;
export const hashSmall0 = (n: number) => (hashRot(n, 7) ^ hashRot(n, 18) ^ (n >>> 3)) >>> 0;
export const hashSmall1 = (n: number) => (hashRot(n, 17) ^ hashRot(n, 19) ^ (n >>> 10)) >>> 0;
export const hashBig0 = (n: number) => (hashRot(n, 2) ^ hashRot(n, 13) ^ hashRot(n, 22)) >>> 0;
export const hashBig1 = (n: number) => (hashRot(n, 6) ^ hashRot(n, 11) ^ hashRot(n, 25)) >>> 0;
export const hashChoose = (x: number, y: number, z: number) => ((x & y) ^ (~x & z)) >>> 0;
export const hashMajority = (x: number, y: number, z: number) =>
  ((x & y) ^ (x & z) ^ (y & z)) >>> 0;
export function hashUtf8(text: string): Uint8Array {
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c >= 0xd800 && c <= 0xdbff) {
      const next = text.charCodeAt(++i);
      if (!(next >= 0xdc00 && next <= 0xdfff)) throw new RangeError('Malformed Unicode');
    } else if (c >= 0xdc00 && c <= 0xdfff) throw new RangeError('Malformed Unicode');
  }
  return new TextEncoder().encode(text);
}
function validateBytes(bytes: readonly number[] | Uint8Array) {
  if (!(bytes instanceof Uint8Array) && bytes.some((v) => !Number.isInteger(v) || v < 0 || v > 255))
    throw new RangeError('Expected bytes');
}
export function hashPad(bytes: readonly number[] | Uint8Array) {
  validateBytes(bytes);
  const total = Math.ceil((bytes.length + 9) / 64) * 64,
    padded = new Uint8Array(total);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const length = BigInt(bytes.length) * 8n;
  for (let i = 0; i < 8; i++) padded[total - 1 - i] = Number((length >> BigInt(i * 8)) & 255n);
  return {
    bytes: padded,
    bitLength: length,
    zeroBytes: total - bytes.length - 9,
    blocks: total / 64,
    lengthBytes: padded.slice(-8),
  };
}
export function hashSchedule(bytes: readonly number[] | Uint8Array): number[] {
  validateBytes(bytes);
  if (bytes.length !== 64) throw new RangeError('A block has 64 bytes');
  const w = Array<number>(64).fill(0);
  for (let i = 0; i < 16; i++)
    w[i] =
      ((bytes[i * 4] << 24) |
        (bytes[i * 4 + 1] << 16) |
        (bytes[i * 4 + 2] << 8) |
        bytes[i * 4 + 3]) >>>
      0;
  for (let i = 16; i < 64; i++)
    w[i] = hashAdd(hashSmall1(w[i - 2]), w[i - 7], hashSmall0(w[i - 15]), w[i - 16]);
  return w;
}
export type HashRound = {
  index: number;
  before: number[];
  after: number[];
  w: number;
  k: number;
  sigma0: number;
  sigma1: number;
  ch: number;
  maj: number;
  t1: number;
  t2: number;
};
export type HashBlock = {
  index: number;
  input: number[];
  schedule: number[];
  rounds: HashRound[];
  working: number[];
  output: number[];
};
export type HashRun = {
  payload: Uint8Array;
  pad: ReturnType<typeof hashPad>;
  blocks: HashBlock[];
  words: number[];
  digest: string;
};
export function hashCompress(
  bytes: readonly number[] | Uint8Array,
  input: readonly number[],
  capture = true,
): Omit<HashBlock, 'index'> {
  if (input.length !== 8 || input.some((v) => !Number.isInteger(v) || v < 0 || v > 0xffffffff))
    throw new RangeError('Eight 32-bit state words required');
  const schedule = hashSchedule(bytes),
    rounds: HashRound[] = [];
  let state = [...input];
  for (let i = 0; i < 64; i++) {
    const [a, b, c, d, e, f, g, h] = state;
    const sigma0 = hashBig0(a),
      sigma1 = hashBig1(e),
      ch = hashChoose(e, f, g),
      maj = hashMajority(a, b, c);
    const t1 = hashAdd(h, sigma1, ch, HASH_K[i], schedule[i]),
      t2 = hashAdd(sigma0, maj);
    const next = [hashAdd(t1, t2), a, b, c, hashAdd(d, t1), e, f, g];
    if (capture)
      rounds.push({
        index: i,
        before: state,
        after: next,
        w: schedule[i],
        k: HASH_K[i],
        sigma0,
        sigma1,
        ch,
        maj,
        t1,
        t2,
      });
    state = next;
  }
  return {
    input: [...input],
    schedule,
    rounds,
    working: state,
    output: state.map((v, i) => hashAdd(v, input[i])),
  };
}
export function hashRun(bytes: readonly number[] | Uint8Array, capture = true): HashRun {
  validateBytes(bytes);
  if (capture && bytes.length > HASH_MAX_BYTES)
    throw new RangeError('Teaching trace limit exceeded');
  const payload = Uint8Array.from(bytes),
    pad = hashPad(payload),
    blocks: HashBlock[] = [];
  let words: number[] = [...HASH_INITIAL];
  for (let i = 0; i < pad.blocks; i++) {
    const block = hashCompress(pad.bytes.subarray(i * 64, i * 64 + 64), words, capture);
    if (capture) blocks.push({ ...block, index: i });
    words = block.output;
  }
  return { payload, pad, blocks, words, digest: words.map((v) => hashHex(v)).join('') };
}
export const hashDigest = (bytes: readonly number[] | Uint8Array) => hashRun(bytes, false).digest;
export function hashFlip(bytes: Uint8Array, byteIndex: number, bit: number): Uint8Array {
  if (
    !Number.isInteger(byteIndex) ||
    byteIndex < 0 ||
    byteIndex >= bytes.length ||
    !Number.isInteger(bit) ||
    bit < 0 ||
    bit > 7
  )
    throw new RangeError('Choose an existing byte and bit 0–7');
  const out = bytes.slice();
  out[byteIndex] ^= 1 << bit;
  return out;
}
export function hashDistance(a: readonly number[], b: readonly number[]): number {
  if (a.length !== b.length) throw new RangeError('Equal-length word lists required');
  let count = 0;
  for (let i = 0; i < a.length; i++) {
    let x = (a[i] ^ b[i]) >>> 0;
    while (x) {
      x = (x & (x - 1)) >>> 0;
      count++;
    }
  }
  return count;
}
export function hashCompare(payload: Uint8Array, byteIndex = 0, bit = 0, flip = true) {
  const changed = flip && payload.length > 0,
    other = changed ? hashFlip(payload, byteIndex, bit) : payload.slice();
  const original = hashRun(payload),
    altered = hashRun(other);
  const history = original.blocks.map((b, i) => [
    hashDistance(b.input, altered.blocks[i].input),
    ...b.rounds.map((r, j) => hashDistance(r.after, altered.blocks[i].rounds[j].after)),
    hashDistance(b.output, altered.blocks[i].output),
  ]);
  return {
    original,
    altered,
    changed,
    history,
    difference: hashDistance(original.words, altered.words),
  };
}
export function hashShot(chapter: number, progress: number) {
  const c = Number.isFinite(chapter) ? Math.max(0, Math.min(7, Math.floor(chapter))) : 0;
  const p = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0;
  return {
    chapter: c,
    progress: p,
    padding: Math.min(3, Math.floor(p * 4)),
    schedule: [16, 17, 18, 63][Math.min(3, Math.floor(p * 4))],
    round: Math.min(63, Math.floor(p * 68)),
    roundPhase: Math.min(2, Math.floor(p * 3)),
    feedWord: Math.min(7, Math.floor(p * 10)),
    longBlock: p < 0.5 ? 0 : 1,
    comparisonStep: Math.min(65, Math.floor(p * 84)),
  };
}
/** A direct view into immutable mathematical computation, not a playback frame cache.
 * step 0 = entering state, 1..64 = completed rounds, 65 = feed-forward state.
 */
export function hashAt(run: HashRun, block: number, step: number): number[] {
  if (
    !Number.isInteger(block) ||
    block < 0 ||
    block >= run.blocks.length ||
    !Number.isInteger(step) ||
    step < 0 ||
    step > 65
  )
    throw new RangeError('Invalid trace position');
  const b = run.blocks[block];
  return [...(step === 0 ? b.input : step === 65 ? b.output : b.rounds[step - 1].after)];
}
