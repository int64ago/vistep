import { it, expect } from 'vitest';
import {
  litterState,
  starchState,
  sampleTransfer,
  assayResult,
  litterRecord,
  reagentDrops,
} from './bio-soil-decomposition';
it('benchmarks exponential litter loss and equal-treatment null comparison', () => {
  expect(litterState(10).remaining).toBeCloseTo(Math.exp(-0.65));
  expect(litterState(28, 0).remaining).toBe(1);
  expect(litterState(28, 1, 0).remaining).toBe(1);
  expect(litterState(28, 1, 1).remaining).toBe(1);
  expect(litterState(28, 0.12).remaining).toBeGreaterThan(litterState(28, 1).remaining);
  expect(litterState(14, 1)).toEqual(litterState(14, 1));
});
it('benchmarks sequential starch hydrolysis, conserves carbon and handles equal rates', () => {
  for (let i = 0; i <= 100; i++) {
    const a = starchState(i * 0.1);
    expect(a.starch + a.reducing + a.used).toBeCloseTo(1);
    expect(a.used).toBeGreaterThanOrEqual(0);
  }
  expect(starchState(2, true, 0).reducing).toBeCloseTo(1 - Math.exp(-1.1));
  expect(starchState(2, true, 0.55).reducing).toBeCloseTo(1.1 * Math.exp(-1.1));
  expect(starchState(7, false)).toEqual({ starch: 1, reducing: 0, used: 0 });
});
it('allows low final reducing sugar despite extensive starch hydrolysis', () => {
  const a = starchState(7, true, 1.2);
  expect(a.starch).toBeLessThan(0.03);
  expect(a.reducing).toBeLessThan(0.06);
  expect(assayResult(7, true, 1.2).precipitate).toBe(0);
  expect(assayResult(7, true, 0.12).precipitate).toBeGreaterThan(0);
});
it('conserves40mL across source, pipette and two separate aliquots', () => {
  for (let i = 0; i <= 1000; i++) {
    const a = sampleTransfer(i / 1000, 240);
    expect(a.source + a.pipette + a.tubes[0] + a.tubes[1]).toBeCloseTo(40);
    expect(a.pipette).toBeGreaterThanOrEqual(-1e-8);
    expect(a.source).toBeGreaterThanOrEqual(20);
  }
  expect(sampleTransfer(1).tubes).toEqual([10, 10]);
  expect(sampleTransfer(1).source).toBe(20);
});
it('raises the pipette above vessel rims before crossing horizontally', () => {
  let prev = sampleTransfer(0, 240);
  for (let i = 1; i <= 1000; i++) {
    const a = sampleTransfer(i / 1000, 240);
    expect(Math.hypot(a.x - prev.x, a.y - prev.y)).toBeLessThan(5);
    if (Math.abs(a.x - prev.x) > 0.01) expect(a.y).toBeLessThanOrEqual(120.001);
    if (a.dispensing) {
      expect(a.y).toBe(150);
      expect(a.x).toBeCloseTo(240 * (a.part === 0 ? 0.57 : 0.82));
    }
    prev = a;
  }
});
it('develops color only after reagent contact, precipitate only after heating', () => {
  expect(reagentDrops(0.1).filter((d) => d.arrived)).toHaveLength(0);
  expect(assayResult(7, false, 0.12, true, 0.1).iodine).toBe(0);
  expect(assayResult(7, false).iodine).toBe(1);
  expect(assayResult(7, true, 0.12, false).precipitate).toBe(0);
  expect(assayResult(7, true, 0.12, true, 0.4).precipitate).toBe(0);
  expect(assayResult().liquidMl).toBeCloseTo(10.3);
});
it('keeps absent observations absent and accepts genuine zero remaining mass', () => {
  expect(litterRecord('', '0')).toBeNull();
  expect(litterRecord('2', '')).toBeNull();
  expect(litterRecord('2', '0')?.loss).toBe(1);
  expect(litterRecord('0', '1')).toBeNull();
});
