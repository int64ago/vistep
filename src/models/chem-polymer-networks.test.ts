import { describe, it, expect } from 'vitest';
import {
  vinylGeometry,
  condensation,
  esterLink,
  resinEdges,
  resinState,
  absorb,
  gelNodes,
  gelLinks,
  decantGeometry,
} from './chem-polymer-networks';
describe('finite polymer models', () => {
  it('keeps the departing hydroxyl hydrogen distinct from its oxygen throughout the diagram', () => {
    for (let i = 0; i <= 100; i++) {
      const a = esterLink(i / 100);
      expect(Math.hypot(a.acidH.x - a.acidO.x, a.acidH.y - a.acidO.y)).toBeGreaterThanOrEqual(
        31.99,
      );
    }
  });
  it('preserves monomer identities and continuous bond-site motion', () => {
    for (let k = 0; k < 1000; k++) {
      const a = vinylGeometry(k / 1000),
        b = vinylGeometry((k + 1) / 1000);
      expect(a.filter((v) => v.chlorine)).toHaveLength(4);
      a.forEach((v, i) => {
        expect(v.id).toBe(b[i].id);
        expect(Math.hypot(v.x - b[i].x, v.y - b[i].y)).toBeLessThan(0.3);
      });
    }
    expect(esterLink(1).acidO.y).toBe(180);
    expect(esterLink(1).alcoholO.y).toBe(75);
  });
  it('retains both end groups, avoiding 2n waters for an open chain', () => {
    for (let n = 1; n < 20; n++) {
      const a = condensation(n);
      expect(a.water).toBe(a.monomers - 1);
      expect(a.acidEnds + a.alcoholEnds).toBe(2);
    }
  });
  it('uses each ortho/para substitution site once and requires excess formaldehyde plus curing', () => {
    const sites = resinEdges.flatMap((e) => [`${e.a}:${e.av}`, `${e.b}:${e.bv}`]);
    expect(new Set(sites).size).toBe(sites.length);
    expect(sites.every((s) => !s.endsWith(':0'))).toBe(true);
    expect(resinState(true, false, 1).crosslink).toBe(0);
    expect(resinState(false, true, 1).crosslink).toBe(0);
    expect(resinState(true, true, 1).crosslink).toBe(1);
  });
  it('conserves water, subtracts tare and reveals retained-free-water bias', () => {
    for (const water of [0, 10, 70])
      for (const cap of [0, 12, 50, 100])
        for (const drain of [0, 0.3, 1]) {
          const a = absorb(1, water, cap, 1, drain);
          expect(a.bound + a.drained + a.residual).toBeCloseTo(water);
          expect(a.ratio).toBeLessThanOrEqual(water);
          expect(a.gross - a.tare - a.dry).toBeCloseTo(a.bound + a.residual);
        }
    const a = absorb(1, 70, 50, 1, 1);
    expect(a.gross).toBe(94);
    expect(a.ratio).toBe(50);
    expect(absorb(1, 70, 12, 1, 0).apparentRatio).toBe(70);
  });
  it('retains all gel links while swelling, and starts a decant stream at the rotated rim', () => {
    const a = gelNodes(0),
      b = gelNodes(1);
    expect(gelLinks.every(([i, j]) => a[i] && a[j] && b[i] && b[j])).toBe(true);
    expect(b[0].x).toBeLessThan(a[0].x);
    expect(decantGeometry(0).lip.x).toBe(55);
    expect(decantGeometry(1).angle).toBeCloseTo(0);
    expect(decantGeometry(0.5).stream).toBe(1);
  });
});
