import { it, expect } from 'vitest';
import {
  animalGrowth,
  bicarbonatePH,
  passagePositions,
  passageFrame,
  hybridSelection,
  cloneOccupancy,
  donorFusion,
  enucleation,
  cloneProvenance,
} from './bio-animal-cell-engineering';
it('separates contact limitation from suspension resource limitation', () => {
  expect(animalGrowth(0).n).toBe(4);
  expect(animalGrowth(24).n).toBeLessThan(32);
  expect(animalGrowth(24, false).n).toBeGreaterThan(animalGrowth(24).n);
  expect(animalGrowth(24, true, false).n).toBeGreaterThan(animalGrowth(24).n);
});
it('models bicarbonate/CO2 rather than treating CO2 as a cell nutrient switch', () => {
  expect(bicarbonatePH(5)).toBeCloseTo(7.423, 2);
  expect(bicarbonatePH(10) - bicarbonatePH(5)).toBeCloseTo(-Math.log10(2));
});
it('keeps16passaged identities and splits them8+8', () => {
  for (let i = 0; i <= 100; i++) {
    const a = passagePositions(i / 100, 240);
    expect(new Set(a.map((a) => a.id)).size).toBe(16);
    expect(
      a.filter((a) => a.inSource).length +
        a.filter((a) => a.inTransit).length +
        a.filter((a) => a.inReceiver).length,
    ).toBe(16);
  }
  expect(passagePositions(1, 240).filter((a) => a.receiver === 0 && a.inReceiver)).toHaveLength(8);
});
it('HAT survival is not antigen specificity and B cells do not persist indefinitely', () => {
  expect(hybridSelection('BM-other', 1).survival).toBe(1);
  expect(hybridSelection('BM-other', 1).target).toBe(false);
  expect(hybridSelection('M', 1).survival).toBe(0);
  expect(hybridSelection('M', 1, false).survival).toBe(1);
  expect(hybridSelection('B', 0.1).survival).toBe(1);
  expect(hybridSelection('B', 1).survival).toBe(0);
});
it('limiting dilution does not prove monoclonality', () => {
  const a = cloneOccupancy(1);
  expect(a.empty).toBeCloseTo(1 / Math.E);
  expect(a.single).toBeCloseTo(1 / Math.E);
  expect(a.multi).toBeCloseTo(1 - 2 / Math.E);
  expect(cloneOccupancy(0).singleAmongOccupied).toBeNull();
});
it('the donor membrane contacts the oocyte before fusion and preserves2Darea', () => {
  expect(donorFusion(0).connected).toBe(false);
  for (let i = 0; i <= 1000; i++) {
    const a = donorFusion(i / 1000);
    expect(a.area).toBeCloseTo(a.target, 7);
    expect(a.connected ? Math.hypot(a.nucleus.x - a.d, a.nucleus.y) < a.r : true).toBe(true);
  }
  expect(donorFusion(1).inside).toBe(true);
  expect(donorFusion(1).R).toBeCloseTo(Math.hypot(55, 8));
});
it('spindle removal is an actual outward trajectory and retains mitochondrial IDs', () => {
  let prev = -Infinity;
  for (let i = 0; i <= 100; i++) {
    const s = enucleation(i / 100, 240);
    if (i >= 30) {
      expect(s.cargo.x).toBeGreaterThanOrEqual(prev);
      prev = s.cargo.x;
    }
    expect(s.mitochondria.every((a) => Math.hypot(a.x - s.cx, a.y - s.cy) < s.r)).toBe(true);
  }
  expect(enucleation(1, 240).inside).toBe(false);
  expect(cloneProvenance.mitochondrial).toBe('mostly-oocyte-donor');
});

it('passaging conserves all16mL and moves horizontally above vessel rims', () => {
  let prev = passageFrame(0, 240);
  for (let i = 0; i <= 1000; i++) {
    const a = passageFrame(i / 1000, 240);
    expect(a.sourceMl + a.pipetteMl + a.receivers[0] + a.receivers[1]).toBeCloseTo(16, 10);
    expect(Math.min(a.sourceMl, a.pipetteMl, ...a.receivers)).toBeGreaterThanOrEqual(-1e-10);
    if (Math.abs(a.tip.x - prev.tip.x) > 0.01) expect(a.tip.y).toBeCloseTo(45, 7);
    prev = a;
  }
  expect(enucleation(0, 240).cargo).toEqual(enucleation(0.29, 240).cargo);
  expect(enucleation(0, 240).inside).toBe(true);
});
