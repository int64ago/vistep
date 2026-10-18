import { it, expect } from 'vitest';
import {
  restrictionFrame,
  dnaComplement,
  filtrationFrame,
  precipitationFrame,
  identificationFrame,
  pcrYield,
  pcrFrame,
  plasmidFrame,
  gelFrame,
  gelDistance,
} from './bio-dna-engineering';
it('EcoRI exposesAATT while SmaI is blunt and ligase restoresbackbone nicks', () => {
  const a = restrictionFrame(1, 0);
  expect(a.overhang).toBe('AATT');
  expect(a.complement).toBe('AGCTTAAGCT');
  expect(a.nicks).toBe(2);
  expect(restrictionFrame(1, 1).nicks).toBe(2);
  expect(restrictionFrame(1, 2).nicks).toBe(0);
  expect(restrictionFrame(1, 2, false, false).nicks).toBe(2);
  expect(restrictionFrame(1, 0, true).overhang).toBe('');
  expect(dnaComplement(dnaComplement(a.sequence))).toBe(a.sequence);
  for (let i = 0; i <= 100; i++)
    expect(new Set(restrictionFrame(i / 100, 0).bases.map((a) => a.id)).size).toBe(20);
});
it('filtration conserves cross-sectional liquid area and carriesDNA through the funnel neck', () => {
  for (let i = 0; i <= 1000; i++) {
    const a = filtrationFrame(i / 1000);
    expect(a.source + a.receiver).toBeCloseTo(a.total);
    expect(a.level).toBeGreaterThan(190);
    for (const b of a.particles)
      if (b.y >= 122 && b.y <= 150) expect(Math.abs(b.x) + 3).toBeLessThan(9);
    for (const b of a.particles)
      if (b.y >= 93 && b.y <= 102) expect(Math.abs(b.x) + 3).toBeLessThan(7);
  }
  expect(filtrationFrame(1).source).toBe(0);
});
it('alcohol and colour reagent volumes balance and blank or no heat cannot turn blue', () => {
  for (let i = 0; i <= 1000; i++) {
    const a = precipitationFrame(i / 1000),
      b = identificationFrame(i / 1000);
    expect(a.stock + a.receiver).toBe(40);
    expect(b.stock + b.volume).toBe(9);
    expect(b.blankBlue).toBe(0);
  }
  expect(identificationFrame(1, false).blue).toBe(0);
  expect(identificationFrame(1, true, false).blue).toBe(0);
  expect(identificationFrame(1).blue).toBe(1);
  expect(identificationFrame(1).cooled).toBe(true);
  expect(identificationFrame(1).heated).toBe(false);
});
it('PCR changes temperature order and only extends after primer annealing', () => {
  expect([0.1, 0.5, 0.9].map((p) => pcrFrame(p).temperature)).toEqual([94, 55, 72]);
  expect(pcrFrame(0.5).extension).toBe(0);
  expect(pcrYield(3).total).toBe(8);
  expect(pcrYield(3).idealExact).toBe(2);
  expect(pcrYield(0).idealExact).toBe(0);
  expect(pcrYield(30).total).toBe(2 ** 30);
  expect(pcrYield(30, 0.8).total).toBeLessThan(2 ** 30);
  expect(pcrYield(30, 1, false).total).toBe(0);
});
it('entry, origin-dependent replication and expression are separate conditions', () => {
  expect(plasmidFrame(1, false).transcript).toBe(0);
  expect(plasmidFrame(1, true, false).copies).toBe(1);
  expect(plasmidFrame(1).copies).toBe(4);
  expect(plasmidFrame(0).entryY + 12).toBeLessThan(120);
  expect(plasmidFrame(1).entryY - 12).toBeGreaterThan(120);
});
it('linearDNA size controls migration but does not establish sequence identity', () => {
  expect(gelDistance(100)).toBeGreaterThan(gelDistance(1000));
  const a = gelFrame(1);
  expect(a.lanes[1].bands[0].y).toBe(a.lanes[2].bands[0].y);
  expect(a.lanes[3].bands).toHaveLength(0);
  expect(gelFrame(1, 'target', true).valid).toBe(false);
  expect(
    gelFrame(1, 'target', false, false)
      .lanes.flatMap((l) => l.bands)
      .every((b) => !b.visible),
  ).toBe(true);
  expect(gelFrame(1, 'offtarget').lanes[2].bands).toHaveLength(2);
});
