import { it, expect } from 'vitest';
import {
  cultureGrowth,
  cultureFactors,
  cultureComparison,
  animalMeasuredSnapshot,
  animalCultureDirector,
  bicarbonatePH,
  passagePositions,
  passageFrame,
  hybridSelection,
  cloneOccupancy,
  donorFusion,
  enucleation,
  cloneProvenance,
} from './bio-animal-cell-engineering';
it('aligns the measured prediction and outcome landmarks without changing the stored process coordinate', () => {
  for (const en of [false, true]) {
    const at = (chapter: number, time: number) => animalMeasuredSnapshot(chapter, 0.9, time, en);
    expect(at(1, 2).progress).toBe(0);
    expect(at(1, 7.6).progress).toBe(1);
    const compareAt = en ? 7.13 : 8.11,
      resultAt = en ? 22.77 : 20.69;
    expect(animalCultureDirector(at(2, compareAt - 0.01).progress).compare).toBe(false);
    expect(animalCultureDirector(at(2, compareAt).progress).prediction).toBe(true);
    const prediction = animalCultureDirector(at(2, resultAt - 0.01).progress);
    expect(prediction.prediction).toBe(true);
    expect(cultureComparison(prediction.growthTime).map((a) => a.total)).toEqual([28, 28, 28]);
    expect(animalCultureDirector(at(2, en ? 33.51 : 29.29).progress).growthTime).toBeCloseTo(8, 12);
    expect(at(3, 2).progress).toBe(0.9);
  }
});
it('matches an independent separated-variable benchmark rather than a prescribed carrying-capacity curve', () => {
  const initial = 4,
    resources = 40,
    budget = initial + resources,
    surface = 32;
  // Integral of dt/dN for the stated coupled resource/surface law, derived independently.
  const primitive = (n: number) =>
    (1 + 8 / budget) * Math.log(n) -
    (1 + 8 / (budget - surface)) * Math.log(surface - n) -
    ((surface * 8) / (budget * (surface - budget))) * Math.log(budget - n);
  for (const t of [1, 4, 8, 16, 24]) {
    const a = cultureGrowth(t, { initial, resources, surface });
    expect((primitive(a.n) - primitive(initial)) / 0.35).toBeCloseTo(t, 6);
    expect(a.n + a.resources).toBeCloseTo(budget, 12);
  }
  expect(cultureFactors(4, 40).rate).toBeCloseTo((0.35 * 4 * (1 - 4 / 32) * 40) / 48, 12);
});
it('separates medium restoration from surface relief using equal starting cells and total medium', () => {
  const initial = cultureComparison(0),
    later = cultureComparison(8);
  expect(initial.map((a) => a.total)).toEqual([28, 28, 28]);
  expect(initial.map((a) => a.totalVolume)).toEqual([1, 1, 1]);
  expect(initial[1].initialResources).toBe(initial[2].initialResources * 2);
  expect(initial[1].nutrient).toBe(initial[2].nutrient);
  expect(initial[2].space).toBeGreaterThan(initial[1].space);
  expect(later[2].total).toBeGreaterThan(later[1].total);
  expect(later[1].total).toBeGreaterThan(later[0].total);
  expect(later[2].total + later[2].resources * 2).toBeCloseTo(later[1].budget, 12);
});
it('rejects unlimited growth and keeps absent cells/resources and fully crowded surfaces as counterexamples', () => {
  expect(cultureGrowth(24, { initial: 0 }).n).toBe(0);
  expect(cultureGrowth(24, { initial: 4, resources: 0, adherent: false }).n).toBe(4);
  expect(cultureGrowth(24, { initial: 32, resources: 100 }).n).toBe(32);
  const suspended = cultureGrowth(24, { adherent: false });
  expect(suspended.n).toBeGreaterThan(cultureGrowth(24).n);
  expect(suspended.n).toBeLessThan(suspended.budget);
  expect(cultureGrowth(24, { contact: false })).toEqual(suspended);
  for (const initial of [0, 4, 16, 32])
    for (const resources of [0, 1, 24, 64])
      for (const contact of [true, false]) {
        const a = cultureGrowth(24, { initial, resources, contact });
        expect(a.n + a.resources).toBeCloseTo(initial + resources, 10);
        expect(a.resources).toBeGreaterThanOrEqual(0);
        expect(Number.isFinite(a.rate)).toBe(true);
      }
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
