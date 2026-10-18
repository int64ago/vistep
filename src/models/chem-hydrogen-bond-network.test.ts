import { describe, it, expect } from 'vitest';
import {
  ice,
  OO,
  OH,
  HOH,
  centralId,
  shellIds,
  sub,
  dot,
  unit,
  length,
  rearranged,
  hydrogenLinks,
  pairGeometry,
  bulk,
  floatGeometry,
  rotate,
} from './chem-hydrogen-bond-network';
describe('hydrogen-bond structure', () => {
  it('has a hexagonal tetrahedral oxygen network and two donated hydrogens per site', () => {
    const c = ice.find((w) => w.id === centralId)!;
    const ns = ice.filter((w) => w.id !== c.id && Math.abs(length(sub(w.o, c.o)) - OO) < 1e-7);
    expect(ns).toHaveLength(4);
    expect(shellIds).toHaveLength(5);
    for (let i = 0; i < 4; i++)
      for (let j = i + 1; j < 4; j++)
        expect(dot(unit(sub(ns[i].o, c.o)), unit(sub(ns[j].o, c.o)))).toBeCloseTo(-1 / 3, 8);
    for (const w of ice) expect(w.donorIds).toHaveLength(2);
    const links = hydrogenLinks(ice);
    const central = links.filter((l) => l.from === c.id || l.to === c.id);
    expect(central).toHaveLength(4);
    expect(central.filter((l) => l.from === c.id)).toHaveLength(2);
    const pairs = new Set(links.map((l) => [l.from, l.to].sort().join('|')));
    expect(pairs.size).toBe(links.length);
  });
  it('keeps identities, covalent lengths and molecular angle during every frame of rearrangement', () => {
    for (let n = 0; n <= 100; n++) {
      const ws = rearranged(n / 100);
      expect(ws.map((w) => w.id)).toEqual(ice.map((w) => w.id));
      for (const w of ws) {
        for (const h of w.h) expect(length(sub(h, w.o))).toBeCloseTo(OH, 9);
        expect(
          (Math.acos(dot(unit(sub(w.h[0], w.o)), unit(sub(w.h[1], w.o)))) * 180) / Math.PI,
        ).toBeCloseTo(HOH, 8);
      }
      for (let i = 0; i < ws.length; i++)
        for (let j = i + 1; j < ws.length; j++)
          expect(length(sub(ws[i].o, ws[j].o))).toBeGreaterThan(2.1);
    }
  });
  it('retains some hydrogen bonds after rearrangement but changes the original network', () => {
    const before = hydrogenLinks(ice),
      after = hydrogenLinks(rearranged(1));
    expect(after.length).toBeGreaterThan(10);
    expect(after.filter((a) => a.score > 0.8).length).toBeLessThan(before.length);
    for (const l of after) expect(l.score).toBeGreaterThan(0);
  });
  it('labels O to O separately from H to O; direction and distance matter', () => {
    const p = pairGeometry(0, 2.76);
    expect(p.distance).toBe(2.76);
    expect(p.ha).toBeCloseTo(1.8);
    expect(p.score).toBe(1);
    expect(pairGeometry(70, 2.76).score).toBe(0);
    expect(pairGeometry(0, 4).score).toBe(0);
    for (const a of [0, 30, 70]) {
      const p = pairGeometry(a, 2.76);
      for (const w of p.waters)
        expect(
          (Math.acos(dot(unit(sub(w.h[0], w.o)), unit(sub(w.h[1], w.o)))) * 180) / Math.PI,
        ).toBeCloseTo(HOH, 8);
    }
  });
  it('conserves vessel water while the block enters and rises or sinks', () => {
    for (const d of [0.8, 0.92, 1, 1.2])
      for (let i = 0; i <= 100; i++) {
        const q = floatGeometry(i / 100, d);
        expect(q.waterArea).toBeCloseTo(q.initialArea, 7);
      }
    const q = floatGeometry(1, 0.92);
    expect(q.immersed / q.h).toBeCloseTo(0.92, 7);
  });
  it('preserves lengths under camera rotation and computes volume and flotation separately', () => {
    expect(length(rotate({ x: 2, y: 3, z: 4 }, 0.8, 0.7))).toBeCloseTo(Math.sqrt(29), 8);
    expect(bulk().iceVolume).toBe(100);
    expect(bulk().waterVolume).toBe(92);
    expect(bulk().submerged).toBe(0.92);
    expect(bulk(92, 1.1, 1).floats).toBe(false);
  });
});
