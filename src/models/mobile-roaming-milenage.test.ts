import { describe, expect, it } from 'vitest';
import {
  aes128Encrypt,
  deriveKasme,
  hmacSha256,
  milenage,
  milenageOpc,
  mrBitDistance,
  mrBytes,
  mrFlipBit,
  mrHex,
  plmnIdBytes,
} from './mobile-roaming-milenage';

describe('AES-128', () => {
  it('matches the FIPS-197 Appendix C.1 example', () => {
    const out = aes128Encrypt(
      mrBytes('000102030405060708090a0b0c0d0e0f'),
      mrBytes('00112233445566778899aabbccddeeff'),
    );
    expect(mrHex(out)).toBe('69c4e0d86a7b0430d8cdb78070b4c55a');
  });
  it('matches the FIPS-197 Appendix B cipher example', () => {
    const out = aes128Encrypt(
      mrBytes('2b7e151628aed2a6abf7158809cf4f3c'),
      mrBytes('3243f6a8885a308d313198a2e0370734'),
    );
    expect(mrHex(out)).toBe('3925841d02dc09fbdc118597196a0b32');
  });
  it('rejects wrong sizes', () => {
    expect(() => aes128Encrypt(new Uint8Array(15), new Uint8Array(16))).toThrow(RangeError);
    expect(() => aes128Encrypt(new Uint8Array(16), new Uint8Array(8))).toThrow(RangeError);
  });
});

// 3GPP TS 35.207 §4.3 / TS 35.208 §4.3 conformance test data.
const sets = [
  {
    name: 'test set 1',
    k: '465b5ce8b199b49faa5f0a2ee238a6bc',
    rand: '23553cbe9637a89d218ae64dae47bf35',
    sqn: 'ff9bb4d0b607',
    amf: 'b9b9',
    op: 'cdc202d5123e20f62b6d676ac72cb318',
    opc: 'cd63cb71954a9f4e48a5994e37a02baf',
    f1: '4a9ffac354dfafb3',
    f1s: '01cfaf9ec4e871e9',
    f2: 'a54211d5e3ba50bf',
    f3: 'b40ba9a3c58b2a05bbf0d987b21bf8cb',
    f4: 'f769bcd751044604127672711c6d3441',
    f5: 'aa689c648370',
    f5s: '451e8beca43b',
  },
  {
    name: 'test set 2',
    k: '0396eb317b6d1c36f19c1c84cd6ffd16',
    rand: 'c00d603103dcee52c4478119494202e8',
    sqn: 'fd8eef40df7d',
    amf: 'af17',
    op: 'ff53bade17df5d4e793073ce9d7579fa',
    opc: '53c15671c60a4b731c55b4a441c0bde2',
    f1: '5df5b31807e258b0',
    f1s: 'a8c016e51ef4a343',
    f2: 'd3a628ed988620f0',
    f3: '58c433ff7a7082acd424220f2b67c556',
    f4: '21a8c1f929702adb3e738488b9f5c5da',
    f5: 'c47783995f72',
    f5s: '30f1197061c1',
  },
];

describe('MILENAGE', () => {
  for (const s of sets)
    it(`reproduces ${s.name}`, () => {
      const k = mrBytes(s.k);
      expect(mrHex(milenageOpc(k, mrBytes(s.op)))).toBe(s.opc);
      const out = milenage({
        k,
        rand: mrBytes(s.rand),
        sqn: mrBytes(s.sqn),
        amf: mrBytes(s.amf),
        op: mrBytes(s.op),
      });
      expect(mrHex(out.macA)).toBe(s.f1);
      expect(mrHex(out.macS)).toBe(s.f1s);
      expect(mrHex(out.res)).toBe(s.f2);
      expect(mrHex(out.ck)).toBe(s.f3);
      expect(mrHex(out.ik)).toBe(s.f4);
      expect(mrHex(out.ak)).toBe(s.f5);
      expect(mrHex(out.akStar)).toBe(s.f5s);
    });

  it('changes about half of RES when one key bit flips', () => {
    const s = sets[0];
    const base = {
      rand: mrBytes(s.rand),
      sqn: mrBytes(s.sqn),
      amf: mrBytes(s.amf),
      opc: mrBytes(s.opc),
    };
    const res = milenage({ ...base, k: mrBytes(s.k) }).res;
    const distances = Array.from({ length: 128 }, (_, i) =>
      mrBitDistance(res, milenage({ ...base, k: mrFlipBit(mrBytes(s.k), i) }).res),
    );
    expect(Math.min(...distances)).toBeGreaterThan(10);
    const mean = distances.reduce((a, b) => a + b, 0) / distances.length;
    expect(mean).toBeGreaterThan(26);
    expect(mean).toBeLessThan(38);
  });

  it('requires OP or OPc and exact field sizes', () => {
    const z = (n: number) => new Uint8Array(n);
    expect(() => milenage({ k: z(16), rand: z(16), sqn: z(6), amf: z(2) })).toThrow(RangeError);
    expect(() => milenage({ k: z(16), rand: z(15), sqn: z(6), amf: z(2), opc: z(16) })).toThrow(
      RangeError,
    );
  });
});

describe('bit helpers', () => {
  it('flips exactly one bit from the most significant end', () => {
    expect(mrHex(mrFlipBit(mrBytes('0000'), 0))).toBe('8000');
    expect(mrHex(mrFlipBit(mrBytes('0000'), 15))).toBe('0001');
    expect(() => mrFlipBit(mrBytes('00'), 8)).toThrow(RangeError);
    expect(mrBitDistance(mrBytes('ff00'), mrBytes('0f01'))).toBe(5);
  });
  it('rejects malformed hex', () => {
    expect(() => mrBytes('abc')).toThrow(RangeError);
    expect(() => mrBytes('zz')).toThrow(RangeError);
  });
});

describe('HMAC-SHA-256 and K_ASME', () => {
  it('matches RFC 4231 test cases 1 and 2', () => {
    const enc = (s: string) => new TextEncoder().encode(s);
    expect(mrHex(hmacSha256(new Uint8Array(20).fill(0x0b), enc('Hi There')))).toBe(
      'b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7',
    );
    expect(mrHex(hmacSha256(enc('Jefe'), enc('what do ya want for nothing?')))).toBe(
      '5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843',
    );
  });
  it('matches RFC 4231 test case 6 (key longer than one block)', () => {
    const enc = (s: string) => new TextEncoder().encode(s);
    expect(
      mrHex(
        hmacSha256(
          new Uint8Array(131).fill(0xaa),
          enc('Test Using Larger Than Block-Size Key - Hash Key First'),
        ),
      ),
    ).toBe('60e431591ee0b67f0d8a26aacbf5b77f8e0bc6213728c5140546040f0ee37f54');
  });
  it('encodes PLMN identities in BCD', () => {
    expect(mrHex(plmnIdBytes('001', '01'))).toBe('00f110');
    expect(mrHex(plmnIdBytes('310', '410'))).toBe('130014');
    expect(() => plmnIdBytes('01', '01')).toThrow(RangeError);
  });
  it('binds K_ASME to the serving network identity', () => {
    const ck = mrBytes(sets[0].f3),
      ik = mrBytes(sets[0].f4),
      conceal = mrBytes('555555555555');
    const a = deriveKasme(ck, ik, plmnIdBytes('002', '01'), conceal);
    const b = deriveKasme(ck, ik, plmnIdBytes('002', '02'), conceal);
    expect(a.length).toBe(32);
    expect(mrHex(a)).not.toBe(mrHex(b));
    expect(mrHex(deriveKasme(ck, ik, plmnIdBytes('002', '01'), conceal))).toBe(mrHex(a));
  });
});
