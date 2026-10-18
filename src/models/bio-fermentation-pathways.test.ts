import { it, expect } from 'vitest';
import {
  fermentationState,
  pickleState,
  jarGeometry,
  nitriteResult,
  sampleMotion,
  reactorState,
  scaleGeometry,
} from './bio-fermentation-pathways';
it('balances carbon and mass across wine then oxygen-fed vinegar', () => {
  for (let i = 0; i <= 100; i++)
    for (const air of [true, false]) {
      const s = fermentationState(i / 100, i / 100, air);
      expect(s.carbon).toBeCloseTo(6);
      expect(s.massOut).toBeCloseTo(s.massIn);
    }
  const s = fermentationState(1, 1);
  expect(s.acetate).toBe(2);
  expect(s.oxygenUsed).toBe(2);
  expect(s.massOut).toBe(244);
  expect(fermentationState(1, 1, false).ethanol).toBe(2);
  expect(fermentationState(0, 1).acetate).toBe(0);
});
it('never presents missing oxygen as killing all lactic bacteria', () => {
  expect(pickleState(10, 5, false).lactate).toBe(pickleState(10, 5, true).lactate);
  expect(pickleState(10, 20).lactate).toBeLessThan(pickleState(10, 5).lactate);
  expect(pickleState(0).sugar).toBe(1);
});
it('converts a synthetic matched-matrix nitrite calibration with explicit dilution', () => {
  expect(nitriteResult('.068')!.foodMgKg).toBeCloseTo(12);
  expect(nitriteResult('')).toBeNull();
  expect(nitriteResult('.01')).toBeNull();
  expect(nitriteResult('.43')).toBeNull();
  expect(nitriteResult('.02')!.foodMgKg).toBe(0);
  expect(nitriteResult('.068', 0.02, 0.04, 50, 10, 1)!.foodMgKg).toBeCloseTo(6);
});
it('withdraws before traversing and delivers after the pipette reaches the tube', () => {
  for (let i = 0; i <= 1000; i++) {
    const s = sampleMotion(i / 1000, 240);
    expect(s.source + s.pipette + s.sample).toBeCloseTo(50);
    if (s.x > 57.6 + 0.001 && s.x < 182.4 - 0.001) expect(s.y).toBe(100);
    if (s.sample > 0) expect(s.y).toBe(156);
  }
  expect(sampleMotion(1, 240).sample).toBe(5);
});
it('keeps the gas path inside liquid, neck and connected airlock', () => {
  for (const w of [240, 320, 800]) {
    const g = jarGeometry(w);
    expect(g.gas[0].y).toBeGreaterThan(g.water);
    expect(g.gas[1].x).toBeGreaterThan(g.neckLeft);
    expect(g.gas[1].x).toBeLessThan(g.neckRight);
    expect(g.right).toBeLessThan(w);
  }
});
it('balances dissolved oxygen and heat in the independently integrated reactor', () => {
  for (const a of [0, 1])
    for (const m of [0, 1])
      for (const c of [false, true]) {
        const s = reactorState(20, a, m, c);
        expect(s.oxygen).toBeCloseTo(6 + s.transferred - s.consumed, 9);
        expect(s.temp).toBeCloseTo(28 + s.heatInput - s.heatRemoved, 9);
        expect(s.oxygen).toBeGreaterThanOrEqual(0);
      }
  expect(reactorState(20, 0).oxygen).toBeLessThan(0.01);
  expect(reactorState(20, 1, 1).oxygen).toBeGreaterThan(reactorState(20, 1, 0).oxygen);
  expect(reactorState(20, 1, 1, false).temp).toBeGreaterThan(reactorState(20).temp);
});
it('scaling volume eightfold only quadruples surface', () => {
  expect(scaleGeometry(2).volume / scaleGeometry(1).volume).toBe(8);
  expect(scaleGeometry(2).area / scaleGeometry(1).area).toBe(4);
  expect(scaleGeometry(2).areaPerVolume).toBe(3);
});
