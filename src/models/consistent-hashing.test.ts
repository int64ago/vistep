import { describe, it, expect } from 'vitest';
import {
  ringBuild,
  ringCompare,
  ringOwner,
  ringTokens,
  ringHash,
  moduloChanges,
  RING_KEYS,
} from './consistent-hashing';
describe('clockwise consistent hashing', () => {
  it('chooses exact successor, including equality and wraparound', () => {
    const tokens = [
      { node: 'A', replica: 0, position: 0.2 },
      { node: 'B', replica: 0, position: 0.8 },
    ];
    expect(ringOwner(0.2, tokens).node).toBe('A');
    expect(ringOwner(0.3, tokens).node).toBe('B');
    expect(ringOwner(0.99, tokens).node).toBe('A');
  });
  it('adding a node moves keys only to that node; deleting moves only its keys', () => {
    const keys = Array.from({ length: 500 }, (_, i) => `key${i}`);
    for (const replicas of [1, 4, 16]) {
      const a = ringBuild(['A', 'B', 'C'], replicas, keys),
        b = ringBuild(['A', 'B', 'C', 'D'], replicas, keys);
      for (const x of ringCompare(a, b)) if (x.changed) expect(x.after).toBe('D');
      const c = ringBuild(['A', 'C'], replicas, keys);
      for (const x of ringCompare(a, c)) if (x.changed) expect(x.before).toBe('B');
    }
  });
  it('the filmed removal actually migrates the default sample', () => {
    const before = ringBuild(),
      after = ringBuild(['A', 'B']);
    const changes = ringCompare(before, after).filter((a) => a.changed);
    expect(changes.length).toBe(15);
    expect(changes.every((a) => a.before === 'C')).toBe(true);
  });
  it('keeps keys and preexisting tokens byte-identical when membership grows', () => {
    const a = ringBuild(),
      b = ringBuild(['A', 'B', 'C', 'D']);
    expect(a.tokens).toEqual(b.tokens.filter((t) => t.node !== 'D'));
    expect(a.assignments.map((a) => a.position)).toEqual(b.assignments.map((a) => a.position));
    expect(ringHash('中文')).toBe(ringHash('中文'));
  });
  it('accounts for all keys and compares actual modulo remapping', () => {
    for (const r of [1, 8])
      expect(Object.values(ringBuild(['A', 'B', 'C'], r).loads).reduce((a, b) => a + b, 0)).toBe(
        RING_KEYS.length,
      );
    const ring = ringCompare(ringBuild(), ringBuild(['A', 'B', 'C', 'D'])).filter(
      (x) => x.changed,
    ).length;
    expect(moduloChanges().filter((x) => x.changed).length).toBeGreaterThan(ring);
  });
  it('rejects ambiguous membership and impossible coordinates', () => {
    expect(() => ringTokens(['A', 'A'])).toThrow();
    expect(() => ringTokens([])).toThrow();
    expect(() => ringOwner(1, ringTokens(['A']))).toThrow();
  });
});
