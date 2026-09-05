import { describe, expect, it } from 'vitest';
import {
  PK_KEYS,
  pkAt,
  pkDecrypt,
  pkDomain,
  pkEncrypt,
  pkExchange,
  pkGcd,
  pkGuess,
  pkInverse,
  pkKey,
  pkParse,
  pkPower,
  pkPrime,
  pkShot,
} from './public-key';
// Independent reference: full BigInt exponent first, then remainder. No square/multiply reuse.
const direct = (m: number, e: number, n: number) => Number(BigInt(m) ** BigInt(e) % BigInt(n));
describe('tiny textbook RSA, deliberately not a secure encryption scheme', () => {
  it('derives the exact lesson key, lambda inverse and Euclidean identities', () => {
    const key = PK_KEYS[0];
    expect([key.n, key.phi, key.lambda, key.e, key.d]).toEqual([187, 160, 80, 7, 23]);
    expect(key.e * key.d).toBe(1 + 2 * key.lambda);
    expect(key.bezout.x * key.e + key.bezout.y * key.lambda).toBe(1);
    for (const row of key.inverse)
      expect(row.dividend).toBe(row.quotient * row.divisor + row.remainder);
    expect(pkInverse(17, 780).d).toBe(413);
    // Classic arithmetic example, using lambda rather than phi selects the equivalent d=413.
    expect(pkKey(61, 53, 17).n).toBe(3233);
    expect(pkExchange(65, pkKey(61, 53, 17)).cipher).toBe(2790);
  });
  it('matches full-power reference for every message and ciphertext in all three preset domains', () => {
    for (const key of PK_KEYS) {
      const outputs = new Set<number>();
      for (let m = 0; m < key.n; m++) {
        const r = pkExchange(m, key);
        expect(r.cipher).toBe(direct(m, key.e, key.n));
        expect(r.recovered).toBe(m);
        expect(pkDecrypt(m, key).result).toBe(direct(m, key.d, key.n));
        outputs.add(r.cipher);
      }
      expect(outputs.size).toBe(key.n);
      expect(pkDomain(key).correct).toBe(key.n);
    }
  });
  it('includes zero, n−1 and messages not coprime to n without applying Euler to zero residues', () => {
    const cases = [
      [0, 0],
      [1, 1],
      [11, 88],
      [17, 85],
      [42, 15],
      [186, 186],
    ];
    for (const [m, c] of cases) {
      const r = pkExchange(m);
      expect(r.cipher).toBe(c);
      expect(r.recovered).toBe(m);
      expect(r.residues.every((s) => s.original === s.recovered)).toBe(true);
    }
    expect(pkDomain(PK_KEYS[0])).toEqual({
      count: 187,
      correct: 187,
      distinct: 187,
      nonCoprime: 27,
    });
  });
  it('records exact squaring and accumulation, including the unused eighth power', () => {
    const r = pkExchange(42);
    expect(r.encryption.steps.map((s) => s.factor)).toEqual([42, 81, 16]);
    expect(r.encryption.steps.map((s) => s.after)).toEqual([42, 36, 15]);
    expect(r.decryption.steps.map((s) => s.factor)).toEqual([15, 38, 135, 86, 103]);
    expect(r.decryption.steps.map((s) => s.after)).toEqual([15, 9, 93, 93, 42]);
    expect(r.decryption.steps.map((s) => s.selected)).toEqual([true, true, true, false, true]);
    for (const trace of [r.encryption, r.decryption])
      for (const row of trace.steps) {
        expect(row.factor).toBe(direct(trace.base, row.power, trace.modulus));
        expect(row.product).toBe(row.before * (row.selected ? row.factor : 1));
        expect(row.product).toBe(row.quotient * trace.modulus + row.after);
        if (row.squareProduct !== null)
          expect(row.squareProduct).toBe(row.squareQuotient! * trace.modulus + row.factor);
      }
    expect(pkPower(0, 0, 187).result).toBe(1);
  });
  it('finds a small message using only public input and shows deterministic repetition', () => {
    const publicKey = { n: 187, e: 7 };
    const attempts = pkGuess(15, publicKey);
    expect(attempts.length).toBe(43);
    expect(attempts.at(-1)).toEqual({ message: 42, cipher: 15, matches: true });
    expect(attempts.slice(0, -1).every((a) => !a.matches)).toBe(true);
    expect(pkEncrypt(42, publicKey)).toEqual(pkEncrypt(42, publicKey));
    expect(pkGuess(186, publicKey).length).toBe(187);
  });
  it('checks every valid exponent for all pairs in a small independently enumerated prime set', () => {
    for (const p of [3, 5, 7, 11, 13])
      for (const q of [3, 5, 7, 11, 13])
        if (p < q) {
          for (let e = 3; e < p * q; e++)
            if (pkGcd(e, (p - 1) * (q - 1)) === 1) {
              const k = pkKey(p, q, e);
              expect((k.e * k.d) % k.lambda).toBe(1);
              for (let m = 0; m < k.n; m++) expect(pkExchange(m, k).recovered).toBe(m);
            }
        }
  });
  it('rejects invalid keys, invalid representatives and ambiguous UI input instead of wrapping', () => {
    for (const args of [
      [11, 11, 7],
      [2, 17, 7],
      [9, 17, 7],
      [101, 17, 7],
      [11, 17, 8],
      [11, 17, 1],
      [11, 17, 187],
      [11.5, 17, 7],
    ])
      expect(() => pkKey(...(args as [number, number, number]))).toThrow();
    for (const m of [-1, 187, Infinity, NaN, 1.2]) expect(() => pkEncrypt(m, PK_KEYS[0])).toThrow();
    expect(() => pkDecrypt(187, PK_KEYS[0])).toThrow();
    expect(() => pkDecrypt(15, { ...PK_KEYS[0], d: 22 })).toThrow();
    expect(() => pkDecrypt(15, { ...PK_KEYS[0], n: 188 })).toThrow();
    for (const s of ['', '-1', '1.2', ' 42', '42 ', '042', '1e2', '0x2a', '187', 'Infinity'])
      expect(pkParse(s, 187)).toBeNull();
    expect(pkParse('0', 187)).toBe(0);
    expect(pkParse('186', 187)).toBe(186);
    expect(pkPrime(97)).toBe(true);
    expect(pkPrime(91)).toBe(false);
  });
  it('reconstructs direct/backward seeks exactly, copies selected rows and validates boundaries', () => {
    const trace = pkExchange(42).decryption;
    const forward = Array.from({ length: 6 }, (_, i) => pkAt(trace, i));
    for (const i of [5, 0, 3, 1, 4, 2, 5]) expect(pkAt(trace, i)).toEqual(forward[i]);
    const copy = pkAt(trace, 1);
    copy.current!.after = 999;
    expect(pkAt(trace, 1).accumulator).toBe(15);
    expect(() => pkAt(trace, 6)).toThrow();
    expect(() => pkAt(trace, 0.5)).toThrow();
    for (let c = 0; c < 8; c++)
      for (const p of [0, 0.25, 0.5, 0.75, 1]) expect(pkShot(c, p)).toEqual(pkShot(c, p));
    expect(pkShot(3, 1).encryptionSteps).toBe(3);
    expect(pkShot(4, 1).decryptionSteps).toBe(5);
    expect(pkShot(6, 1).guesses).toBe(43);
    expect(pkShot(7, 1).secureStage.id).toBe('identity');
    expect(() => pkShot(0, NaN)).toThrow();
    expect(pkShot(7, 2)).toEqual(pkShot(7, 1));
  });
});
