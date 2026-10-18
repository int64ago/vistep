import { expect, it } from 'vitest';
import {
  nuclearTransfer,
  constrictedEmbryo,
  amoebaFragment,
  algaRegeneration,
  macaqueOutcomes,
} from './bio-nuclear-evidence';
it('tracks exactly one transferred donor nucleus and keeps cytoplasmic origin distinct', () => {
  for (const p of [0, 0.3, 0.5, 1]) {
    const s = nuclearTransfer(p);
    expect(Number(s.donorNucleus) + Number(s.recipientNucleus)).toBe(1);
    expect(s.cytoplasmicOrigin).toBe('egg');
  }
  expect(nuclearTransfer(1, false).outcomeVisible).toBe(false);
});
it('allows delayed division only after a nucleus reaches the other half', () => {
  expect(constrictedEmbryo(0.5).leftCells).toBeGreaterThan(1);
  expect(constrictedEmbryo(0.5).rightCells).toBe(1);
  expect(constrictedEmbryo(1, false).rightCells).toBe(1);
  expect(constrictedEmbryo(1, true).rightCells).toBeGreaterThan(1);
});
it('distinguishes residual digestion from sustained nuclear-dependent activity', () => {
  expect(amoebaFragment(0.2, false, false).digestionRemaining).toBeGreaterThan(0);
  expect(amoebaFragment(0.2, false, false).active).toBe(false);
  expect(amoebaFragment(0.9, false, true).active).toBe(true);
});
it('regenerated algal cap follows basal nuclear origin and does not imply perfect cloning efficiency', () => {
  expect(algaRegeneration(1, 'daisy', 'umbrella').cap).toBe('daisy');
  expect(algaRegeneration(0.2, 'daisy', 'umbrella').cap).toBe(null);
  expect(macaqueOutcomes.healthyInfants).toBeLessThan(macaqueOutcomes.pregnancies);
  expect(macaqueOutcomes.pregnancies).toBeLessThan(macaqueOutcomes.surrogates);
});

import { cleavageRegions, amoebaOutline } from './bio-nuclear-evidence';
it('moves the same nucleus continuously from donor to recipient and exposes it on top of the egg', () => {
  for (let p = 0; p < 1; p += 0.001) {
    const a = nuclearTransfer(p),
      b = nuclearTransfer(p + 0.001);
    expect(a.nucleusId).toBe(b.nucleusId);
    expect(
      Math.hypot(
        a.nucleusPosition.x - b.nucleusPosition.x,
        a.nucleusPosition.y - b.nucleusPosition.y,
      ),
    ).toBeLessThan(0.8);
  }
  expect(nuclearTransfer(0).nucleusPosition).toEqual({ x: 75, y: 70 });
  expect(nuclearTransfer(0.4).nucleusPosition.x).toBe(260);
  expect(nuclearTransfer(0.4).nucleusPosition.y).toBeCloseTo(70);
});
it('partitions each embryo half without overlapping cell interiors and passes through the open bridge', () => {
  for (const count of [1, 2, 4, 8, 16]) {
    const cells = cleavageRegions(count, 106, 126);
    for (let i = 0; i < cells.length; i++) {
      expect(Math.hypot(cells[i].nucleus.x - 106, cells[i].nucleus.y - 126)).toBeLessThanOrEqual(
        47.001,
      );
      for (let j = i + 1; j < cells.length; j++) {
        const a = cells[i],
          b = cells[j],
          overlapX = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x),
          overlapY = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
        expect(overlapX <= 0 || overlapY <= 0).toBe(true);
      }
    }
  }
  const start = constrictedEmbryo(0.48);
  expect(start.leftCells).toBe(16);
  expect(start.nucleusPoint).toEqual(cleavageRegions(16, 106, 126)[7].nucleus);
  expect(start.movingNucleus).toBe(true);
  for (let p = 0.48; p <= 0.66; p += 0.001) {
    const a = constrictedEmbryo(p),
      b = constrictedEmbryo(p + 0.001);
    expect(
      Math.hypot(a.nucleusPoint.x - b.nucleusPoint.x, a.nucleusPoint.y - b.nucleusPoint.y),
    ).toBeLessThan(2);
    if (a.nucleusPoint.x >= 174 && a.nucleusPoint.x <= 188) expect(a.nucleusPoint.y).toBe(126);
  }
  expect(constrictedEmbryo(0.66).nucleusPoint).toEqual({ x: 238, y: 126 });
  expect(constrictedEmbryo(0.66).rightNucleus).toBe(true);
  expect(constrictedEmbryo(0.66).rightCells).toBe(1);
});
it('restores amoeba state and nucleus position without a rescue-time scale jump', () => {
  expect(amoebaFragment(0.9, false, true).rescued).toBe(true);
  expect(amoebaFragment(0.5, false, true).rescued).toBe(false);
  for (let p = 0.38; p < 1; p += 0.001) {
    const a = amoebaFragment(p, false, true),
      b = amoebaFragment(p + 0.001, false, true);
    expect(Math.abs(a.maintenance - b.maintenance)).toBeLessThan(0.005);
    expect(
      Math.hypot(
        a.nucleusPosition.x - b.nucleusPosition.x,
        a.nucleusPosition.y - b.nucleusPosition.y,
      ),
    ).toBeLessThan(1);
    expect(amoebaOutline(a.activity)).not.toContain('NaN');
  }
  const end = amoebaFragment(1, false, true);
  expect(end.nucleusPosition).toEqual({ x: 76, y: 104 });
  expect(end.maintenance).toBe(1);
});
