import { describe, expect, it } from 'vitest';
import { dhBrute, dhExchange, dhMitm, dhPow, dhPublic, dhShared } from './diffie-hellman';
describe('tiny subgroup Diffie–Hellman', () => {
  it('agrees for all100 exponent pairs and matches independent BigInt exponentiation', () => {
    for (let a = 1; a <= 10; a++)
      for (let b = 1; b <= 10; b++) {
        const q = dhExchange(a, b);
        expect(q.A).toBe(Number(2n ** BigInt(a) % 23n));
        expect(q.B).toBe(Number(2n ** BigInt(b) % 23n));
        expect(q.alice).toBe(q.bob);
        expect(q.alice).toBe(Number(2n ** BigInt(a * b) % 23n));
      }
    expect(dhExchange()).toMatchObject({ A: 18, B: 13, alice: 6, bob: 6 });
    expect(dhExchange(7, 7).alice).toBe(9);
  });
  it('substitutes two public values and lets the intermediary compute both endpoint secrets', () => {
    for (let a = 1; a <= 10; a++)
      for (let b = 1; b <= 10; b++) {
        const q = dhMitm(a, b);
        expect(q.alice).toBe(q.attackerAlice);
        expect(q.bob).toBe(q.attackerBob);
      }
    expect(dhMitm()).toMatchObject({
      toAlice: 8,
      toBob: 16,
      alice: 13,
      bob: 18,
      attackerAlice: 13,
      attackerBob: 18,
    });
  });
  it('makes the deliberately tiny group completely enumerable, not secure by appearance', () => {
    const values = Array.from({ length: 11 }, (_, i) => dhPow(2, i));
    expect(new Set(values).size).toBe(11);
    expect(dhPow(2, 11)).toBe(1);
    for (let i = 1; i <= 10; i++) expect(dhBrute(dhPublic(i)).recovered).toBe(i);
    expect(dhBrute(5).recovered).toBeNull();
  });
  it('validates exponents and received group membership', () => {
    for (const x of [0, 11, 1.5, NaN]) expect(() => dhPublic(x)).toThrow();
    for (const y of [0, 1, 5, 23, NaN]) expect(() => dhShared(y, 6)).toThrow();
    expect(() => dhPow(2, -1)).toThrow();
  });
});
