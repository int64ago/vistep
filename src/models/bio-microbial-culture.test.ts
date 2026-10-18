import { it, expect } from 'vitest';
import {
  streakState,
  plateGeometry,
  pureCulture,
  dilutionTransfer,
  cfuEstimate,
  colonySites,
  screeningRank,
  samplingUnits,
} from './bio-microbial-culture';
it('streaking reduces deposition only after the cooled loop picks up the preceding streak', () => {
  const a = streakState(1, 240);
  expect(a.seeds.length).toBe(103);
  expect(streakState(1, 240, false).seeds.length).toBe(320);
  expect(streakState(0.2 + 0.18 / 5, 240).hot).toBe(true);
  expect(streakState(0.2 + 0.18 / 5, 240).depositing).toBe(false);
  expect(streakState(0.2 + 0.31 / 5, 240).cooling).toBe(true);
  for (const p of [0, 0.12, 0.24, 0.63, 1]) {
    const s = streakState(p, 240),
      g = plateGeometry(240);
    expect(s.seeds.every((a) => Math.hypot(a.x - g.cx, a.y - g.cy) < g.r)).toBe(true);
  }
});
it('blank plates stay blank unless contamination is explicitly introduced', () => {
  expect(pureCulture(1, 240, true, true)).toHaveLength(0);
  expect(pureCulture(1, 240, true, true, true)).toHaveLength(1);
});
it('serial transfer conserves liquid and sample mass through1001frames', () => {
  for (let i = 0; i <= 1000; i++) {
    const s = dilutionTransfer(i / 1000, 3);
    expect(s.sourceMl + s.pipetteMl + s.receiverMl).toBeCloseTo(19);
    expect(s.sourceG + s.pipetteG + s.receiverG).toBeCloseTo(0.01);
  }
  expect(dilutionTransfer(1, 3).finalGPerMl).toBeCloseTo(0.0001);
});
it('counts colony-forming units per gram including initial suspension and plated volume', () => {
  const a = cfuEstimate(['96', '103', '101'], 5)!;
  expect(a.mean).toBe(100);
  expect(a.cfuPerGram).toBeCloseTo(1e8);
  expect(a.acceptable).toBe(true);
  expect(cfuEstimate(['10', '11', '9'], 5)!.acceptable).toBe(false);
  expect(cfuEstimate(['', '', ''], 5)).toBeNull();
  expect(cfuEstimate(['9.5', '10', '11'], 5)).toBeNull();
});
it('colony positions remain strictly inside agar', () => {
  for (const w of [240, 320, 800])
    for (const n of [30, 100, 300]) {
      const g = plateGeometry(w);
      expect(colonySites(n, w).every((a) => Math.hypot(a.x - g.cx, a.y - g.cy) + 3 < g.r)).toBe(
        true,
      );
    }
});
it('a primary-screen artifact is not the replicated winner', () => {
  expect(screeningRank()[0].id).toBe('B3');
  expect(screeningRank(true)[0].id).toBe('A4');
  expect(screeningRank(false, true)[0].id).not.toBe(screeningRank()[0].id);
});
it('settle plates cannot supply a cubic-metre result', () => {
  expect(samplingUnits('air', 12, 100, 1, true)).toEqual({ value: 120, unit: 'CFU/m³' });
  expect(samplingUnits('air', 12, 100, 1, false)!.unit).toBe('CFU/plate/time');
  expect(samplingUnits('milk', 80, 0.1, 100)!.value).toBe(80000);
  expect(samplingUnits('soil', 100, 0.000001)!.value).toBe(1e8);
  expect(samplingUnits('water', 1, 0)).toBeNull();
});
