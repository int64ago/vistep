import { describe, it, expect } from 'vitest';
import {
  C60,
  C70,
  host,
  norm,
  sub,
  competition,
  release,
  crown,
  crownFit,
  ions,
  crownCavities,
  guestPosition,
  releasedGuestPosition,
  add,
} from './chem-host-guest-recognition';
describe('host guest structures and selective mass balance', () => {
  it('uses genuine three-coordinated fullerene cages with correct atom and edge counts', () => {
    for (const [s, n, e] of [
      [C60, 60, 90],
      [C70, 70, 105],
    ] as const) {
      expect(s.atoms).toHaveLength(n);
      expect(s.bonds).toHaveLength(e);
      for (let i = 0; i < n; i++) expect(s.bonds.filter((b) => b.includes(i))).toHaveLength(3);
      for (const [a, b] of s.bonds) {
        const d = norm(sub(s.atoms[a].p, s.atoms[b].p));
        expect(d).toBeGreaterThan(1.3);
        expect(d).toBeLessThan(1.6);
      }
    }
    const extent = (s: typeof C60) =>
      Math.max(...s.atoms.map((a) => a.p.z)) - Math.min(...s.atoms.map((a) => a.p.z));
    expect(extent(C70)).toBeGreaterThan(7.7);
  });
  it('closes all eight phenolic units through physical methylene bridges', () => {
    expect(host.atoms.filter((a) => a.element === 'C')).toHaveLength(56);
    expect(host.atoms.filter((a) => a.element === 'O')).toHaveLength(8);
    expect(host.bonds).toHaveLength(72);
    for (const [a, b] of host.bonds) {
      const d = norm(sub(host.atoms[a].p, host.atoms[b].p));
      expect(Number.isFinite(d)).toBe(true);
      expect(d).toBeGreaterThan(1.35);
      expect(d).toBeLessThan(1.52);
    }
  });
  it('conserves each guest and host and retains imperfect selectivity', () => {
    for (const k of [1, 3, 10, 30, 100]) {
      const s = competition(k, 3);
      expect(s.b60 + s.f60).toBeCloseTo(0.6, 12);
      expect(s.b70 + s.f70).toBeCloseTo(0.4, 12);
      expect(s.hostFree + s.b60 + s.b70).toBeCloseTo(0.7, 12);
      expect(s.b60 / (s.hostFree * s.f60)).toBeCloseTo(k, 9);
      expect(s.b70 / (s.hostFree * s.f70)).toBeCloseTo(3, 9);
    }
    expect(competition().b70).toBeGreaterThan(0);
    expect(competition().purity).toBeLessThan(1);
    expect(competition(3, 3).purity).toBeCloseTo(0.6);
  });
  it('releases both bound species while retaining their identities and totals', () => {
    for (let i = 0; i <= 100; i++) {
      const s = release(i / 100);
      expect(s.retained60 + s.released60 + s.f60).toBeCloseTo(0.6);
      expect(s.retained70 + s.released70 + s.f70).toBeCloseTo(0.4);
      expect(s.recoveredHost + s.retained60 + s.retained70 + s.hostFree).toBeCloseTo(0.7);
      if (i)
        expect(norm(sub(guestPosition(i / 100), guestPosition((i - 1) / 100)))).toBeLessThan(0.136);
    }
  });
  it('lifts the same guest clear before moving sideways and conserves its cage through release', () => {
    expect(releasedGuestPosition(0)).toEqual(guestPosition(1));
    for (let i = 0; i <= 1000; i++) {
      const p = i / 1000,
        guest = releasedGuestPosition(p);
      if (i) expect(norm(sub(guest, releasedGuestPosition((i - 1) / 1000)))).toBeLessThan(0.05);
      const hostShift = { x: -5 * p, y: 0, z: 0 };
      const min = Math.min(
        ...host.atoms.flatMap((h) =>
          C60.atoms.map((g) => norm(sub(add(h.p, hostShift), add(g.p, guest)))),
        ),
      );
      expect(min).toBeGreaterThan(2.7);
    }
  });
  it('builds closed O–CH2–CH2 crown topologies with internally consistent lengths', () => {
    for (const m of [4, 5, 6, 7] as const) {
      const s = crown(m);
      expect(s.atoms).toHaveLength(3 * m);
      expect(s.bonds).toHaveLength(3 * m);
      expect(s.atoms.filter((a) => a.element === 'O')).toHaveLength(m);
      for (let i = 0; i < 3 * m; i++) expect(s.bonds.filter((b) => b.includes(i))).toHaveLength(2);
      for (const [a, b] of s.bonds) {
        const d = norm(sub(s.atoms[a].p, s.atoms[b].p));
        expect(d).toBeCloseTo(
          s.atoms[a].element === 'C' && s.atoms[b].element === 'C' ? 1.54 : 1.43,
          9,
        );
      }
    }
  });
  it('preserves source cavity intervals and keeps oversized ions outside the donor contact shell', () => {
    expect(crownCavities[6]).toEqual([260, 320]);
    expect(ions.K).toBe(276);
    for (const m of [4, 5, 6, 7] as const)
      for (const ion of Object.keys(ions) as (keyof typeof ions)[]) {
        const f = crownFit(m, ion);
        expect(f.donorDistance).toBeGreaterThanOrEqual(f.ionRadius + 1.4 - 1e-10);
      }
    expect(crownFit(4, 'Cs').ionPosition.z).toBeGreaterThan(0);
    expect(crownFit(6, 'K').ionPosition.z).toBe(0);
  });
});
