import { describe, expect, it } from 'vitest';
import {
  HASH_INITIAL,
  HASH_LONG,
  HASH_MAX_BYTES,
  hashAdd,
  hashAt,
  hashBig0,
  hashBig1,
  hashBits,
  hashChoose,
  hashCompare,
  hashCompress,
  hashDigest,
  hashDistance,
  hashFlip,
  hashHex,
  hashMajority,
  hashPad,
  hashRot,
  hashRun,
  hashSchedule,
  hashShot,
  hashSmall0,
  hashSmall1,
  hashUtf8,
} from './hash';
// Published NIST SHA256.pdf: both complete digests and selected intermediate
// working states. These numeric fixtures are not produced by our implementation.
const nist = [
  { text: 'abc', digest: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad' },
  { text: HASH_LONG, digest: '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1' },
];
const states: Record<number, string> = {
  0: '5D6AEBCD 6A09E667 BB67AE85 3C6EF372 FA2A4622 510E527F 9B05688C 1F83D9AB',
  1: '5A6AD9AD 5D6AEBCD 6A09E667 BB67AE85 78CE7989 FA2A4622 510E527F 9B05688C',
  15: 'B0FA238E C0645FDE D932EB16 87912990 07590DCD 0B92F20C 745A48DE 1E578218',
  31: '73B33BF5 EA992A22 A0060B30 363482C9 BA591112 0109AB3A ADE79437 6112A3B7',
  63: '506E3058 D39A2165 04D24D6C B85E2CE9 5EF50F24 FB121210 948D25B6 961F4894',
};
const parse = (s: string) => s.split(' ').map((h) => parseInt(h, 16));
const referenceRot = (n: number, r: number) =>
  Number(((BigInt(n) >> BigInt(r)) | (BigInt(n) << BigInt(32 - r))) & 0xffffffffn);
async function webHash(bytes: Uint8Array) {
  const digest = await crypto.subtle.digest('SHA-256', new Uint8Array(bytes));
  return [...new Uint8Array(digest)].map((v) => v.toString(16).padStart(2, '0')).join('');
}

describe('SHA-256 bytes, schedule and compression', () => {
  it('matches the NIST one-block and two-block vectors and five published round states', () => {
    for (const v of nist) expect(hashDigest(hashUtf8(v.text))).toBe(v.digest);
    const r = hashRun(hashUtf8('abc'));
    for (const [round, state] of Object.entries(states))
      expect(r.blocks[0].rounds[Number(round)].after).toEqual(parse(state));
    expect(r.blocks[0].schedule.slice(0, 16)).toEqual([0x61626380, ...Array(14).fill(0), 0x18]);
    const long = hashRun(hashUtf8(HASH_LONG));
    expect(long.blocks[0].output).toEqual(
      parse('85E655D6 417A1795 3363376A 624CDE5C 76E09589 CAC5F811 CC4B32C1 F20E533A'),
    );
    expect(long.blocks[1].input).toEqual(long.blocks[0].output);
  });
  it('matches independent WebCrypto for byte lengths 0–129 and Unicode without normalization', async () => {
    for (let length = 0; length <= 129; length++) {
      const bytes = Uint8Array.from({ length }, (_, i) => (i * 73 + length * 17) & 255);
      expect(hashDigest(bytes)).toBe(await webHash(bytes));
    }
    for (const text of [
      '你好，世界',
      '🙂🙂🙂🙂',
      'é',
      'e\u0301',
      'a\u0000b',
      '𝄞'.repeat(30),
      '汉'.repeat(341),
    ]) {
      const bytes = hashUtf8(text);
      expect(hashDigest(bytes)).toBe(await webHash(bytes));
    }
    expect(hashDigest(hashUtf8('é'))).not.toBe(hashDigest(hashUtf8('e\u0301')));
    expect(hashUtf8('🙂')).toHaveLength(4);
    expect(hashDigest(new Uint8Array())).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
  });
  it('retains only a compact result on the large-message digest path', async () => {
    const bytes = new Uint8Array(1_000_000).fill(97);
    const result = hashRun(bytes, false);
    expect(result.digest).toBe('cdc76e5c9914fb9281a1c7e284d73e67f1809a48a497200e046d39ccc7112cd0');
    expect(result.digest).toBe(await webHash(bytes));
    expect(result.blocks).toHaveLength(0);
  });
  it('pads byte boundaries 0/55/56/63/64/119/120/1024 with original 64-bit big-endian bit length', () => {
    for (const length of [0, 55, 56, 63, 64, 119, 120, 1024]) {
      const bytes = new Uint8Array(length).fill(0x31),
        p = hashPad(bytes);
      expect(p.bytes.length % 64).toBe(0);
      expect(p.bytes[length]).toBe(0x80);
      expect([...p.bytes.slice(0, length)]).toEqual([...bytes]);
      expect([...p.bytes.slice(length + 1, -8)].every((v) => v === 0)).toBe(true);
      const bits = p.lengthBytes.reduce((a, v) => (a << 8n) | BigInt(v), 0n);
      expect(bits).toBe(BigInt(length * 8));
      expect(p.blocks).toBe(Math.ceil((length + 9) / 64));
    }
    expect(hashPad(hashUtf8('abc')).zeroBytes).toBe(52);
    expect(hashPad(hashUtf8(HASH_LONG)).blocks).toBe(2);
  });
  it('checks rotations and sigma operations against a separate BigInt implementation', () => {
    for (const x of [0, 1, 0x80000000, 0xffffffff, 0x61626380, 0xdeadbeef]) {
      for (let r = 0; r < 32; r++) expect(hashRot(x, r)).toBe(referenceRot(x, r));
      expect(hashSmall0(x)).toBe((referenceRot(x, 7) ^ referenceRot(x, 18) ^ (x >>> 3)) >>> 0);
      expect(hashSmall1(x)).toBe((referenceRot(x, 17) ^ referenceRot(x, 19) ^ (x >>> 10)) >>> 0);
      expect(hashBig0(x)).toBe(
        (referenceRot(x, 2) ^ referenceRot(x, 13) ^ referenceRot(x, 22)) >>> 0,
      );
      expect(hashBig1(x)).toBe(
        (referenceRot(x, 6) ^ referenceRot(x, 11) ^ referenceRot(x, 25)) >>> 0,
      );
    }
    expect(hashAdd(0xffffffff, 1)).toBe(0);
    expect(hashAdd(...Array(5).fill(0xffffffff))).toBe(0xfffffffb);
    for (let a = 0; a < 2; a++)
      for (let b = 0; b < 2; b++)
        for (let c = 0; c < 2; c++) {
          expect(hashChoose(a, b, c)).toBe(a ? b : c);
          expect(hashMajority(a, b, c)).toBe(a + b + c >= 2 ? 1 : 0);
        }
  });
  it('preserves the tracked bit into W0, W16 and the first T1, using exact real operations', () => {
    const comparison = hashCompare(hashUtf8('abc')),
      a = comparison.original.blocks[0],
      b = comparison.altered.blocks[0];
    expect(a.schedule[0] ^ b.schedule[0]).toBe(1 << 24);
    expect(a.schedule[16] ^ b.schedule[16]).toBe(1 << 24);
    expect(a.rounds[0].t1).toBe(0x54da50e8);
    expect(a.rounds[0].t2).toBe(0x08909ae5);
    expect(hashAdd(b.rounds[0].t1, 1 << 24)).toBe(a.rounds[0].t1);
    expect(a.rounds[0].t2).toBe(b.rounds[0].t2);
    expect(comparison.history[0].slice(0, 6)).toEqual([0, 3, 23, 48, 80, 109]);
  });
  it('matches WebCrypto for all 24 one-bit changes of abc and computes true Hamming counts', async () => {
    const bytes = hashUtf8('abc');
    for (let byte = 0; byte < 3; byte++)
      for (let bit = 0; bit < 8; bit++) {
        const c = hashCompare(bytes, byte, bit);
        expect(hashDistance([...bytes], [...c.altered.payload])).toBe(1);
        expect(c.altered.digest).toBe(await webHash(c.altered.payload));
        const independent = c.original.words
          .map((v, i) => hashBits(v ^ c.altered.words[i]).reduce((s, b) => s + b, 0))
          .reduce((s, n) => s + n, 0);
        expect(c.difference).toBe(independent);
      }
    const c = hashCompare(bytes);
    expect(c.difference).toBe(112);
    expect(c.altered.digest).toBe(
      '89f900390e14d37c405c75244fb086aa35b54c0fb6ec3638c1c21451d4743d11',
    );
    expect(c.history[0].some((v, i, all) => i > 0 && v < all[i - 1])).toBe(true);
    expect(hashCompare(bytes, 0, 0, false).difference).toBe(0);
    expect(hashCompare(new Uint8Array()).changed).toBe(false);
  });
  it('propagates only from the changed block onward and performs feed-forward for every block', () => {
    const bytes = new Uint8Array(130).fill(65),
      c = hashCompare(bytes, 100, 7);
    expect(c.original.blocks[0]).toEqual(c.altered.blocks[0]);
    expect(c.history[0].every((v) => v === 0)).toBe(true);
    expect(c.difference).toBeGreaterThan(0);
    for (const run of [c.original, c.altered])
      run.blocks.forEach((block, i) => {
        expect(block.input).toEqual(i === 0 ? [...HASH_INITIAL] : run.blocks[i - 1].output);
        expect(block.output).toEqual(
          block.working.map((v, j) => Number((BigInt(v) + BigInt(block.input[j])) & 0xffffffffn)),
        );
        expect(block.rounds[0].before).toEqual(block.input);
        expect(block.rounds[63].after).toEqual(block.working);
        for (let j = 1; j < 64; j++)
          expect(block.rounds[j].before).toEqual(block.rounds[j - 1].after);
      });
  });
  it('directly reconstructs entering, round and feed-forward states on arbitrary seeks', () => {
    const run = hashRun(hashUtf8(HASH_LONG));
    for (let block = 0; block < 2; block++)
      for (let step = 65; step >= 0; step--) {
        const actual = hashAt(run, block, step);
        expect(actual).toEqual(
          step === 0
            ? run.blocks[block].input
            : step === 65
              ? run.blocks[block].output
              : run.blocks[block].rounds[step - 1].after,
        );
        actual[0] = 0;
        expect(hashAt(run, block, step)[0]).not.toBe(0);
      }
    const later = hashAt(run, 1, 32);
    hashAt(run, 0, 1);
    expect(hashAt(run, 1, 32)).toEqual(later);
    expect(hashShot(7, 0.8).comparisonStep).toBe(65);
    expect(hashShot(6, 0.6).longBlock).toBe(1);
    expect(hashShot(4, 1).round).toBe(63);
    expect(hashShot(NaN, NaN)).toEqual(hashShot(0, 0));
  });
  it('rejects malformed values, enforces only the trace limit, and does not mutate inputs', () => {
    for (const text of ['\ud800', '\udc00', 'x\ud800y'])
      expect(() => hashUtf8(text)).toThrow(RangeError);
    for (const bytes of [[256], [-1], [0.5], [NaN]])
      expect(() => hashRun(bytes)).toThrow(RangeError);
    expect(() => hashRun(new Uint8Array(HASH_MAX_BYTES + 1))).toThrow(RangeError);
    expect(hashDigest(new Uint8Array(HASH_MAX_BYTES + 1))).toHaveLength(64);
    for (const [byte, bit] of [
      [-1, 0],
      [3, 0],
      [0, 8],
      [NaN, 0],
    ])
      expect(() => hashFlip(hashUtf8('abc'), byte, bit)).toThrow(RangeError);
    expect(() => hashSchedule([1])).toThrow(RangeError);
    expect(() => hashCompress(new Uint8Array(64), [1])).toThrow(RangeError);
    expect(() => hashDistance([1], [])).toThrow(RangeError);
    expect(() => hashAt(hashRun([1]), 0, 66)).toThrow(RangeError);
    const input = Object.freeze([97, 98, 99]);
    hashRun(input);
    expect(input).toEqual([97, 98, 99]);
    expect(hashHex(1)).toBe('00000001');
  });
});
